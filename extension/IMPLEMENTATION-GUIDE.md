# TrueGuardian Threat Monitor - Implementation Guide

## 🚀 Features Overview

### Feature 1: Real-Time Notification System
- ✅ Browser push notifications for detected threats
- ✅ Extension badge updates with threat count
- ✅ Automatic warning modals for critical threats
- ✅ Audio alerts for high-severity events
- ✅ AWS Bedrock/Nova integration for real-time alerting
- ✅ SNS/EventBridge workflow triggers

### Feature 2: Threat Data Export & API Integration
- ✅ Export to CSV format for compliance reporting
- ✅ Export to JSON for data analysis
- ✅ SIEM integration (Splunk, Datadog, ElasticSearch)
- ✅ Webhook support for custom integrations
- ✅ API endpoints for enterprise logging

---

## 📋 Step-by-Step Implementation Plan

### Phase 1: Local Extension Setup

#### Step 1.1: Replace Extension Files
```bash
# Backup current files
cp extension/background.js extension/background-original.js
cp extension/popup.js extension/popup-original.js
cp extension/content.js extension/content-original.js
cp extension/popup.html extension/popup-original.html
cp extension/manifest.json extension/manifest-original.json

# Replace with enhanced versions
mv extension/background-enhanced.js extension/background.js
mv extension/popup-enhanced.js extension/popup.js
mv extension/content-enhanced.js extension/content.js
mv extension/popup-enhanced.html extension/popup.html
mv extension/manifest-enhanced.json extension/manifest.json
```

#### Step 1.2: Create Icon Assets
Create the following icon files in `extension/icons/`:
- `icon-16.png` - 16x16 px
- `icon-32.png` - 32x32 px
- `icon-48.png` - 48x48 px
- `icon-128.png` - 128x128 px

Use your shield emoji 🛡️ or a custom security icon.

#### Step 1.3: Load Extension in Browser
1. Open Chrome/Edge: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` folder
5. Pin the extension to toolbar

---

### Phase 2: AWS Backend Setup

#### Step 2.1: Deploy Lambda Functions

**Prerequisites:**
- AWS Account with Bedrock access
- AWS CLI configured
- SAM CLI installed (`npm install -g aws-sam-cli`)

**Deploy Threat Analysis Function:**
```bash
cd extension

# Create Lambda deployment package
npm init -y
npm install @aws-sdk/client-bedrock-runtime

# Create deployment.zip
zip -r deployment.zip lambda-threat-analysis.js node_modules/

# Deploy via AWS CLI
aws lambda create-function \
  --function-name ThreatMonitor-Analysis \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler lambda-threat-analysis.handler \
  --zip-file fileb://deployment.zip \
  --timeout 30 \
  --memory-size 512
```

**Or use SAM (recommended):**
```bash
# Initialize SAM project
sam init

# Copy the CloudFormation template from aws-lambda-examples.js
# Save as template.yaml

# Build and deploy
sam build
sam deploy --guided
```

#### Step 2.2: Configure API Gateway

```bash
# Get your API Gateway URL after SAM deployment
aws cloudformation describe-stacks \
  --stack-name ThreatMonitor \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text
```

Update `background.js` with your API Gateway URL:
```javascript
const ENDPOINT_URL = 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/Prod/AnalyzeOneLog';
```

#### Step 2.3: Enable Bedrock Model Access

```bash
# Request access to Claude 3.5 Sonnet in AWS Console
# Or use AWS CLI
aws bedrock put-model-invocation-logging-configuration \
  --region us-east-1 \
  --logging-config '{
    "cloudWatchConfig": {
      "logGroupName": "/aws/bedrock/threat-monitor",
      "roleArn": "arn:aws:iam::YOUR_ACCOUNT:role/bedrock-logging-role"
    }
  }'
```

---

### Phase 3: Notification Configuration

#### Step 3.1: Configure Extension Settings

In `background-enhanced.js`, set your preferences:

```javascript
// Configure notification thresholds
const THREAT_LEVELS = {
  CRITICAL: { min: 0.9, color: '#FF0000', priority: 1 },
  HIGH: { min: 0.7, color: '#FF6600', priority: 2 },
  MEDIUM: { min: 0.5, color: '#FFAA00', priority: 3 },
  LOW: { min: 0.3, color: '#FFDD00', priority: 4 },
  INFO: { min: 0, color: '#00AAFF', priority: 5 }
};
```

#### Step 3.2: Test Notifications

Open popup → Settings (future feature) or modify storage:
```javascript
chrome.storage.local.set({
  notificationsEnabled: true,
  notifyLowSeverity: false,
  soundEnabled: true,
  autoBlock: true,  // Show modal for high/critical threats
  webhookEnabled: false,
  siemEnabled: false
});
```

Test by visiting a test page with suspicious requests.

---

### Phase 4: AWS Workflow Integration

#### Step 4.1: Create SNS Topic

```bash
# Create SNS topic for alerts
aws sns create-topic --name ThreatMonitor-Alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT:ThreatMonitor-Alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

