// ============================================================================
// THREAT MONITOR - Enhanced Background Service Worker
// Features: Real-time notifications, badge updates, webhook integration
// ============================================================================

const ENDPOINT_URL = 'https://li9e1bovvb.execute-api.us-east-1.amazonaws.com/Prod/AnalyzeOneLog';

// Optional: API endpoints for SIEM/webhook integration
const WEBHOOK_URL = ''; // Set your webhook URL here
const SIEM_API_URL = ''; // e.g., Splunk HEC endpoint
const AWS_SNS_TOPIC_ARN = ''; // AWS SNS for real-time alerting

// Domains to exclude
const EXCLUDED_DOMAINS = [
  'mixpanel.com', 'doubleclick.net', 'statsig', 'grok.com', 'quantserve.com',
  'amazonadsystem.com', 'clients6.google.com', 'accounts.google.com',
  'amazon.in/nav/ajax', 'unagi.amazon.in', 'aax-eu-zaz.amazon.in',
  'adservice.google.com', 'fbcdn.net', 'facebook.com', 'twitter.com',
  'linkedin.com', 'bing.com'
];

// Threat severity configuration
const THREAT_LEVELS = {
  CRITICAL: { min: 0.9, color: '#FF0000', priority: 1 },
  HIGH: { min: 0.7, color: '#FF6600', priority: 2 },
  MEDIUM: { min: 0.5, color: '#FFAA00', priority: 3 },
  LOW: { min: 0.3, color: '#FFDD00', priority: 4 },
  INFO: { min: 0, color: '#00AAFF', priority: 5 }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function shouldExclude(url) {
  return EXCLUDED_DOMAINS.some(domain => url.includes(domain));
}

function generateThreatId() {
  return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateSeverity(confidence) {
  if (confidence >= THREAT_LEVELS.CRITICAL.min) return 'CRITICAL';
  if (confidence >= THREAT_LEVELS.HIGH.min) return 'HIGH';
  if (confidence >= THREAT_LEVELS.MEDIUM.min) return 'MEDIUM';
  if (confidence >= THREAT_LEVELS.LOW.min) return 'LOW';
  return 'INFO';
}

function parseRequestBody(requestBody) {
  if (!requestBody) return 'N/A';

  if (requestBody.formData) {
    try {
      const formDataObj = {};
      for (const [key, value] of Object.entries(requestBody.formData)) {
        if (value !== null && value !== undefined) {
          formDataObj[key] = Array.isArray(value) ? value.filter(v => v != null) : value;
        }
      }
      return Object.keys(formDataObj).length > 0 ? JSON.stringify(formDataObj) : 'N/A';
    } catch (e) {
      console.error('ThreatMonitor: Error parsing form data:', e);
      return 'Error parsing form data';
    }
  }

  if (requestBody.raw && requestBody.raw[0]) {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const decodedText = decoder.decode(requestBody.raw[0].bytes);

      if (!decodedText || decodedText.trim() === '') return 'N/A';

      try {
        const parsed = JSON.parse(decodedText);
        return JSON.stringify(parsed);
      } catch {
        return decodedText.length > 500 ? decodedText.substring(0, 500) + '...' : decodedText;
      }
    } catch (e) {
      console.error('ThreatMonitor: Error decoding request body:', e);
      return 'Could not decode body';
    }
  }

  return 'N/A';
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

class NotificationManager {
  static async showThreatNotification(threat) {
    const settings = await this.getSettings();

    if (!settings.notificationsEnabled) return;

    // Only notify for threats above configured threshold
    if (threat.severity === 'INFO' && !settings.notifyLowSeverity) return;

    const notificationId = `threat_${threat.id}`;
    const severity = threat.severity || 'UNKNOWN';
    const type = threat.threat?.type || 'Unknown Threat';
    const confidence = Math.round((threat.threat?.confidence || 0) * 100);

    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png', // Add your icon
      title: `🚨 ${severity} Threat Detected`,
      message: `${type} detected (${confidence}% confidence)\n${threat.request.url}`,
      priority: 2,
      requireInteraction: severity === 'CRITICAL' || severity === 'HIGH',
      buttons: [
        { title: 'View Details' },
        { title: 'Dismiss' }
      ]
    });

    // Play sound for critical threats
    if (severity === 'CRITICAL' && settings.soundEnabled) {
      this.playAlertSound();
    }
  }

  static playAlertSound() {
    // Chrome extensions can play audio using offscreen documents
    // For simplicity, we'll trigger via content script if tab is available
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'playAlertSound'
        }).catch(() => {});
      }
    });
  }

  static async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get({
        notificationsEnabled: true,
        notifyLowSeverity: false,
        soundEnabled: true,
        autoBlock: false,
        webhookEnabled: false,
        siemEnabled: false
      }, resolve);
    });
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // View Details
    chrome.action.openPopup();
  }
  chrome.notifications.clear(notificationId);
});

