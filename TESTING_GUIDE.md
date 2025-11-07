# Tab Suspender Testing Guide

## 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select this folder: `/Users/josephrodriguez/Desktop/savetab-extension`
5. You should see "SaveTab" appear in your extensions list

## 2. Quick Test (Manual Suspension)

**This is the fastest way to test if everything works:**

1. Open several tabs (5-10 tabs) - any websites work
2. Click the SaveTab extension icon in toolbar
3. Click the "Settings" tab
4. Enable "Tab Suspender" toggle
5. Click "Suspend Now" button
6. Watch your tabs get suspended! They should show a dark placeholder page with "💤 Tab sleeping"
7. Click on any suspended tab to wake it back up

## 3. Automatic Suspension Test

**Test the automatic suspension after inactivity:**

1. In Settings, make sure "Tab Suspender" is enabled
2. Change "Suspend after" to **15 minutes** (shortest option)
3. Open a few test tabs
4. Switch to one tab and leave it active for 16+ minutes
5. The other tabs should automatically suspend

**To speed up testing:**
- The background worker checks every 5 minutes
- So tabs inactive for 15+ minutes will suspend on the next check
- You can check the console for logs

## 4. Test Settings

### Test "Never suspend pinned tabs"
1. Pin a tab (right-click → "Pin tab")
2. Click "Suspend Now"
3. Pinned tab should NOT suspend (stays normal)

### Test "Never suspend tabs playing audio"
1. Open a YouTube video or Spotify
2. Start playing audio
3. Click "Suspend Now"
4. Tab with audio should NOT suspend

### Test Whitelist
These domains should NEVER suspend (even with "Suspend Now"):
- mail.google.com
- outlook.live.com
- slack.com
- discord.com
- spotify.com
- youtube.com
- calendar.google.com
- notion.so

## 5. Check Stats Widget

1. After suspending some tabs, look at the main Collections tab
2. You should see a stats widget appear showing:
   - "X tabs suspended"
   - "X.X GB saved"
3. Stats update every 5 seconds automatically

## 6. Troubleshooting

### Check Background Service Worker Logs
1. Go to `chrome://extensions/`
2. Find SaveTab extension
3. Click "service worker" link (appears when extension is active)
4. Check console for logs like:
   - "SaveTab background service worker loaded"
   - "Suspended tab X: [title]"

### Check for Errors
If tabs aren't suspending:
1. Open DevTools on the extension popup (right-click popup → Inspect)
2. Check Console tab for errors
3. Look for red error messages

### Common Issues
- **"Suspend Now" does nothing**: Check if you have valid tabs open (not chrome:// pages)
- **Stats don't update**: Check service worker is running
- **Can't wake tabs**: Make sure suspended.js is loading (check DevTools)

## 7. What Success Looks Like

✅ Clicking "Suspend Now" turns tabs into suspended placeholders
✅ Suspended page shows favicon, title, "💤 Tab sleeping", "~100 MB saved"
✅ Clicking suspended tab restores original page
✅ Stats widget shows accurate count and memory estimate
✅ Pinned tabs don't suspend (when enabled)
✅ Audio tabs don't suspend (when enabled)
✅ Whitelisted domains don't suspend

## Quick 30-Second Test

1. Load extension
2. Open 5 random tabs
3. Click SaveTab icon → Settings tab
4. Enable Tab Suspender
5. Click "Suspend Now"
6. See tabs turn into "💤 Tab sleeping" pages
7. Click one to wake it

**If that works, the feature is working correctly!** ✅
