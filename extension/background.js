const ENDPOINT_URL = 'https://li9e1bovvb.execute-api.us-east-1.amazonaws.com/Prod/AnalyzeOneLog';

// Domains to exclude (add more as needed)
const EXCLUDED_DOMAINS = [
  'mixpanel.com', 'doubleclick.net', 'statsig', 'grok.com', 'quantserve.com',
  'amazonadsystem.com', 'clients6.google.com', 'accounts.google.com',
  'amazon.in/nav/ajax', 'unagi.amazon.in', 'aax-eu-zaz.amazon.in',
  'adservice.google.com', 'fbcdn.net', 'facebook.com', 'twitter.com',
  'linkedin.com', 'bing.com'
];

// Helper to check if request should be skipped
function shouldExclude(url) {
  return EXCLUDED_DOMAINS.some(domain => url.includes(domain));
}

/**
 * Safely parses and formats request body data
 * Handles form data, raw bytes, and various encoding issues
 */
function parseRequestBody(requestBody) {
  if (!requestBody) {
    return 'N/A';
  }

  // Handle form data
  if (requestBody.formData) {
    try {
      const formDataObj = {};
      for (const [key, value] of Object.entries(requestBody.formData)) {
        // Filter out null/undefined values
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

  // Handle raw request body
  if (requestBody.raw && requestBody.raw[0]) {
    try {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const decodedText = decoder.decode(requestBody.raw[0].bytes);

      if (!decodedText || decodedText.trim() === '') {
        return 'N/A';
      }

      // Try to parse as JSON
      try {
        const parsed = JSON.parse(decodedText);
        return JSON.stringify(parsed);
      } catch {
        // Not JSON, return as string (truncate if too long)
        return decodedText.length > 500 ? decodedText.substring(0, 500) + '...' : decodedText;
      }
    } catch (e) {
      console.error('ThreatMonitor: Error decoding request body:', e);
      return 'Could not decode body';
    }
  }

  return 'N/A';
}

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
          content: [
            { text: logSummary }
          ]
        }
      ]
    };

    // Debug logging before fetch
    console.log('ThreatMonitor sending to AWS endpoint:', ENDPOINT_URL);

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

          // Attempt to parse JSON response
          if (responseText && responseText.trim()) {
            aiResponse = JSON.parse(responseText);
          } else {
            aiResponse = { error: 'Empty response from AI endpoint' };
            console.warn('ThreatMonitor: Empty response received');
          }
        } catch (parseError) {
          aiResponse = { error: 'Invalid JSON response from AI endpoint' };
          console.error('ThreatMonitor: Failed to parse AI response:', parseError);
        }
      } else {
        // Provide detailed error messages based on status code
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

        const errorMsg = errorMessages[status] || `HTTP ${status} error`;
        aiResponse = { error: errorMsg };
        console.error(`ThreatMonitor: API error ${status}`);
      }

      // Store the log entry
      chrome.storage.local.get({responses: []}, (data) => {
        data.responses.push({
          url: details.url,
          method: details.method,
          body: requestBody,
          timestamp: new Date().toLocaleTimeString(),
          status,
          aiResponse
        });
        chrome.storage.local.set({responses: data.responses.slice(-20)});
      });

    } catch (error) {
      // Network errors, CORS issues, or other fetch failures
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

      chrome.storage.local.get({responses: []}, (data) => {
        data.responses.push({
          url: details.url,
          method: details.method,
          body: requestBody,
          timestamp: new Date().toLocaleTimeString(),
          status: 0, // 0 indicates network failure
          aiResponse: { error: errorMessage }
        });
        chrome.storage.local.set({responses: data.responses.slice(-20)});
      });
    }
  },
  { urls: ['<all_urls>'] },
  ['requestBody']
);
