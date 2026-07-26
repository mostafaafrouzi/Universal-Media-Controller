const defaultHotkeys = {
  playPause: { key: 'k', label: 'Play / Pause' },
  seekBackward10: { key: 'j', label: 'Seek Backward 10s' },
  seekForward10: { key: 'l', label: 'Seek Forward 10s' },
  seekBackward5: { key: 'left', label: 'Seek Backward 5s' },
  seekForward5: { key: 'right', label: 'Seek Forward 5s' },
  volumeUp: { key: '+', label: 'Volume Up' },
  volumeDown: { key: '-', label: 'Volume Down' },
  mute: { key: 'm', label: 'Mute / Unmute' },
  fullscreen: { key: 'f', label: 'Toggle Fullscreen' },
  pip: { key: 'p', label: 'Toggle Picture-in-Picture' },
  speedUp: { key: '>', label: 'Speed Up' },
  speedDown: { key: '<', label: 'Speed Down' },
  prevSubtitle: { key: '[', label: 'Previous Subtitle' },
  nextSubtitle: { key: ']', label: 'Next Subtitle' },
  seekPercent: { key: '0-9', label: 'Seek to percentage (0–9)', fixed: true }
};

const DISABLED = '';
const presetsApi = globalThis.UMC_PRESETS;

const tableBody = document.querySelector('#shortcuts tbody');
const presetsEl = document.getElementById('presets');
const customActionsEl = document.getElementById('custom-actions');
const customListEl = document.getElementById('custom-list');
const customHostInput = document.getElementById('custom-host');
const addCustomBtn = document.getElementById('add-custom');
const saveBtn = document.getElementById('save');
const resetBtn = document.getElementById('reset');
const toast = document.getElementById('toast');

/** @type {{ enabledPresets: string[], custom: Record<string, { disabledActions: string[] }> }} */
let siteProfiles = {
  enabledPresets: presetsApi ? presetsApi.defaultEnabledPresetIds() : [],
  custom: {}
};

const showToast = (msg) => {
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2000);
};

const normalizeKey = (e) => {
  let key = e.key.toLowerCase();
  if (key === ' ') key = 'space';
  if (key === 'arrowleft') key = 'left';
  if (key === 'arrowright') key = 'right';
  if (key === 'arrowup') key = 'up';
  if (key === 'arrowdown') key = 'down';
  if (key === 'escape') key = 'esc';
  return key;
};

const resolveStored = (saved, action) => {
  if (Object.prototype.hasOwnProperty.call(saved, action)) {
    return saved[action];
  }
  return defaultHotkeys[action].key;
};

const renderTable = (saved) => {
  tableBody.innerHTML = '';

  for (const [action, def] of Object.entries(defaultHotkeys)) {
    const stored = resolveStored(saved, action);
    const enabled = stored !== DISABLED && stored !== 'disabled';
    const displayKey = enabled ? stored : def.key;

    const tr = document.createElement('tr');
    if (!enabled) tr.classList.add('disabled-row');

    tr.innerHTML = `
      <td>${def.label}</td>
      <td>
        <input type="text" data-action="${action}" value="${enabled ? displayKey : ''}"
          placeholder="${enabled ? '' : 'disabled'}" ${def.fixed || !enabled ? 'disabled' : ''} readonly>
      </td>
      <td>
        <label class="enable">
          <input type="checkbox" data-enable="${action}" ${enabled ? 'checked' : ''}>
          On
        </label>
      </td>
    `;
    tableBody.appendChild(tr);

    const input = tr.querySelector('input[data-action]');
    const enableBox = tr.querySelector('input[data-enable]');

    enableBox.addEventListener('change', () => {
      const on = enableBox.checked;
      tr.classList.toggle('disabled-row', !on);
      if (def.fixed) {
        input.value = on ? def.key : '';
        input.disabled = true;
        input.placeholder = on ? '' : 'disabled';
        return;
      }
      input.disabled = !on;
      if (on) {
        input.value = input.value || def.key;
        input.placeholder = '';
      } else {
        input.value = '';
        input.placeholder = 'disabled';
      }
    });

    if (!def.fixed) {
      input.addEventListener('keydown', (e) => {
        e.preventDefault();
        if (e.key === 'Backspace' || e.key === 'Delete') {
          input.value = '';
          enableBox.checked = false;
          enableBox.dispatchEvent(new Event('change'));
          return;
        }
        if (e.key === 'Tab') return;
        const key = normalizeKey(e);
        if (key === 'shift' || key === 'control' || key === 'alt' || key === 'meta') return;
        input.value = key;
        enableBox.checked = true;
        tr.classList.remove('disabled-row');
      });
      input.addEventListener('focus', () => input.select());
    }
  }
};

