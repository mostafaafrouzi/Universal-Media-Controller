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