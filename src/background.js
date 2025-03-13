// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ activate: true });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.init) {
    chrome.storage.local.get(['activate'], (result) => {
      sendResponse({ activate: result.activate ?? true });
    });
    return true; // Will respond asynchronously
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['activate'], (result) => {
    const newState = !(result.activate ?? true);
    chrome.storage.local.set({ activate: newState });
    
    // Notify content script about state change
    chrome.tabs.sendMessage(tab.id, { activate: newState });
  });
}); 