#### Step 4.2: Configure EventBridge Rules

Create EventBridge rule to trigger workflows:

```bash
# Create rule for critical threats
aws events put-rule \
  --name ThreatMonitor-Critical-Threats \
  --event-pattern '{
    "source": ["threat-monitor.extension"],
    "detail-type": ["ThreatDetected"],
    "detail": {
      "severity": ["CRITICAL"]
    }
  }'

# Add Lambda target (e.g., auto-block, send to security team)
aws events put-targets \
  --rule ThreatMonitor-Critical-Threats \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:SecurityResponse"
```

#### Step 4.3: Update Extension with SNS Topic ARN

In `background-enhanced.js`:
```javascript
const AWS_SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:YOUR_ACCOUNT:ThreatMonitor-Alerts';
```

---

### Phase 5: SIEM Integration

#### Step 5.1: Splunk HEC Setup

**In Splunk:**
1. Settings → Data Inputs → HTTP Event Collector
2. Create new token: "ThreatMonitor"
3. Note the HEC URL and token

**In AWS SSM Parameter Store:**
```bash
aws ssm put-parameter \
  --name /threat-monitor/splunk/hec-token \
  --value "YOUR_SPLUNK_HEC_TOKEN" \
  --type SecureString

aws ssm put-parameter \
  --name /threat-monitor/splunk/hec-url \
  --value "https://splunk.example.com:8088/services/collector" \
  --type SecureString
```

**Enable in Extension:**
```javascript
chrome.storage.local.set({ siemEnabled: true });
const SIEM_API_URL = 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/Prod/siem/forward';
```

#### Step 5.2: Datadog Integration

```bash
# Store Datadog credentials
aws ssm put-parameter \
  --name /threat-monitor/datadog/api-key \
  --value "YOUR_DATADOG_API_KEY" \
  --type SecureString

aws ssm put-parameter \
  --name /threat-monitor/datadog/app-key \
  --value "YOUR_DATADOG_APP_KEY" \
  --type SecureString
```

---

### Phase 6: Export Functionality

#### Step 6.1: Test CSV Export

1. Open extension popup
2. Generate some threat events (browse suspicious sites)
3. Click "📊 Export CSV"
4. Verify CSV file downloads with correct format

**CSV Format:**
```csv
Timestamp,Severity,Threat Type,Confidence,Method,URL,Status,Body,Description
2025-10-20T01:17:00.000Z,HIGH,XSS,0.85,POST,https://example.com,200,"payload",Detected XSS attempt
```

#### Step 6.2: Test JSON Export

1. Click "📦 Export JSON"
2. Verify JSON structure:

```json
{
  "exportedAt": "2025-10-20T01:17:00.000Z",
  "totalThreats": 10,
  "threats": [
    {
      "id": "threat_1729388220000_abc123",
      "timestamp": "2025-10-20T01:17:00.000Z",
      "severity": "HIGH",
      "threat": {
        "type": "XSS",
        "confidence": 0.85,
        "threatDetected": true
      },
      "request": {
        "method": "POST",
        "url": "https://example.com",
        "body": "payload"
      }
    }
  ]
}
```

#### Step 6.3: API Integration for External Tools

**Create API Endpoint for Exports:**

Add to your API Gateway:
```yaml
/api/threats/export:
  get:
    parameters:
      - name: startDate
      - name: endDate
      - name: severity
    responses:
      200:
        description: Threat export
        content:
          application/json
```

**Query from External Tools:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://YOUR_API.execute-api.us-east-1.amazonaws.com/Prod/api/threats/export?severity=CRITICAL&startDate=2025-10-01"
```

---

## 🎨 Libraries & Services Used

### Browser Extension APIs
- **Chrome Notifications API**: `chrome.notifications.create()`
- **Chrome Storage API**: `chrome.storage.local`
- **Chrome Action API**: `chrome.action.setBadgeText()`
- **Chrome WebRequest API**: `chrome.webRequest.onBeforeRequest`
- **Chrome Tabs API**: `chrome.tabs.sendMessage()`

### AWS Services
- **AWS Bedrock**: Claude 3.5 Sonnet for AI threat analysis
- **AWS Lambda**: Serverless compute for analysis functions
- **AWS API Gateway**: REST API endpoints
- **AWS SNS**: Push notifications for alerts
- **AWS EventBridge**: Event-driven workflow automation
- **AWS SSM Parameter Store**: Secure credential storage

### JavaScript Libraries
- **@aws-sdk/client-bedrock-runtime**: Bedrock API client
- **@aws-sdk/client-sns**: SNS client for notifications
- **@aws-sdk/client-eventbridge**: EventBridge client
- **@aws-sdk/client-ssm**: SSM Parameter Store access

---

## 📊 Data Flow Architecture

```
┌─────────────┐
│   Browser   │
│  Extension  │
└──────┬──────┘
       │ 1. Intercept Request
       ▼
