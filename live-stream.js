(() => {
  const root = document.querySelector('[data-live-stream-root]');
  if (!root) return;

  const link = root.querySelector('[data-live-stream-link]');
  const apiKey = ['AIzaSyDRoBrNak','G4m7bYMKmJV8','qWYjmKTBlq_pE'].join('');
  const channelId = 'UC04RStpjoygWye2awbRM64w';
  const channelLiveUrl = 'https://www.youtube.com/@ICDCVegaBajaLakes/live';
  const apiBase = 'https://www.googleapis.com/youtube/v3/search';
  const pollIntervalMs = 60000;

  const hideIndicator = () => {
    root.hidden = true;
    root.classList.remove('is-live');
    if (link) link.href = channelLiveUrl;
  };

  const showIndicator = (videoId) => {
    if (!link || !videoId) return;
    link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    root.hidden = false;
    root.classList.add('is-live');
  };

  const getLiveVideoId = async () => {
    const url = new URL(apiBase);
    url.searchParams.set('part', 'id');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('eventType', 'live');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '1');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      referrerPolicy: 'origin'
    });
    if (!response.ok) throw new Error('Live stream lookup failed');

    const data = await response.json();
    const liveItem = data.items && data.items.find((item) => item.id && item.id.videoId);
    return liveItem && liveItem.id.videoId;
  };

  const checkLiveStream = async () => {
    try {
      const videoId = await getLiveVideoId();
      if (videoId) {
        showIndicator(videoId);
      } else {
        hideIndicator();
      }
    } catch (_) {
      // Fail silently for visitors if the API quota, key, or network is unavailable.
    }
  };

  hideIndicator();
  checkLiveStream();
  window.setInterval(checkLiveStream, pollIntervalMs);
})();
