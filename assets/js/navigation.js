document.addEventListener('DOMContentLoaded', function() {
  // Load navigation
  fetch('/includes/nav.html')
    .then(response => response.text())
    .then(html => {
      document.body.insertAdjacentHTML('afterbegin', html);
      initializeNavigation();
    })
    .catch(error => {
      console.error('Error loading navigation:', error);
    });
  
  // Load footer
  fetch('/includes/footer.html')
    .then(response => response.text())
    .then(html => {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.outerHTML = html;
      } else {
        document.body.insertAdjacentHTML('beforeend', html);
      }
      // Update current year in footer
      document.getElementById('current-year').textContent = new Date().getFullYear();
    })
    .catch(error => {
      console.error('Error loading footer:', error);
    });

  function initializeNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Set active class on current page
    document.querySelectorAll('.nav-list a').forEach(link => {
      const linkHref = link.getAttribute('href');
      if (linkHref === currentPage || 
          (currentPage === '' && linkHref === 'index.html')) {
        link.classList.add('active');
      }
    });

    // Toggle mobile menu
    if (menuToggle) {
      menuToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-list a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          menuToggle.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', function(event) {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (window.innerWidth <= 768 && 
        !event.target.closest('.nav-menu') && 
        !event.target.closest('.menu-toggle')) {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
});
