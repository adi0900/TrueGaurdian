// content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'threatDetected') {
    const alertMessage = `Threat Detected: ${message.data.type} (Confidence: ${(message.data.confidence * 100).toFixed(2)}%) on ${window.location.href}`;
    alert(alertMessage);
    // Optional: Collect DOM data for further analysis
    const maliciousData = {
      pageTitle: document.title,
      suspiciousElements: document.querySelectorAll('script[src*="malicious"], iframe').length
    };
    chrome.runtime.sendMessage({ action: 'dataCollected', data: maliciousData });
  }
});