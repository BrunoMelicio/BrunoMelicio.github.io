document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const archiveGrid = document.querySelector('[data-event-grid]');
  const status = document.querySelector('[data-event-status]');
  const filterButtons = [...document.querySelectorAll('[data-event-filter]')];
  const yearSelect = document.querySelector('[data-event-year]');
  const sortSelect = document.querySelector('[data-event-sort]');
  const showMoreButton = document.querySelector('[data-show-more]');

  let events = [];
  let activeFilter = 'all';
  let activeYear = 'all';
  let activeSort = 'recent';
  let expanded = false;

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const parseDate = value => new Date(`${value}T12:00:00`);

  const formatDate = value => new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(parseDate(value));

  const mediaSummary = media => {
    const counts = media.reduce((summary, item) => {
      summary[item.type] = (summary[item.type] || 0) + 1;
      return summary;
    }, {});
    const labels = [];
    if (counts.image) labels.push(`${counts.image} photo${counts.image === 1 ? '' : 's'}`);
    if (counts.video) labels.push(`${counts.video} video${counts.video === 1 ? '' : 's'}`);
    if (counts.document) labels.push(`${counts.document} document${counts.document === 1 ? '' : 's'}`);
    return labels.join(' · ');
  };

  const mediaMarkup = event => {
    const firstImage = event.media.find(item => item.type === 'image');
    const firstVideo = event.media.find(item => item.type === 'video');
    const summary = mediaSummary(event.media);

    if (firstImage) {
      return `
        <button class="event-card-media" type="button" data-event-media="${escapeHtml(event.id)}"
          aria-label="View media from ${escapeHtml(event.title)}">
          <img src="${escapeHtml(firstImage.src)}" alt="${escapeHtml(firstImage.alt)}" loading="lazy" decoding="async" />
          <span class="event-card-media-badge"><i class="far fa-images" aria-hidden="true"></i>${escapeHtml(summary)}</span>
        </button>`;
    }

    if (firstVideo) {
      return `
        <button class="event-card-media event-card-media--type" type="button"
          data-event-media="${escapeHtml(event.id)}" aria-label="Play media from ${escapeHtml(event.title)}">
          <strong>Video</strong><small>${escapeHtml(event.date.slice(0, 4))}</small>
          <span class="event-card-media-badge"><i class="fas fa-play" aria-hidden="true"></i>${escapeHtml(summary)}</span>
        </button>`;
    }

    if (event.media.length) {
      return `
        <button class="event-card-media event-card-media--type" type="button"
          data-event-media="${escapeHtml(event.id)}" aria-label="Open supporting document for ${escapeHtml(event.title)}">
          <strong>Document</strong><small>${escapeHtml(event.date.slice(0, 4))}</small>
          <span class="event-card-media-badge"><i class="far fa-file-lines" aria-hidden="true"></i>${escapeHtml(summary)}</span>
        </button>`;
    }

    return `
      <div class="event-card-media event-card-media--type" aria-hidden="true">
        <strong>${escapeHtml(event.type)}</strong><small>${escapeHtml(event.date.slice(0, 4))}</small>
      </div>`;
  };

  const cardMarkup = (event, index) => `
    <article class="event-card${index < 2 ? ' event-card--feature' : ''}" data-event-id="${escapeHtml(event.id)}">
      ${mediaMarkup(event)}
      <div class="event-card-body">
        <div class="event-card-meta">
          <span>${escapeHtml(formatDate(event.date))}</span>
          <span>${escapeHtml(event.label)}</span>
        </div>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="event-card-description">${escapeHtml(event.description)}</p>
        <p class="event-card-location">${escapeHtml(event.location)}</p>
      </div>
    </article>`;

  const filteredEvents = () => events
    .filter(event => activeFilter === 'all' || event.type === activeFilter)
    .filter(event => {
      const year = Number(event.date.slice(0, 4));
      if (activeYear === 'all') return true;
      if (activeYear === 'earlier') return year < 2022;
      return year === Number(activeYear);
    })
    .sort((a, b) => {
      const difference = parseDate(b.date) - parseDate(a.date);
      return activeSort === 'recent' ? difference : -difference;
    });

  const renderEvents = () => {
    if (!archiveGrid) return;
    const matches = filteredEvents();
    const visibleEvents = expanded ? matches : matches.slice(0, 6);

    if (!matches.length) {
      archiveGrid.innerHTML = '<p class="events-empty-state">No events match these filters.</p>';
    } else {
      archiveGrid.innerHTML = visibleEvents.map(cardMarkup).join('');
    }

    const visibleCount = visibleEvents.length;
    if (status) {
      status.textContent = matches.length
        ? `Showing ${visibleCount} of ${matches.length} event${matches.length === 1 ? '' : 's'}`
        : 'No matching events';
    }

    if (showMoreButton) {
      showMoreButton.hidden = matches.length <= 6;
      showMoreButton.setAttribute('aria-expanded', String(expanded));
      const label = showMoreButton.querySelector('span');
      const icon = showMoreButton.querySelector('i');
      if (label) label.textContent = expanded ? 'Show fewer events' : `Show ${matches.length - 6} more events`;
      if (icon) icon.className = expanded ? 'fas fa-minus' : 'fas fa-plus';
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch('assets/data/events.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Events request failed with status ${response.status}`);
      events = await response.json();
      renderEvents();
    } catch (error) {
      console.error('Unable to load the event archive.', error);
      if (archiveGrid) {
        archiveGrid.innerHTML = '<p class="events-empty-state">The event archive could not be loaded. Please refresh the page.</p>';
      }
      if (status) status.textContent = 'Archive unavailable';
    }
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
      renderEvents();
    });
  });

  yearSelect?.addEventListener('change', () => {
    activeYear = yearSelect.value;
    expanded = false;
    renderEvents();
  });

  sortSelect?.addEventListener('change', () => {
    activeSort = sortSelect.value;
    expanded = false;
    renderEvents();
  });

  showMoreButton?.addEventListener('click', () => {
    expanded = !expanded;
    renderEvents();
  });

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

  const lightbox = document.getElementById('event-lightbox');
  const lightboxStage = lightbox?.querySelector('[data-lightbox-stage]');
  const lightboxTitle = lightbox?.querySelector('[data-lightbox-title]');
  const lightboxCounter = lightbox?.querySelector('[data-lightbox-counter]');
  const previousButton = lightbox?.querySelector('[data-lightbox-previous]');
  const nextButton = lightbox?.querySelector('[data-lightbox-next]');
  let lightboxTrigger = null;
  let activeMedia = [];
  let activeMediaIndex = 0;

  const stopLightboxVideo = () => {
    lightboxStage?.querySelector('video')?.pause();
  };

  const renderLightboxMedia = () => {
    if (!lightboxStage || !activeMedia.length) return;
    stopLightboxVideo();
    const media = activeMedia[activeMediaIndex];

    if (media.type === 'video') {
      lightboxStage.innerHTML = `<video src="${escapeHtml(media.src)}" aria-label="${escapeHtml(media.alt)}" controls autoplay playsinline></video>`;
    } else {
      lightboxStage.innerHTML = `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}" />`;
    }

    if (lightboxCounter) lightboxCounter.textContent = `${activeMediaIndex + 1} of ${activeMedia.length}`;
    if (previousButton) previousButton.disabled = activeMedia.length < 2;
    if (nextButton) nextButton.disabled = activeMedia.length < 2;
  };

  const openEventMedia = trigger => {
    const event = events.find(item => item.id === trigger.dataset.eventMedia);
    if (!event?.media.length) return;

    if (event.media.length === 1 && event.media[0].type === 'document') {
      window.open(event.media[0].src, '_blank', 'noopener,noreferrer');
      return;
    }

    activeMedia = event.media.filter(item => item.type !== 'document');
    if (!activeMedia.length) return;
    activeMediaIndex = 0;
    lightboxTrigger = trigger;
    if (lightboxTitle) lightboxTitle.textContent = event.title;
    renderLightboxMedia();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('[data-lightbox-close]')?.focus();
  };

  const moveLightbox = direction => {
    if (activeMedia.length < 2) return;
    activeMediaIndex = (activeMediaIndex + direction + activeMedia.length) % activeMedia.length;
    renderLightboxMedia();
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    stopLightboxVideo();
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    if (lightboxStage) lightboxStage.innerHTML = '';
    document.body.style.overflow = '';
    lightboxTrigger?.focus();
  };

  archiveGrid?.addEventListener('click', event => {
    const trigger = event.target.closest('[data-event-media]');
    if (trigger) openEventMedia(trigger);
  });

  lightbox?.querySelector('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
  previousButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));
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
    const lightboxIsOpen = lightbox && !lightbox.hidden;
    const studioIsOpen = studioDisclosure && !studioDisclosure.hidden;
    const activeModal = lightboxIsOpen ? lightbox : (studioIsOpen ? studioDisclosure : null);
    if (!activeModal) return;

    if (event.key === 'Escape') {
      if (lightboxIsOpen) closeLightbox();
      else closeStudioDisclosure();
      return;
    }

    if (lightboxIsOpen && event.key === 'ArrowLeft') {
      moveLightbox(-1);
      return;
    }

    if (lightboxIsOpen && event.key === 'ArrowRight') {
      moveLightbox(1);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = [...activeModal.querySelectorAll('a[href], button:not([disabled]), video[controls]')];
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

  loadEvents();
});
