# Advanced Threat Monitor - Network/Resource Tagging Features

## 🎯 Feature A: Network/Resource Tagging

### **Architecture Overview**

```
Request Flow with Tagging:
┌──────────────────────────────────────────────────────────────┐
│ 1. Request Intercepted                                       │
│    ├─► Extract Tab Info (ID, title, URL, favicon)           │
│    ├─► Get/Create Session (sessionId, startTime, counts)    │
│    ├─► Classify Resource (type, subtype, fileType)          │
│    ├─► Parse Domain (protocol, domain, subdomain, TLD)      │
│    ├─► Collect Device Info (browser, OS, screen, CPU)       │
│    └─► Get User Identity (userId, installDate)              │
│                                                               │
│ 2. Enhanced Threat Object Created                            │
│    {                                                          │
│      id, timestamp, severity, threat: {...},                 │
│      request: {...},                                         │
│      response: {...},                                        │
│      context: {                                              │
│        tab: { id, url, title, active, incognito },          │
│        session: { id, startTime, requestCount, threatCount}, │
│        user: { id, extensionId, installDate },              │
│        device: { browser, os, platform, screen, hardware }, │
│        resource: {                                           │
│          type, subtype, fileType, domain, subdomain,        │
│          tld, protocol, port, path, contentType             │
│        }                                                     │
│      }                                                       │
│    }                                                         │
│                                                              │
│ 3. Indexed Storage                                           │
│    ├─► threats[] - Main array                               │
│    ├─► threatsByDomain{} - Indexed by domain                │
│    ├─► threatsByType{} - Indexed by resource type           │
│    └─► threatsByTab{} - Indexed by tab ID                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Enhanced Data Structure

### **Complete Threat Object Schema**

```json
{
  "id": "threat_1729388220000_abc123",
  "timestamp": "2025-10-20T01:17:00.000Z",
  "detectedAt": 1729388220000,
  "severity": "HIGH",

  "threat": {
    "type": "XSS",
    "confidence": 0.85,
    "threatDetected": true,
    "description": "Detected reflected XSS attempt",
    "indicators": ["<script>", "javascript:"]
  },

  "request": {
    "method": "POST",
    "url": "https://example.com/api/submit",
    "body": "{\"data\":\"<script>alert(1)</script>\"}",
    "initiator": "https://attacker.com",
    "requestId": "req_xyz",
    "frameId": 0,
    "parentFrameId": -1
  },

  "response": {
    "status": 200,
    "aiAnalysis": {
      "threatDetected": true,
      "confidence": 0.85,
      "type": "XSS"
    }
  },

  "context": {
    "tab": {
      "id": 12345,
      "url": "https://example.com",
      "title": "Example Page",
      "favIconUrl": "https://example.com/favicon.ico",
      "active": true,
      "windowId": 1,
      "incognito": false
    },

    "session": {
      "id": "session_1729388000000_def456",
      "startTime": 1729388000000,
      "duration": 220000,
      "requestCount": 15,
      "threatCount": 3
    },

    "user": {
      "id": "user_1729000000000_ghi789",
      "extensionId": "abcdefghijk1234567890",
      "installDate": 1729000000000
    },

    "device": {
      "browser": {
        "name": "Chrome",
        "engine": "Blink"
      },
      "os": "Windows 10/11",
      "platform": "Win32",
      "language": "en-US",
      "languages": ["en-US", "en"],
      "timezone": "America/New_York",
      "screen": {
        "width": 1920,
        "height": 1080,
        "availWidth": 1920,
        "availHeight": 1040,
        "colorDepth": 24,
        "pixelRatio": 1
      },
      "hardware": {
        "cores": 8,
        "memory": 16,
        "connectionType": "4g"
      }
    },

    "resource": {
      "type": "API",
      "subtype": "REST",
      "fileType": "json",
      "domain": "example.com",
      "subdomain": "api",
      "tld": "example.com",
      "protocol": "https",
      "port": "443",
      "path": "/api/submit",
      "contentType": "application/json"
    }
  },

  "actions": {
    "notified": true,
    "blocked": false,
    "exported": false,
    "webhookSent": true,
    "siemSent": true
  }
}
```

---

## 📈 Interactive Visualizations

### **Chart.js Integration**

#### **1. Threats by Domain (Bar Chart)**
```javascript
// Shows top 10 domains with most threats
// Data: Domain name → Threat count
// Color: Red gradient (#ff6363)
// Use Case: Identify malicious domains
```

**Example Output:**
```
evil-domain.com     ████████████ 12
suspicious.net      ████████ 8
phishing-site.org   ██████ 6
...
```

#### **2. Resource Type Distribution (Doughnut Chart)**
```javascript
// Shows breakdown of requests by resource type
// Types: API, JavaScript, Image, CSS, Font, Media
// Colors: Multi-colored segments
// Use Case: Understand attack surface
```

**Example Output:**
```
API: 45%
JavaScript: 30%
Image: 15%
CSS: 7%
Other: 3%
```

#### **3. Threats Over Time (Line Chart)**
```javascript
// Shows threat count per hour for last 24 hours
// X-axis: Hours ago (24h → 0h)
// Y-axis: Threat count
// Use Case: Detect attack patterns, time-based threats
```

**Example Output:**
```
     ^
  12 |           ╱╲
   8 |        ╱╲╱  ╲
   4 |     ╱╲╱      ╲
   0 |____╱__________╲___►
     24h  12h   6h   0h