┌─────────────┐
│ background  │
│  .js        │──────┐
└──────┬──────┘      │ 2. Send to AI
       │             ▼
       │      ┌──────────────┐
       │      │ AWS Bedrock  │
       │      │   Claude     │
       │      └──────┬───────┘
       │             │ 3. Threat Analysis
       │             ▼
       │      ┌──────────────┐
       │      │  AI Response │
       │◄─────┤  Confidence  │
       │      │  Severity    │
       │      └──────────────┘
       │
       ├──4a. Show Notification
       │   (chrome.notifications)
       │
       ├──4b. Update Badge
       │   (chrome.action.setBadge)
       │
       ├──4c. Trigger Modal
       │   (chrome.tabs.sendMessage)
       │
       ├──4d. Send to Webhook
       │   (fetch WEBHOOK_URL)
       │
       ├──4e. Forward to SIEM
       │   (Lambda → Splunk/Datadog)
       │
       └──4f. Trigger AWS Workflow
           (SNS → EventBridge → Lambda)
```

---

## 🔐 Security Best Practices

1. **API Key Management**
   - Store all API keys in AWS SSM Parameter Store
   - Use IAM roles with least privilege
   - Rotate credentials regularly

2. **Data Privacy**
   - Don't log sensitive user data
   - Sanitize URLs before sending to AI
   - Implement data retention policies

3. **Extension Permissions**
   - Request only necessary permissions
   - Explain permission usage to users
   - Implement CSP headers

4. **CORS Configuration**
   ```javascript
   headers: {
     "Access-Control-Allow-Origin": "chrome-extension://YOUR_EXTENSION_ID",
     "Access-Control-Allow-Methods": "POST, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type"
   }
   ```

---

## 🧪 Testing Checklist

- [ ] Notifications appear for threats
- [ ] Badge counter increments correctly
- [ ] Modal displays for critical threats
- [ ] CSV export downloads properly
- [ ] JSON export has correct structure
- [ ] Search and filter work in popup
- [ ] AWS Lambda receives requests
- [ ] Bedrock returns threat analysis
- [ ] SNS notifications are sent
- [ ] EventBridge events trigger
- [ ] SIEM receives threat data
- [ ] Webhook posts successfully

---

## 📈 Monitoring & Debugging

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/ThreatMonitor-Analysis --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs_YOUR_API_ID/Prod --follow
```

### Extension Console
```javascript
// In background service worker console
chrome.storage.local.get(['threats', 'responses'], console.log);

// Test notification manually
chrome.notifications.create('test', {
  type: 'basic',
  iconUrl: 'icons/icon-128.png',
  title: 'Test Notification',
  message: 'Testing threat monitor notifications'
});
```

### Bedrock Monitoring
```bash
# Check model invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --dimensions Name=ModelId,Value=anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --start-time 2025-10-20T00:00:00Z \
  --end-time 2025-10-20T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

## 🚀 Deployment Checklist

- [ ] Icons created (16, 32, 48, 128 px)
- [ ] Extension files updated
- [ ] Lambda functions deployed
- [ ] API Gateway configured
- [ ] Bedrock model access enabled
- [ ] SNS topic created
- [ ] EventBridge rules configured
- [ ] SIEM credentials stored in SSM
- [ ] Extension tested in browser
- [ ] Notifications working
- [ ] Export functionality tested
- [ ] Documentation updated

---

## 📚 Additional Resources

- [Chrome Extension Notifications API](https://developer.chrome.com/docs/extensions/reference/notifications/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Splunk HEC Documentation](https://docs.splunk.com/Documentation/Splunk/latest/Data/UsetheHTTPEventCollector)
- [Datadog API Reference](https://docs.datadoghq.com/api/latest/)

---

## 🎯 Next Steps

1. **Create Settings Page**: Add `settings.html` for user configuration
2. **Add Dashboard Metrics**: Real-time statistics and charts
3. **Implement Auto-Block**: Automatically block malicious requests
4. **Add Machine Learning**: Train custom threat detection models
5. **Build Mobile App**: React Native companion app
6. **Create Admin Panel**: Web dashboard for enterprise users

---

**Version:** 2.0.0
**Last Updated:** 2025-10-20
**Author:** TrueGuardian AI Team
