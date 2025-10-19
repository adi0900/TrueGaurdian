# TrueGuardian Threat Monitor - Features Reference Card

## 🔔 Feature 1: Real-Time Notification System

### Browser Notifications
```javascript
// Automatically triggered in background-enhanced.js
NotificationManager.showThreatNotification(threat);

// Configuration
chrome.storage.local.set({
  notificationsEnabled: true,
  notifyLowSeverity: false,  // Only HIGH/CRITICAL
  soundEnabled: true
});
```

**Visual Output:**
- 🚨 **Title**: "CRITICAL/HIGH Threat Detected"
- **Message**: "XSS detected (85% confidence)\nhttps://example.com"
- **Buttons**: [View Details] [Dismiss]
- **Auto-dismiss**: 30s for non-critical threats

### Badge Updates
```javascript
// Auto-increments on each threat
BadgeManager.updateBadge(threat);

// Colors:
// CRITICAL: #FF0000 (Red)
// HIGH: #FF6600 (Orange)
// MEDIUM: #FFAA00 (Yellow)
```

**Badge Display:**
- **Counter**: Shows total threats since last popup open
- **Color**: Matches highest severity level
- **Animation**: Pulses for CRITICAL threats

### Warning Modal (Injected into Page)
```javascript
// Triggered for HIGH/CRITICAL threats when autoBlock: true
ModalManager.triggerWarningModal(threat, tabId);
```

**Modal Features:**
- Full-screen overlay with blur
- Detailed threat information
- Action buttons: [Acknowledge] [Leave Page]
- Auto-dismiss after 30s for non-critical
- Cannot be closed by clicking outside for CRITICAL

### Audio Alerts
```javascript
// Plays for CRITICAL threats
AudioAlert.play(); // Dual-beep sound
```

---

## 📊 Feature 2: Threat Data Export & API Integration

### CSV Export
```javascript
// In popup
document.getElementById('export-csv').click();

// Programmatically
exportToCSV(); // Downloads: threat-monitor-2025-10-20T01:17:00.000Z.csv
```

**CSV Format:**
```csv
Timestamp,Severity,Threat Type,Confidence,Method,URL,Status,Body,Description
2025-10-20T01:17:00.000Z,HIGH,XSS,0.85,POST,https://example.com,200,"payload","Detected XSS attempt in form data"
```

**Use Cases:**
- Compliance reporting
- Security audits
- Incident response documentation
- Share with security team

### JSON Export
```javascript
// In popup
document.getElementById('export-json').click();

// Programmatically
exportToJSON(); // Downloads: threat-monitor-2025-10-20T01:17:00.000Z.json
```

**JSON Structure:**
```json
{
  "exportedAt": "2025-10-20T01:17:00.000Z",
  "totalThreats": 10,
  "threats": [
    {
      "id": "threat_1729388220000_abc123",
      "timestamp": "2025-10-20T01:17:00.000Z",
      "detectedAt": 1729388220000,
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
      "response": {
        "status": 200,
        "aiAnalysis": {...}
      },
      "actions": {
        "notified": true,
        "blocked": false,
        "exported": false,
        "webhookSent": true,
        "siemSent": true
      }
    }
  ]
}
```

**Use Cases:**
- Data analysis with Python/R
- Integration with BI tools
- Machine learning training data
- Programmatic processing

### Webhook Integration
```javascript
// In background-enhanced.js
const WEBHOOK_URL = 'https://your-webhook.com/threats';

WebhookManager.sendToWebhook(threat);
```

**Webhook Payload:**
```json
{
  "event": "threat_detected",
  "timestamp": "2025-10-20T01:17:00.000Z",
  "threat": {
    "id": "threat_xyz",
    "severity": "CRITICAL",
    "type": "SQLi",
    "confidence": 0.95,
    "url": "https://example.com"
  }
}
```

**Supported Integrations:**
- Slack notifications
- Discord webhooks
- Microsoft Teams
- PagerDuty
- Custom endpoints

### SIEM Integration

