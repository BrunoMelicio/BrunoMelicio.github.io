document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.teaching-reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 45, 225)}ms`;
      revealObserver.observe(item);
    });
  }

  const cards = [...document.querySelectorAll('.teaching-card')];
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    cards.forEach(card => {
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--card-rx', `${(-y * 2.4).toFixed(2)}deg`);
        card.style.setProperty('--card-ry', `${(x * 2.4).toFixed(2)}deg`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--card-rx', '0deg');
        card.style.setProperty('--card-ry', '0deg');
      });
    });
  }

  const studioDisclosure = document.getElementById('studio-disclosure');
  if (!studioDisclosure) return;

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

    if (event.key !== 'Tab') return;

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
  });
});