```

#### **4. Severity Distribution (Bar Chart)**
```javascript
// Shows count of threats by severity level
// Severities: CRITICAL, HIGH, MEDIUM, LOW, INFO
// Colors: Red → Yellow → Blue
// Use Case: Prioritize security response
```

---

## 🎨 UI Grouping Features

### **Grouping Options**

#### **1. Group by Domain**
```
📁 example.com (12 threats)
   ├─ POST /api/login - XSS (HIGH)
   ├─ GET /api/users - SQLi (CRITICAL)
   └─ POST /submit - Data Exfil (MEDIUM)

📁 suspicious.net (8 threats)
   ├─ GET /tracker.js - Malware (HIGH)
   └─ POST /beacon - Privacy (LOW)
```

#### **2. Group by Tab/Session**
```
📑 Example Site (Tab 12345)
   Session: 1h 23m
   Requests: 45
   ├─ API request - Clean
   ├─ API request - XSS (HIGH)
   └─ Image load - Clean

📑 Shopping Cart (Tab 67890)
   Session: 34m
   Requests: 12
   └─ Payment API - SQLi (CRITICAL)
```

#### **3. Group by Resource Type**
```
⚙️ API Requests (25 threats)
   ├─ POST /api/login - XSS
   └─ GET /api/data - SQLi

📜 JavaScript (8 threats)
   ├─ external.js - Malware
   └─ tracker.js - Privacy

🖼️ Images (3 threats)
   └─ suspicious.png - Steganography
```

#### **4. Group by Severity**
```
🔴 CRITICAL (3 threats)
   ├─ SQLi on payment endpoint
   ├─ RCE attempt detected
   └─ Credential theft

🟠 HIGH (8 threats)
   ├─ XSS in form input
   └─ Malware download

🟡 MEDIUM (15 threats)
   └─ Data exfiltration attempt
```

---

## 📁 Enhanced Export Formats

### **CSV Export with All Fields**

```csv
Timestamp,Severity,Threat Type,Confidence,Method,URL,Domain,Resource Type,Tab ID,Tab Title,Session ID,User ID,Browser,OS,Status,Body
"2025-10-20T01:17:00.000Z","HIGH","XSS","0.85","POST","https://example.com/api","example.com","API","12345","Example Page","session_abc","user_xyz","Chrome","Windows 10/11","200","{\"data\":\"payload\"}"
"2025-10-20T01:18:15.000Z","CRITICAL","SQLi","0.95","GET","https://evil.com/login","evil.com","API","12345","Evil Site","session_abc","user_xyz","Chrome","Windows 10/11","500","N/A"
```

**Fields Exported:**
- **Basic**: Timestamp, Severity, Threat Type, Confidence
- **Request**: Method, URL, Body, Status
- **Context**: Domain, Resource Type, Tab ID, Tab Title
- **Session**: Session ID, User ID
- **Device**: Browser, OS

### **JSON Export with Nested Grouping**

```json
{
  "exportedAt": "2025-10-20T02:00:00.000Z",
  "totalThreats": 25,
  "groupedBy": "domain",
  "filters": {
    "severity": "all",
    "resourceType": "API",
    "search": ""
  },
  "statistics": {
    "criticalThreats": 3,
    "highThreats": 8,
    "uniqueDomains": 12,
    "uniqueSessions": 5,
    "avgConfidence": 0.78
  },
  "threats": [
    {
      "id": "threat_1729388220000_abc123",
      "timestamp": "2025-10-20T01:17:00.000Z",
      "severity": "HIGH",
      "threat": {
        "type": "XSS",
        "confidence": 0.85,
        "threatDetected": true,
        "description": "Detected XSS attempt",
        "indicators": ["<script>", "eval()"]
      },
      "request": {
        "method": "POST",
        "url": "https://example.com/api",
        "body": "{\"data\":\"payload\"}",
        "initiator": "https://attacker.com"
      },
      "context": {
        "tab": {
          "id": 12345,
          "title": "Example Page",
          "url": "https://example.com"
        },
        "session": {
          "id": "session_abc",
          "requestCount": 15,
          "threatCount": 3,
          "duration": 220000
        },
        "user": {
          "id": "user_xyz"
        },
        "device": {
          "browser": { "name": "Chrome", "engine": "Blink" },
          "os": "Windows 10/11",
          "platform": "Win32"
        },
        "resource": {
          "type": "API",
          "subtype": "REST",
          "domain": "example.com",
          "protocol": "https",
          "fileType": "json"
        }
      }
    }
  ]
}
```

---

## 🔧 Implementation Guide

### **Step 1: Replace Extension Files**

```bash
# Backup current files
cp extension/background.js extension/background-backup.js
cp extension/popup.html extension/popup-backup.html
cp extension/popup.js extension/popup-backup.js

