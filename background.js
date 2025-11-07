// SaveTab Background Service Worker

// Test if service worker is alive
self.addEventListener('install', (event) => {
});

self.addEventListener('activate', (event) => {
});

// Open side panel when extension icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error setting panel behavior:', error));

// Storage keys
const TAB_ACTIVITY_KEY = 'tabActivity';
const SUSPENDER_SETTINGS_KEY = 'suspenderSettings';
const SUSPENDED_PREFIX = 'suspended_';

// Track tab activity
let tabActivity = {};

// Default whitelist domains
const DEFAULT_WHITELIST = [
  'mail.google.com',
  'outlook.live.com',
  'outlook.office.com',
  'slack.com',
  'discord.com',
  'spotify.com',
  'youtube.com',
  'calendar.google.com',
  'notion.so',
  'teams.microsoft.com'
];

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {

  // Set default suspender settings
  const settings = await chrome.storage.sync.get(SUSPENDER_SETTINGS_KEY);
  if (!settings[SUSPENDER_SETTINGS_KEY]) {
    await chrome.storage.sync.set({
      [SUSPENDER_SETTINGS_KEY]: {
        enabled: false,
        suspendAfter: 30, // minutes
        whitelist: DEFAULT_WHITELIST,
        neverSuspendPinned: true,
        neverSuspendAudio: true
      }
    });
  }
});

// Track tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  tabActivity[activeInfo.tabId] = Date.now();
  saveTabActivity();
});

// Track tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    tabActivity[tabId] = Date.now();
    saveTabActivity();
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabActivity[tabId];
  chrome.storage.local.remove(`${SUSPENDED_PREFIX}${tabId}`);
  saveTabActivity();
});

// Save tab activity to storage
async function saveTabActivity() {
  await chrome.storage.local.set({ [TAB_ACTIVITY_KEY]: tabActivity });
}

// Load tab activity from storage
async function loadTabActivity() {
  const data = await chrome.storage.local.get(TAB_ACTIVITY_KEY);
  if (data[TAB_ACTIVITY_KEY]) {
    tabActivity = data[TAB_ACTIVITY_KEY];
  }
}

// Check if domain is whitelisted
function isWhitelisted(url, whitelist) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    return whitelist.some(domain => {
      // Exact match
      if (hostname === domain) return true;
      // Subdomain match
      if (hostname.endsWith('.' + domain)) return true;
      // Pattern match
      if (domain.includes('*') && hostname.match(domain.replace('*', '.*'))) return true;
      return false;
    });
  } catch (e) {
    return false;
  }
}

// Check if tab should be suspended
async function shouldSuspendTab(tab, settings) {
  // Already suspended
  if (tab.url.includes(chrome.runtime.getURL('suspended.html'))) {
    return false;
  }

  // Active tab
  if (tab.active) {
    return false;
  }

  // Pinned tabs
  if (tab.pinned && settings.neverSuspendPinned) {
    return false;
  }

  // Audio playing
  if (tab.audible && settings.neverSuspendAudio) {
    return false;
  }

  // Whitelisted domain
  if (isWhitelisted(tab.url, settings.whitelist)) {
    return false;
  }

  // Chrome internal pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    return false;
  }

  // Check inactivity time
  const lastActive = tabActivity[tab.id] || Date.now();
  const inactiveMinutes = (Date.now() - lastActive) / 60000;

  return inactiveMinutes > settings.suspendAfter;
}

// Suspend a tab
async function suspendTab(tab) {
  try {
    // Get the tab's group ID (if it's in a group) - check if API exists first
    const groupId = (chrome.tabGroups && tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE)
      ? tab.groupId
      : null;

    // Store original tab data including group membership
    await chrome.storage.local.set({
      [`${SUSPENDED_PREFIX}${tab.id}`]: {
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl || '',
        suspendedAt: Date.now(),
        originalTabId: tab.id,
        groupId: groupId  // ✅ Store which group this tab belongs to
      }
    });

    // Navigate to suspended page (tab stays in same group automatically)
    await chrome.tabs.update(tab.id, {
      url: chrome.runtime.getURL('suspended.html') + '#' + tab.id
    });

  } catch (error) {
    console.error('Error suspending tab:', error);
  }
}

// Check all tabs for suspension
async function checkTabsForSuspension() {
  try {
    const settings = await getCurrentSettings();

    // Skip if suspender is disabled
    if (!settings || !settings.enabled) {
      return;
    }

    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      if (await shouldSuspendTab(tab, settings)) {
        await suspendTab(tab);
      }
    }
  } catch (error) {
    console.error('Error checking tabs for suspension:', error);
  }
}

// Get suspender stats
async function getSuspenderStats() {
  try {
    const tabs = await chrome.tabs.query({});
    const suspendedTabs = tabs.filter(t => t.url && t.url.includes(chrome.runtime.getURL('suspended.html')));

    return {
      count: suspendedTabs.length,
      memorySaved: suspendedTabs.length * 100 // Estimate 100MB per suspended tab
    };
  } catch (error) {
    console.error('Error getting suspender stats:', error);
    return { count: 0, memorySaved: 0 };
  }
}

