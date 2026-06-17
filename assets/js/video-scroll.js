document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  const canvas = document.getElementById("hero-lightpass");
  if (!canvas) return; // Exit if not on the homepage
  const context = canvas.getContext("2d");

  // Determine which video to load based on screen width
  const isMobile = window.innerWidth <= 768;
  const videoSrc = isMobile 
    ? "assets/videos/mobile-optimized.mp4" 
    : "assets/videos/desktop-optimized.mp4";

  // Create an off-DOM video element
  const video = document.createElement("video");
  video.src = videoSrc;
  video.muted = true;
  video.playsInline = true;
  video.controls = false;
  video.preload = "auto";
  
  // Set dimensions based on the video source (we will refine these when metadata loads)
  canvas.width = isMobile ? 1080 : 1920;
  canvas.height = isMobile ? 1920 : 1080;

  // Wait for the video metadata to load so we know the exact duration and dimensions
  video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    video.currentTime = 0;
    
    // Initial draw
    requestAnimationFrame(updateCanvas);
    
    // Set up GSAP ScrollTrigger to tie scroll position to video time
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1, // Smooth scrubbing, takes 1 second to "catch up" to the scrollbar
      onUpdate: (self) => {
        // Calculate the video time based on scroll progress
        // Only go up to slightly before the end to avoid looping/flicker
        let newTime = self.progress * (video.duration - 0.1);
        if (newTime < 0) newTime = 0;
        video.currentTime = newTime;
      }
    });
  });

  // Continuously draw the current video frame to the canvas
  function updateCanvas() {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(updateCanvas);
  }

  // Force a redraw when the video seeks
  video.addEventListener('seeked', () => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  });

  // ----------------------------------------------------------------
  // UI Choreography (Fade things in and out over the video)
  // ----------------------------------------------------------------

  // Fade Hero up and out quickly as we start scrolling
  gsap.to(".hero-glass-card", {
    opacity: 0,
    y: -50,
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true
    }
  });

  // Fade Stats in
  gsap.fromTo(".home-stats-grid", 
    { opacity: 0, y: 100 },
    { opacity: 1, y: 0, scrollTrigger: {
      trigger: ".home-stats",
      start: "top center",
      end: "center center",
      scrub: true
    }}
  );

  // Fade Paths in
  gsap.fromTo(".home-paths-grid", 
    { opacity: 0, y: 100 },
    { opacity: 1, y: 0, scrollTrigger: {
      trigger: ".home-paths",
      start: "top center",
      end: "center center",
      scrub: true
    }}
  );
});
