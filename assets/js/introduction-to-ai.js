/* ============================================
   INTRODUCTION TO AI — interactive figures
   ============================================ */

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function svgEl(tag, attrs, text) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (text !== undefined) el.textContent = text;
    return el;
  }

  // --- Reading progress ---
  const progress = document.getElementById('guide-progress-bar');
  if (progress) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // --- Figure 2: train the pizza line ---
  (function pizzaLab() {
    const root = document.getElementById('pizza-lab');
    if (!root) return;

    const pizzas = [[20, 7], [25, 9], [30, 11.5], [35, 13], [40, 16]];
    const START = { w: 0.1, b: 6 };
    const sx = x => 60 + (x - 15) * 16;   // 15–45 cm
    const sy = y => 280 - y * 13;         // €0–20

    const line = document.getElementById('pizza-line');
    const errors = document.getElementById('pizza-errors');
    const points = document.getElementById('pizza-points');
    const ticks = document.getElementById('pizza-ticks');
    const wInput = document.getElementById('knob-w');
    const bInput = document.getElementById('knob-b');
    const wOut = document.getElementById('knob-w-out');
    const bOut = document.getElementById('knob-b-out');
    const errOut = document.getElementById('pizza-error');
    const errBar = document.getElementById('pizza-error-bar');
    const msg = document.getElementById('pizza-msg');
    const trainBtn = document.getElementById('pizza-train');
    const resetBtn = document.getElementById('pizza-reset');

    // Keep the line inside the plot area
    const svg = root.querySelector('svg');
    const clip = svgEl('clipPath', { id: 'pizza-clip' });
    clip.appendChild(svgEl('rect', { x: 60, y: 10, width: 480, height: 270 }));
    svg.insertBefore(clip, svg.firstChild);
    line.setAttribute('clip-path', 'url(#pizza-clip)');

    [20, 25, 30, 35, 40].forEach(x => ticks.appendChild(svgEl('text', { x: sx(x), y: 300, 'text-anchor': 'middle' }, x)));
    [5, 10, 15, 20].forEach(y => {
      ticks.appendChild(svgEl('line', { x1: 60, y1: sy(y), x2: 540, y2: sy(y), class: 'grid' }));
      ticks.appendChild(svgEl('text', { x: 50, y: sy(y) + 5, 'text-anchor': 'end' }, y));
    });

    const errLines = pizzas.map(() => errors.appendChild(svgEl('line', {})));
    pizzas.forEach(([x, y]) => points.appendChild(svgEl('circle', { cx: sx(x), cy: sy(y), r: 8, class: 'pizza-dot' })));

    let w = START.w;
    let b = START.b;
    let timer = null;

    const predict = x => w * (x - 30) + b;

    function render() {
      line.setAttribute('x1', sx(15)); line.setAttribute('y1', sy(predict(15)));
      line.setAttribute('x2', sx(45)); line.setAttribute('y2', sy(predict(45)));

      let total = 0;
      pizzas.forEach(([x, y], i) => {
        const p = predict(x);
        total += Math.abs(p - y);
        const l = errLines[i];
        l.setAttribute('x1', sx(x)); l.setAttribute('x2', sx(x));
        l.setAttribute('y1', sy(y)); l.setAttribute('y2', sy(p));
      });
      const avg = total / pizzas.length;

      wOut.textContent = w.toFixed(2);
      bOut.textContent = `€${b.toFixed(2)}`;
      errOut.textContent = `€${avg.toFixed(2)}`;
      errBar.style.transform = `scaleX(${Math.min(avg / 6, 1)})`;
      root.classList.toggle('is-good', avg < 0.35);

      if (avg < 0.35) msg.textContent = 'Excellent. That is about the best a straight line can do.';
      else if (avg < 0.8) msg.textContent = 'Very close. Fine-tune the knobs a little more.';
      else if (avg < 2) msg.textContent = 'Getting closer.';
      else msg.textContent = 'Still far off. Keep turning the knobs.';
    }

    function stop() {
      clearInterval(timer);
      timer = null;
      trainBtn.disabled = false;
      trainBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Let the computer learn';
    }

    // One step of gradient descent on the mean squared error
    function step() {
      let gw = 0;
      let gb = 0;
      pizzas.forEach(([x, y]) => {
        const e = predict(x) - y;
        gw += 2 * e * (x - 30);
        gb += 2 * e;
      });
      w -= 0.004 * gw / pizzas.length;
      b -= 0.15 * gb / pizzas.length;
      wInput.value = w;
      bInput.value = b;
    }

    trainBtn.addEventListener('click', () => {
      if (timer) return;
      let n = 0;
      trainBtn.disabled = true;
      if (reduceMotion) {
        for (; n < 40; n++) step();
        render();
        stop();
        return;
      }
      timer = setInterval(() => {
        step();
        n += 1;
        trainBtn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Step ${n}: nudging knobs`;
        render();
        if (n >= 40) stop();
      }, 90);
    });

    resetBtn.addEventListener('click', () => {
      stop();
      w = START.w; b = START.b;
      wInput.value = w; bInput.value = b;
      render();
    });

    wInput.addEventListener('input', () => { if (!timer) { w = parseFloat(wInput.value); render(); } });
    bInput.addEventListener('input', () => { if (!timer) { b = parseFloat(bInput.value); render(); } });

    render();
  })();

  // --- Figure 3: a picture as numbers ---
  (function pixels() {
    const picture = document.getElementById('pixel-picture');
    const numbers = document.getElementById('pixel-numbers');
    if (!picture || !numbers) return;

    const rows = [
      'WWFFFFWW',
      'WFFFFFFW',
      'FFKFFKFF',
      'FFKFFKFF',
      'FFFFFFFF',
      'FKFFFFKF',
      'WFKKKKFW',
      'WWFFFFWW',
    ];
    const value = { W: 255, F: 170, K: 20 };

    rows.join('').split('').forEach(ch => {
      const v = value[ch];
      const a = document.createElement('span');
      a.style.background = `rgb(${v},${v},${v})`;
      picture.appendChild(a);
      const n = document.createElement('span');
      n.textContent = v;
      n.className = v < 100 ? 'is-dark' : '';
      numbers.appendChild(n);
    });
  })();

  // --- Figure 5: a small neural network ---
  (function network() {
    const wires = document.getElementById('net-wires');
    const nodes = document.getElementById('net-nodes');
    if (!wires || !nodes) return;

    const layers = [
      { x: 60, ys: [45, 110, 175, 240] },
      { x: 210, ys: [35, 87, 140, 193, 245] },
      { x: 360, ys: [35, 87, 140, 193, 245] },
      { x: 470, ys: [103, 193] },
    ];

    for (let i = 0; i < layers.length - 1; i++) {
      layers[i].ys.forEach(y1 => layers[i + 1].ys.forEach(y2 => {
        wires.appendChild(svgEl('line', { x1: layers[i].x, y1, x2: layers[i + 1].x, y2 }));
      }));
    }
    layers.forEach((layer, i) => layer.ys.forEach((y, j) => {
      const isWinner = i === layers.length - 1 && j === 0;
      nodes.appendChild(svgEl('circle', {
        cx: layer.x, cy: y, r: 14,
        class: i === 0 ? 'net-node net-node--in' : isWinner ? 'net-node net-node--win' : 'net-node',
      }));
    }));
  })();

  // --- Figure 6: steps downhill, each one smaller as the slope flattens ---
  (function hill() {
    const path = document.getElementById('hill-path');
    const steps = document.getElementById('hill-steps');
    if (!path || !steps) return;
    const total = path.getTotalLength();
    let bottom = 0;
    for (let l = 0; l <= total; l += 2) {
      if (path.getPointAtLength(l).y > path.getPointAtLength(bottom).y) bottom = l;
    }
    [0.07, 0.4, 0.62, 0.77, 0.88].forEach(t => {
      const pt = path.getPointAtLength(bottom * t);
      steps.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: 8 }));
    });
    const end = path.getPointAtLength(bottom);
    steps.appendChild(svgEl('circle', { cx: end.x, cy: end.y, r: 10, class: 'hill-final' }));
  })();

  // --- Figure 9: attention moves "bat" ---
  (function attention() {
    const root = document.getElementById('attention-lab');
    if (!root) return;

    // [word, how much "bat" attends to it (0–1)]
    const sentences = [
      { words: [['The', 0.05], ['bat', -1], ['flew', 0.8], ['out', 0.15], ['of', 0.05], ['the', 0.05], ['cave', 0.7], ['at', 0.05], ['night.', 0.35]], shift: -112 },
      { words: [['She', 0.15], ['swung', 0.85], ['the', 0.05], ['bat', -1], ['and', 0.05], ['hit', 0.5], ['the', 0.05], ['ball.', 0.75]], shift: 112 },
    ];
    const sentenceEl = document.getElementById('attn-sentence');
    const bat = document.getElementById('attn-bat');
    const buttons = root.querySelectorAll('[data-sentence]');

    function show(index) {
      const s = sentences[index];
      sentenceEl.innerHTML = '';
      s.words.forEach(([word, weight]) => {
        const span = document.createElement('span');
        span.textContent = word;
        if (weight < 0) {
          span.className = 'attn-focus';
        } else {
          span.style.setProperty('--w', weight);
          if (weight >= 0.5) span.className = 'attn-strong';
        }
        sentenceEl.appendChild(span);
        sentenceEl.appendChild(document.createTextNode(' '));
      });
      bat.style.transform = `translateX(${s.shift}px)`;
      buttons.forEach((btn, i) => {
        btn.classList.toggle('is-active', i === index);
        btn.setAttribute('aria-pressed', i === index);
      });
    }

    buttons.forEach(btn => btn.addEventListener('click', () => show(Number(btn.dataset.sentence))));
    show(0);
  })();
})();
