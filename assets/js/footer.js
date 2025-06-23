// Load footer content
function loadFooter() {
  fetch('includes/footer.html')
    .then(response => response.text())
    .then(data => {
      document.querySelector('footer').outerHTML = data;
      // Update current year in footer
      document.getElementById('current-year').textContent = new Date().getFullYear();
    })
    .catch(error => {
      console.error('Error loading footer:', error);
    });
}

// Load footer when DOM is loaded
document.addEventListener('DOMContentLoaded', loadFooter);
