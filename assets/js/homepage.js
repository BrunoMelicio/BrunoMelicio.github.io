document.addEventListener('DOMContentLoaded', async () => {
  const rail = document.querySelector('.publication-grid[data-view-all-href]');
  if (!rail) return;
  try {
    const response = await fetch('assets/data/research-metrics.json');
    if (!response.ok) return;
    const metrics = await response.json();
    const total = metrics.display?.publications;
    if (Number.isInteger(total) && total > 0) rail.dataset.viewAllCount = String(total);
  } catch { /* Keep the published total if the metrics file is unavailable. */ }
});
