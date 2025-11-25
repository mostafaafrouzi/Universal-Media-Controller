const defaultHotkeys = {
    'playPause': { key: 'k', label: 'Play / Pause' },
    'seekBackward10': { key: 'j', label: 'Seek Backward 10s' },
    'seekForward10': { key: 'l', label: 'Seek Forward 10s' },
    'seekBackward5': { key: 'left', label: 'Seek Backward 5s' },
    'seekForward5': { key: 'right', label: 'Seek Forward 5s' },
    'volumeUp': { key: '+', label: 'Volume Up' },
    'volumeDown': { key: '-', label: 'Volume Down' },
    'mute': { key: 'm', label: 'Mute / Unmute' },
    'fullscreen': { key: 'f', label: 'Toggle Fullscreen' },
    'pip': { key: 'p', label: 'Toggle Picture-in-Picture' },
    'speedUp': { key: '>', label: 'Speed Up' },
    'speedDown': { key: '<', label: 'Speed Down' },
    'prevSubtitle': { key: '[', label: 'Previous Subtitle' },
    'nextSubtitle': { key: ']', label: 'Next Subtitle' }
};

const tableBody = document.querySelector('#shortcuts tbody');
const saveBtn = document.getElementById('save');
const resetBtn = document.getElementById('reset');
const toast = document.getElementById('toast');

const renderTable = (hotkeys) => {
    tableBody.innerHTML = '';
    for (const [action, def] of Object.entries(defaultHotkeys)) {
        const currentKey = hotkeys[action] || def.key;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${def.label}</td>
            <td><input type="text" data-action="${action}" value="${currentKey}" readonly></td>
        `;
        tableBody.appendChild(tr);

        const input = tr.querySelector('input');
        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            let key = e.key.toLowerCase();
            if (key === ' ') key = 'space';
            if (key === 'arrowleft') key = 'left';
            if (key === 'arrowright') key = 'right';
            if (key === 'arrowup') key = 'up';
            if (key === 'arrowdown') key = 'down';

            input.value = key;
        });

        input.addEventListener('focus', () => input.select());
    }
};

const loadHotkeys = () => {
    chrome.storage.sync.get(['customHotkeys'], (result) => {
        const saved = result.customHotkeys || {};
        renderTable(saved);
    });
};

const saveHotkeys = () => {
    const newHotkeys = {};
    document.querySelectorAll('input[data-action]').forEach(input => {
        const action = input.getAttribute('data-action');
        const key = input.value;
        if (key && key !== defaultHotkeys[action].key) {
            newHotkeys[action] = key;
        }
    });

    chrome.storage.sync.set({ customHotkeys: newHotkeys }, () => {
        toast.style.opacity = 1;
        setTimeout(() => toast.style.opacity = 0, 2000);
    });
};

const resetHotkeys = () => {
    if (confirm('Reset all shortcuts to default?')) {
        chrome.storage.sync.remove('customHotkeys', () => {
            renderTable({});
            toast.textContent = 'Reset to defaults';
            toast.style.opacity = 1;
            setTimeout(() => toast.style.opacity = 0, 2000);
        });
    }
};

document.addEventListener('DOMContentLoaded', loadHotkeys);
saveBtn.addEventListener('click', saveHotkeys);
resetBtn.addEventListener('click', resetHotkeys);
