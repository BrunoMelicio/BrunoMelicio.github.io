/* Shared navigation. Content stays readable while the small includes load. */
(() => {
  const savedTheme = (() => { try { return localStorage.getItem('theme'); } catch { return null; } })();
  const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('theme-dark', initialTheme === 'dark');
  document.body.classList.toggle('theme-light', initialTheme !== 'dark');

  document.addEventListener('DOMContentLoaded', async () => {
    const main = document.querySelector('main');
    if (main) { main.id = 'main-content'; main.tabIndex = -1; }
    const getInclude = async path => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      const source = await response.text();
      const parsed = new DOMParser().parseFromString(source, 'text/html');
      // Development servers may append live-reload scripts to HTML includes.
      parsed.querySelectorAll('script').forEach(script => script.remove());
      return parsed.body.innerHTML;
    };
    const includes = await Promise.allSettled([getInclude('/includes/nav.html'), getInclude('/includes/footer.html')]);
    if (includes[0].status === 'fulfilled') {
      document.body.insertAdjacentHTML('afterbegin', includes[0].value);
      initializeNavigation();
    }
    if (includes[1].status === 'fulfilled') {
      document.body.insertAdjacentHTML('beforeend', includes[1].value);
      document.getElementById('current-year').textContent = new Date().getFullYear();
    }
    document.querySelectorAll('.animate-on-scroll').forEach(item => item.classList.add('is-visible'));
  });

  function initializeNavigation() {
    const header = document.querySelector('.global-header');
    const nav = document.querySelector('.global-nav');
    const triggers = [...document.querySelectorAll('.menu-button, .dock-menu')];
    const themeButton = document.querySelector('.theme-toggle');
    const mobile = matchMedia('(max-width: 900px)');
    let returnFocus;
    const path = location.pathname;
    document.querySelectorAll('.global-nav a, .mobile-dock a').forEach(link => {
      const href = link.getAttribute('href');
      const active = href === path || (href === '/' && path === '/index.html') ||
        (href === '/learn.html' && /\/((courses|introduction-to-ai)\.html|blog\/)/.test(path));
      if (active) link.setAttribute('aria-current', 'page');
    });
    const setMenu = (open, trigger) => {
      if (open) returnFocus = trigger;
      header.classList.toggle('menu-open', open);
      document.body.classList.toggle('no-scroll', open);
      triggers.forEach(button => button.setAttribute('aria-expanded', String(open)));
      triggers.forEach(button => button.setAttribute('aria-label', open ? 'Close menu' : 'Toggle menu'));
      if (mobile.matches) nav.inert = !open;
      if (open) nav.querySelector('a').focus();
      else returnFocus?.focus();
    };
    triggers.forEach(button => button.addEventListener('click', () => setMenu(!header.classList.contains('menu-open'), button)));
    nav.addEventListener('click', event => { if (event.target.closest('a') && mobile.matches) setMenu(false); });
    document.addEventListener('keydown', event => {
      if (!header.classList.contains('menu-open')) return;
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false); }
      if (event.key !== 'Tab') return;
      const focusable = [...header.querySelectorAll('a, button')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    mobile.addEventListener('change', () => { if (header.classList.contains('menu-open')) setMenu(false); nav.inert = mobile.matches; });
    nav.inert = mobile.matches;
    const syncTheme = () => {
      const dark = document.body.classList.contains('theme-dark');
      themeButton.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} mode`);
      themeButton.setAttribute('aria-pressed', String(dark));
      const icon = themeButton.querySelector('i');
      if (icon) icon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
      const portrait = document.querySelector('.home-portrait img[data-light-src]');
      if (portrait) portrait.src = dark ? portrait.dataset.darkSrc : portrait.dataset.lightSrc;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101010' : '#f4f6f8');
    };
    syncTheme();
    themeButton.addEventListener('click', () => {
      const dark = !document.body.classList.contains('theme-dark');
      document.body.classList.toggle('theme-dark', dark);
      document.body.classList.toggle('theme-light', !dark);
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* Theme remains usable without storage. */ }
      syncTheme();
    });
    const syncScroll = () => header.classList.toggle('is-scrolled', scrollY > 16);
    window.addEventListener('scroll', syncScroll, {passive: true});
    syncScroll();
  }
})();