const collectHotkeys = () => {
  const custom = {};
  for (const action of Object.keys(defaultHotkeys)) {
    const enableBox = document.querySelector(`input[data-enable="${action}"]`);
    const input = document.querySelector(`input[data-action="${action}"]`);
    if (!enableBox || !input) continue;

    if (!enableBox.checked) {
      custom[action] = DISABLED;
      continue;
    }

    if (defaultHotkeys[action].fixed) continue;

    const key = input.value.trim();
    if (!key) {
      custom[action] = DISABLED;
    } else if (key !== defaultHotkeys[action].key) {
      custom[action] = key;
    }
  }
  return custom;
};

const renderPresets = () => {
  if (!presetsApi) {
    presetsEl.innerHTML = '<div class="preset"><p class="desc">Presets failed to load.</p></div>';
    return;
  }

  const enabled = new Set(siteProfiles.enabledPresets || []);
  presetsEl.innerHTML = '';

  for (const preset of Object.values(presetsApi.BUILTIN_SITE_PRESETS)) {
    const row = document.createElement('div');
    row.className = 'preset';
    const checked = enabled.has(preset.id);
    row.innerHTML = `
      <label class="enable">
        <input type="checkbox" data-preset="${preset.id}" ${checked ? 'checked' : ''}>
      </label>
      <div class="meta">
        <p class="title">${preset.label}</p>
        <p class="desc">${preset.description}</p>
        <p class="keys">Disables: ${preset.disabledActions.join(', ')}</p>
      </div>
    `;
    presetsEl.appendChild(row);
  }

  presetsEl.querySelectorAll('input[data-preset]').forEach((box) => {
    box.addEventListener('change', () => {
      const id = box.getAttribute('data-preset');
      const set = new Set(siteProfiles.enabledPresets || []);
      if (box.checked) set.add(id);
      else set.delete(id);
      siteProfiles.enabledPresets = [...set];
    });
  });
};

const renderCustomActionChips = () => {
  customActionsEl.innerHTML = '';
  for (const [action, def] of Object.entries(defaultHotkeys)) {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" data-custom-action="${action}"> ${def.label}`;
    customActionsEl.appendChild(label);
  }
};

const renderCustomList = () => {
  const custom = siteProfiles.custom || {};
  const keys = Object.keys(custom);
  if (!keys.length) {
    customListEl.innerHTML = '<p class="desc" style="color:#5c6570;margin:0">No custom profiles yet.</p>';
    return;
  }

  customListEl.innerHTML = '';
  for (const host of keys.sort()) {
    const profile = custom[host];
    const item = document.createElement('div');
    item.className = 'custom-item';
    item.innerHTML = `
      <div>
        <strong>${host}</strong><br>
        <span style="color:#5c6570;font-size:0.85rem">Disables: ${(profile.disabledActions || []).join(', ') || '(none)'}</span>
      </div>
      <button type="button" class="remove-btn" data-remove="${host}">Remove</button>
    `;
    customListEl.appendChild(item);
  }

  customListEl.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const host = btn.getAttribute('data-remove');
      delete siteProfiles.custom[host];
      renderCustomList();
    });
  });
};

const normalizeHost = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');

addCustomBtn.addEventListener('click', () => {
  const host = normalizeHost(customHostInput.value);
  if (!host || !host.includes('.')) {
    showToast('Enter a valid domain like twitch.tv');
    return;
  }

  const disabledActions = [...customActionsEl.querySelectorAll('input[data-custom-action]:checked')].map(
    (el) => el.getAttribute('data-custom-action')
  );

  if (!siteProfiles.custom) siteProfiles.custom = {};
  siteProfiles.custom[host] = { disabledActions };
  customHostInput.value = '';
  customActionsEl.querySelectorAll('input').forEach((el) => {
    el.checked = false;
  });
  renderCustomList();
  showToast(`Profile saved for ${host} (click Save all)`);
});

const loadAll = () => {
  chrome.storage.sync.get(['customHotkeys', 'siteProfiles'], (result) => {
    renderTable(result.customHotkeys || {});
    if (result.siteProfiles) {
      siteProfiles = {
        enabledPresets: result.siteProfiles.enabledPresets || presetsApi.defaultEnabledPresetIds(),
        custom: result.siteProfiles.custom || {}
      };
    }
    renderPresets();
    renderCustomList();
  });
};

const saveAll = () => {
  const customHotkeys = collectHotkeys();
  // Re-read preset checkboxes in case
  const enabledPresets = [...presetsEl.querySelectorAll('input[data-preset]:checked')].map((el) =>
    el.getAttribute('data-preset')
  );
  siteProfiles.enabledPresets = enabledPresets;

  chrome.storage.sync.set({ customHotkeys, siteProfiles }, () => {
    showToast('Settings saved');
  });
};

const resetHotkeys = () => {
  if (!confirm('Reset global shortcuts to defaults and re-enable every action? Site profiles are kept.')) return;
  chrome.storage.sync.remove('customHotkeys', () => {
    renderTable({});
    showToast('Shortcuts reset');
  });
};

document.addEventListener('DOMContentLoaded', () => {
  renderCustomActionChips();
  loadAll();
});

saveBtn.addEventListener('click', saveAll);
resetBtn.addEventListener('click', resetHotkeys);
