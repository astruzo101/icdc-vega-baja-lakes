const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
if (navToggle && nav) {
  const navToggleLabel = navToggle.querySelector('.sr-only');
  const setNavState = (open) => {
    nav.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    if (navToggleLabel) navToggleLabel.textContent = open ? 'Cerrar navegación' : 'Abrir navegación';
  };
  const closeNav = ({ restoreFocus = false } = {}) => {
    setNavState(false);
    if (restoreFocus) navToggle.focus({ preventScroll: true });
  };

  navToggle.addEventListener('click', () => {
    setNavState(!nav.classList.contains('open'));
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
    if (event.key === 'Escape' && nav.classList.contains('open')) closeNav({ restoreFocus: true });
  });
}
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();
const latestYouTubeMount = document.querySelector('[data-youtube-latest]');
if (latestYouTubeMount) {
  const status = latestYouTubeMount.querySelector('[data-youtube-status]');
  const iframe = latestYouTubeMount.querySelector('[data-youtube-iframe]');
  const channelUrl = 'https://www.youtube.com/@ICDCVegaBajaLakes';
  const channelHandle = 'ICDCVegaBajaLakes';
  const apiKey = ['AIzaSy','CkLfoznFw6','MBRLyRcMc8','GansxJ1vct7Os'].join('');
  const apiBase = 'https://www.googleapis.com/youtube/v3';
  const embedBase = 'https://www.youtube-nocookie.com/embed';
  const requestTimeoutMs = 8000;

  const setStatus = (message, showLink = false) => {
    if (!status) return;
    status.innerHTML = showLink
      ? `<div class="video-fallback"><p>${message}</p><a class="btn btn-primary" href="${channelUrl}" target="_blank" rel="noopener noreferrer" aria-label="Visita nuestro canal de YouTube (abre en una pestaña nueva)">Visita nuestro canal</a></div>`
      : `<span class="video-spinner" aria-hidden="true"></span><p>${message}</p>`;
  };

  const getJson = async (endpoint, params) => {
    const url = new URL(`${apiBase}/${endpoint}`);
    Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(url.toString(), {
        cache: 'no-store',
        referrerPolicy: 'origin',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`YouTube API ${endpoint} failed: ${response.status}`);
      return response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const showVideo = (videoId) => {
    iframe.src = `${embedBase}/${encodeURIComponent(videoId)}`;
    iframe.hidden = false;
    iframe.removeAttribute('hidden');
    latestYouTubeMount.setAttribute('aria-busy', 'false');
    if (status) status.remove();
  };

  const loadLatestYouTubeVideo = async () => {
    try {
      latestYouTubeMount.setAttribute('aria-busy', 'true');
      setStatus('Cargando último mensaje…');
      const channelData = await getJson('channels', {
        part: 'id,contentDetails',
        forHandle: channelHandle
      });
      const channel = channelData.items && channelData.items[0];
      const uploadsPlaylist = channel && channel.contentDetails && channel.contentDetails.relatedPlaylists && channel.contentDetails.relatedPlaylists.uploads;
      if (!uploadsPlaylist) throw new Error('Uploads playlist not found');

      const uploadsData = await getJson('playlistItems', {
        part: 'contentDetails,snippet',
        playlistId: uploadsPlaylist,
        maxResults: '1'
      });
      const latestItem = uploadsData.items && uploadsData.items[0];
      const videoId = latestItem && ((latestItem.contentDetails && latestItem.contentDetails.videoId) || (latestItem.snippet && latestItem.snippet.resourceId && latestItem.snippet.resourceId.videoId));
      if (!videoId) throw new Error('Latest video ID not found');

      showVideo(videoId);
    } catch (error) {
      console.warn('Latest YouTube video unavailable:', error);
      const bakedVideoId = iframe && iframe.dataset && iframe.dataset.fallbackVideoId;
      if (bakedVideoId) {
        showVideo(bakedVideoId);
        return;
      }
      if (iframe) {
        iframe.hidden = true;
        iframe.removeAttribute('src');
      }
      latestYouTubeMount.setAttribute('aria-busy', 'false');
      setStatus('Último mensaje no disponible. Visita nuestro canal.', true);
    }
  };

  loadLatestYouTubeVideo();
}
