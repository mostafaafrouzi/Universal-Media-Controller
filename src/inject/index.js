(async () => {
  // 1. Blacklist Check
  const isBlacklisted = await new Promise(resolve => {
    chrome.storage.sync.get(['blacklist'], (result) => {
      const blacklist = result.blacklist || [];
      const url = window.location.href;
      const isBlocked = blacklist.some(pattern => {
        try {
          return new RegExp(pattern, "i").test(url);
        } catch (e) {
          return false;
        }
      });
      resolve(isBlocked);
    });
  });

  if (isBlacklisted) {
    return;
  }

  // --- State ---
  let active = true;
  let lastPlayed = null;
  let medias = [];
  let customHotkeys = {};

  const defaultHotkeys = {
    'playPause': 'k',
    'seekBackward10': 'j',
    'seekForward10': 'l',
    'seekBackward5': 'left',
    'seekForward5': 'right',
    'volumeUp': '+',
    'volumeDown': '-',
    'mute': 'm',
    'fullscreen': 'f',
    'pip': 'p',
    'speedUp': '>',
    'speedDown': '<',
    'prevSubtitle': '[',
    'nextSubtitle': ']'
  };

  // --- Helpers ---
  const fmtMSS = s => {
    s = Math.round(s);
    return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s;
  };

  const showToast = (msg) => {
    let toast = document.getElementById('umc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'umc-toast';
      Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '4px',
        zIndex: '2147483647',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        opacity: '0',
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      });
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    void toast.offsetWidth;
    toast.style.opacity = '1';

    if (toast.timeout) clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => {
      toast.style.opacity = '0';
    }, 2000);
  };

  // --- Media Detection ---
  const findMedias = () => {
    const elements = [];
    const searchRoot = (root) => {
      if (!root) return;
      root.querySelectorAll('video, audio').forEach(el => elements.push(el));
      root.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) searchRoot(el.shadowRoot);
      });
    };
    searchRoot(document);
    return elements;
  };

  const updateMedias = () => {
    medias = findMedias();
  };

  updateMedias();

  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
        shouldUpdate = true;
        break;
      }
    }
    if (shouldUpdate) updateMedias();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('playing', (e) => {
    if (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO') {
      lastPlayed = e.target;
    }
  }, true);

  // --- Actions ---
  const getMedia = () => {
    medias = medias.filter(m => m.isConnected);
    if (lastPlayed && lastPlayed.isConnected) return lastPlayed;
    return medias[0];
  };

  const togglePlayPause = () => async () => {
    const media = getMedia();
    if (!media) return;
    if (media.paused) {
      try {
        await media.play();
        showToast(`Play (${fmtMSS(media.duration - media.currentTime)} remaining)`);
      } catch (e) {
        console.error(e);
      }
    } else {
      media.pause();
      showToast(`Pause (${fmtMSS(media.duration - media.currentTime)} remaining)`);
    }
  };

  const jump = (sec) => async () => {
    const media = getMedia();
    if (!media) return;
    media.currentTime += sec;
    showToast(`Time: ${fmtMSS(media.currentTime)} / ${fmtMSS(media.duration)}`);
  };

  const playbackRate = (rate) => async () => {
    const media = getMedia();
    if (!media) return;
    media.playbackRate = Math.max(0.1, media.playbackRate + rate);
    showToast(`Rate: ${media.playbackRate.toFixed(2)}x`);
  };

  const seekPercent = (percent) => async () => {
    const media = getMedia();
    if (!media) return;
    if (media.duration) {
      media.currentTime = media.duration * percent / 100;
      showToast(`Time: ${fmtMSS(media.currentTime)} / ${fmtMSS(media.duration)}`);
    }
  };

  const toggleMute = () => async () => {
    const media = getMedia();
    if (!media) return;
    media.muted = !media.muted;
    showToast(media.muted ? 'Muted' : 'Unmuted');
  };

  const toggleFullscreen = () => () => {
    const media = getMedia();
    if (!media) return;
    if (screenfull && screenfull.isEnabled) {
      screenfull.toggle(media);
    }
  };

  const togglePictureInPicture = () => async () => {
    const media = getMedia();
    if (!media || media.tagName !== 'VIDEO') return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showToast('Picture-in-Picture: Off');
      } else if (document.pictureInPictureEnabled) {
        await media.requestPictureInPicture();
        showToast('Picture-in-Picture: On');
      }
    } catch (error) {
      showToast('Picture-in-Picture not supported');
    }
  };

  const adjustVolume = (amount) => async () => {
    const media = getMedia();
    if (!media) return;
    media.volume = Math.min(Math.max(media.volume + amount, 0), 1);
    showToast(`Volume: ${Math.round(media.volume * 100)}%`);
  };

  const findNearestSubtitle = (media, time, direction = -1) => {
    if (window.location.hostname.includes('youtube.com')) {
      const video = document.querySelector('video');
      if (!video) return null;
      const timeStep = direction < 0 ? -5 : 5;
      return Math.max(0, video.currentTime + timeStep);
    }

    if (media.textTracks && media.textTracks.length > 0) {
      let cues = null;
      for (let i = 0; i < media.textTracks.length; i++) {
        if (media.textTracks[i].mode === 'showing') {
          cues = media.textTracks[i].cues;
          break;
        }
      }
      if (cues && cues.length > 0) {
        if (direction < 0) {
          for (let i = cues.length - 1; i >= 0; i--) {
            if (cues[i].startTime < time - 0.5) return cues[i].startTime;
          }
          return cues[0].startTime;
        } else {
          for (let i = 0; i < cues.length; i++) {
            if (cues[i].startTime > time + 0.5) return cues[i].startTime;
          }
          return cues[cues.length - 1].startTime;
        }
      }
    }
    return null;
  };

  const jumpToSubtitle = (direction) => async () => {
    const media = getMedia();
    if (!media) return;
    const newTime = findNearestSubtitle(media, media.currentTime, direction);
    if (newTime !== null) {
      media.currentTime = newTime;
      showToast(`Jumped to ${direction < 0 ? 'previous' : 'next'} subtitle`);
    }
  };

  // --- Binding ---
  const actions = {
    'playPause': togglePlayPause(),
    'seekBackward10': jump(-10),
    'seekForward10': jump(10),
    'seekBackward5': jump(-5),
    'seekForward5': jump(5),
    'volumeUp': adjustVolume(0.1),
    'volumeDown': adjustVolume(-0.1),
    'mute': toggleMute(),
    'fullscreen': toggleFullscreen(),
    'pip': togglePictureInPicture(),
    'speedUp': playbackRate(0.25),
    'speedDown': playbackRate(-0.25),
    'prevSubtitle': jumpToSubtitle(-1),
    'nextSubtitle': jumpToSubtitle(1)
  };

  const bindAll = () => {
    if (!window.Mousetrap) return;
    unbindAll();

    const merged = { ...defaultHotkeys, ...customHotkeys };

    for (const [action, key] of Object.entries(merged)) {
      if (actions[action] && key) {
        try {
          Mousetrap.bind(key, actions[action]);
        } catch (e) {
          console.error('Failed to bind key:', key, e);
        }
      }
    }

    for (let i = 0; i < 10; i++) {
      Mousetrap.bind(i + '', seekPercent(i * 10));
    }
  };

  const unbindAll = () => {
    if (!window.Mousetrap) return;
    const merged = { ...defaultHotkeys, ...customHotkeys };
    for (const key of Object.values(merged)) {
      if (key) Mousetrap.unbind(key);
    }
    for (let i = 0; i < 10; i++) {
      Mousetrap.unbind(i + '');
    }
  };

  // --- Initialization ---
  chrome.storage.sync.get(['customHotkeys'], (result) => {
    customHotkeys = result.customHotkeys || {};

    chrome.runtime.sendMessage({ init: true }, (response = {}) => {
      if (chrome.runtime.lastError) return;
      active = response.activate ?? true;
      if (active) bindAll();
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.customHotkeys) {
      customHotkeys = changes.customHotkeys.newValue || {};
      if (active) {
        bindAll();
        showToast('Hotkeys updated');
      }
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.activate !== undefined) {
      active = message.activate;
      if (active) {
        bindAll();
        showToast('Media hotkeys on');
      } else {
        unbindAll();
        showToast('Media hotkeys off');
      }
    }
  });

})();
