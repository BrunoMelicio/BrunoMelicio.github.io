document.addEventListener('DOMContentLoaded', function () {
  // Load navigation
  fetch('/includes/nav.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('afterbegin', html);
      initNavigation();
      initScrolledNav();
      initThemeToggle();
    })
    .catch(error => console.error('Error loading navigation:', error));

  // Load footer
  fetch('/includes/footer.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);
      const yearEl = document.getElementById('current-year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    })
    .catch(error => console.error('Error loading footer:', error));

  // Initialize scroll animations
  initScrollAnimations();

  // --- Navigation ---
  function initNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const path = window.location.pathname;

    // Active page
    document.querySelectorAll('.nav-list a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path || (href === '/' && (path === '/' || path === '/index.html'))) {
        link.classList.add('active');
      } else if (href !== '/' && path.startsWith(href.replace('.html', ''))) {
        link.classList.add('active');
      }
    });

    // Mobile toggle
    if (menuToggle && navMenu) {
      menuToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('no-scroll');
      });

      // Close on link click
      document.querySelectorAll('.nav-list a').forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('no-scroll');
          }
        });
      });

      // Close on outside click
      document.addEventListener('click', function (e) {
        if (window.innerWidth <= 768 &&
          !e.target.closest('.nav-menu') &&
          !e.target.closest('.menu-toggle')) {
          menuToggle.classList.remove('active');
          navMenu.classList.remove('active');
          document.body.classList.remove('no-scroll');
        }
      });
    }
  }

  // --- Dark Mode Toggle ---
  function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');
    
    // Check saved theme - default is light
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.replace('theme-light', 'theme-dark');
      icon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
      if (document.body.classList.contains('theme-light')) {
        document.body.classList.replace('theme-light', 'theme-dark');
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
      } else {
        document.body.classList.replace('theme-dark', 'theme-light');
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  // --- Transparent → solid nav on scroll ---
  function initScrolledNav() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const threshold = 100;

    function checkScroll() {
      if (window.scrollY > threshold) {
        header.classList.add('nav-scrolled');
      } else {
        header.classList.remove('nav-scrolled');
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  // --- Intersection Observer for scroll animations ---
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    elements.forEach(el => observer.observe(el));
  }
});
