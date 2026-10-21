document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const projectGrid = document.querySelector('[data-project-grid]');
  const statusEl = document.querySelector('[data-project-status]');
  const filterButtons = [...document.querySelectorAll('[data-project-filter]')];
  const sortSelect = document.querySelector('[data-project-sort]');

  let projects = [];
  let activeFilter = 'all';
  let activeSort = 'recent';

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const mediaMarkup = project => {
    const media = project.media && project.media[0];
    if (!media) {
      return `
        <div class="project-card-media" aria-hidden="true">
          <div style="display:flex;height:100%;align-items:center;justify-content:center;background:var(--projects-panel);color:var(--projects-muted);font-weight:600;">
            ${escapeHtml(project.badge)}
          </div>
        </div>`;
    }

    if (media.type === 'video') {
      return `
        <button class="project-card-media" type="button" data-project-media="${escapeHtml(project.id)}"
          aria-label="Play video demonstration for ${escapeHtml(project.title)}">
          <video src="${escapeHtml(media.src)}" poster="${escapeHtml(media.poster || '')}" muted loop playsinline preload="metadata"></video>
          <div class="project-card-play-overlay">
            <span class="project-card-play-btn"><i class="fas fa-play" aria-hidden="true"></i></span>
          </div>
          <span class="project-card-media-badge"><i class="fas fa-video" aria-hidden="true"></i>Video</span>
        </button>`;
    }

    if (media.type === 'gif') {
      return `
        <button class="project-card-media" type="button" data-project-media="${escapeHtml(project.id)}"
          aria-label="View animated demo for ${escapeHtml(project.title)}">
          <img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt || project.title)}" loading="lazy" />
          <span class="project-card-media-badge"><i class="fas fa-play" aria-hidden="true"></i>Animated GIF</span>
          <span class="project-card-media-zoom" aria-hidden="true"><i class="fas fa-expand"></i></span>
        </button>`;
    }

    return `
      <button class="project-card-media" type="button" data-project-media="${escapeHtml(project.id)}"
        aria-label="View media for ${escapeHtml(project.title)}">
        <img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt || project.title)}" loading="lazy" decoding="async" />
        <span class="project-card-media-badge"><i class="far fa-images" aria-hidden="true"></i>Preview</span>
        <span class="project-card-media-zoom" aria-hidden="true"><i class="fas fa-expand"></i></span>
      </button>`;
  };

  const cardMarkup = (project, index) => {
    const isResearch = project.category === 'research';
    const badgeClass = isResearch ? 'project-badge--research' : 'project-badge--side';

    let recruitingBadge = '';
    let recruitingCallout = '';
    if (project.recruiting) {
      const url = escapeHtml(project.recruitingUrl || 'services.html?service=research-collaboration#enquiry');
      const roleText = escapeHtml(project.recruitingRole || 'Open positions available');
      recruitingBadge = `
        <a href="${url}" class="project-badge project-badge--recruiting" title="We are recruiting! Click to apply or get in touch.">
          <span class="project-recruiting-dot" aria-hidden="true"></span>
          <span>Recruiting</span>
        </a>`;
      recruitingCallout = `
        <a href="${url}" class="project-recruiting-callout" title="Join team: ${roleText}">
          <div class="project-recruiting-callout-text">
            <span class="project-recruiting-callout-label"><span class="project-recruiting-dot" aria-hidden="true"></span> Open roles</span>
            <span class="project-recruiting-callout-role">${roleText}</span>
          </div>
          <span class="project-recruiting-callout-action"><span>Apply to join</span> <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
        </a>`;
    }

    let publicationAction = '';
    if (isResearch && project.publicationLink) {
      publicationAction = `
        <a href="${escapeHtml(project.publicationLink)}" target="_blank" rel="noopener noreferrer" class="project-card-link" title="Open peer-reviewed publication">
          <span>${escapeHtml(project.publicationLabel || 'View paper')}</span>
          <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>`;
    }

    let researchPageAction = '';
    if (isResearch && project.researchPageLink) {
      researchPageAction = `
        <a href="${escapeHtml(project.researchPageLink)}" class="project-card-link" title="View details on Research page">
          <span>${escapeHtml(project.researchPageLabel || 'In Research')}</span>
          <i class="fas fa-arrow-right" aria-hidden="true"></i>
        </a>`;
    }

    let demoActionBtn = '';
    if (project.demoLink) {
      demoActionBtn = `
        <a href="${escapeHtml(project.demoLink)}" target="_blank" rel="noopener noreferrer" class="project-card-demo-btn" title="Watch demonstration on YouTube">
          <i class="fab fa-youtube" aria-hidden="true"></i>
          <span>Watch Demo</span>
          <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>`;
    }

    let githubActionBtn = '';
    if (project.githubLink) {
      githubActionBtn = `
        <a href="${escapeHtml(project.githubLink)}" target="_blank" rel="noopener noreferrer" class="project-card-primary-btn" title="Check out ${escapeHtml(project.title)} on GitHub">
          <i class="fab fa-github" aria-hidden="true"></i>
          <span>Check on GitHub</span>
          <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>`;
    } else if (!project.demoLink && project.publicationLink) {
      githubActionBtn = `
        <a href="${escapeHtml(project.publicationLink)}" target="_blank" rel="noopener noreferrer" class="project-card-primary-btn" title="Read publication">
          <i class="fas fa-book-open" aria-hidden="true"></i>
          <span>Read Paper</span>
          <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>`;
    }

    const actionFooter = `
      <div class="project-card-actions">
        ${publicationAction}
        ${researchPageAction}
      </div>
      <div class="project-card-btns">
        ${demoActionBtn}
        ${githubActionBtn}
      </div>`;

    const timeline = escapeHtml(project.timeline || project.year);
    const institution = project.institution ? `<span class="project-card-institution">${escapeHtml(project.institution)}</span>` : '';

    return `
      <article class="project-card" id="${escapeHtml(project.id)}" data-project-id="${escapeHtml(project.id)}">
        <div class="project-card-inner">
          ${mediaMarkup(project)}
          <div class="project-card-body">
            <div class="project-card-meta">
              <span class="project-badge ${badgeClass}">${escapeHtml(project.badge)}</span>
              ${recruitingBadge}
              <span class="project-card-timeline">${timeline}</span>
              ${institution}
            </div>
            <h3>${escapeHtml(project.title)}</h3>
            <p class="project-card-tagline">${escapeHtml(project.tag)}</p>
            <p class="project-card-description">${escapeHtml(project.description)}</p>
            ${recruitingCallout}
            <div class="project-card-footer">
              ${actionFooter}
            </div>
          </div>
        </div>
      </article>`;
  };

  const filteredProjects = () => {
    return projects
      .filter(project => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'recruiting') return Boolean(project.recruiting);
        if (activeFilter === 'research') return project.category === 'research';
        if (activeFilter === 'side-project') return project.category === 'side-project' || project.category === 'applied-ai';
        return project.category === activeFilter;
      })
      .sort((a, b) => {
        if (activeSort === 'title') {
          return a.title.localeCompare(b.title);
        }
        return 0; // preserve curated chronological order in json
      });
  };

  const renderProjects = () => {
    if (!projectGrid) return;
    const matches = filteredProjects();

    if (!matches.length) {
      projectGrid.innerHTML = '<p class="projects-empty-state">No projects match this filter.</p>';
    } else {
      projectGrid.innerHTML = matches.map(cardMarkup).join('');
    }

    if (statusEl) {
      statusEl.textContent = matches.length
        ? `Showing ${matches.length} project${matches.length === 1 ? '' : 's'}`
        : 'No matching projects';
    }

    // Initialize IntersectionObserver for rendered items
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const cards = projectGrid.querySelectorAll('.project-card');
      const cardObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.08 });

      cards.forEach(card => cardObserver.observe(card));
    }
  };

  const handleHashNavigation = () => {
    let hash = window.location.hash.replace('#', '');
    if (!hash) return;
    if (hash === 'footposenet' || hash === 'deeprehab-pose-estimation' || hash === 'deep_rehab') {
      hash = 'deeprehab';
    }
    if (hash === 'nakedfood' || hash === 'naked-food') {
      hash = 'nakedfood-mobile-ai';
    }
    if (hash === 'furhat' || hash === 'multimodal-furhat' || hash === 'social-robotics') {
      hash = 'real-time-multimodal-furhat';
    }
    if (hash === 'ados' || hash === 'ados-2' || hash === 'ados-framework') {
      hash = 'ados-multimodal-framework';
    }
    if (hash === 'kriol' || hash === 'kriolu' || hash === 'kriol-nlp') {
      hash = 'kriol-nlp-lab';
    }
    if (hash === 'gaze' || hash === 'eye-gaze' || hash === 'eyegaze') {
      hash = 'eye-gaze-direction-recognition';
    }
    const targetProject = projects.find(p => p.id === hash);
    if (targetProject) {
      if (activeFilter !== 'all' && targetProject.category !== activeFilter && !(activeFilter === 'recruiting' && targetProject.recruiting)) {
        activeFilter = 'all';
        filterButtons.forEach(btn => {
          btn.classList.toggle('is-active', btn.dataset.projectFilter === 'all');
          btn.setAttribute('aria-pressed', btn.dataset.projectFilter === 'all' ? 'true' : 'false');
        });
        renderProjects();
      }
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('project-card--highlight');
          setTimeout(() => el.classList.remove('project-card--highlight'), 2500);
        }
      }, 180);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('assets/data/projects.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      projects = await response.json();
      renderProjects();
      handleHashNavigation();
    } catch (error) {
      console.error('Unable to load projects:', error);
      if (projectGrid) {
        projectGrid.innerHTML = '<p class="projects-empty-state">The projects could not be loaded. Please refresh the page.</p>';
      }
      if (statusEl) statusEl.textContent = 'Archive unavailable';
    }
  };

  // Filter interaction
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.projectFilter;
      filterButtons.forEach(btn => {
        const isActive = btn === button;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
      renderProjects();
    });
  });

  // Sort interaction
  sortSelect?.addEventListener('change', () => {
    activeSort = sortSelect.value;
    renderProjects();
  });

  // Scroll reveal on static items
  const revealItems = document.querySelectorAll('.projects-reveal');
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

  // ============================================
  // LIGHTBOX INTERACTION
  // ============================================
  const lightbox = document.getElementById('project-lightbox');
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
      lightboxStage.innerHTML = `<video src="${escapeHtml(media.src)}" controls autoplay playsinline></video>`;
    } else {
      lightboxStage.innerHTML = `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt || '')}" />`;
    }

    if (lightboxCounter) lightboxCounter.textContent = `${activeMediaIndex + 1} of ${activeMedia.length}`;
    if (previousButton) previousButton.disabled = activeMedia.length < 2;
    if (nextButton) nextButton.disabled = activeMedia.length < 2;
  };

  const openProjectMedia = trigger => {
    const projectId = trigger.dataset.projectMedia;
    const project = projects.find(item => item.id === projectId);
    if (!project?.media?.length) return;

    activeMedia = project.media;
    activeMediaIndex = 0;
    lightboxTrigger = trigger;
    if (lightboxTitle) lightboxTitle.textContent = project.title;
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

  projectGrid?.addEventListener('click', event => {
    const trigger = event.target.closest('[data-project-media]');
    if (trigger) openProjectMedia(trigger);
  });

  lightbox?.querySelector('[data-lightbox-close]')?.addEventListener('click', closeLightbox);
  previousButton?.addEventListener('click', () => moveLightbox(-1));
  nextButton?.addEventListener('click', () => moveLightbox(1));
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', event => {
    if (!lightbox || lightbox.hidden) return;

    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }

    if (event.key === 'ArrowLeft') {
      moveLightbox(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      moveLightbox(1);
      return;
    }
  });

  window.addEventListener('hashchange', handleHashNavigation);
  loadProjects();
});
