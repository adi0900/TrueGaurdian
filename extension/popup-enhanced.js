// ============================================================================
// THREAT MONITOR - Enhanced Popup Dashboard
// Features: Export to CSV/JSON, filtering, search, statistics
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("traffic-list");
  const clearBtn = document.getElementById("clear-button");
  const exportCsvBtn = document.getElementById("export-csv");
  const exportJsonBtn = document.getElementById("export-json");
  const filterSelect = document.getElementById("severity-filter");
  const searchInput = document.getElementById("search-input");
  const statsContainer = document.getElementById("stats-container");

  let allThreats = [];
  let filteredThreats = [];

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  function formatBody(body) {
    if (!body || body === 'N/A' || body === 'Could not decode') {
      return body || 'N/A';
    }

    if (typeof body === 'object') {
      try {
        const str = JSON.stringify(body, null, 2);
        return str.length > 200 ? str.substring(0, 200) + '...' : str;
      } catch (e) {
        return '[Object - could not serialize]';
      }
    }

    const bodyStr = String(body);
    if (bodyStr.includes('null,null') || bodyStr === '[object Object]') {
      return 'N/A';
    }

    return bodyStr.length > 200 ? bodyStr.substring(0, 200) + '...' : bodyStr;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

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

  function getSeverityBadge(severity) {
    const colors = {
      CRITICAL: '#ff0000',
      HIGH: '#ff6600',
      MEDIUM: '#ffaa00',
      LOW: '#ffdd00',
      INFO: '#00aaff'
    };

    const color = colors[severity] || '#999999';
    return `<span style="
      background: ${color};
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    ">${severity || 'UNKNOWN'}</span>`;
  }

  // ============================================================================
  // STATISTICS DISPLAY
  // ============================================================================

  function updateStatistics(threats) {
    const stats = {
      total: threats.length,
      critical: threats.filter(t => t.severity === 'CRITICAL').length,
      high: threats.filter(t => t.severity === 'HIGH').length,
      medium: threats.filter(t => t.severity === 'MEDIUM').length,
      low: threats.filter(t => t.severity === 'LOW').length,
      clean: threats.filter(t => !t.threat?.threatDetected).length
    };

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div style="font-size: 24px; font-weight: 700; color: #e0f2ff;">${stats.total}</div>
            <div style="font-size: 12px; color: rgba(224, 242, 255, 0.7);">Total Events</div>
          </div>
          <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div style="font-size: 24px; font-weight: 700; color: #ff0000;">${stats.critical}</div>
            <div style="font-size: 12px; color: rgba(224, 242, 255, 0.7);">Critical</div>
          </div>
          <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div style="font-size: 24px; font-weight: 700; color: #ff6600;">${stats.high}</div>
            <div style="font-size: 12px; color: rgba(224, 242, 255, 0.7);">High</div>
          </div>
          <div class="stat-card" style="flex: 1; min-width: 100px;">
            <div style="font-size: 24px; font-weight: 700; color: #66ff99;">${stats.clean}</div>
            <div style="font-size: 12px; color: rgba(224, 242, 255, 0.7);">Clean</div>
          </div>
        </div>
      `;
    }
  }

  // ============================================================================
  // FILTERING & SEARCH
  // ============================================================================

  function applyFilters() {
    const severityFilter = filterSelect?.value || 'all';
    const searchTerm = searchInput?.value.toLowerCase() || '';

    filteredThreats = allThreats.filter(threat => {
      // Severity filter
      if (severityFilter !== 'all' && threat.severity !== severityFilter) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchableText = [
          threat.request?.url,
          threat.request?.method,
          threat.threat?.type,
          threat.threat?.description
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    displayThreats(filteredThreats);
  }

  // ============================================================================
  // DISPLAY THREATS
  // ============================================================================

  function displayThreats(threats) {
    if (threats.length === 0) {
      list.innerHTML = '<div style="text-align: center; color: #e0f2ff; padding: 40px;">No threats match your filters</div>';
      return;
    }

    list.innerHTML = "";
    threats.forEach((threat) => {
      const div = document.createElement("div");
      div.className = "traffic-item";

      if (threat.threat?.threatDetected) div.classList.add("threat");
      if (threat.response?.aiAnalysis?.error) div.classList.add("error");

      const formattedBody = formatBody(threat.request?.body);
      const aiStatus = formatAiResponse(threat.response?.aiAnalysis || threat.aiResponse);
      const severityBadge = getSeverityBadge(threat.severity);

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <strong>${escapeHtml(threat.request?.method || 'UNKNOWN')}</strong>
          ${severityBadge}
        </div>
        <div style="font-size: 12px; word-break: break-all; margin-bottom: 4px;">
          ${escapeHtml(threat.request?.url || 'N/A')}
        </div>
        <b>Status:</b> ${escapeHtml(String(threat.response?.status || threat.status || 'N/A'))}<br>
        <b>Body:</b> ${escapeHtml(formattedBody)}<br>
        <b>Time:</b> ${escapeHtml(threat.timestamp ? new Date(threat.timestamp).toLocaleString() : 'N/A')}<br>
        <b>AI:</b> ${aiStatus}
        ${threat.threat?.description ? `<br><b>Details:</b> ${escapeHtml(threat.threat.description)}` : ''}
      `;

      list.appendChild(div);
    });
  }

  // ============================================================================
  // LOAD THREATS
  // ============================================================================

  function loadThreats() {
    chrome.runtime.sendMessage({ action: 'getThreats' }, (response) => {
      if (response && response.threats) {
        allThreats = response.threats;
      } else {
        // Fallback to legacy storage format
        chrome.storage.local.get(["responses", "threats"], (data) => {
          allThreats = data.threats || data.responses?.map(r => ({
            id: r.id || `legacy_${Date.now()}`,
            timestamp: r.timestamp,
            severity: r.severity || 'INFO',
            request: {
              method: r.method,
              url: r.url,
              body: r.body
            },
            response: {
              status: r.status,
              aiAnalysis: r.aiResponse
            },
            threat: {
              threatDetected: r.aiResponse?.threatDetected,
              type: r.aiResponse?.type,
              confidence: r.aiResponse?.confidence
            }
          })) || [];

          updateView();
        });
        return;
      }

      updateView();
    });
  }

  function updateView() {
    updateStatistics(allThreats);
    applyFilters();
  }

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  function exportToCSV() {
    if (filteredThreats.length === 0) {
      alert('No threats to export');
      return;
    }

    const headers = [
      'Timestamp',
      'Severity',
      'Threat Type',
      'Confidence',
      'Method',
      'URL',
      'Status',
      'Body',
      'Description'
    ];

    const rows = filteredThreats.map(threat => [
      threat.timestamp || '',
      threat.severity || '',
      threat.threat?.type || '',
      threat.threat?.confidence || '',
      threat.request?.method || '',
      threat.request?.url || '',
      threat.response?.status || '',
      JSON.stringify(threat.request?.body || '').replace(/"/g, '""'),
      threat.threat?.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, `threat-monitor-${new Date().toISOString()}.csv`, 'text/csv');
  }

  function exportToJSON() {
    if (filteredThreats.length === 0) {
      alert('No threats to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalThreats: filteredThreats.length,
      threats: filteredThreats
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `threat-monitor-${new Date().toISOString()}.json`, 'application/json');
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

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm('Are you sure you want to clear all threat logs?')) {
        chrome.runtime.sendMessage({ action: 'clearThreats' }, () => {
          allThreats = [];
          filteredThreats = [];
          updateView();
        });
      }
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', exportToJSON);
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', applyFilters);
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  loadThreats();

  // Auto-refresh every 5 seconds
  setInterval(loadThreats, 5000);
});
