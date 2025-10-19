// ============================================================================
// AWS LAMBDA FUNCTIONS FOR THREAT MONITOR INTEGRATION
// Deploy these functions to AWS Lambda for advanced workflow automation
// ============================================================================

/**
 * Lambda Function 1: Threat Analysis with AWS Bedrock/Nova
 * Endpoint: POST /Prod/AnalyzeOneLog
 *
 * This function analyzes network traffic using AWS Bedrock Claude models
 */

// lambda-threat-analysis.js
const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");

const client = new BedrockRuntimeClient({ region: "us-east-1" });

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

    // Extract the log summary from the request
    const messages = body.messages || [];
    const logContent = messages[0]?.content?.[0]?.text || '';

    // Prepare the prompt for threat analysis
    const threatAnalysisPrompt = `You are a cybersecurity expert analyzing network traffic for potential threats.

Analyze the following network request log and determine if it contains any security threats:

${logContent}

Provide your analysis in the following JSON format:
{
  "threatDetected": boolean,
  "confidence": number (0-1),
  "type": "XSS" | "SQLi" | "CSRF" | "DataExfil" | "Malware" | "Phishing" | "None",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
  "description": "Detailed explanation of the threat",
  "indicators": ["list", "of", "suspicious", "patterns"],
  "recommendation": "What action should be taken"
}

Focus on detecting:
- SQL injection attempts
- Cross-site scripting (XSS)
- Data exfiltration patterns
- Malware communication
- Phishing attempts
- Suspicious API calls
- Credential harvesting

Only respond with the JSON object, no additional text.`;

    // Call AWS Bedrock with Claude 3.5 Sonnet or Nova
    const modelId = "anthropic.claude-3-5-sonnet-20241022-v2:0"; // or "us.amazon.nova-pro-v1:0"

    const invokeModelCommand = new InvokeModelCommand({
      modelId: modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent security analysis
        messages: [
          {
            role: "user",
            content: threatAnalysisPrompt
          }
        ]
      })
    });

    const response = await client.send(invokeModelCommand);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the threat analysis from Claude's response
    let threatAnalysis;
    try {
      const analysisText = responseBody.content[0].text;

      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
                       analysisText.match(/(\{[\s\S]*\})/);

      if (jsonMatch) {
        threatAnalysis = JSON.parse(jsonMatch[1]);
      } else {
        threatAnalysis = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      threatAnalysis = {
        threatDetected: false,
        confidence: 0,
        type: "None",
        severity: "INFO",
        description: "Analysis failed - could not parse AI response",
        indicators: [],
        recommendation: "Manual review required"
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify(threatAnalysis)
    };

  } catch (error) {
    console.error("Error in threat analysis:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
        threatDetected: false
      })
    };
  }
};


// ============================================================================
// Lambda Function 2: Workflow Trigger with SNS/EventBridge
// Endpoint: POST /Prod/workflow
//
// This function triggers AWS workflows when threats are detected
// ============================================================================

// lambda-workflow-trigger.js
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");

const snsClient = new SNSClient({ region: "us-east-1" });
const eventBridgeClient = new EventBridgeClient({ region: "us-east-1" });

exports.handler = async (event) => {
  console.log("Workflow trigger event:", JSON.stringify(event, null, 2));

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { action, topicArn, threat } = body;

    if (action === 'trigger_workflow' && threat) {
      const results = {};

      // 1. Send SNS notification
      if (topicArn) {
        try {
          const snsCommand = new PublishCommand({
            TopicArn: topicArn,
            Subject: `🚨 ${threat.severity} Threat Detected`,
            Message: JSON.stringify({
              severity: threat.severity,
              type: threat.type,
              confidence: threat.confidence,
              url: threat.url,
              timestamp: threat.timestamp,
              id: threat.id
            }, null, 2),
            MessageAttributes: {
              severity: {
                DataType: 'String',
                StringValue: threat.severity
              },
              threat_type: {
                DataType: 'String',
                StringValue: threat.type
              }
            }
          });

          const snsResponse = await snsClient.send(snsCommand);
          results.sns = {
            success: true,
            messageId: snsResponse.MessageId
          };
        } catch (snsError) {
          console.error("SNS error:", snsError);
          results.sns = {
            success: false,
            error: snsError.message
          };
        }
      }

      // 2. Send EventBridge event for workflow automation
      try {
        const eventBridgeCommand = new PutEventsCommand({
          Entries: [
            {
              Source: 'threat-monitor.extension',
              DetailType: 'ThreatDetected',
              Detail: JSON.stringify({
                threatId: threat.id,
                severity: threat.severity,
                type: threat.type,
                confidence: threat.confidence,
                url: threat.url,
                timestamp: threat.timestamp,
                metadata: {
                  detectedBy: 'TrueGuardian Threat Monitor',
                  version: '2.0'
                }
              }),
              EventBusName: 'default'
            }
          ]
        });

        const eventBridgeResponse = await eventBridgeClient.send(eventBridgeCommand);
        results.eventBridge = {
          success: true,
          entries: eventBridgeResponse.Entries
        };
      } catch (eventBridgeError) {
        console.error("EventBridge error:", eventBridgeError);
        results.eventBridge = {
          success: false,
          error: eventBridgeError.message
        };
      }

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({
          success: true,
          message: "Workflow triggered successfully",
          results: results
        })
      };
    }

    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Invalid request - missing action or threat data"
      })
    };

  } catch (error) {
    console.error("Workflow trigger error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Workflow trigger failed",
        message: error.message
      })
    };
  }
};


