// ============================================================================
// THREAT MONITOR - Enhanced Content Script
// Features: Warning modals, visual alerts, sound notifications
// ============================================================================

// Prevent multiple injections
if (!window.threatMonitorInjected) {
  window.threatMonitorInjected = true;

  // ============================================================================
  // MODAL DISPLAY SYSTEM
  // ============================================================================

  class ThreatModal {
    static modal = null;

    static create(threat) {
      // Remove existing modal if any
      this.remove();

      const severity = threat.severity || 'HIGH';
      const severityColors = {
        CRITICAL: { bg: '#ff0000', border: '#ff6666', text: '#ffffff' },
        HIGH: { bg: '#ff6600', border: '#ff9933', text: '#ffffff' },
        MEDIUM: { bg: '#ffaa00', border: '#ffcc66', text: '#000000' },
        LOW: { bg: '#ffdd00', border: '#ffee99', text: '#000000' }
      };

      const colors = severityColors[severity] || severityColors.HIGH;
      const threatType = threat.threat?.type || 'Unknown Threat';
      const confidence = Math.round((threat.threat?.confidence || 0) * 100);
      const url = threat.request?.url || window.location.href;

      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.id = 'threat-monitor-modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
      `;

      // Create modal content
      const modal = document.createElement('div');
      modal.id = 'threat-monitor-modal';
      modal.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 3px solid ${colors.border};
        border-radius: 16px;
        padding: 32px;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(255, 0, 0, 0.4), 0 0 30px ${colors.bg};
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: scaleIn 0.3s ease;
        position: relative;
      `;

      modal.innerHTML = `
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
        </style>

        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 72px; animation: pulse 1.5s ease-in-out infinite;">
            🚨
          </div>
          <h2 style="
            font-size: 28px;
            font-weight: 700;
            margin: 16px 0;
            color: ${colors.bg};
            text-shadow: 0 0 10px ${colors.bg};
          ">
            ${severity} SECURITY THREAT DETECTED
          </h2>
        </div>

        <div style="
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          border-left: 4px solid ${colors.bg};
        ">
          <div style="margin-bottom: 12px;">
            <strong style="color: ${colors.bg};">Threat Type:</strong>
            <span style="margin-left: 8px;">${this.escapeHtml(threatType)}</span>
          </div>
          <div style="margin-bottom: 12px;">
            <strong style="color: ${colors.bg};">Confidence:</strong>
            <span style="margin-left: 8px;">${confidence}%</span>
          </div>
          <div style="margin-bottom: 12px;">
            <strong style="color: ${colors.bg};">Target URL:</strong>
            <div style="
              margin-top: 8px;
              padding: 8px;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 6px;
              word-break: break-all;
              font-size: 12px;
              font-family: monospace;
            ">
              ${this.escapeHtml(url)}
            </div>
          </div>
          ${threat.threat?.description ? `
            <div>
              <strong style="color: ${colors.bg};">Details:</strong>
              <div style="
                margin-top: 8px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                font-size: 14px;
                line-height: 1.6;
              ">
                ${this.escapeHtml(threat.threat.description)}
              </div>
            </div>
          ` : ''}
        </div>

        <div style="
          background: rgba(255, 200, 0, 0.1);
          border: 1px solid rgba(255, 200, 0, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        ">
          <div style="font-size: 14px; line-height: 1.6;">
            ⚠️ <strong>Security Advisory:</strong> This activity has been flagged as potentially malicious.
            We recommend closing this page and reviewing your recent activity.
          </div>
        </div>

        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="threat-modal-close" style="
            flex: 1;
            padding: 14px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.6)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
          >
            Acknowledge
          </button>
          <button id="threat-modal-leave" style="
            flex: 1;
            padding: 14px 24px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 107, 107, 0.6)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 107, 107, 0.4)';"
          >
            🚪 Leave Page
          </button>
        </div>

        <div style="
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        ">
          Protected by TrueGuardian Threat Monitor
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Add event listeners
      document.getElementById('threat-modal-close').addEventListener('click', () => {
        this.remove();
      });

      document.getElementById('threat-modal-leave').addEventListener('click', () => {
        window.history.back();
        setTimeout(() => this.remove(), 500);
      });

      // Close on overlay click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.remove();
        }
      });

      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.remove();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      this.modal = overlay;

      // Auto-dismiss after 30 seconds for non-critical threats
      if (severity !== 'CRITICAL') {
        setTimeout(() => this.remove(), 30000);
      }
    }

    static remove() {
      if (this.modal && this.modal.parentNode) {
        this.modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
          if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
          }
          this.modal = null;
        }, 300);
      }
    }

    static escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // ============================================================================
  // VISUAL ALERT BANNER
  // ============================================================================

  class AlertBanner {
    static show(message, severity = 'HIGH') {
      const colors = {
        CRITICAL: '#ff0000',
        HIGH: '#ff6600',
        MEDIUM: '#ffaa00',
        LOW: '#ffdd00'
      };

      const banner = document.createElement('div');
      banner.id = 'threat-monitor-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: ${colors[severity] || colors.HIGH};
        color: white;
        padding: 16px;
        text-align: center;
        font-family: sans-serif;
        font-weight: 600;
        font-size: 14px;
        z-index: 2147483646;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease;
      `;

      banner.innerHTML = `
        <style>
          @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
          }
        </style>
        🚨 ${message}
        <button onclick="this.parentElement.remove()" style="
          margin-left: 16px;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid white;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          font-size: 12px;
        ">Dismiss</button>
      `;

      document.body.appendChild(banner);

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (banner.parentNode) {
          banner.remove();
        }
      }, 10000);
    }
  }

  // ============================================================================
  // AUDIO ALERT SYSTEM
  // ============================================================================

  class AudioAlert {
    static play() {
      // Create audio context for alert sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.5);
      }, 600);
    }
  }

  // ============================================================================
  // MESSAGE LISTENER
  // ============================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showThreatModal') {
      ThreatModal.create(message.data);
      AlertBanner.show(
        `${message.data.severity} threat detected: ${message.data.threat?.type || 'Unknown'}`,
        message.data.severity
      );
      sendResponse({ success: true });
    }

    if (message.action === 'playAlertSound') {
      AudioAlert.play();
      sendResponse({ success: true });
    }

    if (message.action === 'threatDetected') {
      const alertMessage = `Threat Detected: ${message.data.type} (Confidence: ${(message.data.confidence * 100).toFixed(2)}%) on ${window.location.href}`;
      console.warn('ThreatMonitor:', alertMessage);

      // Optional: Collect DOM data for further analysis
      const maliciousData = {
        pageTitle: document.title,
        suspiciousElements: document.querySelectorAll('script[src*="malicious"], iframe').length,
        url: window.location.href
      };

      chrome.runtime.sendMessage({
        action: 'dataCollected',
        data: maliciousData
      });

      sendResponse({ success: true });
    }
  });

  console.log('ThreatMonitor: Enhanced content script loaded');
}
