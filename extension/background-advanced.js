// ============================================================================
// THREAT MONITOR - Advanced Background Service Worker
// Features: Network tagging, resource classification, session tracking
// ============================================================================

const ENDPOINT_URL = 'https://li9e1bovvb.execute-api.us-east-1.amazonaws.com/Prod/AnalyzeOneLog';

// Configuration
const EXCLUDED_DOMAINS = [
  'mixpanel.com', 'doubleclick.net', 'statsig', 'grok.com', 'quantserve.com',
  'amazonadsystem.com', 'clients6.google.com', 'accounts.google.com',
  'amazon.in/nav/ajax', 'unagi.amazon.in', 'aax-eu-zaz.amazon.in',
  'adservice.google.com', 'fbcdn.net', 'facebook.com', 'twitter.com',
  'linkedin.com', 'bing.com'
];

const THREAT_LEVELS = {
  CRITICAL: { min: 0.9, color: '#FF0000', priority: 1 },
  HIGH: { min: 0.7, color: '#FF6600', priority: 2 },
  MEDIUM: { min: 0.5, color: '#FFAA00', priority: 3 },
  LOW: { min: 0.3, color: '#FFDD00', priority: 4 },
  INFO: { min: 0, color: '#00AAFF', priority: 5 }
};

// Resource type classification
const RESOURCE_TYPES = {
  'xmlhttprequest': 'API',
  'fetch': 'API',
  'script': 'JavaScript',
  'stylesheet': 'CSS',
  'image': 'Image',
  'font': 'Font',
  'media': 'Media',
  'websocket': 'WebSocket',
  'other': 'Other'
};

// Session management
let currentSessionId = generateSessionId();
const tabSessions = new Map(); // tabId -> sessionData

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateThreatId() {
  return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function shouldExclude(url) {
  return EXCLUDED_DOMAINS.some(domain => url.includes(domain));
}

function calculateSeverity(confidence) {
  if (confidence >= THREAT_LEVELS.CRITICAL.min) return 'CRITICAL';
  if (confidence >= THREAT_LEVELS.HIGH.min) return 'HIGH';
  if (confidence >= THREAT_LEVELS.MEDIUM.min) return 'MEDIUM';
  if (confidence >= THREAT_LEVELS.LOW.min) return 'LOW';
  return 'INFO';
}

// ============================================================================
// NETWORK & RESOURCE TAGGING
// ============================================================================

class ResourceClassifier {
  static classifyResourceType(details) {
    const type = details.type || 'other';
    const url = details.url || '';

    // Enhanced classification
    if (url.includes('/api/') || url.includes('/graphql')) {
      return { type: 'API', subtype: url.includes('/graphql') ? 'GraphQL' : 'REST' };
    }

    if (type === 'xmlhttprequest' || type === 'fetch') {
      return { type: 'API', subtype: 'AJAX' };
    }

    if (type === 'script') {
      return { type: 'JavaScript', subtype: url.endsWith('.js') ? 'External' : 'Inline' };
    }

    if (type === 'stylesheet') {
      return { type: 'CSS', subtype: 'Stylesheet' };
    }

    if (type === 'image') {
      const ext = url.split('.').pop()?.toLowerCase();
      return { type: 'Image', subtype: ext || 'unknown' };
    }

    if (type === 'font') {
      return { type: 'Font', subtype: 'Web Font' };
    }

    if (type === 'media') {
      return { type: 'Media', subtype: url.includes('video') ? 'Video' : 'Audio' };
    }

    if (type === 'websocket') {
      return { type: 'WebSocket', subtype: 'Real-time' };
    }

    return { type: RESOURCE_TYPES[type] || 'Other', subtype: 'Unknown' };
  }

  static extractDomainInfo(url) {
    try {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol.replace(':', ''),
        domain: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? '443' : '80'),
        path: urlObj.pathname,
        subdomain: urlObj.hostname.split('.').slice(0, -2).join('.') || null,
        tld: urlObj.hostname.split('.').slice(-2).join('.')
      };
    } catch (e) {
      return {
        protocol: 'unknown',
        domain: url,
        port: null,
        path: '/',
        subdomain: null,
        tld: null
      };
    }
  }

  static getFileType(url) {
    const extension = url.split('?')[0].split('.').pop()?.toLowerCase();
    const fileTypes = {
      'js': 'JavaScript',
      'css': 'Stylesheet',
      'json': 'JSON',
      'xml': 'XML',
      'html': 'HTML',
      'jpg': 'Image',
      'png': 'Image',
      'gif': 'Image',
      'svg': 'Vector',
      'woff': 'Font',
      'woff2': 'Font',
      'ttf': 'Font',
      'mp4': 'Video',
      'webm': 'Video',
      'mp3': 'Audio'
    };
    return fileTypes[extension] || extension || 'unknown';
  }
}

