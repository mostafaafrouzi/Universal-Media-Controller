document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle-ext');
  const blacklistInput = document.getElementById('blacklist');
  const optionsBtn = document.getElementById('open-options');
  const permBox = document.getElementById('perm-box');
  const permStatus = document.getElementById('perm-status');
  const siteLine = document.getElementById('site-line');
  const allowSiteBtn = document.getElementById('allow-site');
  const allowAllBtn = document.getElementById('allow-all');
  const revokeAllBtn = document.getElementById('revoke-all');

  let blacklistTimer = null;
  let currentTab = null;

  const send = (message) =>
    new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || {});
      });
    });

  const refreshPermissionUI = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab || null;

    const state = await send({ getPermissionState: true });
    const origin = tab?.url && /^https?:/i.test(tab.url) ? new URL(tab.url).origin : null;

    let siteAllowed = false;
    let mode = 'none';
    if (origin) {
      const check = await send({ containsOrigin: true, origin });
      siteAllowed = Boolean(check.allowed);
      mode = check.mode || (state.allSites ? 'all' : 'none');
    } else if (state.allSites) {
      mode = 'all';
      siteAllowed = true;
    }

    if (origin) {
      siteLine.hidden = false;
      siteLine.textContent = origin;
    } else {
      siteLine.hidden = true;
    }

    revokeAllBtn.hidden = !(state.origins && state.origins.length);

    if (state.allSites) {
      permBox.className = 'perm-box ok';
      permStatus.textContent = 'Allowed on all sites';
      allowSiteBtn.hidden = true;
      allowAllBtn.hidden = true;
    } else if (siteAllowed) {
      permBox.className = 'perm-box ok';
      permStatus.textContent = 'Allowed on this site';
      allowSiteBtn.hidden = true;
      allowAllBtn.hidden = false;
      allowAllBtn.textContent = 'Allow all sites';
    } else {
      permBox.className = 'perm-box warn';
      permStatus.textContent = origin
        ? 'This site is not allowed yet'
        : 'Open a normal http(s) page to grant access';
      allowSiteBtn.hidden = !origin;
      allowAllBtn.hidden = false;
      allowAllBtn.textContent = 'Allow all sites';

      // Temporary inject via activeTab so user can try immediately
      if (tab?.id && origin) {
        await send({ injectActiveTab: true, tabId: tab.id });
      }
    }
  };

  chrome.storage.local.get(['activate'], (result) => {
    toggle.checked = result.activate ?? true;
  });

  chrome.storage.sync.get(['blacklist'], (result) => {
    blacklistInput.value = (result.blacklist || []).join('\n');
  });

  toggle.addEventListener('change', (e) => {
    const newState = e.target.checked;
    chrome.storage.local.set({ activate: newState }, () => {
      send({ broadcastActivate: newState });
    });
  });

  const saveBlacklist = () => {
    const blacklist = blacklistInput.value
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
    chrome.storage.sync.set({ blacklist });
  };

  blacklistInput.addEventListener('input', () => {
    clearTimeout(blacklistTimer);
    blacklistTimer = setTimeout(saveBlacklist, 400);
  });
  blacklistInput.addEventListener('change', saveBlacklist);

  allowSiteBtn.addEventListener('click', async () => {
    if (!currentTab?.url || !currentTab.id) return;
    allowSiteBtn.disabled = true;
    const origin = new URL(currentTab.url).origin;
    const res = await send({
      requestSiteOrigin: true,
      origin,
      tabId: currentTab.id
    });
    allowSiteBtn.disabled = false;
    if (res.granted) {
      await refreshPermissionUI();
    }
  });

  allowAllBtn.addEventListener('click', async () => {
    allowAllBtn.disabled = true;
    const res = await send({ requestAllSites: true });
    allowAllBtn.disabled = false;
    if (res.granted) {
      await refreshPermissionUI();
    }
  });

  revokeAllBtn.addEventListener('click', async () => {
    if (!confirm('Revoke access to all previously allowed sites? Hotkeys will stop until you allow sites again.')) {
      return;
    }
    await send({ revokeAllSites: true });
    await refreshPermissionUI();
  });

  optionsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('src/options/index.html'));
    }
  });

  refreshPermissionUI();
});
