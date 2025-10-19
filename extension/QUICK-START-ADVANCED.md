# 🚀 Quick Start: Advanced Threat Monitor

## Installation & Activation (5 minutes)

### Step 1: Activate Advanced Features

```bash
# Navigate to extension folder
cd "D:\True Gaurdian\extension"

# Backup current files (optional)
mkdir backups
copy background.js backups\
copy popup.html backups\
copy popup.js backups\

# Activate advanced version
copy background-advanced.js background.js
copy popup-advanced.html popup.html
copy popup-advanced.js popup.js
```

### Step 2: Reload Extension

1. Open browser: `chrome://extensions/`
2. Find "TrueGuardian Threat Monitor"
3. Click ↻ **Reload** button
4. Pin extension to toolbar

### Step 3: Open Dashboard

Click extension icon → See new advanced dashboard!

---

## 🎨 New UI Overview

### **Tabs**

```
┌──────────────────────────────────────────────┐
│ [📊 Overview] [📈 Analysis] [🚨 Threats] [⚙️] │
└──────────────────────────────────────────────┘
```

#### **📊 Overview Tab**
- **Statistics Cards**: Total Requests, Threats, Critical, Unique Domains
- **4 Interactive Charts**:
  1. Threats by Domain (Bar Chart)
  2. Resource Types (Doughnut Chart)
  3. Threats Over Time (Line Chart)
  4. Severity Distribution (Bar Chart)

#### **📈 Analysis Tab**
- Top threat domains
- Resource type breakdown
- Session statistics
- Device information

#### **🚨 Threats Tab**
- **Filters**: Severity, Resource Type, Search
- **Grouping**: None, Domain, Tab, Resource Type, Severity
- **Export**: CSV, JSON with all new fields
- **Threat List**: Collapsible groups with details

---

## 🎯 Key Features Demo

### Feature 1: Interactive Charts

**View Threats by Domain:**
1. Open extension
2. Click **📊 Overview** tab
3. See "Threats by Domain" bar chart
4. Hover over bars to see exact counts

**See Resource Distribution:**
1. Look at "Resource Types" doughnut chart
2. Colors represent: API, JavaScript, Image, CSS, etc.

### Feature 2: Grouping

**Group by Domain:**
```
1. Go to 🚨 Threats tab
2. Click "By Domain" button
3. See threats grouped:

   📁 evil-site.com (5 threats)
      ├─ SQLi attack
      ├─ XSS attempt
      └─ ...

   📁 suspicious.org (3 threats)
      └─ Data exfiltration
```

**Group by Tab/Session:**
```
1. Click "By Tab" button
2. See threats grouped by browser tab:

   📑 Shopping Cart (Tab 12345)
      Session: 1h 23m
      ├─ Payment API - SQLi
      └─ Tracker - Privacy violation
```

### Feature 3: Advanced Filtering

**Find all CRITICAL threats:**
```
1. Severity dropdown → "Critical"
2. See only critical threats
```

**Search for specific domain:**
```
1. Search box → Type "evil-site.com"
2. Instantly filtered results
```

**Combine filters:**
```
1. Severity: "HIGH"
2. Resource Type: "API"
3. Search: "login"
→ See only HIGH severity API threats containing "login"
```

### Feature 4: Enhanced Exports

**Export with Full Context:**
```
1. Apply desired filters
2. Click 📊 Export CSV
3. Open CSV to see:
   - Tab ID, Tab Title
   - Session ID
   - User ID
   - Browser, OS
   - Domain, Resource Type
   - All original fields
```

**JSON Export with Grouping:**
```
1. Group threats by "Domain"
2. Click 📦 Export JSON
3. JSON includes:
   - All threat details
   - Grouped data structure
   - Statistics summary
   - Filter configuration
```

---

## 📊 Data Structure Reference

### **New Context Fields**

Every threat now includes:

```javascript
{
  // Basic threat info
  id, timestamp, severity, threat, request, response,

  // NEW: Enhanced context
  context: {
    tab: {
      id: 12345,
      title: "Page Title",
      url: "https://...",
      active: true
    },
    session: {
      id: "session_abc",
      requestCount: 25,
      threatCount: 5
    },
    user: {
      id: "user_xyz"
    },
    device: {
      browser: { name: "Chrome" },
      os: "Windows 10/11",
      screen: { width: 1920, height: 1080 }
    },
    resource: {
      type: "API",
      domain: "example.com",
      protocol: "https",
      fileType: "json"
    }
  }
}
```