// ============================================================================
// BADGE MANAGER
// ============================================================================

class BadgeManager {
  static threatCount = 0;

  static async updateBadge(threat) {
    if (threat && threat.threat?.threatDetected) {
      this.threatCount++;

      const severity = threat.severity || 'INFO';
      const color = THREAT_LEVELS[severity]?.color || '#999999';

      chrome.action.setBadgeText({ text: this.threatCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color });

      // Animate badge for critical threats
      if (severity === 'CRITICAL') {
        this.animateBadge();
      }
    }
  }

  static async animateBadge() {
    const colors = ['#FF0000', '#FF6666', '#FF0000', '#FF6666'];
    for (let i = 0; i < colors.length; i++) {
      setTimeout(() => {
        chrome.action.setBadgeBackgroundColor({ color: colors[i] });
      }, i * 200);
    }
  }

  static resetBadge() {
    this.threatCount = 0;
    chrome.action.setBadgeText({ text: '' });
  }
}

// Reset badge when popup is opened
chrome.action.onClicked.addListener(() => {
  BadgeManager.resetBadge();
});

// ============================================================================
// MODAL TRIGGER MANAGER
// ============================================================================

class ModalManager {
  static async triggerWarningModal(threat, tabId) {
    const settings = await NotificationManager.getSettings();

    // Only show modal for high/critical threats if auto-block is enabled
    if (!settings.autoBlock) return;
    if (threat.severity !== 'CRITICAL' && threat.severity !== 'HIGH') return;

    try {
      await chrome.tabs.sendMessage(tabId, {
        action: 'showThreatModal',
        data: threat
      });
    } catch (error) {
      console.error('ThreatMonitor: Could not inject modal:', error);
    }
  }
}

// ============================================================================
// WEBHOOK & API INTEGRATION
// ============================================================================

class WebhookManager {
  static async sendToWebhook(threat) {
    const settings = await NotificationManager.getSettings();
    if (!settings.webhookEnabled || !WEBHOOK_URL) return;

    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'threat_detected',
          timestamp: threat.timestamp,
          threat: threat
        })
      });

      threat.actions.webhookSent = true;
      console.log('ThreatMonitor: Webhook sent successfully');
    } catch (error) {
      console.error('ThreatMonitor: Webhook failed:', error);
    }
  }

  static async sendToSIEM(threat) {
    const settings = await NotificationManager.getSettings();
    if (!settings.siemEnabled || !SIEM_API_URL) return;

    try {
      // Format for Splunk HEC or similar SIEM tools
      const siemEvent = {
        time: Date.now() / 1000,
        host: 'browser-extension',
        source: 'threat-monitor',
        sourcetype: 'threat_detection',
        event: {
          severity: threat.severity,
          threat_type: threat.threat?.type,
          confidence: threat.threat?.confidence,
          url: threat.request.url,
          method: threat.request.method,
          timestamp: threat.timestamp,
          details: threat
        }
      };

      await fetch(SIEM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Splunk ${localStorage.getItem('siemToken') || ''}`
        },
        body: JSON.stringify(siemEvent)
      });

      console.log('ThreatMonitor: SIEM event sent');
    } catch (error) {
      console.error('ThreatMonitor: SIEM integration failed:', error);
    }
  }

  static async triggerAWSWorkflow(threat) {
    // Trigger AWS EventBridge or SNS for workflow automation
    if (!AWS_SNS_TOPIC_ARN) return;

    try {
      // This would typically go through your Lambda function
      await fetch(`${ENDPOINT_URL}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_workflow',
          topicArn: AWS_SNS_TOPIC_ARN,
          threat: {
            id: threat.id,
            severity: threat.severity,
            type: threat.threat?.type,
            confidence: threat.threat?.confidence,
            url: threat.request.url,
            timestamp: threat.timestamp
          }
        })
      });

      console.log('ThreatMonitor: AWS workflow triggered');
    } catch (error) {
      console.error('ThreatMonitor: AWS workflow trigger failed:', error);
    }
  }
}

// ============================================================================
// THREAT EVENT PROCESSOR
// ============================================================================