#### Splunk HEC
```javascript
// Configuration
const SIEM_API_URL = 'https://splunk.example.com:8088/services/collector';

// Automatic forwarding
WebhookManager.sendToSIEM(threat);
```

**Splunk Event Format:**
```json
{
  "time": 1729388220,
  "host": "browser-extension",
  "source": "threat-monitor",
  "sourcetype": "threat_detection",
  "event": {
    "severity": "CRITICAL",
    "threat_type": "SQLi",
    "confidence": 0.95,
    "url": "https://example.com",
    "details": {...}
  }
}
```

**Splunk Query Examples:**
```spl
# Find all critical threats
index=main sourcetype=threat_detection severity=CRITICAL

# Threat trends over time
index=main sourcetype=threat_detection
| timechart count by threat_type

# High confidence threats
index=main sourcetype=threat_detection confidence>0.8
| stats count by threat_type, url
```

#### Datadog Events
```javascript
// Sends to Datadog Events API
// Visible in Events Explorer and triggered monitors
```

**Datadog Event:**
```json
{
  "title": "CRITICAL Threat Detected",
  "text": "SQLi with 95% confidence at https://example.com",
  "priority": "normal",
  "tags": [
    "severity:CRITICAL",
    "threat_type:SQLi",
    "source:threat-monitor"
  ],
  "alert_type": "error"
}
```

**Datadog Monitor:**
```
Trigger alert when:
  count(threat-monitor:threat_detected{severity:CRITICAL})
  over last 5 minutes > 10
```

---

## ☁️ AWS Bedrock/Nova Workflow Integration

### Real-Time Analysis
```javascript
// Automatic threat analysis via AWS Bedrock
// Model: anthropic.claude-3-5-sonnet-20241022-v2:0
// Alternative: us.amazon.nova-pro-v1:0

const aiResponse = await invokeBedrockModel(logSummary);
```

**Analysis Response:**
```json
{
  "threatDetected": true,
  "confidence": 0.92,
  "type": "XSS",
  "severity": "HIGH",
  "description": "Detected reflected XSS attempt in URL parameter",
  "indicators": [
    "<script>alert(1)</script>",
    "javascript: protocol handler"
  ],
  "recommendation": "Block request and sanitize input"
}
```

### SNS Notifications
```javascript
// Automatic publish to SNS topic
const AWS_SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456:ThreatMonitor-Alerts';

WebhookManager.triggerAWSWorkflow(threat);
```

**SNS Message:**
```json
{
  "Subject": "🚨 CRITICAL Threat Detected",
  "Message": {
    "severity": "CRITICAL",
    "type": "SQLi",
    "confidence": 0.95,
    "url": "https://example.com",
    "timestamp": "2025-10-20T01:17:00.000Z",
    "id": "threat_xyz"
  },
  "MessageAttributes": {
    "severity": "CRITICAL",
    "threat_type": "SQLi"
  }
}
```

**SNS Subscriptions:**
- Email: security-team@company.com
- SMS: +1-555-0100
- Lambda: Auto-response function
- SQS: Queue for processing

### EventBridge Automation
```javascript
// Publishes events to EventBridge default bus
// Event pattern matching for workflow triggers
```

**EventBridge Event:**
```json
{
  "Source": "threat-monitor.extension",
  "DetailType": "ThreatDetected",
  "Detail": {
    "threatId": "threat_xyz",
    "severity": "CRITICAL",
    "type": "SQLi",
    "confidence": 0.95,
    "url": "https://example.com",
    "timestamp": "2025-10-20T01:17:00.000Z"
  }
}
```

**EventBridge Rules:**
```yaml
Rule 1: Auto-Block Critical Threats
  Event Pattern:
    source: ["threat-monitor.extension"]
    detail-type: ["ThreatDetected"]
    detail:
      severity: ["CRITICAL"]
  Target: Lambda → Block IP/Domain

Rule 2: Security Team Alert
  Event Pattern:
    source: ["threat-monitor.extension"]
    detail:
      severity: ["CRITICAL", "HIGH"]
  Target: SNS → PagerDuty

Rule 3: Log to S3
  Event Pattern:
    source: ["threat-monitor.extension"]
  Target: Firehose → S3 Bucket
```