---

## 🔧 Troubleshooting

### Charts Not Loading?

**Check Chart.js:**
```javascript
// Open popup → F12 → Console
// Should see: "Chart.js loaded"
```

**Solution:**
- Ensure internet connection (CDN download)
- Or download Chart.js locally (see ADVANCED-FEATURES.md)

### No Grouping Options?

**Reload extension:**
```
chrome://extensions/ → Reload button
```

### Export CSV empty columns?

**This is normal if:**
- Request had no body → "N/A"
- Tab was closed → Tab title = "Unknown"
- Old threats without context → Missing device info

**Solution:** Clear old data, generate new threats

---

## 💡 Pro Tips

### Tip 1: Use Filters Before Export
```
1. Filter: Severity = CRITICAL
2. Export CSV
→ Get only critical threats in CSV
```

### Tip 2: Monitor Specific Domain
```
1. Search: "suspicious-domain.com"
2. Watch real-time updates
→ See all requests to that domain
```

### Tip 3: Track Attack Patterns
```
1. Overview tab → "Threats Over Time" chart
2. Look for spikes
→ Identify when attacks occurred
```

### Tip 4: Session Analysis
```
1. Group by Tab
2. See which tabs have most threats
→ Identify compromised websites
```

### Tip 5: Export for Compliance
```
1. No filters (show all)
2. Export JSON
3. Share with security team
→ Full audit trail with device info
```

---

## 🎨 Customization

### Change Chart Colors

Edit `popup-advanced.js`:
```javascript
// Line 120: Domain chart colors
backgroundColor: 'rgba(255, 99, 132, 0.6)', // Red
// Change to:
backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
```

### Adjust Grouping Logic

Edit `popup-advanced.js`, line 260:
```javascript
switch (currentGrouping) {
  case 'domain':
    key = threat.context?.resource?.domain || 'Unknown';
    break;
  // Add custom grouping:
  case 'myCustomGroup':
    key = threat.context?.custom?.field;
    break;
}
```

### Add New Statistics

Edit `popup-advanced.js`, line 50:
```javascript
function updateStatistics() {
  // Add new stat
  const myCustomStat = calculateCustomStat(allThreats);
  document.getElementById('my-stat').textContent = myCustomStat;
}
```

Then add to HTML:
```html
<div class="stat-card">
  <div class="stat-value" id="my-stat">0</div>
  <div class="stat-label">My Custom Stat</div>
</div>
```

---

## 📚 Next Steps

1. **Review ADVANCED-FEATURES.md** for complete documentation
2. **Test all grouping options** (domain, tab, type, severity)
3. **Export sample data** to see new CSV/JSON format
4. **Integrate with AWS** (optional) for cloud alerting
5. **Customize charts** to match your needs

---

## 🆘 Need Help?

- **Documentation**: See `ADVANCED-FEATURES.md`
- **Examples**: Check `export-examples/` folder
- **Issues**: GitHub issues
- **Implementation**: See `IMPLEMENTATION-GUIDE.md`

---

## ✅ Verification Checklist

- [ ] Extension reloaded with advanced files
- [ ] Dashboard opens with 4 tabs
- [ ] Statistics cards show correct counts
- [ ] All 4 charts render
- [ ] Grouping buttons work
- [ ] Filters apply correctly
- [ ] CSV export includes new fields
- [ ] JSON export has context data
- [ ] Charts update in real-time
- [ ] Search box filters threats
- [ ] Groups are collapsible

**All checked?** → You're ready to use Advanced Threat Monitor! 🎉

---

**Quick Reference:**

| Feature | Location | Shortcut |
|---------|----------|----------|
| View Charts | Overview tab | Default view |
| Group Threats | Threats tab | Click group buttons |
| Export CSV | Threats tab | 📊 CSV button |
| Export JSON | Threats tab | 📦 JSON button |
| Filter | Threats tab | Top dropdowns |
| Search | Threats tab | Search box |
| Clear Data | Threats tab | 🗑️ Clear button |
| Analysis | Analysis tab | Click tab |

**Version:** 3.0.0 Advanced
**Chart.js:** 4.4.0
**Status:** Ready to use! 🚀