class ThreatProcessor {
  static async processThreat(threatData, details, aiResponse, status) {
    const threatId = generateThreatId();
    const confidence = aiResponse.confidence || 0;
    const severity = calculateSeverity(confidence);

    const threat = {
      id: threatId,
      timestamp: new Date().toISOString(),
      detectedAt: Date.now(),
      severity: severity,
      threat: {
        type: aiResponse.type || 'Unknown',
        confidence: confidence,
        threatDetected: aiResponse.threatDetected || false,
        description: aiResponse.description || '',
        indicators: aiResponse.indicators || []
      },
      request: {
        method: details.method,
        url: details.url,
        body: threatData.requestBody,
        initiator: details.initiator || 'unknown',
        type: details.type
      },
      response: {
        status: status,
        aiAnalysis: aiResponse
      },
      actions: {
        notified: false,
        blocked: false,
        exported: false,
        webhookSent: false,
        siemSent: false
      }
    };

    // Store in local storage
    await this.storeThreat(threat);

    // Trigger notifications if threat detected
    if (threat.threat.threatDetected) {
      await NotificationManager.showThreatNotification(threat);
      await BadgeManager.updateBadge(threat);
      await ModalManager.triggerWarningModal(threat, details.tabId);

      // External integrations
      await WebhookManager.sendToWebhook(threat);
      await WebhookManager.sendToSIEM(threat);
      await WebhookManager.triggerAWSWorkflow(threat);

      threat.actions.notified = true;
    }

    return threat;
  }

  static async storeThreat(threat) {
    return new Promise((resolve) => {
      chrome.storage.local.get({ threats: [], responses: [] }, (data) => {
        // Store in new 'threats' array with full schema
        data.threats.unshift(threat);
        data.threats = data.threats.slice(0, 100); // Keep last 100 threats

        // Also store in legacy 'responses' format for backward compatibility
        data.responses.unshift({
          id: threat.id,
          url: threat.request.url,
          method: threat.request.method,
          body: threat.request.body,
          timestamp: new Date(threat.timestamp).toLocaleTimeString(),
          status: threat.response.status,
          aiResponse: threat.response.aiAnalysis,
          severity: threat.severity
        });
        data.responses = data.responses.slice(0, 20);

        chrome.storage.local.set({ threats: data.threats, responses: data.responses }, resolve);
      });
    });
  }
}

// ============================================================================
// MAIN REQUEST INTERCEPTOR
// ============================================================================

chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    if (!['GET', 'POST', 'PUT'].includes(details.method)) return;
    if (details.type !== 'xmlhttprequest') return;
    if (details.url === ENDPOINT_URL) return;
    if (shouldExclude(details.url)) return;

    const requestBody = parseRequestBody(details.requestBody);

    const logSummary = `Log Entry:\nMethod: ${details.method}\nURL: ${details.url}\nBody: ${requestBody}\nTimestamp: ${new Date().toISOString()}\nSource: ${details.initiator || 'browser'}`;

    const requestData = {
      messages: [
        {
          role: "user",
          content: [{ text: logSummary }]
        }
      ]
    };

    console.log('ThreatMonitor: Analyzing request...');

    try {
      const response = await fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      let aiResponse, status = response.status;

      if (response.ok) {
        try {
          const responseText = await response.text();
          if (responseText && responseText.trim()) {
            aiResponse = JSON.parse(responseText);
          } else {
            aiResponse = { error: 'Empty response from AI endpoint' };
          }
        } catch (parseError) {
          aiResponse = { error: 'Invalid JSON response from AI endpoint' };
        }
      } else {
        const errorMessages = {
          400: 'Bad request - Check request format',
          401: 'Unauthorized - Check API credentials',
          403: 'Forbidden - Access denied',
          404: 'Endpoint not found - Check API URL',
          429: 'Rate limit exceeded - Too many requests',
          500: 'Internal server error - AWS Lambda error',
          502: 'Bad gateway - Check Lambda configuration',
          503: 'Service unavailable - AWS may be down',
          504: 'Gateway timeout - Lambda took too long'
        };
        aiResponse = { error: errorMessages[status] || `HTTP ${status} error` };
      }

      // Process and store threat with all integrations
      await ThreatProcessor.processThreat(
        { requestBody },
        details,
        aiResponse,
        status
      );

    } catch (error) {
      console.error('ThreatMonitor: Network error:', error);

      let errorMessage = 'Network error';
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot reach API - Check network/CORS';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network connection failed';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else {
        errorMessage = error.message || 'Unknown error';
      }

      // Store error as low-severity event
      await ThreatProcessor.processThreat(
        { requestBody },
        details,
        { error: errorMessage, threatDetected: false },
        0
      );
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

// ============================================================================
// MESSAGE HANDLERS FOR POPUP/CONTENT COMMUNICATION
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getThreats') {
    chrome.storage.local.get({ threats: [] }, (data) => {
      sendResponse({ threats: data.threats });
    });
    return true; // Async response
  }

  if (message.action === 'exportThreats') {
    chrome.storage.local.get({ threats: [] }, (data) => {
      sendResponse({
        success: true,
        threats: data.threats,
        count: data.threats.length
      });
    });
    return true;
  }

  if (message.action === 'clearThreats') {
    chrome.storage.local.set({ threats: [], responses: [] }, () => {
      BadgeManager.resetBadge();
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('ThreatMonitor: Enhanced background service worker initialized');
