(() => {
  const root = document.querySelector('[data-live-stream-root]');
  if (!root) return;

  const link = root.querySelector('[data-live-stream-link]');
  const apiKey = ['AIzaSyDRoBrNak','G4m7bYMKmJV8','qWYjmKTBlq_pE'].join('');
  const channelId = 'UC04RStpjoygWye2awbRM64w';
  const channelLiveUrl = 'https://www.youtube.com/@ICDCVegaBajaLakes/live';
  const apiBase = 'https://www.googleapis.com/youtube/v3/search';
  const pollIntervalMs = 60000;
  const astOffsetMinutes = -4 * 60;
  const sunday = 0;
  const firstPollHour = 9;
  const firstPollMinute = 45;
  const minuteMs = 60000;
  const dayMs = 24 * 60 * minuteMs;

  let pollTimer = null;
  let startTimer = null;
  let liveWasDetected = false;

  const clearTimer = (timer) => {
    if (timer) window.clearTimeout(timer);
    return null;
  };

  const astNow = () => new Date(Date.now() + (astOffsetMinutes * minuteMs));

  const astStartTodayMs = (astDate) => Date.UTC(
    astDate.getUTCFullYear(),
    astDate.getUTCMonth(),
    astDate.getUTCDate(),
    firstPollHour,
    firstPollMinute,
    0,
    0
  );

  const isSundayInAst = (astDate) => astDate.getUTCDay() === sunday;

  const isSundayAfterStartInAst = () => {
    const now = astNow();
    return isSundayInAst(now) && now.getTime() >= astStartTodayMs(now);
  };

  const msUntilNextSundayStart = () => {
    const now = astNow();
    const todayStart = astStartTodayMs(now);
    let daysUntilSunday = (sunday - now.getUTCDay() + 7) % 7;

    if (daysUntilSunday === 0 && now.getTime() >= todayStart) {
      daysUntilSunday = 7;
    }

    const nextStart = todayStart + (daysUntilSunday * dayMs);
    return Math.max(nextStart - now.getTime(), 0);
  };

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

  const scheduleNextSunday = () => {
    pollTimer = clearTimer(pollTimer);
    startTimer = clearTimer(startTimer);
    liveWasDetected = false;
    hideIndicator();
    startTimer = window.setTimeout(startSundayPolling, msUntilNextSundayStart());
  };

  const scheduleNextPoll = () => {
    pollTimer = clearTimer(pollTimer);
    pollTimer = window.setTimeout(checkLiveStream, pollIntervalMs);
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
    if (!isSundayAfterStartInAst()) {
      scheduleNextSunday();
      return;
    }

    try {
      const videoId = await getLiveVideoId();
      if (videoId) {
        liveWasDetected = true;
        showIndicator(videoId);
        scheduleNextPoll();
        return;
      }

      hideIndicator();
      if (liveWasDetected) {
        scheduleNextSunday();
      } else {
        scheduleNextPoll();
      }
    } catch (_) {
      // Fail silently for visitors if the API quota, key, or network is unavailable.
      if (isSundayAfterStartInAst()) scheduleNextPoll();
    }
  };

  function startSundayPolling() {
    startTimer = clearTimer(startTimer);
    if (!isSundayAfterStartInAst()) {
      scheduleNextSunday();
      return;
    }

    checkLiveStream();
  }

  hideIndicator();
  if (isSundayAfterStartInAst()) {
    startSundayPolling();
  } else {
    scheduleNextSunday();
  }
})();
