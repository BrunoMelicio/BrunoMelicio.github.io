document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealItems = document.querySelectorAll('.home-reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
      revealObserver.observe(item);
    });
  }

  const filters = document.querySelectorAll('.research-filter');
  const cards = document.querySelectorAll('.publication-card');

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const selected = filter.dataset.filter;

      filters.forEach(button => {
        const active = button === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      cards.forEach(card => {
        const visible = selected === 'all' || card.dataset.type === selected;
        card.classList.toggle('is-filtered-out', !visible);
        if (visible) card.classList.add('is-visible');
      });
    });
  });

  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach(card => {
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--card-rx', `${(-y * 4).toFixed(2)}deg`);
        card.style.setProperty('--card-ry', `${(x * 4).toFixed(2)}deg`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--card-rx', '0deg');
        card.style.setProperty('--card-ry', '0deg');
      });
    });

    const hero = document.querySelector('.home-hero');
    const portrait = document.querySelector('.home-portrait img');
    if (hero && portrait) {
      hero.addEventListener('pointermove', event => {
        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        portrait.style.setProperty('--portrait-x', `${(x * 5).toFixed(1)}px`);
        portrait.style.setProperty('--portrait-y', `${(y * 3).toFixed(1)}px`);
      });

      hero.addEventListener('pointerleave', () => {
        portrait.style.setProperty('--portrait-x', '0px');
        portrait.style.setProperty('--portrait-y', '0px');
      });
    }
  }
});
