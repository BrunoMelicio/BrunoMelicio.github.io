document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.services-reveal');

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
      item.style.transitionDelay = `${Math.min(index * 40, 200)}ms`;
      observer.observe(item);
    });
  }

  const courseCards = [...document.querySelectorAll('.course-card')];
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    courseCards.forEach(card => {
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty('--card-rx', `${(-y * 2).toFixed(2)}deg`);
        card.style.setProperty('--card-ry', `${(x * 2).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--card-rx', '0deg');
        card.style.setProperty('--card-ry', '0deg');
      });
    });
  }

  const filters = [...document.querySelectorAll('.library-filter')];
  const resources = [...document.querySelectorAll('.library-card')];
  const emptyState = document.querySelector('.library-empty');

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const selected = filter.dataset.filter;
      filters.forEach(button => {
        const isActive = button === filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });

      let visibleCount = 0;
      resources.forEach(resource => {
        const categories = resource.dataset.category.split(' ');
        const visible = selected === 'all' || categories.includes(selected);
        resource.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    });
  });

  let lastTrigger = null;
  const openModal = (modal, trigger) => {
    if (!modal) return;
    lastTrigger = trigger;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('services-modal-open');
    modal.querySelector('[data-modal-close]')?.focus();
  };

  const closeModal = modal => {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.services-modal:not([hidden])')) {
      document.body.classList.remove('services-modal-open');
    }
    lastTrigger?.focus();
  };

  const comingSoonModal = document.getElementById('coming-soon-modal');
  document.querySelectorAll('[data-coming-soon]').forEach(button => {
    button.addEventListener('click', () => {
      const name = comingSoonModal?.querySelector('[data-coming-soon-name]');
      if (name) name.textContent = button.dataset.comingSoon;
      openModal(comingSoonModal, button);
    });
  });

  const inquiryModal = document.getElementById('inquiry-modal');
  document.querySelectorAll('[data-inquiry-open]').forEach(button => {
    button.addEventListener('click', () => openModal(inquiryModal, button));
  });

  document.querySelectorAll('.services-modal').forEach(modal => {
    modal.querySelectorAll('[data-modal-close]').forEach(button => {
      button.addEventListener('click', () => closeModal(modal));
    });
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal(modal);
    });
  });

  const engagementForm = document.getElementById('engagement-form');
  const engagementStatus = document.getElementById('engagement-status');
  engagementForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = engagementForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.firstChild.textContent = 'Sending… ';

    try {
      const response = await fetch(engagementForm.action, {
        method: 'POST',
        body: new FormData(engagementForm),
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Unable to submit enquiry');
      engagementForm.reset();
      engagementStatus.textContent = 'Thank you. Your enquiry has been sent.';
    } catch (error) {
      engagementStatus.innerHTML = 'The form could not be sent. Please email <a href="mailto:brunomelicio.ai@gmail.com">brunomelicio.ai@gmail.com</a>.';
    } finally {
      engagementStatus.hidden = false;
      submit.disabled = false;
      submit.firstChild.textContent = 'Send enquiry ';
    }
  });

  const studioDisclosure = document.getElementById('studio-disclosure');
  let studioTrigger = null;
  const closeStudioDisclosure = () => {
    if (!studioDisclosure) return;
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

  studioDisclosure?.querySelectorAll('[data-studio-close]').forEach(control => {
    control.addEventListener('click', closeStudioDisclosure);
  });
  studioDisclosure?.addEventListener('click', event => {
    if (event.target === studioDisclosure) closeStudioDisclosure();
  });
  studioDisclosure?.querySelector('.studio-disclosure-primary')?.addEventListener('click', closeStudioDisclosure);

  document.addEventListener('keydown', event => {
    const openServicesModal = document.querySelector('.services-modal:not([hidden])');
    const activeModal = openServicesModal || (!studioDisclosure?.hidden ? studioDisclosure : null);
    if (!activeModal) return;

    if (event.key === 'Escape') {
      if (openServicesModal) closeModal(openServicesModal);
      else closeStudioDisclosure();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...activeModal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')];
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
