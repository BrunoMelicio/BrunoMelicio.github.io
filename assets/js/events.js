document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.events-reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
      observer.observe(item);
    });
  }

  const filterButtons = [...document.querySelectorAll('.event-filter')];
  const eventCards = [...document.querySelectorAll('.event-archive-card')];
  const showMoreButton = document.querySelector('[data-show-more]');
  let expanded = false;
  let activeFilter = 'all';

  const renderArchive = () => {
    let visibleCount = 0;
    eventCards.forEach((card, index) => {
      const matchesFilter = activeFilter === 'all' || card.dataset.eventCategory === activeFilter;
      const withinInitialSet = index < 6;
      const visible = matchesFilter && (activeFilter !== 'all' || expanded || withinInitialSet);
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (showMoreButton) {
      const hasMore = eventCards.length > 6;
      showMoreButton.hidden = activeFilter !== 'all' || !hasMore;
      showMoreButton.setAttribute('aria-expanded', String(expanded));
      const label = showMoreButton.querySelector('span');
      const icon = showMoreButton.querySelector('i');
      if (label) label.textContent = expanded ? 'Show fewer events' : 'Show more events';
      if (icon) icon.className = expanded ? 'fas fa-minus' : 'fas fa-plus';
    }

    document.querySelector('.event-archive-grid')?.setAttribute('data-visible-count', String(visibleCount));
  };

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.eventFilter;
      expanded = false;
      filterButtons.forEach(filter => {
        const isActive = filter === button;
        filter.classList.toggle('is-active', isActive);
        filter.setAttribute('aria-pressed', String(isActive));
      });
      renderArchive();
    });
  });

  showMoreButton?.addEventListener('click', () => {
    expanded = !expanded;
    renderArchive();
  });
  renderArchive();

  const lightbox = document.getElementById('event-lightbox');
  const lightboxImage = lightbox?.querySelector('[data-lightbox-image]');
  let lightboxTrigger = null;

  const openLightbox = trigger => {
    if (!lightbox || !lightboxImage) return;
    lightboxTrigger = trigger;
    lightboxImage.src = trigger.dataset.lightboxSrc;
    lightboxImage.alt = trigger.dataset.lightboxAlt || 'Event image';
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('[data-lightbox-close]')?.focus();
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = 'assets/images/events/UTA_2026_Workshop/uta-2026-5.jpg';
    document.body.style.overflow = '';
    lightboxTrigger?.focus();
  };

  document.querySelectorAll('[data-lightbox-src]').forEach(trigger => {
    trigger.addEventListener('click', () => openLightbox(trigger));
  });
  lightbox?.querySelector('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  const studioDisclosure = document.getElementById('studio-disclosure');
  let studioTrigger = null;

  const closeStudioDisclosure = () => {
    if (!studioDisclosure || studioDisclosure.hidden) return;
    studioDisclosure.hidden = true;
    studioDisclosure.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('studio-modal-open');
    studioTrigger?.focus();
  };

  document.addEventListener('click', event => {
    const studioEntry = event.target.closest('.studio-entry');
    if (!studioEntry || !studioDisclosure) return;
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

  studioDisclosure?.querySelectorAll('[data-studio-close]').forEach(control => {
    control.addEventListener('click', closeStudioDisclosure);
  });
  studioDisclosure?.addEventListener('click', event => {
    if (event.target === studioDisclosure) closeStudioDisclosure();
  });
  studioDisclosure?.querySelector('.studio-disclosure-primary')?.addEventListener('click', closeStudioDisclosure);

  document.addEventListener('keydown', event => {
    const activeModal = !lightbox?.hidden ? lightbox : (!studioDisclosure?.hidden ? studioDisclosure : null);
    if (!activeModal) return;

    if (event.key === 'Escape') {
      if (!lightbox?.hidden) closeLightbox();
      else closeStudioDisclosure();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...activeModal.querySelectorAll('a[href], button:not([disabled])')];
    if (!focusable.length) return;
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
