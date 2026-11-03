/* Small, progressively enhanced interactions shared across the portfolio. */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.bg-video').forEach(video => { video.pause(); });

  const enhanceRail = rail => {
    if (rail.dataset.railReady) return;
    rail.dataset.railReady = 'true';
    rail.classList.add('swipe-rail');
    rail.setAttribute('tabindex', '0');
    const title = rail.closest('section')?.querySelector('h2')?.textContent || 'Items';
    const label = title.trim();
    rail.setAttribute('aria-label', `${label}, horizontally scrollable`);
    const toolbar = document.createElement('div');
    toolbar.className = 'rail-toolbar';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', `Scroll ${title.trim()}`);
    const arrow = direction => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="${direction < 0 ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'}"/></svg>`;
    toolbar.innerHTML = `<span class="rail-position" aria-live="polite"></span><div class="rail-buttons"><button type="button" aria-label="Previous item">${arrow(-1)}</button><button type="button" aria-label="Next item">${arrow(1)}</button></div>`;
    if (!rail.id) rail.id = `card-rail-${document.querySelectorAll('.rail-toolbar').length + 1}`;
    toolbar.querySelectorAll('button').forEach(button => button.setAttribute('aria-controls', rail.id));
    const heading = rail.parentElement.querySelector(':scope > .landing-section-heading, :scope > .catalog-heading, :scope > .services-catalog-heading, :scope > .projects-section-heading, :scope > .events-section-heading, :scope > .research-section-heading');
    if (heading) { heading.classList.add('rail-heading'); heading.append(toolbar); }
    else {
      const group = document.createElement('div');
      group.className = 'rail-group';
      rail.before(group);
      group.append(toolbar, rail);
    }
    const [previous, next] = toolbar.querySelectorAll('.rail-buttons button');
    const existingToggle = document.querySelector(`[aria-controls="${rail.id}"].catalog-expand-btn`);
    const collectionHref = rail.dataset.viewAllHref;
    const toggle = existingToggle || document.createElement(collectionHref ? 'a' : 'button');
    if (!existingToggle) {
      if (collectionHref) toggle.href = collectionHref;
      else toggle.type = 'button';
      toggle.className = 'catalog-expand-btn rail-view-toggle';
      if (!collectionHref) {
        toggle.setAttribute('aria-controls', rail.id);
        toggle.setAttribute('aria-expanded', 'false');
      }
      toggle.innerHTML = `${collectionHref ? '' : '<i class="fas fa-th-large" aria-hidden="true"></i>'}<span class="expand-btn-text"></span>`;
    }
    const oldToggleContainer = existingToggle?.parentElement;
    toolbar.prepend(toggle);
    if (oldToggleContainer?.classList.contains('catalog-header-actions')) oldToggleContainer.remove();
    const visibleItems = () => [...rail.children].filter(item => !item.hidden && !item.classList.contains('is-filtered-out') && !item.matches('.projects-empty-state,.events-empty-state'));
    const sync = () => {
      const items = visibleItems();
      const overflow = rail.scrollWidth > rail.clientWidth + 4;
      const expanded = rail.classList.contains('is-grid-view');
      toolbar.hidden = !items.length;
      toolbar.querySelector('.rail-buttons').hidden = expanded || !overflow;
      if (collectionHref) {
        toggle.querySelector('.expand-btn-text').textContent = `View all (${rail.dataset.viewAllCount || items.length})`;
        toolbar.querySelector('.rail-position').hidden = true;
      } else {
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.querySelector('.expand-btn-text').textContent = expanded ? 'Carousel View' : `See All (${items.length})`;
        toggle.querySelector('i').className = expanded ? 'fas fa-arrows-left-right' : 'fas fa-th-large';
      }
      rail.setAttribute('aria-label', `${label}, ${expanded ? 'all items' : 'horizontally scrollable'}`);
      toolbar.setAttribute('aria-label', `${label} view controls`);
      const left = rail.getBoundingClientRect().left;
      let nearest = 0, distance = Infinity;
      items.forEach((item, i) => { const d = Math.abs(item.getBoundingClientRect().left - left); if (d < distance) { distance = d; nearest = i; } });
      const visibleCount = items.filter(item => {
        const rect = item.getBoundingClientRect();
        return rect.left >= left - 4 && rect.right <= left + rail.clientWidth + 4;
      }).length;
      const last = Math.min(nearest + Math.max(visibleCount, 1), items.length);
      toolbar.querySelector('.rail-position').textContent = expanded ? `${items.length} items` : items.length ? `${nearest + 1}${last > nearest + 1 ? `–${last}` : ''} / ${items.length}` : '0 / 0';
      previous.disabled = rail.scrollLeft < 4;
      next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4;
    };
    if (!existingToggle && !collectionHref) toggle.addEventListener('click', () => {
      rail.classList.toggle('is-grid-view');
      toggle.classList.toggle('is-active', rail.classList.contains('is-grid-view'));
      rail.scrollLeft = 0;
      sync();
    });
    const move = direction => {
      const card = visibleItems()[0];
      const gap = parseFloat(getComputedStyle(rail).gap) || 20;
      rail.scrollBy({left: direction * ((card?.getBoundingClientRect().width || 300) + gap), behavior: reduceMotion.matches ? 'instant' : 'smooth'});
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    rail.addEventListener('keydown', event => {
      if (event.target !== rail || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    });
    let frame;
    rail.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(sync); }, {passive:true});
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(rail);
    else window.addEventListener('resize', sync);
    new MutationObserver(sync).observe(rail, {childList:true, subtree:true, attributes:true, attributeFilter:['class','hidden','data-view-all-count']});
    rail.addEventListener('focusin', event => {
      const item = event.target.closest('.swipe-rail > *');
      if (!item) return;
      const rect = item.getBoundingClientRect(), bounds = rail.getBoundingClientRect();
      if (rect.left < bounds.left || rect.right > bounds.right) rail.scrollBy({left: rect.left - bounds.left, behavior: reduceMotion.matches ? 'instant' : 'smooth'});
    });
    sync();
  };
  document.querySelectorAll('[data-swipe-rail], .publication-grid, .research-publication-grid, .project-card-grid, .event-card-grid, .course-rail, .materials-rail, .services-card-grid, .research-focus-grid, .teaching-approach-grid, .reviews-list, .blog-posts-grid, .studio-featured-grid, .studio-collabs-grid, .studio-gallery-grid').forEach(enhanceRail);

  // Media dialogs keep keyboard focus with their controls until dismissed.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const dialog = document.querySelector('.project-lightbox:not([hidden])');
    if (!dialog) return;
    const controls = [...dialog.querySelectorAll('a[href],button:not([disabled]),video[controls]')].filter(control => control.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  });

});
