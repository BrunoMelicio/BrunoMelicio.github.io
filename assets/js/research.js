document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = document.querySelectorAll('.research-reveal');

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

  const filters = [...document.querySelectorAll('.publication-filter')];
  const cards = [...document.querySelectorAll('.research-publication-card')];
  const emptyState = document.querySelector('.publication-empty');

  const matchesFilter = (card, selected) => {
    if (selected === 'all') return true;
    if (selected === 'earlier') return Number(card.dataset.year) < 2025;
    if (/^\d{4}$/.test(selected)) return card.dataset.year === selected;
    return card.dataset.type === selected;
  };

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const selected = filter.dataset.filter;
      let visibleCount = 0;

      filters.forEach(button => {
        const isActive = button === filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });

      cards.forEach(card => {
        const isVisible = matchesFilter(card, selected);
        card.classList.toggle('is-filtered-out', !isVisible);
        card.setAttribute('aria-hidden', String(!isVisible));
        if (isVisible) {
          visibleCount += 1;
          card.classList.add('is-visible');
        }
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
    });
  });

  const loadResearchMetrics = async () => {
    try {
      const response = await fetch('assets/data/research-metrics.json', { cache: 'no-cache' });
      if (!response.ok) return;

      const metrics = await response.json();
      Object.entries(metrics.display || {}).forEach(([key, value]) => {
        document.querySelectorAll(`[data-research-metric="${key}"]`).forEach(node => {
          node.textContent = Number(value).toLocaleString('en-US');
        });
      });

      const researchGateCitations = metrics.sources?.researchGate?.citations;
      if (Number.isFinite(Number(researchGateCitations))) {
        document.querySelectorAll('[data-research-citation-sources]').forEach(node => {
          node.textContent = `Google Scholar · ${Number(researchGateCitations).toLocaleString('en-US')} on ResearchGate`;
        });
      }

      if (metrics.verifiedOn) {
        const verifiedDate = new Date(`${metrics.verifiedOn}T00:00:00`);
        if (!Number.isNaN(verifiedDate.getTime())) {
          const formattedDate = new Intl.DateTimeFormat('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }).format(verifiedDate);
          document.querySelectorAll('[data-research-verified]').forEach(node => {
            node.textContent = `Verified ${formattedDate}`;
          });
        }
      }
    } catch {
      // Keep the verified values embedded in the page if the local snapshot cannot be loaded.
    }
  };

  loadResearchMetrics();

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
