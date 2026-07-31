document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const teachingMain = document.querySelector('.teaching-main');
  const freeLearning = document.getElementById('free-learning');
  const universityTeaching = document.getElementById('university-teaching');
  const courseCatalog = document.getElementById('online-courses');
  const materialsLibrary = document.getElementById('materials');
  const privateIntensive = document.querySelector('.private-intensive');

  if (teachingMain && freeLearning && universityTeaching && courseCatalog && materialsLibrary && privateIntensive) {
    teachingMain.insertBefore(freeLearning, courseCatalog);
    teachingMain.insertBefore(universityTeaching, courseCatalog);
    teachingMain.insertBefore(materialsLibrary, privateIntensive);
  }

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
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 35, 175)}ms`;
      revealObserver.observe(item);
    });
  }

  const bindCatalogControls = (railSelector, controlSelector, directionKey) => {
    const rail = document.querySelector(railSelector);

    document.querySelectorAll(controlSelector).forEach(control => {
      control.addEventListener('click', () => {
        if (!rail) return;
        const direction = Number(control.dataset[directionKey]) || 1;
        const card = rail.querySelector('.course-product');
        const distance = card ? card.getBoundingClientRect().width + 16 : 320;
        rail.scrollBy({ left: direction * distance, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  };

  bindCatalogControls('[data-course-rail]', '[data-course-direction]', 'courseDirection');
  bindCatalogControls('[data-free-course-rail]', '[data-free-course-direction]', 'freeCourseDirection');

  const materialFilters = [...document.querySelectorAll('[data-material-filter]')];
  const materials = [...document.querySelectorAll('[data-material-access]')];

  materialFilters.forEach(filter => {
    filter.addEventListener('click', () => {
      const selected = filter.dataset.materialFilter;

      materialFilters.forEach(button => {
        const active = button === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      materials.forEach(material => {
        const visible = selected === 'all' || material.dataset.materialAccess === selected;
        material.classList.toggle('is-filtered-out', !visible);
      });
    });
  });

  const reviewForm = document.getElementById('course-review-form');
  reviewForm?.addEventListener('submit', event => {
    event.preventDefault();

    if (!reviewForm.reportValidity()) return;

    const formData = new FormData(reviewForm);
    const name = String(formData.get('name') || '').trim();
    const course = String(formData.get('course') || '').trim();
    const rating = String(formData.get('rating') || '').trim();
    const review = String(formData.get('review') || '').trim();
    const subject = encodeURIComponent(`Course review from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nCourse or event: ${course}\nRating: ${rating}/5\n\nReview:\n${review}\n\nPublication consent: Yes`
    );
    const status = reviewForm.querySelector('.review-form-status');

    if (status) status.textContent = 'Opening your email app so you can send the review for verification…';
    window.location.href = `mailto:brunomelicio.ai@gmail.com?subject=${subject}&body=${body}`;
  });

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
