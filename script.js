const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
if (navToggle && nav) {
  const navToggleLabel = navToggle.querySelector('.sr-only');
  const setNavState = (open) => {
    navToggle.setAttribute('aria-expanded', String(open));
    if (navToggleLabel) {
      navToggleLabel.textContent = open ? 'Cerrar navegación' : 'Abrir navegación';
    }
  };
  const closeNav = () => {
    nav.classList.remove('open');
    setNavState(false);
  };

  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    setNavState(open);
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeNav();
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('open')) return;
    if (event.target.closest('[data-nav], [data-nav-toggle]')) return;
    closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });
}
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
const latestYouTubeMount = document.querySelector('[data-youtube-latest]');
if (latestYouTubeMount) {
  const status = latestYouTubeMount.querySelector('[data-youtube-status]');
  const iframe = latestYouTubeMount.querySelector('[data-youtube-iframe]');
  const videoId = iframe?.dataset?.fallbackVideoId;

  if (iframe && videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
    iframe.hidden = false;
    iframe.removeAttribute('hidden');
    latestYouTubeMount.setAttribute('aria-busy', 'false');
    status?.remove();
  } else {
    latestYouTubeMount.setAttribute('aria-busy', 'false');
    if (status) {
      status.innerHTML = '<div class="video-fallback"><p>Último mensaje no disponible.</p><a class="btn btn-primary" href="https://www.youtube.com/@ICDCVegaBajaLakes" rel="noopener noreferrer">Visita nuestro canal</a></div>';
    }
  }
}
