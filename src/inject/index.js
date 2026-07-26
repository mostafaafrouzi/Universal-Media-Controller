(async () => {
  // Re-injection (activeTab / register) reloads Mousetrap — rebind instead of no-op
  if (globalThis.__UMC_LOADED__) {
    if (typeof globalThis.__UMC_REBIND__ === 'function') {
      globalThis.__UMC_REBIND__();
    }
    return;
  }
  globalThis.__UMC_LOADED__ = true;

  const presetsApi = globalThis.UMC_PRESETS || null;

  // --- State ---
  let active = true;
  let lastPlayed = null;
  let medias = [];
  let globalCustomHotkeys = {};
  let customHotkeys = {};
  let siteProfiles = {};
  let activeProfile = null;
  let blacklisted = false;

  const defaultHotkeys = {
    playPause: 'k',
    seekBackward10: 'j',
    seekForward10: 'l',
    seekBackward5: 'left',
    seekForward5: 'right',
    volumeUp: '+',
    volumeDown: '-',
    mute: 'm',
    fullscreen: 'f',
    pip: 'p',
    speedUp: '>',
    speedDown: '<',
    prevSubtitle: '[',
    nextSubtitle: ']',
    seekPercent: '0-9'
  };

  const DISABLED = (presetsApi && presetsApi.DISABLED) || '';

  const recomputeHotkeys = () => {
    activeProfile = presetsApi
      ? presetsApi.resolveSiteProfile(window.location.hostname, siteProfiles)
      : null;
    customHotkeys = presetsApi
      ? presetsApi.mergeHotkeysWithProfile(globalCustomHotkeys, activeProfile)
      : { ...globalCustomHotkeys };
  };

  // --- Helpers ---
  const fmtMSS = (s) => {
    if (!Number.isFinite(s)) return '--:--';
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
      (document.documentElement || document.body).appendChild(toast);
    }

    toast.textContent = msg;
    void toast.offsetWidth;
    toast.style.opacity = '1';

    if (toast.timeout) clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => {
      toast.style.opacity = '0';
    }, 2000);
  };

  const safe = (fn) => {
    try {
      const result = fn();
      if (result && typeof result.then === 'function') {
        return result.catch((e) => console.debug('[UMC]', e));
      }
      return result;
    } catch (e) {
      console.debug('[UMC]', e);
      return undefined;
    }
  };

  const isEditableTarget = (el) => {
    if (!el || el === document || el === window) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return Boolean(el.closest && el.closest('input, textarea, select, [contenteditable="true"]'));
  };

  const checkBlacklist = (blacklist = []) => {
    const url = window.location.href;
    return blacklist.some((pattern) => {
      try {
        return new RegExp(pattern, 'i').test(url);
      } catch (e) {
        return url.toLowerCase().includes(String(pattern).toLowerCase());
      }
    });
  };

  const resolveKey = (action) => {
    if (Object.prototype.hasOwnProperty.call(customHotkeys, action)) {
      return customHotkeys[action];
    }
    return defaultHotkeys[action];
  };

  const isActionEnabled = (action) => {
    const key = resolveKey(action);
    return key !== DISABLED && key != null && key !== 'disabled';
  };

  const snapPlaybackRate = (rate) => {
    const snapped = Math.round(rate * 4) / 4;
    return Math.min(16, Math.max(0.25, snapped));
  };

  // --- Media Detection ---
  const findMedias = () => {
    const elements = [];
    const seen = new Set();
    const searchRoot = (root) => {
      if (!root) return;
      root.querySelectorAll('video, audio').forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          elements.push(el);
        }
      });
      root.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) searchRoot(el.shadowRoot);
      });
    };
    searchRoot(document);
    return elements;
  };

  const updateMedias = () => {
    medias = findMedias();
  };

  const getMedia = () => {
    medias = medias.filter((m) => m.isConnected);
    if (lastPlayed && lastPlayed.isConnected) return lastPlayed;

    const playing = medias.find((m) => !m.paused && !m.ended);
    if (playing) return playing;

    const withData = medias.find((m) => m.readyState >= 1);
    if (withData) return withData;

    return medias[0];
  };

  // --- Actions ---
  const togglePlayPause = () => async (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media) return;
    await safe(async () => {
      if (media.paused) {
        await media.play();
        showToast(`Play (${fmtMSS(media.duration - media.currentTime)} remaining)`);
      } else {
        media.pause();
        showToast(`Pause (${fmtMSS(media.duration - media.currentTime)} remaining)`);
      }
    });
  };

  const jump = (sec) => async (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media || !Number.isFinite(media.duration)) return;
    safe(() => {
      const next = Math.min(Math.max(media.currentTime + sec, 0), media.duration || Infinity);
      media.currentTime = next;
      showToast(`Time: ${fmtMSS(media.currentTime)} / ${fmtMSS(media.duration)}`);
    });
  };

  const playbackRate = (delta) => async (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media) return;
    safe(() => {
      media.playbackRate = snapPlaybackRate(media.playbackRate + delta);
      showToast(`Rate: ${media.playbackRate.toFixed(2)}x`);
    });
  };

  const seekPercent = (percent) => async (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media || !media.duration) return;
    safe(() => {
      media.currentTime = media.duration * percent / 100;
      showToast(`Time: ${fmtMSS(media.currentTime)} / ${fmtMSS(media.duration)}`);
    });
  };

  const toggleMute = () => async (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media) return;
    safe(() => {
      media.muted = !media.muted;
      showToast(media.muted ? 'Muted' : 'Unmuted');
    });
  };

  const toggleFullscreen = () => (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media) return;
    safe(() => {
      if (typeof screenfull !== 'undefined' && screenfull.isEnabled) {
        screenfull.toggle(media);
        showToast('Fullscreen toggled');
      } else if (media.requestFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          media.requestFullscreen();
        }
        showToast('Fullscreen toggled');
      }
    });
  };

  const togglePictureInPicture = () => async (e) => {
    if (e) e.preventDefault();
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

  const adjustVolume = (amount) => async (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media) return;
    safe(() => {
      if (amount > 0 && media.muted) media.muted = false;
      const next = Math.round((media.volume + amount) * 100) / 100;
      media.volume = Math.min(Math.max(next, 0), 1);
      showToast(`Volume: ${Math.round(media.volume * 100)}%`);
    });
  };

  const findNearestSubtitle = (media, time, direction = -1) => {
    if (window.location.hostname.includes('youtube.com') ||
        window.location.hostname.includes('youtube-nocookie.com')) {
      const timeStep = direction < 0 ? -5 : 5;
      return Math.max(0, media.currentTime + timeStep);
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
        }
        for (let i = 0; i < cues.length; i++) {
          if (cues[i].startTime > time + 0.5) return cues[i].startTime;
        }
        return cues[cues.length - 1].startTime;
      }
    }
    return null;
  };

  const jumpToSubtitle = (direction) => async (e) => {
    if (e) e.preventDefault();
    const media = getMedia();
    if (!media) return;
    safe(() => {
      const newTime = findNearestSubtitle(media, media.currentTime, direction);
      if (newTime !== null) {
        media.currentTime = newTime;
        showToast(`Jumped to ${direction < 0 ? 'previous' : 'next'} subtitle`);
      }
    });
  };

  const actions = {
    playPause: togglePlayPause(),
    seekBackward10: jump(-10),
    seekForward10: jump(10),
    seekBackward5: jump(-5),
    seekForward5: jump(5),
    volumeUp: adjustVolume(0.1),
    volumeDown: adjustVolume(-0.1),
    mute: toggleMute(),
    fullscreen: toggleFullscreen(),
    pip: togglePictureInPicture(),
    speedUp: playbackRate(0.25),
    speedDown: playbackRate(-0.25),
    prevSubtitle: jumpToSubtitle(-1),
    nextSubtitle: jumpToSubtitle(1)
  };

  // --- Binding ---
  const unbindAll = () => {
    if (!window.Mousetrap) return;
    const merged = { ...defaultHotkeys, ...customHotkeys };
    for (const [action, key] of Object.entries(merged)) {
      if (action === 'seekPercent') continue;
      if (key && key !== 'disabled') Mousetrap.unbind(key);
    }
    for (let i = 0; i < 10; i++) {
      Mousetrap.unbind(String(i));
    }
  };

  const bindAll = () => {
    if (!window.Mousetrap || blacklisted || !active) return;
    unbindAll();

    Mousetrap.prototype.stopCallback = function (e, element) {
      return isEditableTarget(element);
    };

    for (const [action, handler] of Object.entries(actions)) {
      if (!isActionEnabled(action)) continue;
      const key = resolveKey(action);
      try {
        Mousetrap.bind(key, handler);
      } catch (e) {
        console.debug('[UMC] Failed to bind key:', key, e);
      }
    }

    if (isActionEnabled('seekPercent')) {
      for (let i = 0; i < 10; i++) {
        Mousetrap.bind(String(i), seekPercent(i * 10));
      }
    }
  };

  const applyActivation = () => {
    if (blacklisted || !active) {
      unbindAll();
    } else {
      bindAll();
    }
  };

  const refreshBlacklist = (blacklist) => {
    const wasBlacklisted = blacklisted;
    blacklisted = checkBlacklist(blacklist || []);
    if (blacklisted) {
      unbindAll();
      if (!wasBlacklisted) showToast('Media hotkeys disabled on this site');
    } else {
      applyActivation();
    }
  };

  const startObservers = () => {
    updateMedias();

    const root = document.body || document.documentElement;
    if (root) {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
            updateMedias();
            break;
          }
        }
      });
      observer.observe(root, { childList: true, subtree: true });
    }

    document.addEventListener('playing', (e) => {
      if (e.target && (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO')) {
        lastPlayed = e.target;
      }
    }, true);

    document.addEventListener('play', (e) => {
      if (e.target && (e.target.tagName === 'VIDEO' || e.target.tagName === 'AUDIO')) {
        lastPlayed = e.target;
        if (!medias.includes(e.target)) updateMedias();
      }
    }, true);
  };

  const bootstrap = () => {
    chrome.storage.sync.get(['blacklist', 'customHotkeys', 'siteProfiles'], (result) => {
      globalCustomHotkeys = result.customHotkeys || {};
      siteProfiles = result.siteProfiles || {};
      recomputeHotkeys();
      blacklisted = checkBlacklist(result.blacklist || []);

      chrome.runtime.sendMessage({ init: true }, (response = {}) => {
        if (chrome.runtime.lastError) {
          active = true;
        } else {
          active = response.activate ?? true;
        }
        startObservers();
        applyActivation();

        if (active && !blacklisted && activeProfile && activeProfile.source === 'preset') {
          // Quiet hint once per page load if a site profile trimmed keys
          console.debug('[UMC] Site profile active:', activeProfile.id || activeProfile.label);
        }
      });
    });
  };

  const setActive = (next, { notify = true } = {}) => {
    const value = next ?? true;
    if (active === value) return;
    active = value;
    applyActivation();
    if (notify && !blacklisted) {
      showToast(active ? 'Media hotkeys on' : 'Media hotkeys off');
    }
  };

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.customHotkeys || changes.siteProfiles)) {
      if (changes.customHotkeys) {
        globalCustomHotkeys = changes.customHotkeys.newValue || {};
      }
      if (changes.siteProfiles) {
        siteProfiles = changes.siteProfiles.newValue || {};
      }
      recomputeHotkeys();
      applyActivation();
      if (active && !blacklisted) showToast('Hotkeys updated');
    }
    if (area === 'sync' && changes.blacklist) {
      refreshBlacklist(changes.blacklist.newValue || []);
    }
    if (area === 'local' && changes.activate) {
      setActive(changes.activate.newValue ?? true, { notify: true });
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.activate !== undefined) {
      setActive(message.activate, { notify: false });
    }
  });

  globalThis.__UMC_REBIND__ = () => {
    recomputeHotkeys();
    applyActivation();
  };

  bootstrap();
})();
