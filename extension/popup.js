document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("traffic-list");
  const clearBtn = document.getElementById("clear-button");

  /**
   * Safely formats the request body for display
   * Handles various data types and prevents null/undefined display issues
   */
  function formatBody(body) {
    if (!body || body === 'N/A' || body === 'Could not decode') {
      return body || 'N/A';
    }

    // Handle objects and arrays
    if (typeof body === 'object') {
      try {
        const str = JSON.stringify(body, null, 2);
        // Truncate if too long
        return str.length > 200 ? str.substring(0, 200) + '...' : str;
      } catch (e) {
        return '[Object - could not serialize]';
      }
    }

    // Handle strings
    const bodyStr = String(body);

    // Check for malformed JSON strings like "[null,null,...]"
    if (bodyStr.includes('null,null') || bodyStr === '[object Object]') {
      return 'N/A';
    }

    // Truncate long strings
    return bodyStr.length > 200 ? bodyStr.substring(0, 200) + '...' : bodyStr;
  }

  /**
   * Safely escapes HTML to prevent XSS and display issues
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Formats AI response into a user-friendly message
   */
  function formatAiResponse(aiResponse) {
    if (!aiResponse) {
      return '<span style="color: #ffcc00;">⚠ Analysis pending</span>';
    }

    if (aiResponse.error) {
      const errorMsg = aiResponse.error.includes('Endpoint error')
        ? 'API unavailable - Check AWS Lambda endpoint'
        : `Analysis failed: ${aiResponse.error}`;
      return `<span style="color: #ff6666;">❌ ${escapeHtml(errorMsg)}</span>`;
    }

    if (aiResponse.threatDetected) {
      const confidence = Math.round(aiResponse.confidence * 100);
      const type = aiResponse.type || 'Unknown';
      return `<span style="color: #ff3366;">🚨 Threat: ${escapeHtml(type)} (${confidence}% confidence)</span>`;
    }

    return '<span style="color: #66ff99;">✓ Clean - No threats detected</span>';
  }

  function loadLogs() {
    chrome.storage.local.get(["responses"], (data) => {
      const responses = data.responses || [];

      if (responses.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #e0f2ff; padding: 40px;">No requests logged yet</div>';
        return;
      }

      list.innerHTML = "";
      responses.forEach((res) => {
        const div = document.createElement("div");
        div.className = "traffic-item";

        // Apply styling based on threat status
        if (res.aiResponse?.threatDetected) div.classList.add("threat");
        if (res.aiResponse?.error) div.classList.add("error");

        const formattedBody = formatBody(res.body);
        const aiStatus = formatAiResponse(res.aiResponse);

        div.innerHTML = `
          <strong>${escapeHtml(res.method || 'UNKNOWN')}</strong> ${escapeHtml(res.url || 'N/A')}<br>
          <b>Status:</b> ${escapeHtml(String(res.status || 'N/A'))}<br>
          <b>Body:</b> ${escapeHtml(formattedBody)}<br>
          <b>Time:</b> ${escapeHtml(res.timestamp || 'N/A')}<br>
          <b>AI:</b> ${aiStatus}
        `;

        list.appendChild(div);
      });
    });
  }

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  function exportToCSV() {
    chrome.storage.local.get(["responses"], (data) => {
      const threats = data.responses || [];

      if (threats.length === 0) {
        alert('No threats to export');
        return;
      }

      const headers = [
        'Timestamp',
        'Method',
        'URL',
        'Status',
        'Threat Type',
        'Confidence',
        'AI Status',
        'Body'
      ];

      const rows = threats.map(threat => [
        threat.timestamp || '',
        threat.method || '',
        threat.url || '',
        threat.status || '',
        threat.aiResponse?.type || '',
        threat.aiResponse?.confidence || '',
        threat.aiResponse?.threatDetected ? 'THREAT' : 'CLEAN',
        JSON.stringify(threat.body || '').replace(/"/g, '""')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      downloadFile(csvContent, `threat-monitor-${new Date().toISOString()}.csv`, 'text/csv');
    });
  }

  function exportToJSON() {
    chrome.storage.local.get(["responses"], (data) => {
      const threats = data.responses || [];

      if (threats.length === 0) {
        alert('No threats to export');
        return;
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        totalThreats: threats.length,
        threats: threats
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      downloadFile(jsonContent, `threat-monitor-${new Date().toISOString()}.json`, 'application/json');
    });
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  clearBtn.addEventListener("click", () => {
    if (confirm('Are you sure you want to clear all threat logs?')) {
      chrome.storage.local.set({ responses: [] }, loadLogs);
    }
  });

  const exportCsvBtn = document.getElementById("export-csv");
  const exportJsonBtn = document.getElementById("export-json");

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", exportToCSV);
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", exportToJSON);
  }

  loadLogs();

  // Auto-refresh every 3 seconds to show new logs
  setInterval(loadLogs, 3000);
});