// Set up alarm for periodic checks (every 5 minutes)
chrome.alarms.create('checkSuspension', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkSuspension') {
    checkTabsForSuspension();
  }
});

// Get current settings (supports both old nested and new flat structure)
async function getCurrentSettings() {
  // Try new flat structure first
  const flatSettings = await chrome.storage.sync.get([
    'suspenderEnabled',
    'suspendAfter',
    'neverSuspendPinned',
    'neverSuspendAudio'
  ]);

  // If new structure exists, use it
  if (flatSettings.suspenderEnabled !== undefined) {
    return {
      enabled: flatSettings.suspenderEnabled,
      suspendAfter: flatSettings.suspendAfter || 30,
      neverSuspendPinned: flatSettings.neverSuspendPinned !== false,
      neverSuspendAudio: flatSettings.neverSuspendAudio !== false,
      whitelist: DEFAULT_WHITELIST
    };
  }

  // Fall back to old nested structure
  const nestedSettings = await chrome.storage.sync.get(SUSPENDER_SETTINGS_KEY);
  return nestedSettings[SUSPENDER_SETTINGS_KEY] || {
    enabled: false,
    suspendAfter: 30,
    neverSuspendPinned: true,
    neverSuspendAudio: true,
    whitelist: DEFAULT_WHITELIST
  };
}

// Message listener for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSuspenderStats') {
    getSuspenderStats().then(sendResponse);
    return true; // Will respond asynchronously
  }

  if (request.action === 'suspendNow') {
    // Manual suspension - bypass enabled check
    (async () => {
      try {
        const tabs = await chrome.tabs.query({});
        let suspendedCount = 0;

        for (const tab of tabs) {
          // Skip active tab, chrome pages, and already suspended tabs
          if (tab.active) continue;
          if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
          if (tab.url.includes(chrome.runtime.getURL('suspended.html'))) continue;

          await suspendTab(tab);
          suspendedCount++;
        }

        const stats = await getSuspenderStats();
        sendResponse({ count: suspendedCount, success: true, stats: stats });
      } catch (error) {
        console.error('Error in suspendNow:', error);
        sendResponse({ count: 0, success: false, error: error.message });
      }
    })();
    return true;
  }

  if (request.action === 'updateSuspenderSettings') {
    // Settings are already saved by popup, just acknowledge
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getSuspenderSettings') {
    getCurrentSettings().then(sendResponse);
    return true;
  }
});

// Load tab activity on startup
loadTabActivity();

// Initial check after 1 minute
setTimeout(checkTabsForSuspension, 60000);

// ==================== TAB GROUP TRACKING ====================

// Listen for when tab groups are removed (user manually closes group)
// Only set up listener if Tab Groups API is available (Chrome 89+)
if (chrome.tabGroups && chrome.tabGroups.onRemoved) {
  chrome.tabGroups.onRemoved.addListener(async (group) => {
    // The parameter is a TabGroup object, not just an ID
    const groupId = typeof group === 'object' ? group.id : group;


    try {
      // Find any collections that were using this group
      const result = await chrome.storage.local.get('savedTabLists');
      const lists = result.savedTabLists || [];

      let updated = false;
      lists.forEach(list => {
        if (list.groupId === groupId) {
          list.groupId = null;
          updated = true;
        }
      });

      if (updated) {
        await chrome.storage.local.set({ savedTabLists: lists });
      }
    } catch (error) {
      console.error('Error handling group removal:', error);
    }
  });
} else {
}

// ==================== WORKSPACE ALARMS ====================

// Handle workspace alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  // Check if this is a workspace alarm
  if (alarm.name.startsWith('workspace_')) {
    const workspaceId = parseInt(alarm.name.replace('workspace_', ''));

    try {
      const result = await chrome.storage.local.get(['workspaces', 'savedTabLists']);
      const workspaces = result.workspaces || [];
      const workspace = workspaces.find(w => w.id === workspaceId);

      if (workspace && workspace.schedule && workspace.schedule.enabled) {

        // Close all current tabs if autoClose is enabled
        if (workspace.schedule.autoClose) {
          const currentTabs = await chrome.tabs.query({});
          const tabsToClose = currentTabs.filter(tab =>
            !tab.url.startsWith('chrome://') &&
            !tab.url.startsWith('chrome-extension://')
          ).map(tab => tab.id);

          if (tabsToClose.length > 0) {
            await chrome.tabs.remove(tabsToClose);
          }
        }

        // Open all collections in the workspace
        const lists = result.savedTabLists || [];
        for (const collectionId of workspace.collections) {
          const collection = lists.find(l => l.id === collectionId);
          if (collection && collection.tabs) {
            // Create tabs for this collection
            for (const tab of collection.tabs) {
              await chrome.tabs.create({ url: tab.url, active: false });
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        }

      }
    } catch (error) {
      console.error('Error activating scheduled workspace:', error);
    }
  }
});