// ============================================================================
// TAB & SESSION TRACKING
// ============================================================================

class SessionTracker {
  static async getTabInfo(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      return {
        id: tabId,
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        windowId: tab.windowId,
        incognito: tab.incognito
      };
    } catch (error) {
      console.error('Error getting tab info:', error);
      return {
        id: tabId,
        url: 'unknown',
        title: 'Unknown Tab',
        favIconUrl: null,
        active: false,
        windowId: null,
        incognito: false
      };
    }
  }

  static getOrCreateSession(tabId) {
    if (!tabSessions.has(tabId)) {
      tabSessions.set(tabId, {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        requestCount: 0,
        threatCount: 0
      });
    }

    const session = tabSessions.get(tabId);
    session.requestCount++;

    return session;
  }

  static incrementThreatCount(tabId) {
    const session = tabSessions.get(tabId);
    if (session) {
      session.threatCount++;
    }
  }
}

// Listen for tab removal to clean up sessions
chrome.tabs.onRemoved.addListener((tabId) => {
  tabSessions.delete(tabId);
});

// ============================================================================
// DEVICE & USER INFO COLLECTION
// ============================================================================

class DeviceInfoCollector {
  static async getDeviceInfo() {
    const userAgent = navigator.userAgent;

    return {
      browser: this.getBrowserInfo(userAgent),
      os: this.getOSInfo(userAgent),
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio
      },
      hardware: {
        cores: navigator.hardwareConcurrency || 'unknown',
        memory: navigator.deviceMemory || 'unknown',
        connectionType: navigator.connection?.effectiveType || 'unknown'
      }
    };
  }

  static getBrowserInfo(ua) {
    if (ua.includes('Edg/')) return { name: 'Edge', engine: 'Chromium' };
    if (ua.includes('Chrome/')) return { name: 'Chrome', engine: 'Blink' };
    if (ua.includes('Firefox/')) return { name: 'Firefox', engine: 'Gecko' };
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return { name: 'Safari', engine: 'WebKit' };
    return { name: 'Unknown', engine: 'Unknown' };
  }

  static getOSInfo(ua) {
    if (ua.includes('Windows NT 10')) return 'Windows 10/11';
    if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (ua.includes('Windows NT 6.2')) return 'Windows 8';
    if (ua.includes('Windows NT 6.1')) return 'Windows 7';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  static async getUserIdentity() {
    // Get extension installation ID for user tracking
    const extensionId = chrome.runtime.id;

    // Generate or retrieve persistent user ID
    const storage = await chrome.storage.local.get(['userId']);
    let userId = storage.userId;

    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await chrome.storage.local.set({ userId });
    }

    return {
      userId,
      extensionId,
      installDate: storage.installDate || Date.now()
    };
  }
}

// ============================================================================
// ENHANCED THREAT PROCESSOR
// ============================================================================

class EnhancedThreatProcessor {
  static async processThreat(details, requestBody, aiResponse, status) {
    const threatId = generateThreatId();
    const confidence = aiResponse.confidence || 0;
    const severity = calculateSeverity(confidence);

    // Get tab and session info
    const tabInfo = await SessionTracker.getTabInfo(details.tabId);
    const sessionInfo = SessionTracker.getOrCreateSession(details.tabId);

    // Classify resource
    const resourceType = ResourceClassifier.classifyResourceType(details);
    const domainInfo = ResourceClassifier.extractDomainInfo(details.url);
    const fileType = ResourceClassifier.getFileType(details.url);

    // Get device and user info
    const deviceInfo = await DeviceInfoCollector.getDeviceInfo();
    const userInfo = await DeviceInfoCollector.getUserIdentity();

    // Build enhanced threat object
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
        body: requestBody,
        initiator: details.initiator || 'unknown',
        requestId: details.requestId,
        frameId: details.frameId,
        parentFrameId: details.parentFrameId
      },

      response: {
        status: status,
        aiAnalysis: aiResponse
      },

      // Enhanced context
      context: {
        // Tab/Session info
        tab: tabInfo,
        session: {
          id: sessionInfo.sessionId,
          startTime: sessionInfo.startTime,
          duration: Date.now() - sessionInfo.startTime,
          requestCount: sessionInfo.requestCount,
          threatCount: sessionInfo.threatCount
        },

        // User identity
        user: {
          id: userInfo.userId,
          extensionId: userInfo.extensionId,
          installDate: userInfo.installDate
        },

        // Device info
        device: deviceInfo,

        // Resource classification
        resource: {
          type: resourceType.type,
          subtype: resourceType.subtype,
          fileType: fileType,
          domain: domainInfo.domain,
          subdomain: domainInfo.subdomain,
          tld: domainInfo.tld,
          protocol: domainInfo.protocol,
          port: domainInfo.port,
          path: domainInfo.path,
          contentType: details.contentType || 'unknown'
        }
      },

