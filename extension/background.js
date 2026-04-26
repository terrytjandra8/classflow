/**
 * background.js
 * Handles extension-wide logic.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("Classboards Secure Browser Extension Installed");
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "CLEAR_CLIPBOARD") {
    // Note: Writing to clipboard from background requires 'clipboardWrite' permission
    // and might still be restricted in some manifest v3 environments without a user gesture.
    // However, we can try to inject a small script to clear it.
  }
});
