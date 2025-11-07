# Chrome Web Store Privacy Practices - Required Justifications

Copy and paste these justifications into the Chrome Web Store Developer Dashboard Privacy practices tab.

---

## Single Purpose Description

SaveTab is a tab management and organization extension that helps users save, restore, and organize their browser tabs into collections and workspaces. The extension provides features including tab collection management, workspace organization, automatic tab suspension to save memory, and optional AI-powered tab grouping.

---

## Permission Justifications

### tabs
**Justification:**
The tabs permission is required to access and manage the user's browser tabs. This is the core functionality of SaveTab - the extension needs to:
- Read tab URLs and titles to save them into collections
- Create new tabs when restoring saved collections
- Query existing tabs to avoid duplicates
- Close tabs when the user chooses to save and close collections
- Organize tabs into visual groups
Without this permission, the extension cannot perform its primary function of saving and restoring tab collections.

---

### storage
**Justification:**
The storage permission is required to save all user data locally on their device. This includes:
- Saved tab collections (URLs, titles, timestamps, custom colors)
- User-created workspaces and their associated collections
- User preferences and settings (sort order, theme customization, suspension delays)
- Optional encrypted API key for AI features
All data is stored locally using chrome.storage.local API. No data is transmitted to external servers except when the user explicitly uses optional AI features. This permission is essential for the extension to persist user data between browser sessions.

---

### tabGroups
**Justification:**
The tabGroups permission is required to organize tabs into visual groups within the browser. When users restore a saved collection, SaveTab creates a Chrome tab group to visually organize and distinguish the restored tabs from other tabs. This allows users to:
- Visually identify which tabs belong to which collection
- Easily manage multiple open collections simultaneously
- Avoid accidentally closing tabs from the wrong collection
The extension uses the native Chrome Tab Groups API to provide better organization and user experience.

---

### alarms
**Justification:**
The alarms permission is required for the automatic tab suspension feature. This feature helps users save system memory by automatically suspending inactive tabs after a user-configured delay (5 minutes to 2 hours). The extension uses chrome.alarms API to:
- Schedule periodic checks for inactive tabs
- Trigger tab suspension based on user-defined time thresholds
- Monitor tab activity to determine which tabs should be suspended
This permission does not access any user data beyond what is necessary for tab suspension functionality. Users can disable tab suspension in settings if they choose not to use this feature.

---

### sidePanel
**Justification:**
The sidePanel permission is required to display the extension's user interface in Chrome's side panel. This provides a better user experience by:
- Keeping the extension interface accessible without blocking the main browser window
- Allowing users to manage tabs while viewing their current page
- Providing a more spacious and organized interface compared to popup windows
The side panel is the primary interface for all SaveTab features including collections, workspaces, customization, and settings.

---

### Remote Code Declaration
**Justification:**
SaveTab does NOT use remote code. All JavaScript code is included in the extension package and reviewed by Chrome Web Store. The only external API calls are:
- Optional: Google Gemini API (when user explicitly enables AI features and provides their own API key)
- These API calls only send tab URLs and titles for AI-powered grouping
- No remote code is downloaded or executed
- All extension functionality is contained within the packaged files

---

## Data Usage Certification Checklist

When filling out the Chrome Web Store Privacy practices tab, certify the following:

**Data Collection:**
- [x] This item does NOT collect or transmit user data (except optional AI features)
- [x] Data handling practices are disclosed in the privacy policy
- [x] Privacy policy URL: [YOUR_HOSTED_PRIVACY_POLICY_URL]

**Data Handling:**
- [x] All data is stored locally using chrome.storage API
- [x] No analytics or tracking
- [x] No third-party data sharing (except Google Gemini API for optional AI features)
- [x] Users have full control to export and delete their data

**Single Purpose:**
- [x] Tab collection and workspace management
- [x] All features support this single purpose

**Permissions:**
- [x] All permissions are necessary for core functionality
- [x] No excessive permissions requested
- [x] Justifications provided for all permissions

---

## Privacy Policy URL

You must host the PRIVACY.md file and provide the public URL here.

**Options for hosting:**
1. **GitHub Pages** (Recommended - Free)
   - Create a repository or use existing one
   - Upload PRIVACY.md
   - Enable GitHub Pages in repository settings
   - URL will be: `https://yourusername.github.io/savetab-extension/PRIVACY.html`

2. **GitHub Raw URL** (Quick option)
   - Upload PRIVACY.md to a public repository
   - Get the raw file URL: `https://raw.githubusercontent.com/yourusername/savetab-extension/main/PRIVACY.md`

3. **Your Own Website**
   - Upload to your personal website
   - Example: `https://yourwebsite.com/savetab/privacy`

---

## How to Fill Out Privacy Practices Tab

1. **Go to Chrome Web Store Developer Dashboard**
2. **Click on your SaveTab item**
3. **Click "Privacy practices" tab**
4. **Fill in the following:**

### Single Purpose
Paste the "Single Purpose Description" from above

### Permissions Justifications
For each permission (tabs, storage, tabGroups, alarms, sidePanel):
- Click "Add justification"
- Paste the corresponding justification from above

### Remote Code
- Select: "No, I am not using remote code"
- (If asked for justification, paste the Remote Code justification above)

### Data Usage
- Does this item collect or transmit user data?
  - Select: "No" (or "Yes" if you want to disclose optional AI feature)
  - If "Yes": Describe that only optional AI features send data when explicitly enabled

### Privacy Policy
- Paste your hosted privacy policy URL

### Certification
- Check all boxes certifying compliance with policies
- Click "Save Draft"

---

## Important Notes

1. **Be Honest**: Only certify what is actually true about your extension
2. **Privacy Policy Required**: Must be hosted on a public URL before submission
3. **Keep Consistent**: Make sure justifications match what the code actually does
4. **Single Purpose**: Emphasize that all features support tab management/organization
5. **Optional Features**: Clearly state that AI features are optional and require user action

---

## Quick Copy-Paste Versions (Condensed)

If character limits are tight, use these shorter versions:

### Single Purpose (Short)
SaveTab helps users save, restore, and organize browser tabs into collections and workspaces, with optional tab suspension and AI-powered grouping features.

### tabs (Short)
Required to read tab URLs/titles when saving collections and to create/close tabs when restoring collections. Core functionality of the extension.

### storage (Short)
Required to save user's tab collections, workspaces, and settings locally on their device. All data stored locally, not transmitted to servers.

### tabGroups (Short)
Required to organize restored tabs into visual groups for better organization and to prevent accidental closing of wrong tabs.

### alarms (Short)
Required for automatic tab suspension feature to schedule periodic checks and suspend inactive tabs based on user-configured delays.

### sidePanel (Short)
Required to display the extension interface in Chrome's side panel for better user experience and accessibility.

### Remote Code (Short)
SaveTab does not use remote code. All code is packaged with the extension. Optional AI features use Google Gemini API but do not execute remote code.
