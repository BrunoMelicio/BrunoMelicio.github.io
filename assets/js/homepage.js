document.addEventListener('DOMContentLoaded', () => {
  const filters = [...document.querySelectorAll('.research-filter')];
  const cards = [...document.querySelectorAll('.publication-card')];
  const rail = document.querySelector('.publication-grid');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(filter => {
      const selected = filter === button;
      filter.classList.toggle('is-active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.type !== button.dataset.filter; });
    rail?.scrollTo({left: 0, behavior: 'instant'});
  }));
});
