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