### Workflow Examples

#### Example 1: Auto-Response to Critical Threat
```
Threat Detected (CRITICAL)
  │
  ├─► Browser Notification
  ├─► Modal Warning
  ├─► SNS → Security Team Email
  ├─► EventBridge Rule Triggered
  │     │
  │     ├─► Lambda: Block IP in WAF
  │     ├─► Lambda: Create JIRA Ticket
  │     └─► Lambda: Post to Slack
  │
  └─► SIEM (Splunk) → Alert Dashboard
```

#### Example 2: Data Exfiltration Detection
```
Unusual POST Detected
  │
  ├─► Bedrock Analysis → 95% Data Exfil
  ├─► EventBridge → StepFunctions
  │     │
  │     ├─► Investigate: Query DynamoDB for user history
  │     ├─► Analyze: Check for similar patterns
  │     ├─► Decision: Auto-block or alert?
  │     └─► Action: Update security rules
  │
  └─► Export to JSON → Security Team Review
```

#### Example 3: Compliance Reporting
```
Daily at 00:00 UTC
  │
  ├─► Lambda: Export all threats
  ├─► Format: CSV with compliance fields
  ├─► Store: S3 bucket (encrypted)
  ├─► Generate: PDF report
  └─► Email: Compliance team
```

---

## 🎛️ Configuration Options

### Extension Storage Settings
```javascript
chrome.storage.local.set({
  // Notifications
  notificationsEnabled: true,
  notifyLowSeverity: false,
  soundEnabled: true,

  // Auto-response
  autoBlock: true,  // Show modal for HIGH/CRITICAL

  // Integrations
  webhookEnabled: true,
  siemEnabled: true,

  // Data retention
  maxThreats: 100,
  autoExport: false,
  exportSchedule: 'daily'
});
```

### AWS Configuration
```javascript
// In background-enhanced.js
const ENDPOINT_URL = 'https://YOUR_API.execute-api.us-east-1.amazonaws.com/Prod/AnalyzeOneLog';
const WEBHOOK_URL = 'https://hooks.slack.com/services/YOUR/WEBHOOK';
const SIEM_API_URL = 'https://splunk.example.com:8088/services/collector';
const AWS_SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456:ThreatMonitor-Alerts';
```

---

## 📱 API Endpoints Reference

### GET /api/threats/export
```bash
curl -H "Authorization: Bearer TOKEN" \
  "https://api.example.com/threats/export?severity=CRITICAL&format=json"
```

**Parameters:**
- `severity`: CRITICAL | HIGH | MEDIUM | LOW | INFO
- `format`: json | csv
- `startDate`: ISO 8601 timestamp
- `endDate`: ISO 8601 timestamp
- `limit`: Number of results (max 1000)

### POST /api/threats/webhook
```bash
curl -X POST https://api.example.com/threats/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-webhook.com/endpoint",
    "events": ["threat_detected", "critical_only"],
    "secret": "webhook-secret"
  }'
```

### POST /siem/forward
```bash
# Handled by Lambda automatically
# No direct endpoint access needed
```

---

## 🔍 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| No notifications | Check `chrome.storage.local` settings, browser permissions |
| Modal not appearing | Verify `autoBlock: true`, content script injected |
| Export fails | Check popup console, ensure threats exist |
| AWS 500 error | Check Lambda logs, Bedrock permissions |
| Badge not updating | Clear extension, reload, check background worker |
| SIEM not receiving | Verify SSM parameters, Lambda IAM role |

---

**Quick Access:**
- Press extension icon → View all threats
- Right-click icon → Options (future feature)
- `Ctrl+Shift+T` → Open dashboard (future feature)

**Support:**
- GitHub Issues: https://github.com/TrueGuardianAI/PlugInn/issues
- Documentation: See IMPLEMENTATION-GUIDE.md
- AWS Support: Check CloudWatch logs
