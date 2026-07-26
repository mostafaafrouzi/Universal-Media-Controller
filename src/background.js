/**
 * Background service worker — permissions, dynamic content scripts, messaging.
 */

const SCRIPT_ID = 'umc-hotkeys';
const JS_FILES = [
  'js/mousetrap.min.js',
  'js/screenfull.min.js',
  'src/shared/presets.js',
  'src/inject/index.js'
];
const CSS_FILES = ['css/index.css'];
const ALL_URLS_ORIGIN = '*://*/*';

const originPattern = (origin) => {
  try {
    const u = new URL(origin);
    return `${u.protocol}//${u.host}/*`;
  } catch {
    return null;
  }
};

const hasBroadAccess = (origins = []) =>
  origins.some((o) => o === '<all_urls>' || o === '*://*/*' || o === 'http://*/*' || o === 'https://*/*');

async function getGrantedOrigins() {
  const all = await chrome.permissions.getAll();
  return all.origins || [];
}

async function syncContentScripts() {
  const origins = await getGrantedOrigins();

  try {
    await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  } catch {
    // not registered yet
  }

  if (!origins.length) return { registered: false, matches: [] };

  let matches;
  if (hasBroadAccess(origins)) {
    matches = ['http://*/*', 'https://*/*'];
  } else {
    matches = origins.filter((o) => o.startsWith('http'));
  }

  if (!matches.length) return { registered: false, matches: [] };

  await chrome.scripting.registerContentScripts([
    {
      id: SCRIPT_ID,
      matches,
      js: JS_FILES,
      css: CSS_FILES,
      allFrames: true,
      runAt: 'document_idle',
      persistAcrossSessions: true
    }
  ]);

  return { registered: true, matches };
}

async function injectIntoTab(tabId) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId, allFrames: true },
      files: CSS_FILES
    });
  } catch {
    // css optional
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: JS_FILES
    });
    return true;
  } catch (e) {
    console.debug('[UMC] inject failed', e);
    return false;
  }
}

async function injectIntoMatchingTabs() {
  const origins = await getGrantedOrigins();
  if (!origins.length) return 0;

  const tabs = await chrome.tabs.query({});
  let count = 0;
  for (const tab of tabs) {
    if (!tab.id || !tab.url || !/^https?:/i.test(tab.url)) continue;
    const pattern = originPattern(tab.url);
    if (!pattern) continue;

    const allowed =
      hasBroadAccess(origins) ||
      origins.some((o) => {
        try {
          return tab.url.startsWith(o.replace(/\/\*$/, '/')) || o === pattern;
        } catch {
          return false;
        }
      }) ||
      (await chrome.permissions.contains({ origins: [pattern] }));

    if (!allowed) continue;
    if (await injectIntoTab(tab.id)) count += 1;
  }
  return count;
}

const broadcastActivate = (activate) => {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.tabs.sendMessage(tab.id, { activate }, () => {
        void chrome.runtime.lastError;
      });
    }
  });
};

async function ensureDefaults() {
  const local = await chrome.storage.local.get(['activate', 'siteProfilesInitialized']);
  if (local.activate === undefined) {
    await chrome.storage.local.set({ activate: true });
  }

  if (!local.siteProfilesInitialized) {
    const sync = await chrome.storage.sync.get(['siteProfiles']);
    if (!sync.siteProfiles) {
      // Presets are opt-in — user enables them in Options when needed
      await chrome.storage.sync.set({
        siteProfiles: {
          enabledPresets: [],
          custom: {}
        }
      });
    }
    await chrome.storage.local.set({ siteProfilesInitialized: true });
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await ensureDefaults();
  await syncContentScripts();

  if (details.reason === 'install') {
    await chrome.storage.local.set({ needsPermissionSetup: true });
  }
  if (details.reason === 'update') {
    // Host access became optional in 0.3.0 — prompt via popup badge
    await chrome.storage.local.set({ needsPermissionSetup: true });
    console.log('[UMC] Updated to', chrome.runtime.getManifest().version);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureDefaults();
  await syncContentScripts();
});

chrome.permissions.onAdded.addListener(async () => {
  await syncContentScripts();
  await injectIntoMatchingTabs();
  await chrome.storage.local.set({ needsPermissionSetup: false });
});

chrome.permissions.onRemoved.addListener(async () => {
  await syncContentScripts();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.activate) {
    broadcastActivate(changes.activate.newValue ?? true);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const reply = async () => {
    if (message.init) {
      const result = await chrome.storage.local.get(['activate']);
      return { activate: result.activate ?? true };
    }

    if (message.broadcastActivate !== undefined) {
      broadcastActivate(message.broadcastActivate);
      return { ok: true };
    }

    if (message.syncScripts) {
      const reg = await syncContentScripts();
      return reg;
    }

    if (message.getPermissionState) {
      const origins = await getGrantedOrigins();
      return {
        origins,
        allSites: hasBroadAccess(origins),
        needsSetup: (await chrome.storage.local.get(['needsPermissionSetup'])).needsPermissionSetup === true
      };
    }

    if (message.requestAllSites) {
      const granted = await chrome.permissions.request({ origins: [ALL_URLS_ORIGIN] });
      if (granted) {
        await syncContentScripts();
        await injectIntoMatchingTabs();
        await chrome.storage.local.set({ needsPermissionSetup: false });
      }
      return { granted };
    }

    if (message.requestSiteOrigin && message.origin) {
      const pattern = originPattern(message.origin);
      if (!pattern) return { granted: false, error: 'invalid_origin' };
      const granted = await chrome.permissions.request({ origins: [pattern] });
      if (granted) {
        await syncContentScripts();
        if (message.tabId) await injectIntoTab(message.tabId);
        await chrome.storage.local.set({ needsPermissionSetup: false });
      }
      return { granted, pattern };
    }

    if (message.revokeAllSites) {
      const origins = await getGrantedOrigins();
      if (origins.length) {
        await chrome.permissions.remove({ origins });
      }
      await syncContentScripts();
      return { revoked: true };
    }

    if (message.injectActiveTab && message.tabId) {
      const ok = await injectIntoTab(message.tabId);
      return { injected: ok };
    }

    if (message.containsOrigin && message.origin) {
      const pattern = originPattern(message.origin);
      const origins = await getGrantedOrigins();
      if (hasBroadAccess(origins)) return { allowed: true, mode: 'all' };
      const allowed = pattern
        ? await chrome.permissions.contains({ origins: [pattern] })
        : false;
      return { allowed, mode: allowed ? 'site' : 'none' };
    }

    return null;
  };

  reply()
    .then((result) => sendResponse(result))
    .catch((err) => sendResponse({ error: String(err) }));
  return true;
});

// Kick once when SW wakes
ensureDefaults().then(syncContentScripts);