      actions: {
        notified: false,
        blocked: false,
        exported: false,
        webhookSent: false,
        siemSent: false
      }
    };

    // Increment threat count if detected
    if (threat.threat.threatDetected) {
      SessionTracker.incrementThreatCount(details.tabId);
    }

    // Store threat
    await this.storeThreat(threat);

    // Trigger notifications (reuse existing NotificationManager)
    if (threat.threat.threatDetected) {
      // Add notification, badge, modal triggers here
      console.log('Threat detected:', threat);
    }

    return threat;
  }

  static async storeThreat(threat) {
    return new Promise((resolve) => {
      chrome.storage.local.get({
        threats: [],
        responses: [],
        threatsByDomain: {},
        threatsByType: {},
        threatsByTab: {}
      }, (data) => {
        // Store in main threats array
        data.threats.unshift(threat);
        data.threats = data.threats.slice(0, 500); // Keep last 500

        // Legacy format for backward compatibility
        data.responses.unshift({
          id: threat.id,
          url: threat.request.url,
          method: threat.request.method,
          body: threat.request.body,
          timestamp: new Date(threat.timestamp).toLocaleTimeString(),
          status: threat.response.status,
          aiResponse: threat.response.aiAnalysis,
          severity: threat.severity,
          domain: threat.context.resource.domain,
          tabId: threat.context.tab.id,
          sessionId: threat.context.session.id
        });
        data.responses = data.responses.slice(0, 100);

        // Index by domain
        const domain = threat.context.resource.domain;
        if (!data.threatsByDomain[domain]) {
          data.threatsByDomain[domain] = [];
        }
        data.threatsByDomain[domain].push(threat.id);

        // Index by resource type
        const resourceType = threat.context.resource.type;
        if (!data.threatsByType[resourceType]) {
          data.threatsByType[resourceType] = [];
        }
        data.threatsByType[resourceType].push(threat.id);

        // Index by tab
        const tabId = threat.context.tab.id;
        if (!data.threatsByTab[tabId]) {
          data.threatsByTab[tabId] = {
            tabInfo: threat.context.tab,
            threatIds: []
          };
        }
        data.threatsByTab[tabId].threatIds.push(threat.id);

        chrome.storage.local.set({
          threats: data.threats,
          responses: data.responses,
          threatsByDomain: data.threatsByDomain,
          threatsByType: data.threatsByType,
          threatsByTab: data.threatsByTab
        }, resolve);
      });
    });
  }
}

// ============================================================================
// REQUEST BODY PARSER
// ============================================================================

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
      return 'Could not decode body';
    }
  }

  return 'N/A';
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
        { role: "user", content: [{ text: logSummary }] }
      ]
    };

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
          aiResponse = responseText && responseText.trim()
            ? JSON.parse(responseText)
            : { error: 'Empty response from AI endpoint' };
        } catch {
          aiResponse = { error: 'Invalid JSON response from AI endpoint' };
        }
      } else {
        const errorMessages = {
          400: 'Bad request', 401: 'Unauthorized', 403: 'Forbidden',
          404: 'Endpoint not found', 429: 'Rate limit exceeded',
          500: 'Internal server error', 502: 'Bad gateway',
          503: 'Service unavailable', 504: 'Gateway timeout'
        };
        aiResponse = { error: errorMessages[status] || `HTTP ${status} error` };
      }

      await EnhancedThreatProcessor.processThreat(details, requestBody, aiResponse, status);

    } catch (error) {
      console.error('ThreatMonitor: Network error:', error);

      const errorMessage = error.message.includes('Failed to fetch')
        ? 'Cannot reach API - Check network/CORS'
        : error.message || 'Unknown error';

      await EnhancedThreatProcessor.processThreat(
        details,
        requestBody,
        { error: errorMessage, threatDetected: false },
        0
      );
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);

// ============================================================================
// MESSAGE HANDLERS
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getThreats') {
    chrome.storage.local.get({ threats: [] }, (data) => {
      sendResponse({ threats: data.threats });
    });
    return true;
  }

  if (message.action === 'getGroupedThreats') {
    chrome.storage.local.get({
      threats: [],
      threatsByDomain: {},
      threatsByType: {},
      threatsByTab: {}
    }, (data) => {
      sendResponse({
        threats: data.threats,
        byDomain: data.threatsByDomain,
        byType: data.threatsByType,
        byTab: data.threatsByTab
      });
    });
    return true;
  }

  if (message.action === 'clearThreats') {
    chrome.storage.local.set({
      threats: [],
      responses: [],
      threatsByDomain: {},
      threatsByType: {},
      threatsByTab: {}
    }, () => {
      tabSessions.clear();
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('ThreatMonitor: Advanced background service worker initialized');
