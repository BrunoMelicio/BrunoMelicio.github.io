// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', function() {
            navList.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a nav link
    const navLinks = document.querySelectorAll('.nav-list a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navList.classList.contains('active')) {
                navList.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    });
    
    // Check if we're on the home page to handle the overlay
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        // Check if the user has already dismissed the overlay
        if (!localStorage.getItem('overlayDismissed')) {
            document.getElementById('overlay').style.display = 'flex';
        }
    }
});

// Function to dismiss the overlay
function dismissOverlay() {
    document.getElementById('overlay').style.display = 'none';
    // Remember that the user dismissed the overlay
    localStorage.setItem('overlayDismissed', 'true');
}
