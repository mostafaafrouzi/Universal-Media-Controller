document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('toggle-ext');
    const blacklistInput = document.getElementById('blacklist');
    const optionsBtn = document.getElementById('open-options');

    // Load state
    chrome.storage.local.get(['activate'], (result) => {
        toggle.checked = result.activate ?? true;
    });

    chrome.storage.sync.get(['blacklist'], (result) => {
        blacklistInput.value = (result.blacklist || []).join('\n');
    });

    // Toggle handler
    toggle.addEventListener('change', (e) => {
        const newState = e.target.checked;
        chrome.storage.local.set({ activate: newState });

        // Notify active tabs
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { activate: newState });
            }
        });
    });

    // Blacklist handler
    blacklistInput.addEventListener('change', (e) => {
        const blacklist = e.target.value.split('\n').map(x => x.trim()).filter(x => x);
        chrome.storage.sync.set({ blacklist });
    });

    // Options button
    optionsBtn.addEventListener('click', () => {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('src/options/index.html'));
        }
    });
});