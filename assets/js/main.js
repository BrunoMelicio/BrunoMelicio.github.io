/* Main.js - Additional interactions */
/* Scroll animations are initialized in navigation.js */
/* This file is kept for any page-specific interactivity */

document.addEventListener('DOMContentLoaded', () => {
  // Sitewide Liquid Glass Video Background Slow Motion
  const bgVideos = document.querySelectorAll('.bg-video');
  bgVideos.forEach(v => v.playbackRate = 0.5); 
});
