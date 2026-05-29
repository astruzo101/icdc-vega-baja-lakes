(() => {
  const root = document.querySelector('[data-live-stream-root]');
  if (!root) return;

  const link = root.querySelector('[data-live-stream-link]');
  const apiKey = ['AIzaSyDRoBrNak','G4m7bYMKmJV8','qWYjmKTBlq_pE'].join('');
  const channelId = 'UC04RStpjoygWye2awbRM64w';
  const channelLiveUrl = 'https://www.youtube.com/@ICDCVegaBajaLakes/live';
  const apiBase = 'https://www.googleapis.com/youtube/v3/search';
  const pollIntervalMs = 60000;
  const requestTimeoutMs = 8000;
  const astOffsetMinutes = -4 * 60;
  const sunday = 0;
  const firstPollHour = 9;
  const firstPollMinute = 45;
  const minuteMs = 60000;
  const dayMs = 24 * 60 * minuteMs;
  const maxTimeoutMs = 2147483647;

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

  const scheduleTimeout = (callback, delayMs) => {
    const safeDelay = Math.min(Math.max(delayMs, 0), maxTimeoutMs);
    return window.setTimeout(() => {
      const remainingDelay = delayMs - safeDelay;
      if (remainingDelay > 0) {
        startTimer = scheduleTimeout(callback, remainingDelay);
        return;
      }
      callback();
    }, safeDelay);
  };

  const scheduleNextSunday = () => {
    pollTimer = clearTimer(pollTimer);
    startTimer = clearTimer(startTimer);
    liveWasDetected = false;
    hideIndicator();
    startTimer = scheduleTimeout(startSundayPolling, msUntilNextSundayStart());
  };

  const scheduleNextPoll = () => {
    pollTimer = clearTimer(pollTimer);
    if (document.hidden) return;
    pollTimer = window.setTimeout(checkLiveStream, pollIntervalMs);
  };

  const pausePolling = () => {
    pollTimer = clearTimer(pollTimer);
    startTimer = clearTimer(startTimer);
  };

  const resumePolling = () => {
    if (isSundayAfterStartInAst()) {
      checkLiveStream();
    } else {
      scheduleNextSunday();
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      pausePolling();
      return;
    }

    resumePolling();
  };

  const getLiveVideoId = async () => {
    const url = new URL(apiBase);
    url.searchParams.set('part', 'id');
    url.searchParams.set('channelId', channelId);
    url.searchParams.set('eventType', 'live');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '1');
    url.searchParams.set('key', apiKey);

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(url.toString(), {
        cache: 'no-store',
        referrerPolicy: 'origin',
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Live stream lookup failed');

      const data = await response.json();
      const liveItem = data.items && data.items.find((item) => item.id && item.id.videoId);
      return liveItem && liveItem.id.videoId;
    } finally {
      window.clearTimeout(timeout);
    }
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

  document.addEventListener('visibilitychange', handleVisibilityChange);
  hideIndicator();
  if (document.hidden) return;
  resumePolling();
})();
