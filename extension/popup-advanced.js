// ============================================================================
// THREAT MONITOR - Advanced Popup Dashboard
// Features: Chart.js visualizations, grouping, filtering, enhanced exports
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  let allThreats = [];
  let filteredThreats = [];
  let currentGrouping = 'none';

  // Chart instances
  let domainChart, resourceChart, timelineChart, severityChart;

  // ============================================================================
  // TAB SWITCHING
  // ============================================================================

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;

      // Update active tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');

      // Load tab-specific data
      if (tabName === 'analysis') {
        loadAnalysisData();
      }
    });
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  function loadThreats() {
    chrome.runtime.sendMessage({ action: 'getGroupedThreats' }, (response) => {
      if (response && response.threats) {
        allThreats = response.threats;
        updateStatistics();
        updateCharts();
        applyFilters();
      }
    });
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  function updateStatistics() {
    const totalRequests = allThreats.length;
    const threats = allThreats.filter(t => t.threat?.threatDetected);
    const criticalThreats = threats.filter(t => t.severity === 'CRITICAL');
    const uniqueDomains = new Set(allThreats.map(t => t.context?.resource?.domain)).size;

    document.getElementById('total-requests').textContent = totalRequests;
    document.getElementById('total-threats').textContent = threats.length;
    document.getElementById('critical-threats').textContent = criticalThreats.length;
    document.getElementById('unique-domains').textContent = uniqueDomains;
  }

  // ============================================================================
  // CHART.JS VISUALIZATIONS
  // ============================================================================

  function updateCharts() {
    updateDomainChart();
    updateResourceChart();
    updateTimelineChart();
    updateSeverityChart();
  }

  function updateDomainChart() {
    const domainCounts = {};
    allThreats.forEach(threat => {
      if (threat.threat?.threatDetected) {
        const domain = threat.context?.resource?.domain || 'unknown';
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    });

    // Top 10 domains
    const sorted = Object.entries(domainCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const labels = sorted.map(([domain]) => domain.length > 25 ? domain.substring(0, 25) + '...' : domain);
    const data = sorted.map(([, count]) => count);

    if (domainChart) domainChart.destroy();

    const ctx = document.getElementById('domain-chart');
    domainChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Threats',
          data: data,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#e0f2ff', stepSize: 1 },
            grid: { color: 'rgba(0, 153, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#e0f2ff', maxRotation: 45, minRotation: 45 },
            grid: { color: 'rgba(0, 153, 255, 0.1)' }
          }
        }
      }
    });
  }

  function updateResourceChart() {
    const typeCounts = {};
    allThreats.forEach(threat => {
      const type = threat.context?.resource?.type || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const labels = Object.keys(typeCounts);
    const data = Object.values(typeCounts);
    const colors = [
      'rgba(255, 99, 132, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)'
    ];

    if (resourceChart) resourceChart.destroy();

    const ctx = document.getElementById('resource-chart');
    resourceChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#001a33',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#e0f2ff', font: { size: 10 } }
          }
        }
      }
    });
  }

  function updateTimelineChart() {
    // Group by hour for last 24 hours
    const hourCounts = new Array(24).fill(0);
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    allThreats.forEach(threat => {
      if (threat.threat?.threatDetected) {
        const timestamp = new Date(threat.timestamp).getTime();
        if (timestamp > oneDayAgo) {
          const hoursAgo = Math.floor((now - timestamp) / (60 * 60 * 1000));
          if (hoursAgo < 24) {
            hourCounts[23 - hoursAgo]++;
          }
        }
      }
    });

    const labels = Array.from({ length: 24 }, (_, i) => `${i}h ago`).reverse();

    if (timelineChart) timelineChart.destroy();

    const ctx = document.getElementById('timeline-chart');
    timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Threats',
          data: hourCounts,
          borderColor: 'rgba(102, 126, 234, 1)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#e0f2ff', stepSize: 1 },
            grid: { color: 'rgba(0, 153, 255, 0.1)' }
          },
          x: {
            ticks: {
              color: '#e0f2ff',
              maxRotation: 0,
              callback: (value, index) => index % 4 === 0 ? labels[index] : ''
            },
            grid: { color: 'rgba(0, 153, 255, 0.1)' }
          }
        }
      }
    });
  }

  function updateSeverityChart() {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
    const counts = severities.map(sev =>
      allThreats.filter(t => t.severity === sev).length
    );

    const colors = ['#ff0000', '#ff6600', '#ffaa00', '#ffdd00', '#00aaff'];

    if (severityChart) severityChart.destroy();

    const ctx = document.getElementById('severity-chart');
    severityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: severities,
        datasets: [{
          label: 'Count',
          data: counts,
          backgroundColor: colors.map(c => c + 'aa'),
          borderColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#e0f2ff', stepSize: 1 },
            grid: { color: 'rgba(0, 153, 255, 0.1)' }
          },
          x: {
            ticks: { color: '#e0f2ff' },
            grid: { color: 'rgba(0, 153, 255, 0.1)' }
          }
        }
      }
    });
  }

  // ============================================================================
  // FILTERING & GROUPING
  // ============================================================================

  function applyFilters() {
    const severityFilter = document.getElementById('severity-filter')?.value || 'all';
    const resourceFilter = document.getElementById('resource-filter')?.value || 'all';
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';

    filteredThreats = allThreats.filter(threat => {
      // Severity filter
      if (severityFilter !== 'all' && threat.severity !== severityFilter) return false;

      // Resource filter
      if (resourceFilter !== 'all' && threat.context?.resource?.type !== resourceFilter) return false;

      // Search filter
      if (searchTerm) {
        const searchable = [
          threat.request?.url,
          threat.context?.resource?.domain,
          threat.context?.tab?.title,
          threat.threat?.type
        ].join(' ').toLowerCase();

        if (!searchable.includes(searchTerm)) return false;
      }

      return true;
    });

    displayThreats();
  }

  function displayThreats() {
    const list = document.getElementById('threat-list');

    if (filteredThreats.length === 0) {
      list.innerHTML = '<div class="loading">No threats match your filters</div>';
      return;
    }

    if (currentGrouping === 'none') {
      displayFlat(list);
    } else {
      displayGrouped(list);
    }
  }

  function displayFlat(list) {
    list.innerHTML = '';
    filteredThreats.forEach(threat => {
      list.appendChild(createThreatElement(threat));
    });
  }

  function displayGrouped(list) {
    const groups = {};

    filteredThreats.forEach(threat => {
      let key;

      switch (currentGrouping) {
        case 'domain':
          key = threat.context?.resource?.domain || 'Unknown';
          break;
        case 'tab':
          key = `${threat.context?.tab?.title || 'Unknown'} (Tab ${threat.context?.tab?.id})`;
          break;
        case 'type':
          key = threat.context?.resource?.type || 'Unknown';
          break;
        case 'severity':
          key = threat.severity || 'Unknown';
          break;
        default:
          key = 'Ungrouped';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(threat);
    });

    list.innerHTML = '';

    Object.entries(groups).forEach(([groupName, threats]) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'threat-group';

      const header = document.createElement('div');
      header.className = 'group-header';
      header.innerHTML = `
        <span>${escapeHtml(groupName)}</span>
        <span class="group-count">${threats.length}</span>
      `;

      const items = document.createElement('div');
      items.className = 'group-items';
      items.style.display = 'block';

      threats.forEach(threat => {
        items.appendChild(createThreatElement(threat));
      });

      // Toggle collapse
      header.addEventListener('click', () => {
        items.style.display = items.style.display === 'none' ? 'block' : 'none';
      });

      groupDiv.appendChild(header);
      groupDiv.appendChild(items);
      list.appendChild(groupDiv);
    });
  }

  function createThreatElement(threat) {
    const div = document.createElement('div');
    div.className = 'threat-item';

    if (threat.threat?.threatDetected) div.classList.add('threat');
    if (threat.response?.aiAnalysis?.error) div.classList.add('error');

    const severityColor = {
      CRITICAL: '#ff0000',
      HIGH: '#ff6600',
      MEDIUM: '#ffaa00',
      LOW: '#ffdd00',
      INFO: '#00aaff'
    }[threat.severity] || '#999';

    div.innerHTML = `
      <div class="threat-header">
        <span><strong>${escapeHtml(threat.request?.method || 'GET')}</strong> ${escapeHtml(threat.context?.resource?.type || 'Unknown')}</span>
        <span class="severity-badge" style="background: ${severityColor};">${escapeHtml(threat.severity || 'INFO')}</span>
      </div>
      <div><b>Domain:</b> ${escapeHtml(threat.context?.resource?.domain || 'N/A')}</div>
      <div><b>URL:</b> ${escapeHtml(truncate(threat.request?.url || 'N/A', 60))}</div>
      <div><b>Tab:</b> ${escapeHtml(truncate(threat.context?.tab?.title || 'N/A', 40))}</div>
      <div><b>Time:</b> ${escapeHtml(new Date(threat.timestamp).toLocaleString())}</div>
      ${threat.threat?.threatDetected ? `<div><b>Threat:</b> ${escapeHtml(threat.threat.type)} (${Math.round(threat.threat.confidence * 100)}%)</div>` : ''}
    `;

    return div;
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
      'Timestamp', 'Severity', 'Threat Type', 'Confidence',
      'Method', 'URL', 'Domain', 'Resource Type',
      'Tab ID', 'Tab Title', 'Session ID',
      'User ID', 'Browser', 'OS',
      'Status', 'Body'
    ];

    const rows = filteredThreats.map(t => [
      t.timestamp,
      t.severity,
      t.threat?.type || '',
      t.threat?.confidence || '',
      t.request?.method,
      t.request?.url,
      t.context?.resource?.domain,
      t.context?.resource?.type,
      t.context?.tab?.id,
      t.context?.tab?.title,
      t.context?.session?.id,
      t.context?.user?.id,
      t.context?.device?.browser?.name,
      t.context?.device?.os,
      t.response?.status,
      JSON.stringify(t.request?.body || '').replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, `threats-${Date.now()}.csv`, 'text/csv');
  }

  function exportToJSON() {
    if (filteredThreats.length === 0) {
      alert('No threats to export');
      return;
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalThreats: filteredThreats.length,
      groupedBy: currentGrouping,
      filters: {
        severity: document.getElementById('severity-filter')?.value,
        resourceType: document.getElementById('resource-filter')?.value,
        search: document.getElementById('search-input')?.value
      },
      threats: filteredThreats
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `threats-${Date.now()}.json`, 'application/json');
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
  // ANALYSIS TAB
  // ============================================================================

  function loadAnalysisData() {
    const container = document.getElementById('analysis-content');

    const stats = {
      topDomains: getTopDomains(5),
      topTypes: getTopResourceTypes(5),
      sessionStats: getSessionStats(),
      deviceStats: getDeviceStats()
    };

    container.innerHTML = `
      <div style="padding: 16px;">
        <h3>Top Threat Domains</h3>
        <div style="margin: 12px 0;">
          ${stats.topDomains.map(([domain, count]) => `
            <div style="padding: 8px; background: rgba(0, 102, 204, 0.15); margin: 4px 0; border-radius: 6px; display: flex; justify-content: space-between;">
              <span>${escapeHtml(domain)}</span>
              <span style="background: rgba(255, 0, 0, 0.3); padding: 2px 8px; border-radius: 4px;">${count}</span>
            </div>
          `).join('')}
        </div>

        <h3>Resource Type Distribution</h3>
        <div style="margin: 12px 0;">
          ${stats.topTypes.map(([type, count]) => `
            <div style="padding: 8px; background: rgba(0, 102, 204, 0.15); margin: 4px 0; border-radius: 6px; display: flex; justify-content: space-between;">
              <span>${escapeHtml(type)}</span>
              <span style="background: rgba(0, 153, 255, 0.3); padding: 2px 8px; border-radius: 4px;">${count}</span>
            </div>
          `).join('')}
        </div>

        <h3>Session Statistics</h3>
        <div style="padding: 12px; background: rgba(0, 102, 204, 0.15); border-radius: 8px;">
          <div>Total Sessions: ${stats.sessionStats.totalSessions}</div>
          <div>Active Tabs: ${stats.sessionStats.activeTabs}</div>
          <div>Avg Threats/Session: ${stats.sessionStats.avgThreatsPerSession.toFixed(2)}</div>
        </div>

        <h3>Device Information</h3>
        <div style="padding: 12px; background: rgba(0, 102, 204, 0.15); border-radius: 8px; margin-top: 12px;">
          <div>Browser: ${stats.deviceStats.browser}</div>
          <div>OS: ${stats.deviceStats.os}</div>
          <div>Platform: ${stats.deviceStats.platform}</div>
        </div>
      </div>
    `;
  }

  function getTopDomains(limit) {
    const counts = {};
    allThreats.filter(t => t.threat?.threatDetected).forEach(t => {
      const domain = t.context?.resource?.domain || 'unknown';
      counts[domain] = (counts[domain] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
  }

  function getTopResourceTypes(limit) {
    const counts = {};
    allThreats.forEach(t => {
      const type = t.context?.resource?.type || 'unknown';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
  }

  function getSessionStats() {
    const sessions = new Set(allThreats.map(t => t.context?.session?.id).filter(Boolean));
    const tabs = new Set(allThreats.map(t => t.context?.tab?.id).filter(Boolean));
    const threatsPerSession = allThreats.length / (sessions.size || 1);

    return {
      totalSessions: sessions.size,
      activeTabs: tabs.size,
      avgThreatsPerSession: threatsPerSession
    };
  }

  function getDeviceStats() {
    const latest = allThreats[0];
    return {
      browser: latest?.context?.device?.browser?.name || 'Unknown',
      os: latest?.context?.device?.os || 'Unknown',
      platform: latest?.context?.device?.platform || 'Unknown'
    };
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function truncate(str, length) {
    return str.length > length ? str.substring(0, length) + '...' : str;
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  document.getElementById('severity-filter')?.addEventListener('change', applyFilters);
  document.getElementById('resource-filter')?.addEventListener('change', applyFilters);
  document.getElementById('search-input')?.addEventListener('input', applyFilters);

  document.querySelectorAll('.group-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.group-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGrouping = btn.dataset.group;
      displayThreats();
    });
  });

  document.getElementById('export-csv')?.addEventListener('click', exportToCSV);
  document.getElementById('export-json')?.addEventListener('click', exportToJSON);

  document.getElementById('clear-button')?.addEventListener('click', () => {
    if (confirm('Clear all threat data?')) {
      chrome.runtime.sendMessage({ action: 'clearThreats' }, () => {
        allThreats = [];
        filteredThreats = [];
        updateStatistics();
        updateCharts();
        displayThreats();
      });
    }
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  loadThreats();
  setInterval(loadThreats, 5000); // Auto-refresh every 5 seconds
});
