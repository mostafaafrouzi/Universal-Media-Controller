$(() => {
  let mm = true, lastPlayed, medias = $('video, audio'), hotkeys = {}
  
  // Listen for playing event
  addEventListener('playing', e => {
    lastPlayed = e.target
  }, true)
  
  // Update media elements list periodically
  setInterval(() => {
    medias = $('video, audio')
  }, 333)

  const fmtMSS = s => {
    s = Math.round(s)
    return (s-(s%=60))/60+(9<s?':':':0')+s
  }

  const notify = (msg) => {
    toastr.remove()
    toastr.info('', msg, {
      showDuration: 100,
      hideDuration: 100,
      positionClass: 'toast-top-center',
      toastClass: 'cool-toast',
      timeOut: 1000,
    })
  }

  const togglePlayPause = () => async e => {
    let media = lastPlayed || medias[0]
    if(!media) return
    if(media.paused) {
      await media.play()
      notify(`Play (${fmtMSS(media.duration - media.currentTime)} remaining)`)
    }
    else {
      media.pause()
      notify(`Pause (${fmtMSS(media.duration - media.currentTime)} remaining)`)
    }
  }

  const jump = (sec) => async e => {
    let media = lastPlayed || medias[0]
    if(!media) return
    media.currentTime += sec
    notify(`Time: ${fmtMSS(media.currentTime)} / ${fmtMSS(media.duration)}`)
  }

  const playbackRate = (rate) => async e => {
    let media = lastPlayed || medias[0]
    if(!media) return
    media.playbackRate += rate
    notify(`Rate: ${media.playbackRate}x`)
  }

  const seekPercent = (percent) => async e => {
    let media = lastPlayed || medias[0]
    if(!media) return
    media.currentTime = media.duration * percent / 100
    notify(`Time: ${fmtMSS(media.currentTime)} / ${fmtMSS(media.duration)}`)
  }

  const toggleMute = () => async e => {
    let media = lastPlayed || medias[0]
    if(!media) return
    media.muted = !media.muted
    notify(media.muted ? 'Muted' : 'Unmuted')
  }

  const toggleFullscreen = () => e => {
    let media = lastPlayed || medias[0]
    if(!media) return
    if (screenfull.isEnabled) {
      screenfull.toggle(media);
    }
  }

  const togglePictureInPicture = () => async e => {
    let media = lastPlayed || medias[0]
    if(!media || media.tagName !== 'VIDEO') return
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        notify('Picture-in-Picture: Off')
      } else if (document.pictureInPictureEnabled) {
        await media.requestPictureInPicture()
        notify('Picture-in-Picture: On')
      }
    } catch (error) {
      notify('Picture-in-Picture not supported')
    }
  }

  const adjustVolume = (amount) => async e => {
    let media = lastPlayed || medias[0]
    if(!media) return
    media.volume = Math.min(Math.max(media.volume + amount, 0), 1)
    notify(`Volume: ${Math.round(media.volume * 100)}%`)
  }

  const findNearestSubtitle = (media, time, direction = -1) => {
    // Special handling for YouTube
    if (window.location.hostname.includes('youtube.com')) {
      // Find the caption window element
      const captionWindow = document.querySelector('.ytp-caption-window-container');
      if (!captionWindow) {
        notify('No active subtitles on YouTube');
        return null;
      }

      // Get all caption segments
      const captions = document.querySelectorAll('.ytp-caption-segment');
      if (!captions || captions.length === 0) {
        notify('No active subtitles on YouTube');
        return null;
      }

      // Get video element and current time
      const video = document.querySelector('video');
      if (!video) return null;

      const currentTime = video.currentTime;
      
      // YouTube auto-generated captions appear every ~4 seconds
      const timeStep = direction < 0 ? -4 : 4;
      const newTime = Math.max(0, currentTime + timeStep);
      
      // Update time and let YouTube handle the caption display
      video.currentTime = newTime;
      notify(`Jumped to ${direction < 0 ? 'previous' : 'next'} caption`);
      return null;
    }

    // Standard HTML5 text tracks for other players
    const tracks = media.textTracks;
    let activeTrack = null;
    let cues = null;

    if (tracks && tracks.length > 0) {
      // Find the active text track
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].mode === 'showing') {
          activeTrack = tracks[i];
          break;
        }
      }

      if (activeTrack && activeTrack.cues && activeTrack.cues.length > 0) {
        cues = activeTrack.cues;
      }
    }

    if (!cues) {
      // Try other common caption containers
      const captionContainers = [
        '.vjs-text-track-display', // VideoJS
        '.mejs__captions-text', // MediaElement
        '.plyr__captions', // Plyr
        '.fp-captions', // Flowplayer
        '.jw-text-track-display', // JWPlayer
      ];

      for (const selector of captionContainers) {
        const container = document.querySelector(selector);
        if (container && container.textContent.trim()) {
          // Found active captions in a custom player
          const newTime = direction < 0 ? time - 2 : time + 2;
          return Math.max(0, newTime);
        }
      }

      notify('No active subtitles found');
      return null;
    }

    // Standard HTML5 subtitle navigation
    if (direction < 0) {
      // Find previous subtitle
      for (let i = cues.length - 1; i >= 0; i--) {
        if (cues[i].startTime < time) {
          return cues[i].startTime;
        }
      }
      return cues[0].startTime;
    } else {
      // Find next subtitle
      for (let i = 0; i < cues.length; i++) {
        if (cues[i].startTime > time) {
          return cues[i].startTime;
        }
      }
      return cues[cues.length - 1].startTime;
    }
  }

  const jumpToSubtitle = (direction) => async e => {
    let media = lastPlayed || medias[0]
    if (!media || media.tagName !== 'VIDEO') return

    const newTime = findNearestSubtitle(media, media.currentTime, direction)
    if (newTime !== null) {
      media.currentTime = newTime
      notify(`Jumped to ${direction < 0 ? 'previous' : 'next'} subtitle`)
    }
  }

  // Define hotkeys
  hotkeys['k'] = togglePlayPause();
  hotkeys['j'] = jump(-10);
  hotkeys['l'] = jump(10);
  hotkeys['left'] = jump(-5);
  hotkeys['right'] = jump(5);
  hotkeys['<'] = playbackRate(-0.25);
  hotkeys['>'] = playbackRate(0.25);
  hotkeys['f'] = toggleFullscreen();
  hotkeys['p'] = togglePictureInPicture();
  hotkeys['+'] = adjustVolume(0.1);
  hotkeys['-'] = adjustVolume(-0.1);
  hotkeys['['] = jumpToSubtitle(-1); // Previous subtitle
  hotkeys[']'] = jumpToSubtitle(1);  // Next subtitle
  for(let i = 0; i < 10; i++) {
    hotkeys[i+''] = seekPercent(i * 10);
  }
  hotkeys['m'] = toggleMute();

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.activate !== undefined) {
      mm = message.activate;
      if (mm) {
        bindAll();
        notify('Media hotkeys on');
      } else {
        unbindAll();
        notify('Media hotkeys off');
      }
    }
  });

  const bindAll = () => {
    for(var k in hotkeys) {
      Mousetrap.bind(k, hotkeys[k])
    }
  }

  const unbindAll = () => {
    for(var k in hotkeys) {
      Mousetrap.unbind(k)
    }
  }

  // Initialize hotkeys state
  chrome.runtime.sendMessage({ init: true }, (response={}) => {
    mm = response.activate ?? true;
    if (mm) {
      bindAll();
    }
  });
});
