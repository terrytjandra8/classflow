/**
 * content.js
 * Runs on the Classboards domain.
 */

console.log("Classboards Secure Browser Extension Active");

// Communicate with the web app that the extension is installed
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CHECK_EXTENSION") {
    window.postMessage({ type: "EXTENSION_INSTALLED", version: "1.0.0" }, "*");
  }
});

// Detect PrintScreen and other screenshot keys at a lower level
window.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  const keyCode = e.keyCode;
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  // Common screenshot shortcuts
  const isPrtSc = key === 'printscreen' || keyCode === 44;
  const isMacSS = isMac && e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);
  const isWinSnip = e.metaKey && e.shiftKey && key === 's';
  const isCrSS = e.ctrlKey && (key === 'f5' || keyCode === 116);

  if (isPrtSc || isMacSS || isWinSnip || isCrSS) {
    // Notify the web app to hide content immediately
    window.postMessage({ type: "SCREENSHOT_ATTEMPT" }, "*");
    
    // Attempt to clear clipboard (requires user interaction or specific permissions)
    // We do it in background script if needed
  }
}, true);

// Detect when the window loses focus
window.addEventListener("blur", () => {
  window.postMessage({ type: "WINDOW_BLUR" }, "*");
});

window.addEventListener("focus", () => {
  window.postMessage({ type: "WINDOW_FOCUS" }, "*");
});
