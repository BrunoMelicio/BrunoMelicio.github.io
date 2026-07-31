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
      item.style.transitionDelay = `${Math.min(index * 35, 180)}ms`;
      observer.observe(item);
    });
  }

  const profileSelect = document.getElementById('profile-select');
  const serviceSelect = document.getElementById('service-select');
  const budgetSelect = document.getElementById('budget-select');
  const enquirySection = document.getElementById('enquiry');
  const subjectInput = document.getElementById('enquiry-subject');

  const serviceOptions = {
    individual: [
      ['private-ai-intensive', 'Private AI Intensive'],
      ['course-learning-question', 'Course or Learning Question'],
      ['other-individual', 'Other Individual Enquiry']
    ],
    organization: [
      ['guest-talks-keynotes', 'Guest Talks & Keynotes'],
      ['ai-workshops-training', 'AI Workshops & Team Training'],
      ['custom-ai-program', 'Custom AI Learning Program'],
      ['other-organization', 'Other Organization Enquiry']
    ],
    university: [
      ['guest-talks-keynotes', 'Guest Talks & Keynotes'],
      ['ai-workshops-training', 'AI Workshops & Team Training'],
      ['custom-ai-program', 'Custom AI Learning Program'],
      ['research-collaboration', 'Research or Academic Collaboration'],
      ['other-university', 'Other University Enquiry']
    ],
    event: [
      ['guest-talks-keynotes', 'Guest Talks & Keynotes'],
      ['panel-participation', 'Panel Participation'],
      ['hosted-event', 'Hosted or Co-created Event'],
      ['other-event', 'Other Event Enquiry']
    ],
    other: [
      ['other', 'Other Enquiry']
    ]
  };

  const budgetOptions = {
    individual: [
      ['under-100', 'Under €100'],
      ['100-249', '€100–€249'],
      ['250-499', '€250–€499'],
      ['500-999', '€500–€999'],
      ['1000+', '€1,000+'],
      ['not-decided', 'Not decided']
    ],
    professional: [
      ['under-1500', 'Under €1,500'],
      ['1500-2499', '€1,500–€2,499'],
      ['2500-4999', '€2,500–€4,999'],
      ['5000-9999', '€5,000–€9,999'],
      ['10000+', '€10,000+'],
      ['not-decided', 'Not decided']
    ],
    other: [
      ['under-500', 'Under €500'],
      ['500-1499', '€500–€1,499'],
      ['1500-4999', '€1,500–€4,999'],
      ['5000+', '€5,000+'],
      ['not-decided', 'Not decided']
    ]
  };

  const populateSelect = (select, options, placeholder) => {
    if (!select) return;
    select.replaceChildren();
    const placeholderOption = new Option(placeholder, '');
    select.add(placeholderOption);
    options.forEach(([value, label]) => select.add(new Option(label, value)));
  };

  const profileForService = service => {
    if (service === 'private-ai-intensive' || service === 'course-learning-question' || service === 'other-individual') {
      return 'individual';
    }
    if (['guest-talks-keynotes', 'ai-workshops-training', 'custom-ai-program', 'other-organization'].includes(service)) {
      return 'organization';
    }
    return 'other';
  };

  const updateSubject = () => {
    if (!subjectInput) return;
    const profileLabel = profileSelect?.value
      ? profileSelect.options[profileSelect.selectedIndex]?.textContent?.trim()
      : '';
    const serviceLabel = serviceSelect?.value
      ? serviceSelect.options[serviceSelect.selectedIndex]?.textContent?.trim()
      : '';
    subjectInput.value = serviceLabel
      ? `New services enquiry — ${profileLabel} — ${serviceLabel}`
      : 'New services enquiry';
  };

  const updateProfileFields = (profile, preferredService = '') => {
    const services = serviceOptions[profile] || [];
    populateSelect(
      serviceSelect,
      services,
      profile ? 'Select a service' : 'Choose a profile first'
    );

    const budgetGroup = profile === 'individual'
      ? 'individual'
      : (['organization', 'university', 'event'].includes(profile) ? 'professional' : 'other');
    populateSelect(
      budgetSelect,
      profile ? budgetOptions[budgetGroup] : [],
      profile ? 'Select a range' : 'Choose a profile first'
    );

    if (preferredService && services.some(([value]) => value === preferredService)) {
      serviceSelect.value = preferredService;
    }
    updateSubject();
  };

  const selectProfileAndService = (profile, service) => {
    if (!profileSelect || !serviceSelect || !serviceOptions[profile]) return false;
    profileSelect.value = profile;
    updateProfileFields(profile, service);
    return serviceSelect.value === service;
  };

  document.querySelectorAll('[data-service-select]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      const service = trigger.dataset.serviceSelect;
      const profile = trigger.dataset.serviceProfile || profileForService(service);
      const selected = selectProfileAndService(profile, service);
      if (!selected || !enquirySection) return;
      event.preventDefault();
      enquirySection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => profileSelect.focus({ preventScroll: true }), reduceMotion ? 0 : 650);
    });
  });

  profileSelect?.addEventListener('change', () => {
    updateProfileFields(profileSelect.value);
  });

  serviceSelect?.addEventListener('change', () => {
    updateSubject();
  });

  const requestedService = new URLSearchParams(window.location.search).get('service');
  if (requestedService
    && selectProfileAndService(profileForService(requestedService), requestedService)
    && window.location.hash === '#enquiry') {
    window.requestAnimationFrame(() => enquirySection?.scrollIntoView({ block: 'start' }));
  } else {
    updateProfileFields('');
  }

  const engagementForm = document.getElementById('engagement-form');
  const engagementStatus = document.getElementById('engagement-status');

  engagementForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = engagementForm.querySelector('button[type="submit"]');
    const submitLabel = submit?.querySelector('[data-submit-label]');
    const originalLabel = submitLabel?.textContent || 'Send enquiry';

    if (submit) submit.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending…';
    if (engagementStatus) {
      engagementStatus.hidden = true;
      engagementStatus.classList.remove('is-success', 'is-error');
    }

    try {
      const response = await fetch(engagementForm.action, {
        method: 'POST',
        body: new FormData(engagementForm),
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) throw new Error('Unable to submit enquiry');
      engagementForm.reset();
      updateProfileFields('');
      if (subjectInput) subjectInput.value = 'New services enquiry';
      if (engagementStatus) {
        engagementStatus.textContent = 'Thank you. Your enquiry has been sent. I will review it and reply if the engagement is a strong fit.';
        engagementStatus.classList.add('is-success');
        engagementStatus.hidden = false;
      }
    } catch (error) {
      if (engagementStatus) {
        engagementStatus.innerHTML = 'The form could not be sent. Please email <a href="mailto:brunomelicio.ai@gmail.com">brunomelicio.ai@gmail.com</a>.';
        engagementStatus.classList.add('is-error');
        engagementStatus.hidden = false;
      }
    } finally {
      if (submit) submit.disabled = false;
      if (submitLabel) submitLabel.textContent = originalLabel;
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
    if (!studioDisclosure || studioDisclosure.hidden) return;

    if (event.key === 'Escape') {
      closeStudioDisclosure();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...studioDisclosure.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )];
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