# Use advanced versions
mv extension/background-advanced.js extension/background.js
mv extension/popup-advanced.html extension/popup.html
mv extension/popup-advanced.js extension/popup.js
```

### **Step 2: Update Manifest for Permissions**

```json
{
  "manifest_version": 3,
  "name": "TrueGuardian Threat Monitor",
  "version": "3.0.0",
  "permissions": [
    "webRequest",
    "storage",
    "tabs",
    "notifications",
    "scripting"
  ],
  "host_permissions": ["<all_urls>"]
}
```

### **Step 3: Chart.js CDN**

The popup HTML already includes:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

**Alternative: Offline Installation**
```bash
cd extension
curl -O https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
```

Then update HTML:
```html
<script src="chart.umd.min.js"></script>
```

---

## 🚀 AWS Bedrock/Nova Integration

### **Cloud-Based Alerting Workflow**

```javascript
// When CRITICAL threat detected → background.js

// 1. Enrich threat data with context
const enrichedThreat = {
  ...threat,
  cloudMetadata: {
    accountId: AWS_ACCOUNT_ID,
    region: 'us-east-1',
    timestamp: new Date().toISOString()
  }
};

// 2. Publish to SNS Topic
await publishToSNS(enrichedThreat);

// 3. Trigger EventBridge Rule
await triggerEventBridge({
  source: 'threat-monitor.extension',
  detailType: 'CriticalThreatDetected',
  detail: enrichedThreat
});

// 4. Lambda Function Triggered
// ├─► Auto-block domain in CloudFront/WAF
// ├─► Create JIRA ticket
// ├─► Send to SIEM (Splunk/Datadog)
// ├─► Alert security team (PagerDuty)
// └─► Store in S3 for compliance
```

### **EventBridge Rule Example**

```yaml
EventPattern:
  source:
    - threat-monitor.extension
  detail-type:
    - CriticalThreatDetected
  detail:
    severity:
      - CRITICAL
    context:
      resource:
        domain:
          - prefix: "evil"
          - prefix: "malicious"

Targets:
  - Arn: arn:aws:lambda:us-east-1:123456:function:AutoBlockDomain
  - Arn: arn:aws:lambda:us-east-1:123456:function:NotifySecurityTeam
  - Arn: arn:aws:firehose:us-east-1:123456:deliverystream/ThreatLogs
```

---

## 📊 Best Practices

### **Manifest V3 Compliance**

✅ **Use Service Workers** (not background pages)
```javascript
// background-advanced.js uses Service Worker APIs
self.addEventListener('install', event => {
  console.log('Service worker installed');
});
```

✅ **Async Storage APIs**
```javascript
// All chrome.storage calls use callbacks/promises
chrome.storage.local.get(['threats'], (data) => { ... });
```

✅ **Content Security Policy**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### **Chart.js Performance**

✅ **Limit Data Points**
```javascript
// Only show top 10 domains
const sorted = Object.entries(domainCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
```

✅ **Destroy Charts Before Recreating**
```javascript
if (domainChart) domainChart.destroy();
domainChart = new Chart(ctx, config);
```

✅ **Use Responsive Mode**
```javascript
options: {
  responsive: true,
  maintainAspectRatio: true
}
```

### **Storage Optimization**

✅ **Limit Stored Threats**
```javascript
data.threats = data.threats.slice(0, 500); // Keep last 500
```

✅ **Index for Fast Lookups**
```javascript
// Index by domain for quick filtering
threatsByDomain[domain].push(threatId);
```

✅ **Compress Old Data**
```javascript
// Archive threats older than 30 days
const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
const archived = threats.filter(t => t.detectedAt < thirtyDaysAgo);
```

---

## 🎯 Testing Checklist

- [ ] Load extension with advanced files
- [ ] Verify Chart.js loads in popup
- [ ] Check 4 charts render correctly
- [ ] Test grouping by domain, tab, type, severity
- [ ] Verify filters work (severity, resource type, search)
- [ ] Test CSV export with all new fields
- [ ] Test JSON export with nested structure
- [ ] Confirm tab/session tracking works
- [ ] Verify device info collection
- [ ] Check storage indexing (byDomain, byType, byTab)
- [ ] Test auto-refresh every 5 seconds
- [ ] Verify collapsible groups work

---

## 📚 Libraries & APIs Used

| Component | Technology | CDN/Version |
|-----------|-----------|-------------|
| **Charts** | Chart.js 4.4.0 | `cdn.jsdelivr.net/npm/chart.js@4.4.0` |
| **Tab Info** | Chrome Tabs API | `chrome.tabs.get()` |
| **Device Info** | Navigator API | `navigator.userAgent`, `navigator.platform` |
| **Storage** | Chrome Storage API | `chrome.storage.local` |
| **Requests** | WebRequest API | `chrome.webRequest.onBeforeRequest` |
| **Sessions** | Custom Implementation | `Map<tabId, sessionData>` |

---

**Version:** 3.0.0
**Features:** Network Tagging, Resource Classification, Interactive Charts, Advanced Grouping
**Chart.js:** 4.4.0
**Manifest:** V3 Compliant
