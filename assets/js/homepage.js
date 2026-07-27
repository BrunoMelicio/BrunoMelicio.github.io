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
  const interactiveCards = document.querySelectorAll('.publication-card, .service-card');
  const publicationRail = document.querySelector('.publication-grid');

  document.querySelectorAll('[data-publication-direction]').forEach(control => {
    control.addEventListener('click', () => {
      if (!publicationRail) return;
      const direction = Number(control.dataset.publicationDirection) || 1;
      const visibleCard = publicationRail.querySelector('.publication-card:not(.is-filtered-out)');
      const distance = visibleCard ? visibleCard.getBoundingClientRect().width + 16 : 320;
      publicationRail.scrollBy({
        left: direction * distance,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });
  });

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

      publicationRail?.scrollTo({
        left: 0,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });
  });

  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    interactiveCards.forEach(card => {
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

  const studioDisclosure = document.getElementById('studio-disclosure');
  if (studioDisclosure) {
    let studioTrigger = null;
    const closeStudioDisclosure = () => {
      studioDisclosure.hidden = true;
      studioDisclosure.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('studio-modal-open');
      studioTrigger?.focus();
    };

    document.addEventListener('click', event => {
      const studioEntry = event.target.closest('.studio-entry');
      if (!studioEntry) return;

      event.preventDefault();
      studioTrigger = studioEntry;
      document.querySelector('.menu-toggle')?.classList.remove('active');
      document.querySelector('.nav-menu')?.classList.remove('active');
      document.body.classList.remove('no-scroll');
      document.body.classList.add('studio-modal-open');
      studioDisclosure.hidden = false;
      studioDisclosure.setAttribute('aria-hidden', 'false');
      studioDisclosure.querySelector('.studio-disclosure-close')?.focus();
    });

    studioDisclosure.querySelectorAll('[data-studio-close]').forEach(control => {
      control.addEventListener('click', closeStudioDisclosure);
    });

    studioDisclosure.addEventListener('click', event => {
      if (event.target === studioDisclosure) closeStudioDisclosure();
    });

    studioDisclosure.querySelector('.studio-disclosure-primary')?.addEventListener('click', closeStudioDisclosure);

    document.addEventListener('keydown', event => {
      if (studioDisclosure.hidden) return;

      if (event.key === 'Escape') {
        closeStudioDisclosure();
        return;
      }

      if (event.key === 'Tab') {
        const focusable = [...studioDisclosure.querySelectorAll('a[href], button:not([disabled])')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
});
