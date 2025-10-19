# TrueGuardian Multi-Page App Setup Guide

## Overview
This is a multi-page React + JavaScript application using Vite, styled with Tailwind CSS, maintaining the Huly Laser theme with purple/pink/blue neon gradients. Includes Chrome extension integration for storage and identity.

## Project Structure
```
my-react-app/
├── src/
│   ├── App-multipage.jsx       # Main app with navigation
│   ├── App-multipage.css       # Huly Laser background & animations
│   ├── pages/
│   │   ├── Dashboard.jsx       # chrome.storage data display
│   │   ├── Team.jsx            # Team member cards
│   │   ├── Projects.jsx        # Project status cards
│   │   ├── Reports.jsx         # Analytics & metrics
│   │   └── Profile.jsx         # Chrome identity integration
├── public/
│   └── manifest.json           # Chrome extension manifest
└── tailwind.config.js
```

## Setup Instructions

### 1. Install Dependencies
```bash
cd my-react-app
npm install

# If Tailwind not installed:
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configure Tailwind
Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Update Main Entry Point
Replace `src/main.jsx`:
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App-multipage.jsx'
import './App-multipage.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 4. Running the App

**For Browser Development:**
```bash
npm run dev
```
Access at: http://localhost:5173/

**For Chrome Extension:**
1. Build the app:
   ```bash
   npm run build
   ```

2. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### 5. Chrome Extension Setup

**Update manifest.json:**
- Replace `YOUR_CLIENT_ID` with your actual Google OAuth Client ID
- Get OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)

**Configure OAuth:**
1. Go to Google Cloud Console
2. Create a new project
3. Enable Chrome Identity API
4. Create OAuth 2.0 credentials
5. Add authorized domains
6. Copy Client ID to manifest.json

### 6. Chrome Storage Mock Data

To populate mock data for testing, open browser console and run:

```javascript
// Set Dashboard data
chrome.storage.local.set({
  savedData: [
    { id: 1, session: 'Session 1', metric: '100 saves', timestamp: '2025-10-15' },
    { id: 2, session: 'Session 2', metric: '85 saves', timestamp: '2025-10-16' },
  ]
})

// Set Reports data
chrome.storage.local.set({
  analyticsData: [
    { date: '2025-10-15', saves: 45, category: 'Research' },
    { date: '2025-10-16', saves: 38, category: 'Development' },
  ]
})
```

## Features

### Pages

**Dashboard**
- Displays saved data from chrome.storage.local
- Fallback to mock data if no storage available
- Animated table with glassmorphism design

**Team**
- Grid of team member cards
- Hover effects and animations
- Responsive layout (1/2/3 columns)

**Projects**
- Project cards with status badges
- Progress bars with gradient colors
- Status indicators (Active, In Progress, Planning)

**Reports**
- Summary cards (Total Saves, Days Tracked, Average)
- Analytics table from chrome.storage
- Gradient card designs

**Profile**
- Chrome Identity integration
- Sign in/Sign out functionality
- User profile display
- Fallback demo mode for browser testing

### Styling

**Huly Laser Background:**
- Animated gradient: purple → pink → blue → cyan
- 15-second animation loop
- Full-screen coverage

**Animations:**
- Fade-in entrance (1s duration)
- Staggered delays (0ms, 200ms, 400ms)
- Transform translateY(20px) → 0
- Smooth transitions

**Navigation:**
- Fixed top bar
- Glassmorphism effect (backdrop-blur)
- Active state highlighting
- Responsive mobile menu

## Chrome Extension Permissions

Required in manifest.json:
- **storage**: For Dashboard and Reports data
- **identity**: For Profile sign-in
- **host_permissions**: For Google APIs

## Browser Testing vs Extension

**Browser Mode:**
- Mock data automatically loaded
- Chrome APIs gracefully fallback
- Full development experience

**Extension Mode:**
- Real chrome.storage integration
- Chrome Identity authentication
- Production-ready features

## Customization

### Change Brand Name
Replace "TrueGuardian" in:
- `App-multipage.jsx` (line 38)
- All page files (Profile.jsx line 64, etc.)
- manifest.json

### Modify Navigation Items
Edit `navItems` array in `App-multipage.jsx` (line 13)

### Adjust Colors
Edit Tailwind classes or add custom colors in `tailwind.config.js`

### Customize Animations
Modify `App-multipage.css` keyframes and durations

## Troubleshooting

**Issue: Blank page**
- Check browser console for errors
- Verify all page files exist in `src/pages/`
- Ensure imports in App-multipage.jsx are correct

**Issue: Chrome APIs not working**
- Verify manifest.json permissions
- Check OAuth configuration
- Test in actual Chrome extension (not browser)

**Issue: Styling not applied**
- Run `npm run dev` to rebuild
- Check Tailwind config content paths
- Verify CSS imports in main.jsx

## Build for Production

```bash
npm run build
```

Output in `dist/` folder ready for Chrome extension deployment.

## License
MIT - Feel free to use and modify!
