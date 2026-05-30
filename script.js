const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
if (navToggle && nav) {
  const closeNav = () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
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
  const channelUrl = 'https://www.youtube.com/@ICDCVegaBajaLakes';
  const channelHandle = 'ICDCVegaBajaLakes';
  const apiKey = ['AIzaSy','CkLfoznFw6','MBRLyRcMc8','GansxJ1vct7Os'].join('');
  const apiBase = 'https://www.googleapis.com/youtube/v3';

  const setStatus = (message, showLink = false) => {
    if (!status) return;
    status.innerHTML = showLink
      ? `<div class="video-fallback"><p>${message}</p><a class="btn btn-primary" href="${channelUrl}" rel="noopener noreferrer">Visita nuestro canal</a></div>`
      : `<span class="video-spinner" aria-hidden="true"></span><p>${message}</p>`;
  };

  const getJson = async (endpoint, params) => {
    const url = new URL(`${apiBase}/${endpoint}`);
    Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) throw new Error(`No se pudo consultar YouTube (${endpoint}): ${response.status}`);
    return response.json();
  };

  const showVideo = (videoId) => {
    iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
    iframe.hidden = false;
    iframe.removeAttribute('hidden');
    if (status) status.remove();
  };

  const loadLatestYouTubeVideo = async () => {
    try {
      setStatus('Cargando último mensaje…');
      const channelData = await getJson('channels', {
        part: 'id,contentDetails',
        forHandle: channelHandle
      });
      const channel = channelData.items && channelData.items[0];
      const uploadsPlaylist = channel && channel.contentDetails && channel.contentDetails.relatedPlaylists && channel.contentDetails.relatedPlaylists.uploads;
      if (!uploadsPlaylist) throw new Error('No se encontró la lista de videos del canal');

      const uploadsData = await getJson('playlistItems', {
        part: 'contentDetails,snippet',
        playlistId: uploadsPlaylist,
        maxResults: '1'
      });
      const latestItem = uploadsData.items && uploadsData.items[0];
      const videoId = latestItem && ((latestItem.contentDetails && latestItem.contentDetails.videoId) || (latestItem.snippet && latestItem.snippet.resourceId && latestItem.snippet.resourceId.videoId));
      if (!videoId) throw new Error('No se encontró el video más reciente');

      showVideo(videoId);
    } catch (error) {
      console.warn('El último video de YouTube no está disponible:', error);
      const bakedVideoId = iframe && iframe.dataset && iframe.dataset.fallbackVideoId;
      if (bakedVideoId) {
        showVideo(bakedVideoId);
        return;
      }
      if (iframe) {
        iframe.hidden = true;
        iframe.removeAttribute('src');
      }
      setStatus('Último mensaje no disponible. Visita nuestro canal.', true);
    }
  };

  loadLatestYouTubeVideo();
}