// ============================================================================
// Lambda Function 3: SIEM Integration
// Endpoint: POST /Prod/siem/forward
//
// Forwards threat data to SIEM tools (Splunk, Datadog, etc.)
// ============================================================================

// lambda-siem-integration.js
const https = require('https');
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient({ region: "us-east-1" });

async function getSecretParameter(parameterName) {
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true
  });
  const response = await ssmClient.send(command);
  return response.Parameter.Value;
}

async function sendToSplunk(threat, hecToken, hecUrl) {
  const splunkEvent = {
    time: Date.now() / 1000,
    host: 'browser-extension',
    source: 'threat-monitor',
    sourcetype: 'threat_detection',
    event: {
      severity: threat.severity,
      threat_type: threat.type,
      confidence: threat.confidence,
      url: threat.url,
      timestamp: threat.timestamp,
      threat_id: threat.id,
      details: threat
    }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(splunkEvent);

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Splunk ${hecToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(hecUrl, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function sendToDatadog(threat, apiKey, appKey) {
  const datadogEvent = {
    title: `${threat.severity} Threat Detected`,
    text: `Threat type: ${threat.type}\nConfidence: ${threat.confidence}\nURL: ${threat.url}`,
    priority: threat.severity === 'CRITICAL' || threat.severity === 'HIGH' ? 'normal' : 'low',
    tags: [
      `severity:${threat.severity}`,
      `threat_type:${threat.type}`,
      'source:threat-monitor'
    ],
    alert_type: threat.severity === 'CRITICAL' ? 'error' : 'warning'
  };

  const ddUrl = `https://api.datadoghq.com/api/v1/events?api_key=${apiKey}`;

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(datadogEvent);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': apiKey,
        'DD-APPLICATION-KEY': appKey,
        'Content-Length': data.length
      }
    };

    const req = https.request(ddUrl, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log("SIEM integration event:", JSON.stringify(event, null, 2));

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { threat, siemType } = body; // siemType: 'splunk', 'datadog', 'elastic', etc.

    const results = {};

    // Get SIEM credentials from SSM Parameter Store
    if (siemType === 'splunk') {
      const hecToken = await getSecretParameter('/threat-monitor/splunk/hec-token');
      const hecUrl = await getSecretParameter('/threat-monitor/splunk/hec-url');
      results.splunk = await sendToSplunk(threat, hecToken, hecUrl);
    }

    if (siemType === 'datadog') {
      const apiKey = await getSecretParameter('/threat-monitor/datadog/api-key');
      const appKey = await getSecretParameter('/threat-monitor/datadog/app-key');
      results.datadog = await sendToDatadog(threat, apiKey, appKey);
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        success: true,
        message: "Threat forwarded to SIEM",
        results: results
      })
    };

  } catch (error) {
    console.error("SIEM integration error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "SIEM integration failed",
        message: error.message
      })
    };
  }
};


// ============================================================================
// package.json for Lambda functions
// ============================================================================

/*
{
  "name": "threat-monitor-lambda",
  "version": "2.0.0",
  "description": "AWS Lambda functions for ThreatMonitor extension",
  "dependencies": {
    "@aws-sdk/client-bedrock-runtime": "^3.x",
    "@aws-sdk/client-sns": "^3.x",
    "@aws-sdk/client-eventbridge": "^3.x",
    "@aws-sdk/client-ssm": "^3.x"
  }
}
*/

// ============================================================================
// SAM/CloudFormation Template
// ============================================================================

/*
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: ThreatMonitor Lambda Functions

Resources:
  ThreatAnalysisFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: ThreatMonitor-Analysis
      Handler: lambda-threat-analysis.handler
      Runtime: nodejs18.x
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          MODEL_ID: anthropic.claude-3-5-sonnet-20241022-v2:0
      Policies:
        - AmazonBedrockFullAccess
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /AnalyzeOneLog
            Method: post

  WorkflowTriggerFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: ThreatMonitor-Workflow
      Handler: lambda-workflow-trigger.handler
      Runtime: nodejs18.x
      Timeout: 15
      Policies:
        - SNSPublishMessagePolicy:
            TopicName: !Ref ThreatAlertTopic
        - EventBridgePutEventsPolicy:
            EventBusName: default
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /workflow
            Method: post

  SiemIntegrationFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: ThreatMonitor-SIEM
      Handler: lambda-siem-integration.handler
      Runtime: nodejs18.x
      Timeout: 20
      Policies:
        - SSMParameterReadPolicy:
            ParameterName: /threat-monitor/*
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /siem/forward
            Method: post

  ThreatAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: ThreatMonitor-Alerts
      DisplayName: Threat Monitor Alert Notifications

Outputs:
  ApiGatewayUrl:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/'

  SnsTopicArn:
    Description: SNS Topic ARN for threat alerts
    Value: !Ref ThreatAlertTopic
*/
