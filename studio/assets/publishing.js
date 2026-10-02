(() => {
  const productDialog = document.querySelector('[data-product-dialog]');
  const productBackdrop = document.querySelector('[data-dialog-backdrop]');
  const productTitle = document.querySelector('[data-dialog-title]');
  const galleryDialog = document.querySelector('[data-gallery-dialog]');
  const galleryBackdrop = document.querySelector('[data-gallery-backdrop]');
  const galleryImage = document.querySelector('[data-gallery-dialog-image]');
  const galleryVideo = document.querySelector('[data-gallery-dialog-video]');
  const galleryTitle = document.querySelector('[data-gallery-dialog-title]');
  const galleryLabel = document.querySelector('[data-gallery-dialog-label]');
  const galleryModel = document.querySelector('[data-gallery-dialog-model]');
  const galleryRatio = document.querySelector('[data-gallery-dialog-ratio]');
  const galleryStatus = document.querySelector('[data-gallery-dialog-status]');
  const galleryPrompt = document.querySelector('[data-gallery-dialog-prompt]');
  const gallerySource = document.querySelector('[data-gallery-dialog-source]');
  const copyPromptButton = document.querySelector('[data-copy-prompt]');

  const cataloguePromise = fetch('assets/gallery/gallery-metadata.json')
    .then((response) => {
      if (!response.ok) throw new Error(`Gallery catalogue returned ${response.status}`);
      return response.json();
    })
    .then((catalogue) => new Map((catalogue.items || []).map((item) => [item.path, item])))
    .catch((error) => {
      console.warn('Braids gallery catalogue could not be loaded.', error);
      return new Map();
    });

  const templates = {
    studio: {
      path: 'showcase_1/model.png',
      title: 'Professional Studio Portraits',
      label: 'Free studio template'
    },
    amalfi: {
      path: 'ChatGPT Image Jul 22, 2026, 11_05_29 AM.png',
      title: 'Amalfi Sea Ladder',
      label: 'Free editorial template'
    },
    'colour-block': {
      path: 'Model_standing_against_wall_2K_202607232008 (1).jpeg',
      title: 'Colour-Block Editorial',
      label: 'Free fashion template'
    },
    fan: {
      title: 'Stadium Fan Film',
      label: 'Free video template',
      image: 'assets/images/template-fan-stadium.jpg',
      model: 'GPT Image 2 → image-to-video model',
      aspectRatio: '9:16',
      width: null,
      height: null,
      promptStatus: 'reconstructed',
      promptSource: 'Braids template reconstruction',
      prompt: 'Using the uploaded identity reference, create a vertical cinematic football-supporter scene in packed stadium stands. Preserve the person’s facial identity, natural proportions and age. Dress them in a Cape Verde national-team shirt, surrounded by supporters and flags, under believable match-night lighting. Frame a lively mid-shot with realistic crowd depth, handheld energy and room for natural five-second image-to-video movement: cheering, turning toward the pitch and raising one arm. Avoid distorted hands, duplicated people, text artifacts and artificial skin.'
    },
    'ugc-foundation': {
      title: 'Realistic UGC Influencer',
      label: 'Free UGC influencer template',
      image: 'assets/gallery/influencers/African/ChatGPT%20Image%20Jul%2014,%202026,%2004_51_40%20PM.png',
      model: 'GPT Image 2 or Higgsfield Soul 2',
      aspectRatio: '3:4 or 9:16',
      width: null,
      height: null,
      promptStatus: 'reconstructed',
      promptSource: 'Braids free teaching template',
      prompt: 'Create a photorealistic UGC influencer character photographed for authentic social content. Define a clear, memorable identity: [age range], [appearance], [hair], [personal style] and [personality]. Place the character in [everyday location] doing [natural action]. Use believable phone-camera framing, available light, realistic skin texture, subtle imperfections and an unforced expression. The result should feel captured rather than staged—no beauty-filter skin, exaggerated anatomy, luxury-ad polish, artificial bokeh, text or watermarks. Preserve this exact facial identity and defining features for future scenes.'
    }
  };

  const closeProductDialog = () => {
    if (!productDialog || !productBackdrop) return;
    productDialog.hidden = true;
    productBackdrop.hidden = true;
    if (!galleryDialog || galleryDialog.hidden) document.body.classList.remove('dialog-open');
  };

  const openProductDialog = (name) => {
    if (!productDialog || !productBackdrop) return;
    if (productTitle) productTitle.textContent = name;
    productDialog.hidden = false;
    productBackdrop.hidden = false;
    document.body.classList.add('dialog-open');
    productDialog.querySelector('[data-dialog-close]')?.focus();
  };

  const promptStatusLabel = (status) => {
    if (status === 'source' || status === 'source-pack' || status === 'source-metadata') return 'Source prompt';
    if (status === 'reconstructed') return 'Reconstructed prompt';
    return 'Prompt unavailable';
  };

  const closeGalleryDialog = () => {
    if (!galleryDialog || !galleryBackdrop) return;
    if (galleryVideo) {
      galleryVideo.pause();
      galleryVideo.removeAttribute('src');
      galleryVideo.load();
      galleryVideo.hidden = true;
    }
    galleryDialog.hidden = true;
    galleryBackdrop.hidden = true;
    if (!productDialog || productDialog.hidden) document.body.classList.remove('dialog-open');
  };

  const openGalleryItem = (item, options = {}) => {
    if (!galleryDialog || !galleryBackdrop || !item) return;
    const mediaSrc = options.image || (item.path ? `assets/gallery/${item.path}` : '');
    const dimensions = item.width && item.height ? `${item.width} × ${item.height}` : null;
    const duration = item.duration ? `${Math.round(item.duration)} seconds` : null;
    const status = promptStatusLabel(item.promptStatus);
    const isVideo = item.mediaType === 'video';

    if (galleryImage) {
      galleryImage.hidden = isVideo;
      galleryImage.src = isVideo ? '' : mediaSrc;
      galleryImage.alt = options.title || item.title || 'Braids gallery image';
    }
    if (galleryVideo) {
      galleryVideo.hidden = !isVideo;
      if (isVideo) {
        galleryVideo.src = mediaSrc;
        galleryVideo.load();
      }
    }
    if (galleryTitle) galleryTitle.textContent = options.title || item.promptTitle || item.title || 'Gallery image';
    if (galleryLabel) galleryLabel.textContent = options.label || 'Gallery details';
    if (galleryModel) galleryModel.textContent = item.model || 'Model not identified';
    if (galleryRatio) galleryRatio.textContent = [item.aspectRatio, duration, dimensions].filter(Boolean).join(' · ') || 'Not available';
    if (galleryStatus) galleryStatus.textContent = status;
    if (galleryPrompt) galleryPrompt.textContent = item.prompt || 'This prompt has not yet been matched to its source file.';
    if (gallerySource) {
      gallerySource.textContent = item.promptSource ? `Source: ${item.promptSource}` : 'No source file matched yet.';
    }
    if (copyPromptButton) {
      copyPromptButton.disabled = !item.prompt;
      copyPromptButton.dataset.prompt = item.prompt || '';
      copyPromptButton.textContent = 'Copy prompt';
    }

    galleryDialog.hidden = false;
    galleryBackdrop.hidden = false;
    document.body.classList.add('dialog-open');
    galleryDialog.querySelector('[data-gallery-close]')?.focus();
  };

  document.querySelectorAll('[data-product-preview]').forEach((button) => {
    button.addEventListener('click', () => openProductDialog(button.dataset.productPreview || 'Product'));
  });
  document.querySelectorAll('[data-dialog-close]').forEach((button) => button.addEventListener('click', closeProductDialog));
  productBackdrop?.addEventListener('click', closeProductDialog);

  document.querySelectorAll('[data-gallery-path]').forEach((piece) => {
    piece.tabIndex = 0;
    piece.setAttribute('role', 'button');
    piece.setAttribute('aria-label', `View details for ${piece.querySelector('figcaption')?.textContent || 'gallery item'}`);
    const open = async () => {
      const catalogue = await cataloguePromise;
      const item = catalogue.get(piece.dataset.galleryPath);
      if (item) openGalleryItem(item, { title: piece.querySelector('figcaption')?.textContent });
    };
    piece.addEventListener('click', open);
    piece.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });

  document.querySelectorAll('[data-template-preview]').forEach((button) => {
    button.addEventListener('click', async () => {
      const template = templates[button.dataset.templatePreview];
      if (!template) return;
      if (template.path) {
        const catalogue = await cataloguePromise;
        const item = catalogue.get(template.path);
        if (item) openGalleryItem(item, template);
      } else {
        openGalleryItem(template, template);
      }
    });
  });

  document.querySelectorAll('[data-gallery-close]').forEach((button) => button.addEventListener('click', closeGalleryDialog));
  galleryBackdrop?.addEventListener('click', closeGalleryDialog);
  copyPromptButton?.addEventListener('click', async () => {
    const prompt = copyPromptButton.dataset.prompt;
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      copyPromptButton.textContent = 'Copied';
      window.setTimeout(() => { copyPromptButton.textContent = 'Copy prompt'; }, 1600);
    } catch (error) {
      console.warn('Prompt could not be copied.', error);
    }
  });

  document.querySelectorAll('[data-static-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const prompt = button.closest('.ugc-prompt-card')?.querySelector('[data-static-prompt]')?.textContent?.trim();
      if (!prompt) return;
      const original = button.innerHTML;
      try {
        await navigator.clipboard.writeText(prompt);
        button.textContent = 'Prompt copied';
        window.setTimeout(() => { button.innerHTML = original; }, 1600);
      } catch (error) {
        console.warn('Prompt could not be copied.', error);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeGalleryDialog();
    closeProductDialog();
  });

  const shopCards = [...document.querySelectorAll('[data-shop-category]')];
  const shopFilters = [...document.querySelectorAll('[data-shop-filter]')];
  shopFilters.forEach((button) => button.addEventListener('click', () => {
    const category = button.dataset.shopFilter;
    shopFilters.forEach((item) => item.classList.toggle('is-active', item === button));
    shopCards.forEach((card) => { card.hidden = category !== 'all' && card.dataset.shopCategory !== category; });
  }));
})();
