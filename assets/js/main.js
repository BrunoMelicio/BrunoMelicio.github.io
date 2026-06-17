/* Main.js - Additional interactions */
/* Scroll animations are initialized in navigation.js */
/* This file is kept for any page-specific interactivity */

document.addEventListener('DOMContentLoaded', () => {
  // Sitewide Liquid Glass Video Background Slow Motion
  const bgVideos = document.querySelectorAll('.bg-video');
  bgVideos.forEach(v => v.playbackRate = 0.5); 

  // Interactive Glow Effect for Glass Panels
  const glassPanels = document.querySelectorAll('.glass-panel');
  glassPanels.forEach(panel => {
    panel.addEventListener('mousemove', e => {
      const rect = panel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      panel.style.setProperty('--mouse-x', `${x}px`);
      panel.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // --- Minimal Global Loading Screen ---
  const removeLoader = () => document.body.classList.add('page-loaded');
  if (document.readyState === 'complete') {
    removeLoader();
  } else {
    window.addEventListener('load', removeLoader);
    // Fallback timeout in case video stalls
    setTimeout(removeLoader, 2500);
  }
});
