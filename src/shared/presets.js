/**
 * Built-in site profiles shared by content script + options UI.
 * Loaded as a classic script (no import/export) before inject/options logic.
 */
(function (root) {
  const DISABLED = '';

  const BUILTIN_SITE_PRESETS = {
    'twitch.tv': {
      id: 'twitch.tv',
      label: 'Twitch',
      description: 'Disables F / M / Space-like clashes with Twitch player & chat',
      // Match www.twitch.tv, m.twitch.tv, etc.
      hostPattern: /(^|\.)twitch\.tv$/i,
      defaultEnabled: false,
      disabledActions: ['fullscreen', 'mute', 'playPause', 'seekPercent']
    },
    'youtube.com': {
      id: 'youtube.com',
      label: 'YouTube (light)',
      description: 'Keeps UMC seek/speed keys but leaves YouTube native F / M / K alone',
      hostPattern: /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$/i,
      defaultEnabled: false,
      disabledActions: ['fullscreen', 'mute', 'playPause']
    },
    'netflix.com': {
      id: 'netflix.com',
      label: 'Netflix',
      description: 'Avoids keys that often conflict with Netflix player',
      hostPattern: /(^|\.)netflix\.com$/i,
      defaultEnabled: false,
      disabledActions: ['fullscreen', 'seekPercent', 'playPause']
    }
  };

  /**
   * @param {string} hostname
   * @param {{ enabledPresets?: string[], custom?: Record<string, object> }} siteProfiles
   */
  function resolveSiteProfile(hostname, siteProfiles = {}) {
    const enabledPresets = siteProfiles.enabledPresets;
    const custom = siteProfiles.custom || {};

    // Custom profiles win (keyed by hostname or parent domain entry)
    for (const [key, profile] of Object.entries(custom)) {
      if (!profile) continue;
      const keyHost = key.replace(/^\./, '').toLowerCase();
      const host = (hostname || '').toLowerCase();
      if (host === keyHost || host.endsWith('.' + keyHost)) {
        return { source: 'custom', id: key, ...profile };
      }
    }

    const presetIds = Array.isArray(enabledPresets)
      ? enabledPresets
      : Object.values(BUILTIN_SITE_PRESETS)
        .filter((p) => p.defaultEnabled)
        .map((p) => p.id);

    for (const id of presetIds) {
      const preset = BUILTIN_SITE_PRESETS[id];
      if (!preset) continue;
      if (preset.hostPattern.test(hostname || '')) {
        return {
          source: 'preset',
          id: preset.id,
          label: preset.label,
          disabledActions: preset.disabledActions.slice(),
          hotkeys: preset.hotkeys ? { ...preset.hotkeys } : undefined
        };
      }
    }

    return null;
  }

  /**
   * Merge global custom hotkeys with a site profile.
   * Profile disabledActions / hotkeys override globals.
   */
  function mergeHotkeysWithProfile(globalCustom = {}, profile = null) {
    const merged = { ...globalCustom };
    if (!profile) return merged;

    if (Array.isArray(profile.disabledActions)) {
      for (const action of profile.disabledActions) {
        merged[action] = DISABLED;
      }
    }
    if (profile.hotkeys && typeof profile.hotkeys === 'object') {
      Object.assign(merged, profile.hotkeys);
    }
    return merged;
  }

  function defaultEnabledPresetIds() {
    return Object.values(BUILTIN_SITE_PRESETS)
      .filter((p) => p.defaultEnabled)
      .map((p) => p.id);
  }

  root.UMC_PRESETS = {
    DISABLED,
    BUILTIN_SITE_PRESETS,
    resolveSiteProfile,
    mergeHotkeysWithProfile,
    defaultEnabledPresetIds
  };
})(typeof self !== 'undefined' ? self : globalThis);
