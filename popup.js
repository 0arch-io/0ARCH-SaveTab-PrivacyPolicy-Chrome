
// DOM Elements
const listNameInput = document.getElementById('listNameInput');
const saveBtn = document.getElementById('saveBtn');
const saveBtnText = document.getElementById('saveBtnText');
const saveMessage = document.getElementById('saveMessage');
const duplicateWarning = document.getElementById('duplicateWarning');
const listsContainer = document.getElementById('listsContainer');
const emptyState = document.getElementById('emptyState');
const closeTabsCheckbox = document.getElementById('closeTabsCheckbox');
const tabCountBadge = document.getElementById('tabCountBadge');
const searchInput = document.getElementById('searchInput');
const aiSearchBtn = document.getElementById('aiSearchBtn');
const findDuplicatesBtn = document.getElementById('findDuplicatesBtn');
const sortSelect = document.getElementById('sortSelect');
const autoSaveCheckbox = document.getElementById('autoSaveCheckbox');
const deduplicateCheckbox = document.getElementById('deduplicateCheckbox');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const statsBtn = document.getElementById('statsBtn');
const settingsBtn = document.getElementById('settingsBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalFooter = document.getElementById('modalFooter');
const modalClose = document.getElementById('modalClose');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Workspace elements
const workspacesTab = document.getElementById('workspacesTab');
const workspacesContainer = document.getElementById('workspacesContainer');
const workspacesEmpty = document.getElementById('workspacesEmpty');
const createWorkspaceBtn = document.getElementById('createWorkspaceBtn');
const smartGroupBtn = document.getElementById('smartGroupBtn');
const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const testApiBtn = document.getElementById('testApiBtn');
const toastAction = document.getElementById('toastAction');

// Storage keys
const STORAGE_KEY = 'savedTabLists';
const WORKSPACES_KEY = 'workspaces';
const ACTIVE_WORKSPACE_KEY = 'activeWorkspaceId';
const GEMINI_API_KEY = 'geminiApiKey';
const SETTINGS_KEY = 'savetab_settings';
const THEME_KEY = 'savetab_theme';

// Per-category processing locks
const processingLocks = new Map();

// Global state
let allLists = [];
let currentSearchQuery = '';
let currentSortOption = 'date-desc';
let autoSaveInterval = null;
let deletedList = null;
let draggedItem = null;

// Default theme
const DEFAULT_THEME = {
  accentColor: '#007aff',
  restoreBtn: '#34c759',
  resaveBtn: '#007aff',
  closeBtn: '#ff9f0a',
  deleteBtn: '#ff3b30'
};

// Darken a hex color by a percentage (utility function)
function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1).toUpperCase();
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {

  // Check Chrome Tab Groups API support
  if (chrome.tabGroups) {
  } else {
  }

  loadAndDisplayLists();
  migrateDecimalIds(); // Fix old decimal IDs from AI Smart Group
  setupEventListeners();
  updateTabCount();
  loadSettings();
  loadTheme();
  setupKeyboardShortcuts();

  // Initialize customization system
  if (typeof initializeCustomization === 'function') {
    initializeCustomization();
  }

  // Initialize suspender after a brief delay to ensure functions are defined
  setTimeout(() => {
    if (typeof loadSuspenderStats === 'function' && typeof setupSuspenderListeners === 'function') {
      loadSuspenderStats();
      setupSuspenderListeners();
    } else {
      console.error('Suspender functions not yet defined');
    }
  }, 100);
});

// Load settings
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const settings = result[SETTINGS_KEY] || {};

    if (settings.autoSave) {
      autoSaveCheckbox.checked = true;
      startAutoSave();
    }

    if (settings.deduplicate) {
      deduplicateCheckbox.checked = true;
    }

    if (settings.sortOption) {
      currentSortOption = settings.sortOption;
      sortSelect.value = currentSortOption;

      // Sync with settings dropdown
      const defaultSortSelect = document.getElementById('defaultSortSelect');
      if (defaultSortSelect) defaultSortSelect.value = currentSortOption;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings
async function saveSettings() {
  try {
    const settings = {
      autoSave: autoSaveCheckbox.checked,
      deduplicate: deduplicateCheckbox.checked,
      sortOption: currentSortOption
    };
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', async (e) => {
    // Number keys 1-9 to restore lists
    if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return; // Don't trigger if typing in an input
      }

      const index = parseInt(e.key) - 1;
      const visibleLists = getFilteredAndSortedLists();
      if (index < visibleLists.length) {
        e.preventDefault();
        await handleRestoreList(visibleLists[index].id);
      }
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });

  saveBtn.addEventListener('click', handleSaveTabs);

  listNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSaveTabs();
    }
  });

  listNameInput.addEventListener('input', checkForDuplicates);

  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase();
    renderFilteredLists();
  });

  aiSearchBtn.addEventListener('click', handleAiSearch);
  findDuplicatesBtn.addEventListener('click', handleFindDuplicates);

  sortSelect.addEventListener('change', (e) => {
    currentSortOption = e.target.value;
    saveSettings();
    renderFilteredLists();

    // Sync with settings dropdown
    const defaultSort = document.getElementById('defaultSortSelect');
    if (defaultSort) defaultSort.value = currentSortOption;
  });

  // Settings page sort dropdown
  const defaultSortSelect = document.getElementById('defaultSortSelect');
  if (defaultSortSelect) {
    defaultSortSelect.addEventListener('change', (e) => {
      currentSortOption = e.target.value;
      saveSettings();
      renderFilteredLists();
      sortSelect.value = currentSortOption;
    });
  }

  autoSaveCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      startAutoSave();
    } else {
      stopAutoSave();
    }
    saveSettings();
  });

  deduplicateCheckbox.addEventListener('change', saveSettings);

  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', handleImport);
  statsBtn.addEventListener('click', showStats);
  settingsBtn.addEventListener('click', () => switchTab('settings'));
  clearAllBtn.addEventListener('click', handleClearAll);

  // Customize tab event listeners
  setupCustomizeTab();

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Listen for tab changes to update count
  chrome.tabs.onCreated.addListener(updateTabCount);
  chrome.tabs.onRemoved.addListener(updateTabCount);
}

// Switch tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    }
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  if (tabName === 'collections') {
    document.getElementById('collectionsTab').classList.add('active');
  } else if (tabName === 'workspaces') {
    document.getElementById('workspacesTab').classList.add('active');
  } else if (tabName === 'customize') {
    document.getElementById('customizeTab').classList.add('active');
  } else if (tabName === 'settings') {
    document.getElementById('settingsTab').classList.add('active');
  }
}

// Update tab count badge
async function updateTabCount() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const validTabs = tabs.filter(tab =>
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('chrome-extension://')
    );

    const count = validTabs.length;

    // Update hero tab count
    const heroTabCount = document.getElementById('heroTabCount');
    if (heroTabCount) {
      heroTabCount.textContent = count;
    }
  } catch (error) {
    console.error('Error updating tab count:', error);
  }
}

// Check for duplicate lists
async function checkForDuplicates() {
  const name = listNameInput.value.trim();
  if (!name) {
    duplicateWarning.classList.remove('show');
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const validTabs = tabs.filter(tab =>
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('chrome-extension://')
    );

    const currentUrls = validTabs.map(t => t.url).sort().join('|');

    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];

    const duplicate = lists.find(list => {
      const listUrls = list.tabs.map(t => t.url).sort().join('|');
      return listUrls === currentUrls;
    });

    if (duplicate) {
      duplicateWarning.textContent = `Similar to "${duplicate.name}"`;
      duplicateWarning.classList.add('show');
    } else {
      duplicateWarning.classList.remove('show');
    }
  } catch (error) {
    console.error('Error checking duplicates:', error);
  }
}

// Handle saving tabs
async function handleSaveTabs() {
  const name = listNameInput.value.trim();

  if (!name) {
    showMessage('Please enter a name for your tab list', false);
    return;
  }

  try {
    // Get all tabs in current window
    const tabs = await chrome.tabs.query({ currentWindow: true });

    // Filter out extension pages and create tab objects
    const validTabs = tabs.filter(tab =>
      !tab.url.startsWith('chrome://') &&
      !tab.url.startsWith('chrome-extension://')
    );

    const tabData = validTabs.map(tab => ({
      title: tab.title,
      url: tab.url
    }));

    if (tabData.length === 0) {
      showMessage('No valid tabs to save', false);
      return;
    }

    // Create new list object
    const newList = {
      id: Date.now(),
      name: name,
      tabs: tabData,
      savedAt: new Date().toISOString(),
      tabCount: tabData.length,
      color: '#6366f1',
      groupId: null,  // Chrome Tab Group ID (when restored)
      folder: null,
      buttonColors: {
        restore: '#34c759',
        resave: '#007aff',
        close: '#ff9f0a',
        delete: '#ff3b30'
      }
    };

    // Get existing lists
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const existingLists = result[STORAGE_KEY] || [];

    // Add new list to beginning of array
    existingLists.unshift(newList);

    // Save to storage
    await chrome.storage.local.set({ [STORAGE_KEY]: existingLists });

    // Close tabs if checkbox is checked
    if (closeTabsCheckbox.checked) {
      const tabIdsToClose = validTabs.map(tab => tab.id);
      await chrome.tabs.remove(tabIdsToClose);
    }

    // Clear input and warning
    listNameInput.value = '';
    duplicateWarning.classList.remove('show');

    // Show success message
    const message = closeTabsCheckbox.checked ? 'Saved & Closed' : 'Saved';
    showMessage(message, true);

    // Reload lists
    loadAndDisplayLists();
  } catch (error) {
    console.error('Error saving tabs:', error);
    showMessage('Failed to save tabs', false);
  }
}

// Auto-save functionality
function startAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }

  // Auto-save every 5 minutes
  autoSaveInterval = setInterval(async () => {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const validTabs = tabs.filter(tab =>
        !tab.url.startsWith('chrome://') &&
        !tab.url.startsWith('chrome-extension://')
      );

      if (validTabs.length === 0) return;

      const tabData = validTabs.map(tab => ({
        title: tab.title,
        url: tab.url
      }));

      const timestamp = new Date().toLocaleString();
      const newList = {
        id: Date.now(),
        name: `Auto-save ${timestamp}`,
        tabs: tabData,
        savedAt: new Date().toISOString(),
        tabCount: tabData.length,
        color: '#6b7280',
        openTabIds: [],
        folder: 'Auto-saved'
      };

      const result = await chrome.storage.local.get(STORAGE_KEY);
      const lists = result[STORAGE_KEY] || [];
      lists.unshift(newList);

      await chrome.storage.local.set({ [STORAGE_KEY]: lists });
      loadAndDisplayLists();

      showToast('Auto-saved current tabs');
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
}

function stopAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

// Load and display all saved lists
async function loadAndDisplayLists() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    allLists = result[STORAGE_KEY] || [];

    // Migrate old lists
    let needsUpdate = false;
    allLists = allLists.map(list => {
      let updated = { ...list };

      // Migrate: Add buttonColors if missing
      if (!updated.buttonColors) {
        updated.buttonColors = {
          restore: '#34c759',
          resave: '#007aff',
          close: '#ff9f0a',
          delete: '#ff3b30'
        };
        needsUpdate = true;
      }

      // Migrate: Replace openTabIds with groupId
      if (updated.openTabIds !== undefined) {
        updated.groupId = null;  // Reset - old tab IDs are invalid
        delete updated.openTabIds;
        needsUpdate = true;
      }

      // Ensure groupId exists
      if (updated.groupId === undefined) {
        updated.groupId = null;
        needsUpdate = true;
      }

      return updated;
    });

    // Save back if we migrated anything
    if (needsUpdate) {
      await chrome.storage.local.set({ [STORAGE_KEY]: allLists });
    }

    renderFilteredLists();
  } catch (error) {
    console.error('Error loading lists:', error);
  }
}

// Get filtered and sorted lists
function getFilteredAndSortedLists() {
  let lists = [...allLists];

  // Apply search filter
  if (currentSearchQuery) {
    lists = lists.filter(list =>
      list.name.toLowerCase().includes(currentSearchQuery) ||
      list.tabs.some(tab =>
        tab.title.toLowerCase().includes(currentSearchQuery) ||
        tab.url.toLowerCase().includes(currentSearchQuery)
      )
    );
  }

  // Apply sorting
  switch (currentSortOption) {
    case 'date-desc':
      lists.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      break;
    case 'date-asc':
      lists.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt));
      break;
    case 'name-asc':
      lists.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      lists.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'tabs-desc':
      lists.sort((a, b) => b.tabCount - a.tabCount);
      break;
    case 'tabs-asc':
      lists.sort((a, b) => a.tabCount - b.tabCount);
      break;
  }

  return lists;
}

// Render filtered lists
function renderFilteredLists() {
  const lists = getFilteredAndSortedLists();

  if (lists.length === 0) {
    if (currentSearchQuery) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('p').textContent = 'No matches found';
      emptyState.querySelector('.empty-state-hint').textContent = 'Try a different search term';
    } else if (allLists.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('p').textContent = 'No saved tab lists yet';
      emptyState.querySelector('.empty-state-hint').textContent = 'Save your first collection above';
    } else {
      emptyState.classList.add('hidden');
    }
    listsContainer.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');
  renderLists(lists);
}

// Render lists to the DOM
function renderLists(lists) {
  listsContainer.innerHTML = lists.map((list, index) => {
    // Get button colors or use defaults
    const buttonColors = list.buttonColors || {
      restore: '#34c759',
      resave: '#007aff',
      close: '#ff9f0a',
      delete: '#ff3b30'
    };


    return `
    <div class="list-item"
         data-id="${list.id}"
         data-index="${index}"
         draggable="true"
         style="border-left: 3px solid ${list.color || '#6366f1'}">
      <div class="list-header">
        <div class="list-info">
          <div class="list-title-row">
            <div class="color-indicator" style="background: ${list.color || '#6366f1'}"></div>
            <h3 class="list-title" data-id="${list.id}">
              ${escapeHtml(list.name)}
              ${list.folder ? `<span style="font-size: 11px; opacity: 0.5;"> · ${escapeHtml(list.folder)}</span>` : ''}
            </h3>
            <button class="btn-icon-minimal" data-action="color" data-id="${list.id}" title="Change color">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </button>
            <button class="btn-icon-minimal" data-action="rename" data-id="${list.id}" title="Rename">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-icon-minimal" data-action="customize-buttons" data-id="${list.id}" title="Customize">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
            </button>
          </div>
          <div class="list-meta">
            <span>${list.tabCount} tab${list.tabCount !== 1 ? 's' : ''}</span>
            <span>${formatTimeAgo(list.savedAt)}</span>
          </div>
          ${list.aiSummary ? `<div class="ai-summary-preview">${escapeHtml(list.aiSummary.substring(0, 100))}${list.aiSummary.length > 100 ? '...' : ''}</div>` : ''}
        </div>
      </div>
      <div class="list-actions">
        <button class="btn-small btn-ai-summary" data-action="ai-summary" data-id="${list.id}" title="AI Summary">
          AI
        </button>
        <button class="btn-small btn-restore list-${list.id}-restore" data-action="restore" data-id="${list.id}">
          Restore
        </button>
        <button class="btn-small btn-resave list-${list.id}-resave" data-action="resave" data-id="${list.id}">
          Re-save
        </button>
        <button class="btn-small btn-close list-${list.id}-close" data-action="close" data-id="${list.id}">
          Close All
        </button>
        <button class="btn-small btn-delete list-${list.id}-delete" data-action="delete" data-id="${list.id}">
          Delete
        </button>
      </div>
      <style>
        .list-${list.id}-restore { background: ${buttonColors.restore} !important; border-color: ${buttonColors.restore} !important; }
        .list-${list.id}-restore:hover { background: ${darkenColor(buttonColors.restore, 10)} !important; }
        .list-${list.id}-resave { background: ${buttonColors.resave} !important; border-color: ${buttonColors.resave} !important; }
        .list-${list.id}-resave:hover { background: ${darkenColor(buttonColors.resave, 10)} !important; }
        .list-${list.id}-close { background: ${buttonColors.close} !important; border-color: ${buttonColors.close} !important; }
        .list-${list.id}-close:hover { background: ${darkenColor(buttonColors.close, 10)} !important; }
        .list-${list.id}-delete { background: ${buttonColors.delete} !important; border-color: ${buttonColors.delete} !important; }
        .list-${list.id}-delete:hover { background: ${darkenColor(buttonColors.delete, 10)} !important; }
      </style>
    </div>
  `;
  }).join('');

  // Add event listeners to action buttons
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', handleListAction);
  });

  // Add drag and drop listeners
  setupDragAndDrop();

  // Add mouse tracking for card hover effects
  setupCardMouseTracking();
}

// Setup drag and drop
function setupDragAndDrop() {
  const items = document.querySelectorAll('.list-item');

  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.list-item').forEach(item => {
    item.classList.remove('drag-over');
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const afterElement = getDragAfterElement(listsContainer, e.clientY);
  if (afterElement == null) {
    this.classList.add('drag-over');
  }
}

function handleDrop(e) {
  e.preventDefault();

  if (draggedItem !== this) {
    const draggedIndex = parseInt(draggedItem.dataset.index);
    const targetIndex = parseInt(this.dataset.index);

    reorderLists(draggedIndex, targetIndex);
  }

  this.classList.remove('drag-over');
}

// Setup mouse tracking for card hover effects
function setupCardMouseTracking() {
  const cards = document.querySelectorAll('.list-item');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.list-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function reorderLists(fromIndex, toIndex) {
  try {
    const filteredLists = getFilteredAndSortedLists();

    // Get the items being moved
    const movedItem = filteredLists[fromIndex];
    const targetItem = filteredLists[toIndex];

    if (!movedItem || !targetItem) return;

    // Find positions in the original unfiltered array
    const originalFromIndex = allLists.findIndex(l => l.id === movedItem.id);
    const originalToIndex = allLists.findIndex(l => l.id === targetItem.id);

    if (originalFromIndex === -1 || originalToIndex === -1) return;

    // Move in the original array (not filtered)
    const [item] = allLists.splice(originalFromIndex, 1);
    allLists.splice(originalToIndex, 0, item);

    // Save and re-render
    await chrome.storage.local.set({ [STORAGE_KEY]: allLists });
    renderFilteredLists();
    showToast('List reordered');
  } catch (error) {
    console.error('Error reordering lists:', error);
  }
}

// Handle list actions
async function handleListAction(e) {
  const button = e.target.closest('[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  const listId = parseFloat(button.dataset.id); // Use parseFloat to handle decimal IDs

  // Per-category lock
  if (processingLocks.get(listId)) {
    return;
  }

  processingLocks.set(listId, true);

  const listItem = button.closest('.list-item');
  const allButtons = listItem.querySelectorAll('button');
  allButtons.forEach(btn => btn.disabled = true);

  try {
    if (action === 'restore') {
      await handleRestoreList(listId);
    } else if (action === 'resave') {
      await handleResaveList(listId);
    } else if (action === 'close') {
      await handleCloseList(listId);
    } else if (action === 'color') {
      await handleChangeColor(listId);
    } else if (action === 'rename') {
      await handleRenameList(listId);
    } else if (action === 'customize-buttons') {
      await handleCustomizeButtons(listId);
    } else if (action === 'ai-summary') {
      await handleAiSummary(listId);
    } else if (action === 'delete') {
      await handleDeleteList(listId);
    }
  } finally {
    allButtons.forEach(btn => btn.disabled = false);
    processingLocks.delete(listId);
  }
}

// Handle restoring a tab list
async function handleRestoreList(listId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    const list = lists.find(l => l.id === listId);

    if (!list) {
      showMessage('List not found', false);
      return;
    }

    // ✅ Check if this collection is already open (has an active group)
    if (list.groupId && chrome.tabGroups) {
      try {
        // Check if the group still exists
        const group = await chrome.tabGroups.get(list.groupId);
        if (group) {
          // Group exists - collection is already open!
          const tabsInGroup = await chrome.tabs.query({ groupId: list.groupId });

          showModal(
            'Collection Already Open',
            `<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">
              This collection is already open with ${tabsInGroup.length} tab${tabsInGroup.length !== 1 ? 's' : ''}.<br><br>
              Do you want to:<br><br>
              <strong>Restore Again</strong> - Open a new copy (creates duplicate tabs)<br>
              <strong>Cancel</strong> - Keep existing tabs
            </p>`,
            [
              { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
              {
                text: 'Restore Again',
                className: 'modal-btn modal-btn-primary',
                onClick: async () => {
                  closeModal();
                  // Continue with restore, but don't reuse the group
                  await performRestore(list, lists, true);
                }
              }
            ]
          );
          return;
        }
      } catch (err) {
        // Group doesn't exist anymore - clear it and continue with restore
        list.groupId = null;
      }
    }

    // Collection not open - proceed with restore
    await performRestore(list, lists, false);

  } catch (error) {
    console.error('Error restoring tabs:', error);
    showMessage('Failed to restore tabs', false);
  }
}

// Extracted restore logic
async function performRestore(list, lists, forceNewGroup = false) {
  try {
    // Check if deduplication is enabled
    const settings = await chrome.storage.local.get(SETTINGS_KEY);
    const shouldDeduplicate = settings[SETTINGS_KEY]?.deduplicate || false;

    let tabsToRestore = list.tabs;

    if (shouldDeduplicate) {
      // Get currently open tabs
      const openTabs = await chrome.tabs.query({});
      const openUrls = new Set(openTabs.map(t => t.url));

      // Filter out URLs that are already open
      tabsToRestore = list.tabs.filter(tab => !openUrls.has(tab.url));

      if (tabsToRestore.length === 0) {
        showMessage('All tabs are already open', false);
        return;
      }
    }

    // ✅ Create tabs
    const newTabIds = [];

    // Create all tabs first
    for (const tab of tabsToRestore) {
      const newTab = await chrome.tabs.create({
        url: tab.url,
        active: false
      });
      newTabIds.push(newTab.id);
    }

    // Try to use Chrome Tab Groups API (requires Chrome 89+)
    if (chrome.tabGroups) {
      try {
        // Group all tabs together using Chrome Tab Groups API
        const groupId = await chrome.tabs.group({ tabIds: newTabIds });

        // Update group appearance to match collection
        const groupTitle = forceNewGroup
          ? `${list.name} (copy)`.substring(0, 50)
          : list.name.substring(0, 50);

        await chrome.tabGroups.update(groupId, {
          title: groupTitle,
          color: getGroupColorFromHex(list.color),
          collapsed: false
        });

        // Only update the groupId if this is the first restore (not a duplicate)
        if (!forceNewGroup) {
          list.groupId = groupId;
          await chrome.storage.local.set({ [STORAGE_KEY]: lists });
        }

      } catch (groupError) {
        if (!forceNewGroup) {
          list.groupId = null;
          await chrome.storage.local.set({ [STORAGE_KEY]: lists });
        }
      }
    } else {
      // Fallback for older Chrome versions (< 89)
      if (!forceNewGroup) {
        list.groupId = null;
        await chrome.storage.local.set({ [STORAGE_KEY]: lists });
      }
    }

    const message = shouldDeduplicate && tabsToRestore.length < list.tabs.length
      ? `Restored ${tabsToRestore.length}/${list.tabs.length} tab${tabsToRestore.length !== 1 ? 's' : ''} (skipped duplicates)`
      : `Restored ${tabsToRestore.length} tab${tabsToRestore.length !== 1 ? 's' : ''}`;

    showMessage(message, true);
  } catch (error) {
    console.error('Error restoring tabs:', error);
    showMessage('Failed to restore tabs', false);
  }
}

// Handle re-saving current tabs to an existing list
async function handleResaveList(listId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    const list = lists.find(l => l.id === listId);

    if (!list) {
      showMessage('List not found', false);
      return;
    }

    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabData = tabs
      .filter(tab => !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
      .map(tab => ({
        title: tab.title,
        url: tab.url
      }));

    if (tabData.length === 0) {
      showMessage('No valid tabs to save', false);
      return;
    }

    list.tabs = tabData;
    list.tabCount = tabData.length;
    list.savedAt = new Date().toISOString();

    await chrome.storage.local.set({ [STORAGE_KEY]: lists });

    showMessage('Re-saved', true);
    loadAndDisplayLists();
  } catch (error) {
    console.error('Error re-saving tabs:', error);
    showMessage('Failed to re-save tabs', false);
  }
}

// Handle closing all tabs from a list
async function handleCloseList(listId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    const list = lists.find(l => l.id === listId);

    if (!list) {
      showMessage('List not found', false);
      return;
    }


    let tabsToClose = [];

    // ✅ PROPER APPROACH: Use Tab Group ID first (Chrome's native tracking)
    if (list.groupId && chrome.tabGroups) {
      try {
        // Verify the group still exists
        const group = await chrome.tabGroups.get(list.groupId);

        if (group) {
          // Get ALL tabs that belong to this specific group
          const tabsInGroup = await chrome.tabs.query({ groupId: list.groupId });
          tabsToClose = tabsInGroup.map(tab => tab.id);

        }
      } catch (err) {
        // Group no longer exists - fall back to URL matching
        list.groupId = null;
      }
    }

    // ⚠️ FALLBACK: URL matching (only if no groupId exists)
    if (tabsToClose.length === 0) {

      const allTabs = await chrome.tabs.query({});
      const suspendedUrl = chrome.runtime.getURL('suspended.html');
      const collectionUrls = new Set(list.tabs.map(t => t.url));

      try {
        for (const tab of allTabs) {
          // For suspended tabs, check their original URL from storage
          if (tab.url.startsWith(suspendedUrl)) {
            // Use tab.id directly - it doesn't change when tab is suspended
            const data = await chrome.storage.local.get(`suspended_${tab.id}`);
            const suspendedInfo = data[`suspended_${tab.id}`];

            if (suspendedInfo) {
              let urlMatches = collectionUrls.has(suspendedInfo.url);

              // If exact match fails, try domain matching (handles redirects)
              if (!urlMatches && suspendedInfo.url) {
                try {
                  const suspendedDomain = new URL(suspendedInfo.url).hostname;
                  for (const collectionUrl of collectionUrls) {
                    try {
                      const collectionDomain = new URL(collectionUrl).hostname;
                      if (suspendedDomain === collectionDomain) {
                        urlMatches = true;
                        break;
                      }
                    } catch (e) {}
                  }
                } catch (e) {}
              }

              if (urlMatches) {
                tabsToClose.push(tab.id);
              }
            }
          }
          // For active tabs, check URL directly
          else {
            let urlMatches = collectionUrls.has(tab.url);

            // If exact match fails, try domain matching (handles redirects)
            if (!urlMatches && tab.url) {
              try {
                const tabDomain = new URL(tab.url).hostname;
                for (const collectionUrl of collectionUrls) {
                  try {
                    const collectionDomain = new URL(collectionUrl).hostname;
                    if (tabDomain === collectionDomain) {
                      urlMatches = true;
                      break;
                    }
                  } catch (e) {}
                }
              } catch (e) {}
            }

            if (urlMatches) {
              tabsToClose.push(tab.id);
            }
          }
        }

      } catch (err) {
      }
    }

    if (tabsToClose.length === 0) {
      showMessage('No tabs from this collection are currently open', false);
      return;
    }


    // Close tabs (batch for performance)
    let closedCount = 0;
    try {
      await chrome.tabs.remove(tabsToClose);
      closedCount = tabsToClose.length;
    } catch (err) {
      for (const tabId of tabsToClose) {
        try {
          await chrome.tabs.remove(tabId);
          closedCount++;
        } catch (individualErr) {
          console.error(`   ✗ Failed to close tab ${tabId}:`, individualErr);
        }
      }
    }

    // Clear the group association
    list.groupId = null;
    await chrome.storage.local.set({ [STORAGE_KEY]: lists });

    showMessage(`Closed ${closedCount} tab${closedCount !== 1 ? 's' : ''}`, true);

  } catch (error) {
    console.error('Error closing tabs:', error);
    showMessage('Failed to close tabs', false);
  }
}

// Handle renaming with modal
async function handleRenameList(listId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    const list = lists.find(l => l.id === listId);

    if (!list) {
      showMessage('List not found', false);
      return;
    }

    showModal(
      'Rename List',
      `<input type="text" class="modal-input" id="renameInput" value="${escapeHtml(list.name)}" maxlength="50" />`,
      [
        { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
        {
          text: 'Rename',
          className: 'modal-btn modal-btn-primary',
          onClick: async () => {
            const newName = document.getElementById('renameInput').value.trim();
            if (newName) {
              list.name = newName;
              await chrome.storage.local.set({ [STORAGE_KEY]: lists });
              loadAndDisplayLists();
              showMessage('Renamed', true);
            }
            closeModal();
          }
        }
      ]
    );

    // Focus and select the input
    setTimeout(() => {
      const input = document.getElementById('renameInput');
      input.focus();
      input.select();
    }, 100);
  } catch (error) {
    console.error('Error renaming list:', error);
    showMessage('Failed to rename list', false);
  }
}

// Handle changing color with modal
async function handleChangeColor(listId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    const list = lists.find(l => l.id === listId);

    if (!list) {
      showMessage('List not found', false);
      return;
    }

    const colors = [
      { name: 'Purple', value: '#6366f1' },
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Green', value: '#10b981' },
      { name: 'Yellow', value: '#f59e0b' },
      { name: 'Red', value: '#ef4444' },
      { name: 'Pink', value: '#ec4899' },
      { name: 'Cyan', value: '#06b6d4' },
      { name: 'Gray', value: '#6b7280' }
    ];

    const currentColor = list.color || '#6366f1';
    let selectedColor = currentColor;

    const colorPickerHTML = `
      <div class="color-picker-container">
        <div>
          <div class="color-picker-section-title">Presets</div>
          <div class="color-picker-grid">
            ${colors.map(c => `
              <div class="color-picker-option ${c.value === currentColor ? 'selected' : ''}"
                   style="background: ${c.value}"
                   data-color="${c.value}">
              </div>
            `).join('')}
          </div>
        </div>

        <div class="custom-color-section">
          <div class="color-picker-section-title">Custom Color</div>
          <div class="color-input-container">
            <div class="color-input-wrapper">
              <input type="color"
                     id="customColorPicker"
                     class="color-input-native"
                     value="${currentColor}">
              <input type="text"
                     id="customColorText"
                     class="color-input-text"
                     value="${currentColor}"
                     placeholder="#000000"
                     maxlength="7"
                     pattern="^#[0-9A-Fa-f]{6}$">
            </div>
          </div>
        </div>
      </div>
    `;

    showModal(
      'Choose Color',
      colorPickerHTML,
      [
        { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
        {
          text: 'Apply',
          className: 'modal-btn modal-btn-primary',
          onClick: async () => {
            list.color = selectedColor;
            await chrome.storage.local.set({ [STORAGE_KEY]: lists });
            loadAndDisplayLists();
            showMessage('Color changed', true);
            closeModal();
          }
        }
      ]
    );

    // Get references to custom color inputs
    const customColorPicker = document.getElementById('customColorPicker');
    const customColorText = document.getElementById('customColorText');

    // Add click handlers to preset color options
    document.querySelectorAll('.color-picker-option').forEach(option => {
      option.addEventListener('click', function() {
        document.querySelectorAll('.color-picker-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        selectedColor = this.dataset.color;

        // Update custom inputs
        customColorPicker.value = selectedColor;
        customColorText.value = selectedColor;
      });
    });

    // Handle color picker input
    customColorPicker.addEventListener('input', (e) => {
      const color = e.target.value;
      selectedColor = color;
      customColorText.value = color;

      // Deselect preset options
      document.querySelectorAll('.color-picker-option').forEach(o => o.classList.remove('selected'));
    });

    // Handle text input
    customColorText.addEventListener('input', (e) => {
      let value = e.target.value;

      // Add # if missing
      if (value && !value.startsWith('#')) {
        value = '#' + value;
        e.target.value = value;
      }

      // Validate hex color
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        selectedColor = value;
        customColorPicker.value = value;

        // Deselect preset options
        document.querySelectorAll('.color-picker-option').forEach(o => o.classList.remove('selected'));
      }
    });

    // Handle text input on blur (format and validate)
    customColorText.addEventListener('blur', (e) => {
      let value = e.target.value;

      // Ensure proper format
      if (value && !value.startsWith('#')) {
        value = '#' + value;
      }

      // Validate and format
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        value = value.toUpperCase();
        e.target.value = value;
        selectedColor = value;
        customColorPicker.value = value;
      } else {
        // Reset to current selected color if invalid
        e.target.value = selectedColor;
      }
    });
  } catch (error) {
    console.error('Error changing color:', error);
    showMessage('Failed to change color', false);
  }
}

// Handle customizing button colors for a category
async function handleCustomizeButtons(listId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    const list = lists.find(l => l.id === listId);

    if (!list) {
      showMessage('List not found', false);
      return;
    }

    // Initialize button colors if not present
    if (!list.buttonColors) {
      list.buttonColors = {
        restore: '#34c759',
        resave: '#007aff',
        close: '#ff9f0a',
        delete: '#ff3b30'
      };
    }

    let currentColors = { ...list.buttonColors };

    const customizeHTML = `
      <div class="theme-customizer">
        <div class="theme-section">
          <div class="theme-section-title">Button Colors for "${escapeHtml(list.name)}"</div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentColors.restore}" data-preview="restore"></div>
              <div class="theme-color-name">Restore Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="restore">Change</button>
          </div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentColors.resave}" data-preview="resave"></div>
              <div class="theme-color-name">Re-save Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="resave">Change</button>
          </div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentColors.close}" data-preview="close"></div>
              <div class="theme-color-name">Close All Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="close">Change</button>
          </div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentColors.delete}" data-preview="delete"></div>
              <div class="theme-color-name">Delete Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="delete">Change</button>
          </div>
        </div>

        <div class="theme-section">
          <div class="theme-section-title">Quick Presets</div>
          <div class="theme-preset-grid">
            <div class="theme-preset-card" data-preset="default">
              <div class="theme-preset-name">Default</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #34c759"></div>
                <div class="theme-preset-color" style="background: #007aff"></div>
                <div class="theme-preset-color" style="background: #ff9f0a"></div>
                <div class="theme-preset-color" style="background: #ff3b30"></div>
              </div>
            </div>

            <div class="theme-preset-card" data-preset="pastel">
              <div class="theme-preset-name">Pastel</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #a8e6cf"></div>
                <div class="theme-preset-color" style="background: #aec6cf"></div>
                <div class="theme-preset-color" style="background: #ffd3b6"></div>
                <div class="theme-preset-color" style="background: #ffaaa5"></div>
              </div>
            </div>

            <div class="theme-preset-card" data-preset="neon">
              <div class="theme-preset-name">Neon</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #39ff14"></div>
                <div class="theme-preset-color" style="background: #00d4ff"></div>
                <div class="theme-preset-color" style="background: #ff006e"></div>
                <div class="theme-preset-color" style="background: #ff10f0"></div>
              </div>
            </div>

            <div class="theme-preset-card" data-preset="monochrome">
              <div class="theme-preset-name">Monochrome</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #555555"></div>
                <div class="theme-preset-color" style="background: #333333"></div>
                <div class="theme-preset-color" style="background: #888888"></div>
                <div class="theme-preset-color" style="background: #222222"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    showModal('Customize Buttons', customizeHTML, [
      { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
      {
        text: 'Apply & Close',
        className: 'modal-btn modal-btn-primary',
        onClick: async () => {
          list.buttonColors = currentColors;
          await chrome.storage.local.set({ [STORAGE_KEY]: lists });
          closeModal();
          await loadAndDisplayLists();
          showMessage(' Button colors saved!', true);
        }
      }
    ]);

    // Add event listeners for color picker buttons - Apply immediately when color selected
    document.querySelectorAll('.theme-color-picker-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const colorKey = btn.dataset.color;
        const currentColor = currentColors[colorKey];

        const newColor = await showQuickColorPicker(currentColor);
        if (newColor) {
          currentColors[colorKey] = newColor;

          // Apply immediately
          list.buttonColors = currentColors;
          await chrome.storage.local.set({ [STORAGE_KEY]: lists });

          // Close the customize modal and reload
          closeModal();
          await loadAndDisplayLists();
          showMessage(` ${colorKey.charAt(0).toUpperCase() + colorKey.slice(1)} button color updated!`, true);
        }
      });
    });

    // Add event listeners for preset cards - Apply immediately when clicked
    document.querySelectorAll('.theme-preset-card').forEach(card => {
      card.addEventListener('click', async () => {
        const preset = card.dataset.preset;

        const presets = {
          default: {
            restore: '#34c759',
            resave: '#007aff',
            close: '#ff9f0a',
            delete: '#ff3b30'
          },
          pastel: {
            restore: '#a8e6cf',
            resave: '#aec6cf',
            close: '#ffd3b6',
            delete: '#ffaaa5'
          },
          neon: {
            restore: '#39ff14',
            resave: '#00d4ff',
            close: '#ff006e',
            delete: '#ff10f0'
          },
          monochrome: {
            restore: '#555555',
            resave: '#333333',
            close: '#888888',
            delete: '#222222'
          }
        };

        currentColors = presets[preset];

        // Apply immediately
        list.buttonColors = currentColors;
        await chrome.storage.local.set({ [STORAGE_KEY]: lists });
        await loadAndDisplayLists();

        // Close modal and show success
        closeModal();
        showMessage(` ${preset.charAt(0).toUpperCase() + preset.slice(1)} theme applied!`, true);
      });
    });

  } catch (error) {
    console.error('Error customizing buttons:', error);
    showMessage('Failed to customize buttons', false);
  }
}

// Handle Find Duplicates
async function handleFindDuplicates() {
  // Check for API key
  const result = await chrome.storage.local.get(GEMINI_API_KEY);
  const apiKey = result[GEMINI_API_KEY];

  if (!apiKey) {
    showToast('Please set up your Gemini API key in Settings first', 'Go to Settings', () => {
      switchTab('settings');
    }, 5000);
    return;
  }

  // Get all currently open tabs
  const tabs = await chrome.tabs.query({});
  const validTabs = tabs.filter(tab =>
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://')
  );

  if (validTabs.length < 2) {
    showToast('Need at least 2 tabs open to find duplicates', null, null, 3000);
    return;
  }

  // Show loading
  findDuplicatesBtn.disabled = true;
  findDuplicatesBtn.innerHTML = 'Analyzing...';

  try {
    // Prepare tab data for AI
    const tabData = validTabs.map((tab, idx) => ({
      index: idx,
      title: tab.title,
      url: new URL(tab.url).hostname,
      fullUrl: tab.url
    }));

    const prompt = `Analyze these browser tabs and find duplicates or very similar tabs.

Tabs:
${JSON.stringify(tabData, null, 2)}

Find:
1. Exact duplicates (same URL)
2. Similar pages (same domain/topic but different URLs)
3. Related content that might be redundant

Return ONLY a JSON array of duplicate groups:
[
  {
    "reason": "Duplicate YouTube videos",
    "tabIndices": [0, 3, 7]
  },
  {
    "reason": "Same article on different sites",
    "tabIndices": [2, 5]
  }
]

If no duplicates found, return: []`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text.trim();

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const duplicateGroups = JSON.parse(jsonMatch[0]);

    if (duplicateGroups.length === 0) {
      showToast(' No duplicate tabs found!', null, null, 3000);
      return;
    }

    // Show duplicates in modal
    const duplicatesHTML = `
      <div style="max-height: 400px; overflow-y: auto;">
        <p style="margin-bottom: 16px; color: var(--text-muted);">
          Found ${duplicateGroups.length} group${duplicateGroups.length !== 1 ? 's' : ''} of duplicate or similar tabs:
        </p>
        ${duplicateGroups.map((group, idx) => `
          <div class="preview-group" style="margin-bottom: 16px;">
            <div class="preview-group-header">
              <strong>${escapeHtml(group.reason)}</strong>
              <span style="color: var(--text-muted);">(${group.tabIndices.length} tabs)</span>
            </div>
            <div class="preview-tabs" style="margin-top: 8px;">
              ${group.tabIndices.map(i => {
                const tab = validTabs[i];
                return `<div class="preview-tab" style="padding: 8px; background: var(--bg-subtle); border-radius: 6px; margin-bottom: 4px;">
                  ${escapeHtml(tab.title.substring(0, 60))}${tab.title.length > 60 ? '...' : ''}
                </div>`;
              }).join('')}
            </div>
            <button class="modal-btn modal-btn-secondary" onclick="closeDuplicatesInGroup(${JSON.stringify(group.tabIndices).replace(/"/g, '&quot;')})" style="margin-top: 8px; width: 100%;">
              Close ${group.tabIndices.length - 1} duplicate${group.tabIndices.length > 2 ? 's' : ''} (keep first)
            </button>
          </div>
        `).join('')}
      </div>
    `;

    // Store tab data globally for close function
    window.duplicateTabsData = validTabs;

    showModal(
      'Duplicate Tabs Found',
      duplicatesHTML,
      [
        { text: 'Close', className: 'modal-btn modal-btn-primary', onClick: closeModal }
      ]
    );

  } catch (error) {
    console.error('Duplicate detection error:', error);
    showToast(' Duplicate detection failed. Please try again.', null, null, 5000);
  } finally {
    findDuplicatesBtn.disabled = false;
    findDuplicatesBtn.innerHTML = 'Find Duplicates';
  }
}

// Close duplicates in a group (keep first tab)
window.closeDuplicatesInGroup = async function(tabIndices) {
  try {
    const validTabs = window.duplicateTabsData;
    const tabsToClose = tabIndices.slice(1).map(i => validTabs[i].id);

    await chrome.tabs.remove(tabsToClose);
    closeModal();
    showToast(` Closed ${tabsToClose.length} duplicate tab${tabsToClose.length !== 1 ? 's' : ''}!`, null, null, 3000);
  } catch (error) {
    console.error('Error closing duplicates:', error);
    showToast('Failed to close tabs', null, null, 3000);
  }
};

// Handle AI Search
async function handleAiSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    showToast('Please enter a search query', null, null, 2000);
    return;
  }

  // Check for API key
  const result = await chrome.storage.local.get(GEMINI_API_KEY);
  const apiKey = result[GEMINI_API_KEY];

  if (!apiKey) {
    showToast('Please set up your Gemini API key in Settings first', 'Go to Settings', () => {
      switchTab('settings');
    }, 5000);
    return;
  }

  // Show loading
  aiSearchBtn.disabled = true;
  aiSearchBtn.innerHTML = '...';

  try {
    // Prepare collections data for AI
    const collectionsData = allLists.map(list => ({
      id: list.id,
      name: list.name,
      tabCount: list.tabCount,
      tabs: list.tabs.map(tab => ({
        title: tab.title,
        url: new URL(tab.url).hostname
      }))
    }));

    const prompt = `User query: "${query}"

Collections database:
${JSON.stringify(collectionsData, null, 2)}

Analyze the user's natural language query and return the IDs of matching collections.
Consider:
- Collection names
- Tab titles and URLs
- Topics and themes
- Patterns (e.g., "YouTube" should match youtube.com tabs)

Return ONLY a JSON array of collection IDs, like: [123, 456, 789]
If no matches, return: []`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text.trim();

    // Extract JSON array from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const matchingIds = JSON.parse(jsonMatch[0]);

    if (matchingIds.length === 0) {
      showToast('No collections found matching your query', null, null, 3000);
      return;
    }

    // Filter lists to show only AI matches
    const filteredLists = allLists.filter(list => matchingIds.includes(list.id));

    emptyState.classList.add('hidden');
    renderLists(filteredLists);

    showToast(`Found ${matchingIds.length} collection${matchingIds.length !== 1 ? 's' : ''}!`, null, null, 2000);

  } catch (error) {
    console.error('AI search error:', error);
    showToast(' AI search failed. Using regular search instead.', null, null, 3000);
    // Fall back to regular search
    currentSearchQuery = query.toLowerCase();
    renderFilteredLists();
  } finally {
    aiSearchBtn.disabled = false;
    aiSearchBtn.innerHTML = 'AI';
  }
}

// Handle AI Summary
async function handleAiSummary(listId) {
  try {
    // Check for API key
    const result = await chrome.storage.local.get([STORAGE_KEY, GEMINI_API_KEY]);
    const apiKey = result[GEMINI_API_KEY];

    if (!apiKey) {
      showToast('Please set up your Gemini API key in Settings first', 'Go to Settings', () => {
        switchTab('settings');
      }, 5000);
      return;
    }

    const lists = result[STORAGE_KEY] || [];
    const list = lists.find(l => l.id === listId);

    if (!list || !list.tabs) {
      showMessage('List not found', false);
      return;
    }

    // Show loading state
    const button = document.querySelector(`[data-action="ai-summary"][data-id="${listId}"]`);
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '...';

    try {
      // Prepare tab data for AI
      const tabData = list.tabs.map(tab => ({
        title: tab.title,
        url: new URL(tab.url).hostname
      }));

      const prompt = `Analyze this browser tab collection and provide a concise summary (2-3 sentences max).

Collection name: "${list.name}"
Tabs (${list.tabs.length}):
${JSON.stringify(tabData, null, 2)}

Provide a helpful summary that describes:
1. What topics/themes these tabs cover
2. The main purpose of this collection
3. Any notable patterns

Return ONLY the summary text, no JSON, no formatting.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const summary = data.candidates[0].content.parts[0].text.trim();

      // Save summary to list
      list.aiSummary = summary;
      await chrome.storage.local.set({ [STORAGE_KEY]: lists });

      // Show summary in modal
      showModal(
        `AI Summary: ${escapeHtml(list.name)}`,
        `
          <div style="padding: 16px; background: var(--bg-subtle); border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0; line-height: 1.6;">${escapeHtml(summary)}</p>
          </div>
          <div style="color: var(--text-muted); font-size: 13px;">
            ${list.tabs.length} tabs analyzed
          </div>
        `,
        [
          { text: 'Close', className: 'modal-btn modal-btn-primary', onClick: closeModal }
        ]
      );

      // Refresh display to show summary
      await loadAndDisplayLists();

    } catch (error) {
      console.error('AI summary error:', error);
      showToast(' Failed to generate summary. Please try again.', null, null, 5000);
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }

  } catch (error) {
    console.error('Error generating AI summary:', error);
    showMessage('Failed to generate summary', false);
  }
}

// Handle deleting with undo
async function handleDeleteList(listId) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    const listIndex = lists.findIndex(l => l.id === listId);

    if (listIndex === -1) {
      showMessage('List not found', false);
      return;
    }

    deletedList = { list: lists[listIndex], index: listIndex };
    const filteredLists = lists.filter(l => l.id !== listId);

    await chrome.storage.local.set({ [STORAGE_KEY]: filteredLists });
    loadAndDisplayLists();

    // Show toast with undo option
    showToast('List deleted', 'Undo', handleUndoDelete, 5000);
  } catch (error) {
    console.error('Error deleting list:', error);
    showMessage('Failed to delete list', false);
  }
}

// Handle undo delete
async function handleUndoDelete() {
  if (!deletedList) return;

  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];

    lists.splice(deletedList.index, 0, deletedList.list);

    await chrome.storage.local.set({ [STORAGE_KEY]: lists });
    loadAndDisplayLists();

    deletedList = null;
    hideToast();
    showMessage(' Restored!', true);
  } catch (error) {
    console.error('Error undoing delete:', error);
  }
}

// Export lists
async function handleExport() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];

    if (lists.length === 0) {
      showMessage('No lists to export', false);
      return;
    }

    const dataStr = JSON.stringify(lists, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `savetab-backup-${timestamp}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
    showMessage(' Exported!', true);
  } catch (error) {
    console.error('Error exporting lists:', error);
    showMessage('Failed to export', false);
  }
}

// Import lists
function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';

  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedLists = JSON.parse(text);

      if (!Array.isArray(importedLists)) {
        showMessage('Invalid file format', false);
        return;
      }

      // Validate each list has required fields
      const invalidLists = importedLists.filter(list => {
        return !list.id || !list.name || !list.tabs || !Array.isArray(list.tabs);
      });

      if (invalidLists.length > 0) {
        showMessage(`Invalid file: ${invalidLists.length} list(s) missing required fields`, false);
        return;
      }

      // Validate each tab has required fields
      for (const list of importedLists) {
        const invalidTabs = list.tabs.filter(tab => !tab.url || !tab.title);
        if (invalidTabs.length > 0) {
          showMessage(`Invalid file: "${list.name}" has ${invalidTabs.length} invalid tab(s)`, false);
          return;
        }
      }

      showModal(
        'Import Lists',
        `<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">
          Found ${importedLists.length} list${importedLists.length !== 1 ? 's' : ''} to import.<br><br>
          This will merge with your existing ${allLists.length} list${allLists.length !== 1 ? 's' : ''}.
        </p>`,
        [
          { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
          {
            text: 'Import',
            className: 'modal-btn modal-btn-primary',
            onClick: async () => {
              const result = await chrome.storage.local.get(STORAGE_KEY);
              const existingLists = result[STORAGE_KEY] || [];

              const mergedLists = [...importedLists, ...existingLists];
              await chrome.storage.local.set({ [STORAGE_KEY]: mergedLists });

              loadAndDisplayLists();
              showMessage(` Imported ${importedLists.length} list${importedLists.length !== 1 ? 's' : ''}!`, true);
              closeModal();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error importing lists:', error);
      showMessage('Failed to import file', false);
    }
  });

  input.click();
}

// Handle clear all data
async function handleClearAll() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];

    if (lists.length === 0) {
      showMessage('No data to clear', false);
      return;
    }

    showModal(
      'Clear All Data?',
      `<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">
        This will permanently delete all ${lists.length} collection${lists.length !== 1 ? 's' : ''}.<br><br>
        <strong style="color: var(--red);">This action cannot be undone!</strong><br><br>
        Consider exporting your data first.
      </p>`,
      [
        { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
        {
          text: 'Delete All',
          className: 'modal-btn modal-btn-primary',
          onClick: async () => {
            await chrome.storage.local.set({ [STORAGE_KEY]: [] });
            loadAndDisplayLists();
            closeModal();
            showMessage(' All data cleared', true);
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// Show statistics
async function showStats() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];

    const totalLists = lists.length;
    const totalTabs = lists.reduce((sum, list) => sum + list.tabCount, 0);
    const avgTabsPerList = totalLists > 0 ? Math.round(totalTabs / totalLists) : 0;

    const storageUsed = new Blob([JSON.stringify(lists)]).size;
    const storageKB = (storageUsed / 1024).toFixed(1);

    const statsHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalLists}</div>
          <div class="stat-label">Collections</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalTabs}</div>
          <div class="stat-label">Total Tabs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgTabsPerList}</div>
          <div class="stat-label">Avg per List</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${storageKB}</div>
          <div class="stat-label">KB Used</div>
        </div>
      </div>
    `;

    showModal('Statistics', statsHTML, [
      { text: 'Close', className: 'modal-btn modal-btn-primary', onClick: closeModal }
    ]);
  } catch (error) {
    console.error('Error showing stats:', error);
  }
}

// Modal helpers
function showModal(title, bodyHTML, buttons = []) {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHTML;

  modalFooter.innerHTML = '';
  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.className = btn.className;
    button.addEventListener('click', btn.onClick);
    modalFooter.appendChild(button);
  });

  modal.classList.add('show');
}

function closeModal() {
  modal.classList.remove('show');
}

// Toast helpers
function showToast(message, actionText = null, actionCallback = null, duration = 3000) {
  toastMessage.textContent = message;

  if (actionText && actionCallback) {
    toastAction.textContent = actionText;
    toastAction.style.display = 'block';
    toastAction.onclick = actionCallback;
  } else {
    toastAction.style.display = 'none';
  }

  toast.classList.add('show');

  setTimeout(() => {
    if (toast.classList.contains('show')) {
      hideToast();
    }
  }, duration);
}

function hideToast() {
  toast.classList.remove('show');
}

// Show temporary message
function showMessage(text, isSuccess) {
  saveMessage.textContent = text;
  saveMessage.className = 'message show';

  if (isSuccess) {
    saveMessage.classList.add('success');
  }

  setTimeout(() => {
    saveMessage.classList.remove('show');
  }, 1500);
}

// Format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) {
    return 'Just now';
  } else if (diffSecs < 60) {
    return `${diffSecs}s ago`;
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load and apply theme
async function loadTheme() {
  try {
    const result = await chrome.storage.local.get(THEME_KEY);
    const theme = result[THEME_KEY] || DEFAULT_THEME;
    applyTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
    applyTheme(DEFAULT_THEME);
  }
}

// Apply theme colors to CSS variables
function applyTheme(theme) {
  const root = document.documentElement;

  // Apply accent color
  if (theme.accentColor) {
    root.style.setProperty('--accent', theme.accentColor);
    root.style.setProperty('--accent-text', theme.accentColor);
  }

  // Apply button colors
  if (theme.restoreBtn) {
    root.style.setProperty('--green', theme.restoreBtn);
    root.style.setProperty('--green-dark', darkenColor(theme.restoreBtn, 10));
  }

  if (theme.resaveBtn) {
    // Resave uses accent color, so we set a custom variable
    const style = document.createElement('style');
    style.id = 'custom-resave-color';
    const existingStyle = document.getElementById('custom-resave-color');
    if (existingStyle) existingStyle.remove();

    style.textContent = `.btn-resave { background: ${theme.resaveBtn} !important; } .btn-resave:hover { background: ${darkenColor(theme.resaveBtn, 10)} !important; }`;
    document.head.appendChild(style);
  }

  if (theme.closeBtn) {
    root.style.setProperty('--orange', theme.closeBtn);
    root.style.setProperty('--orange-dark', darkenColor(theme.closeBtn, 10));
  }

  if (theme.deleteBtn) {
    root.style.setProperty('--red', theme.deleteBtn);
    root.style.setProperty('--red-dark', darkenColor(theme.deleteBtn, 10));
  }
}

// Show theme customizer modal
async function showThemeCustomizer() {
  try {
    const result = await chrome.storage.local.get(THEME_KEY);
    let currentTheme = result[THEME_KEY] || { ...DEFAULT_THEME };

    const themeHTML = `
      <div class="theme-customizer">
        <div class="theme-section">
          <div class="theme-section-title">Button Colors</div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentTheme.restoreBtn}" data-preview="restoreBtn"></div>
              <div class="theme-color-name">Restore Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="restoreBtn">Change</button>
          </div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentTheme.resaveBtn}" data-preview="resaveBtn"></div>
              <div class="theme-color-name">Re-save Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="resaveBtn">Change</button>
          </div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentTheme.closeBtn}" data-preview="closeBtn"></div>
              <div class="theme-color-name">Close All Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="closeBtn">Change</button>
          </div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentTheme.deleteBtn}" data-preview="deleteBtn"></div>
              <div class="theme-color-name">Delete Button</div>
            </div>
            <button class="theme-color-picker-btn" data-color="deleteBtn">Change</button>
          </div>
        </div>

        <div class="theme-section">
          <div class="theme-section-title">Accent Color</div>

          <div class="theme-color-item">
            <div class="theme-color-label">
              <div class="theme-color-preview" style="background: ${currentTheme.accentColor}" data-preview="accentColor"></div>
              <div class="theme-color-name">Primary Accent</div>
            </div>
            <button class="theme-color-picker-btn" data-color="accentColor">Change</button>
          </div>
        </div>

        <div class="theme-section">
          <div class="theme-section-title">Theme Presets</div>
          <div class="theme-preset-grid">
            <div class="theme-preset-card" data-preset="default">
              <div class="theme-preset-name">Default</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #34c759"></div>
                <div class="theme-preset-color" style="background: #007aff"></div>
                <div class="theme-preset-color" style="background: #ff9f0a"></div>
                <div class="theme-preset-color" style="background: #ff3b30"></div>
              </div>
            </div>

            <div class="theme-preset-card" data-preset="pastel">
              <div class="theme-preset-name">Pastel</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #a8e6cf"></div>
                <div class="theme-preset-color" style="background: #aec6cf"></div>
                <div class="theme-preset-color" style="background: #ffd3b6"></div>
                <div class="theme-preset-color" style="background: #ffaaa5"></div>
              </div>
            </div>

            <div class="theme-preset-card" data-preset="neon">
              <div class="theme-preset-name">Neon</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #39ff14"></div>
                <div class="theme-preset-color" style="background: #00d4ff"></div>
                <div class="theme-preset-color" style="background: #ff006e"></div>
                <div class="theme-preset-color" style="background: #ff10f0"></div>
              </div>
            </div>

            <div class="theme-preset-card" data-preset="monochrome">
              <div class="theme-preset-name">Monochrome</div>
              <div class="theme-preset-colors">
                <div class="theme-preset-color" style="background: #555555"></div>
                <div class="theme-preset-color" style="background: #333333"></div>
                <div class="theme-preset-color" style="background: #888888"></div>
                <div class="theme-preset-color" style="background: #222222"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    showModal('Theme Customization', themeHTML, [
      { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
      {
        text: 'Save Theme',
        className: 'modal-btn modal-btn-primary',
        onClick: async () => {
          await chrome.storage.local.set({ [THEME_KEY]: currentTheme });
          applyTheme(currentTheme);
          closeModal();
          showMessage(' Theme saved!', true);
        }
      }
    ]);

    // Add event listeners for color picker buttons
    document.querySelectorAll('.theme-color-picker-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const colorKey = btn.dataset.color;
        const currentColor = currentTheme[colorKey];

        // Show color picker
        const newColor = await showQuickColorPicker(currentColor);
        if (newColor) {
          currentTheme[colorKey] = newColor;

          // Update preview
          const preview = document.querySelector(`[data-preview="${colorKey}"]`);
          if (preview) {
            preview.style.background = newColor;
          }
        }
      });
    });

    // Add event listeners for preset cards
    document.querySelectorAll('.theme-preset-card').forEach(card => {
      card.addEventListener('click', () => {
        const preset = card.dataset.preset;

        const presets = {
          default: { ...DEFAULT_THEME },
          pastel: {
            accentColor: '#aec6cf',
            restoreBtn: '#a8e6cf',
            resaveBtn: '#aec6cf',
            closeBtn: '#ffd3b6',
            deleteBtn: '#ffaaa5'
          },
          neon: {
            accentColor: '#00d4ff',
            restoreBtn: '#39ff14',
            resaveBtn: '#00d4ff',
            closeBtn: '#ff006e',
            deleteBtn: '#ff10f0'
          },
          monochrome: {
            accentColor: '#333333',
            restoreBtn: '#555555',
            resaveBtn: '#333333',
            closeBtn: '#888888',
            deleteBtn: '#222222'
          }
        };

        currentTheme = presets[preset];

        // Update all previews
        document.querySelector('[data-preview="restoreBtn"]').style.background = currentTheme.restoreBtn;
        document.querySelector('[data-preview="resaveBtn"]').style.background = currentTheme.resaveBtn;
        document.querySelector('[data-preview="closeBtn"]').style.background = currentTheme.closeBtn;
        document.querySelector('[data-preview="deleteBtn"]').style.background = currentTheme.deleteBtn;
        document.querySelector('[data-preview="accentColor"]').style.background = currentTheme.accentColor;

        // Update active state
        document.querySelectorAll('.theme-preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

  } catch (error) {
    console.error('Error showing theme customizer:', error);
  }
}

// Quick color picker (reuses existing color picker logic)
function showQuickColorPicker(currentColor) {
  return new Promise((resolve) => {
    const colors = [
      { name: 'Purple', value: '#6366f1' },
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Green', value: '#10b981' },
      { name: 'Yellow', value: '#f59e0b' },
      { name: 'Red', value: '#ef4444' },
      { name: 'Pink', value: '#ec4899' },
      { name: 'Cyan', value: '#06b6d4' },
      { name: 'Gray', value: '#6b7280' }
    ];

    let selectedColor = currentColor;

    const colorPickerHTML = `
      <div class="color-picker-container">
        <div>
          <div class="color-picker-section-title">Presets</div>
          <div class="color-picker-grid">
            ${colors.map(c => `
              <div class="color-picker-option ${c.value === currentColor ? 'selected' : ''}"
                   style="background: ${c.value}"
                   data-color="${c.value}">
              </div>
            `).join('')}
          </div>
        </div>

        <div class="custom-color-section">
          <div class="color-picker-section-title">Custom Color</div>
          <div class="color-input-container">
            <div class="color-input-wrapper">
              <input type="color"
                     id="quickColorPicker"
                     class="color-input-native"
                     value="${currentColor}">
              <input type="text"
                     id="quickColorText"
                     class="color-input-text"
                     value="${currentColor}"
                     placeholder="#000000"
                     maxlength="7">
            </div>
          </div>
        </div>
      </div>
    `;

    showModal('Choose Color', colorPickerHTML, [
      { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: () => { closeModal(); resolve(null); } },
      {
        text: 'Select',
        className: 'modal-btn modal-btn-primary',
        onClick: () => { closeModal(); resolve(selectedColor); }
      }
    ]);

    const quickColorPicker = document.getElementById('quickColorPicker');
    const quickColorText = document.getElementById('quickColorText');

    document.querySelectorAll('.color-picker-option').forEach(option => {
      option.addEventListener('click', function() {
        document.querySelectorAll('.color-picker-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        selectedColor = this.dataset.color;
        quickColorPicker.value = selectedColor;
        quickColorText.value = selectedColor;
      });
    });

    quickColorPicker.addEventListener('input', (e) => {
      selectedColor = e.target.value;
      quickColorText.value = selectedColor;
      document.querySelectorAll('.color-picker-option').forEach(o => o.classList.remove('selected'));
    });

    quickColorText.addEventListener('input', (e) => {
      let value = e.target.value;
      if (value && !value.startsWith('#')) {
        value = '#' + value;
        e.target.value = value;
      }
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        selectedColor = value;
        quickColorPicker.value = value;
        document.querySelectorAll('.color-picker-option').forEach(o => o.classList.remove('selected'));
      }
    });
  });
}

// Reset theme to defaults
async function resetTheme() {
  try {
    showModal(
      'Reset Theme?',
      '<p style="color: var(--text-muted); font-size: 13px; line-height: 1.5;">This will restore all colors to their default values.</p>',
      [
        { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
        {
          text: 'Reset',
          className: 'modal-btn modal-btn-primary',
          onClick: async () => {
            await chrome.storage.local.set({ [THEME_KEY]: DEFAULT_THEME });
            applyTheme(DEFAULT_THEME);
            closeModal();
            showMessage(' Theme reset!', true);
          }
        }
      ]
    );
  } catch (error) {
    console.error('Error resetting theme:', error);
  }
}

// ==================== TAB GROUP HELPER FUNCTIONS ====================

// Map hex colors to Chrome group colors
function getGroupColorFromHex(hexColor) {
  const colorMap = {
    '#6366f1': 'purple',
    '#3b82f6': 'blue',
    '#10b981': 'green',
    '#f59e0b': 'yellow',
    '#ef4444': 'red',
    '#ec4899': 'pink',
    '#06b6d4': 'cyan',
    '#6b7280': 'grey'
  };

  return colorMap[hexColor] || 'blue';
}

// Generate URL fingerprint for fallback matching
function generateUrlFingerprint(tabs) {
  return tabs.map(t => t.url).sort().join('|||');
}

// ==================== TAB SUSPENDER FUNCTIONS ====================

// Load and display suspender stats
async function loadSuspenderStats() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSuspenderStats' });
    if (response) {
      updateStatsDisplay(response);
    }
  } catch (error) {
    // Background worker might not be ready yet - that's OK
  }
}

// Update stats display in UI (stats widget removed from conversion-focused UI)
function updateStatsDisplay(stats) {
  // Stats widget was removed during UI redesign
  // Tab suspender stats are now integrated into the background
  // Could be re-added to hero section or settings tab if needed
}

// Load suspender settings
async function loadSuspenderSettings() {
  try {
    const result = await chrome.storage.sync.get([
      'suspenderEnabled',
      'suspendAfter',
      'neverSuspendPinned',
      'neverSuspendAudio'
    ]);

    document.getElementById('suspenderEnabled').checked = result.suspenderEnabled || false;
    document.getElementById('suspendAfter').value = result.suspendAfter || 30;
    document.getElementById('neverSuspendPinned').checked = result.neverSuspendPinned !== false;
    document.getElementById('neverSuspendAudio').checked = result.neverSuspendAudio !== false;
  } catch (error) {
    console.error('Error loading suspender settings:', error);
  }
}

// Save suspender settings
async function saveSuspenderSettings() {
  try {
    const settings = {
      suspenderEnabled: document.getElementById('suspenderEnabled').checked,
      suspendAfter: parseInt(document.getElementById('suspendAfter').value),
      neverSuspendPinned: document.getElementById('neverSuspendPinned').checked,
      neverSuspendAudio: document.getElementById('neverSuspendAudio').checked
    };

    await chrome.storage.sync.set(settings);

    // Try to notify background script (don't fail if worker isn't ready)
    try {
      await chrome.runtime.sendMessage({
        action: 'updateSuspenderSettings',
        settings: settings
      });
    } catch (bgError) {
    }

    showMessage(' Suspender settings saved!', true);
  } catch (error) {
    console.error('Error saving suspender settings:', error);
    showMessage('Failed to save settings', false);
  }
}

// Setup suspender event listeners
function setupSuspenderListeners() {
  // Load settings when settings tab is opened
  loadSuspenderSettings();

  // Save settings on change
  document.getElementById('suspenderEnabled').addEventListener('change', saveSuspenderSettings);
  document.getElementById('suspendAfter').addEventListener('change', saveSuspenderSettings);
  document.getElementById('neverSuspendPinned').addEventListener('change', saveSuspenderSettings);
  document.getElementById('neverSuspendAudio').addEventListener('change', saveSuspenderSettings);

  // Suspend now button
  const suspendNowBtn = document.getElementById('suspendNow');
  if (suspendNowBtn) {
    suspendNowBtn.addEventListener('click', async () => {
      try {
        // Get current tabs to show user what we're working with
        const tabs = await chrome.tabs.query({});
        const validTabs = tabs.filter(t =>
          !t.url.startsWith('chrome://') &&
          !t.url.startsWith('chrome-extension://') &&
          !t.url.includes('suspended.html')
        );

        const response = await chrome.runtime.sendMessage({ action: 'suspendNow' });

        if (response && response.count > 0) {
          showMessage(` Suspended ${response.count} tab${response.count !== 1 ? 's' : ''}!`, true);
          loadSuspenderStats();
        } else {
          showMessage('No tabs to suspend (check console for details)', false);
        }
      } catch (error) {
        console.error('Error suspending tabs:', error);
        showMessage('Failed to suspend tabs - check console', false);
      }
    });
  } else {
    console.error('suspendNow button not found in DOM!');
  }

  // Update stats periodically
  setInterval(loadSuspenderStats, 5000);
}

// ==================== ID MIGRATION ====================
// Fix decimal IDs from old AI Smart Group feature
async function migrateDecimalIds() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const lists = result[STORAGE_KEY] || [];
    let migrated = false;

    const migratedLists = lists.map(list => {
      // Check if ID is a decimal number
      if (list.id % 1 !== 0) {
        migrated = true;
        return {
          ...list,
          id: Math.floor(list.id) // Convert to integer
        };
      }
      return list;
    });

    if (migrated) {
      await chrome.storage.local.set({ [STORAGE_KEY]: migratedLists });
      await loadAndDisplayLists();
    }
  } catch (error) {
    console.error('Error migrating IDs:', error);
  }
}

// ==================== CUSTOMIZE TAB FUNCTIONALITY ====================
function setupCustomizeTab() {
  try {
    // Get all elements
    const themePresets = document.querySelectorAll('.theme-preset');
    const primaryColor = document.getElementById('primaryColor');
    const secondaryColor = document.getElementById('secondaryColor');
    const accentColor = document.getElementById('accentColor');
    const backgroundType = document.getElementById('backgroundType');
    const blurAmount = document.getElementById('blurAmount');
    const blurValue = document.getElementById('blurValue');
    const glassOpacity = document.getElementById('glassOpacity');
    const glassOpacityValue = document.getElementById('glassOpacityValue');
    const borderRadius = document.getElementById('borderRadius');
    const borderRadiusValue = document.getElementById('borderRadiusValue');
    const animationSpeed = document.getElementById('animationSpeed');
    const rotatingBg = document.getElementById('rotatingBg');
    const resetCustomization = document.getElementById('resetCustomization');

      themePresets: themePresets.length,
      primaryColor: !!primaryColor,
      backgroundType: !!backgroundType,
      blurAmount: !!blurAmount,
      resetCustomization: !!resetCustomization
    });

    // Theme preset buttons
    if (themePresets.length > 0) {
      themePresets.forEach(btn => {
        btn.addEventListener('click', () => {
          // Remove active from all
          themePresets.forEach(b => b.classList.remove('active'));
          // Add active to clicked
          btn.classList.add('active');

          const theme = btn.dataset.theme;
          applyThemePreset(theme);
        });
      });
    }

  // Color pickers
  if (primaryColor) {
    primaryColor.addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--color-primary', e.target.value);
      saveCustomization();
    });
  }

  if (secondaryColor) {
    secondaryColor.addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--color-secondary', e.target.value);
      saveCustomization();
    });
  }

  if (accentColor) {
    accentColor.addEventListener('input', (e) => {
      document.documentElement.style.setProperty('--accent', e.target.value);
      saveCustomization();
    });
  }

  // Background type
  if (backgroundType) {
    backgroundType.addEventListener('change', (e) => {
      applyBackgroundType(e.target.value);
      saveCustomization();
    });
  }

  // Blur amount slider
  if (blurAmount && blurValue) {
    blurAmount.addEventListener('input', (e) => {
      const value = e.target.value;
      blurValue.textContent = `${value}px`;
      document.documentElement.style.setProperty('--blur-amount', `${value}px`);
      saveCustomization();
    });
  }

  // Glass opacity slider
  if (glassOpacity && glassOpacityValue) {
    glassOpacity.addEventListener('input', (e) => {
      const value = e.target.value;
      glassOpacityValue.textContent = `${value}%`;
      document.documentElement.style.setProperty('--glass-opacity', value / 100);
      saveCustomization();
    });
  }

  // Border radius slider
  if (borderRadius && borderRadiusValue) {
    borderRadius.addEventListener('input', (e) => {
      const value = e.target.value;
      borderRadiusValue.textContent = `${value}px`;
      document.documentElement.style.setProperty('--radius-md', `${value}px`);
      document.documentElement.style.setProperty('--radius-lg', `${value * 1.5}px`);
      saveCustomization();
    });
  }

  // Animation speed
  if (animationSpeed) {
    animationSpeed.addEventListener('change', (e) => {
      document.documentElement.style.setProperty('--transition', `${e.target.value}s ease`);
      saveCustomization();
    });
  }

  // Rotating background toggle
  if (rotatingBg) {
    rotatingBg.addEventListener('change', (e) => {
      const radialBg = document.querySelector('.radial-gradient-bg');
      if (radialBg) {
        radialBg.style.display = e.target.checked ? 'block' : 'none';
      }
      saveCustomization();
    });
  }

  // Reset button
  if (resetCustomization) {
    resetCustomization.addEventListener('click', () => {
      resetCustomizationSettings();
    });
  }

    // Load saved customization on init
    loadCustomization();
  } catch (error) {
    console.error('Error setting up customize tab:', error);
  }
}

function applyThemePreset(theme) {
  const presets = {
    glass: {
      backgroundType: 'animated-gradient',
      blur: 20,
      opacity: 8,
      borderRadius: 16
    },
    solid: {
      backgroundType: 'solid',
      blur: 0,
      opacity: 100,
      borderRadius: 12
    },
    minimal: {
      backgroundType: 'transparent',
      blur: 0,
      opacity: 5,
      borderRadius: 8
    },
    gradient: {
      backgroundType: 'static-gradient',
      blur: 10,
      opacity: 15,
      borderRadius: 20
    }
  };

  const preset = presets[theme];
  if (!preset) return;

  // Apply preset values
  const backgroundType = document.getElementById('backgroundType');
  const blurAmount = document.getElementById('blurAmount');
  const blurValue = document.getElementById('blurValue');
  const glassOpacity = document.getElementById('glassOpacity');
  const glassOpacityValue = document.getElementById('glassOpacityValue');
  const borderRadius = document.getElementById('borderRadius');
  const borderRadiusValue = document.getElementById('borderRadiusValue');

  if (backgroundType) {
    backgroundType.value = preset.backgroundType;
    applyBackgroundType(preset.backgroundType);
  }

  if (blurAmount && blurValue) {
    blurAmount.value = preset.blur;
    blurValue.textContent = `${preset.blur}px`;
    document.documentElement.style.setProperty('--blur-amount', `${preset.blur}px`);
  }

  if (glassOpacity && glassOpacityValue) {
    glassOpacity.value = preset.opacity;
    glassOpacityValue.textContent = `${preset.opacity}%`;
    document.documentElement.style.setProperty('--glass-opacity', preset.opacity / 100);
  }

  if (borderRadius && borderRadiusValue) {
    borderRadius.value = preset.borderRadius;
    borderRadiusValue.textContent = `${preset.borderRadius}px`;
    document.documentElement.style.setProperty('--radius-md', `${preset.borderRadius}px`);
    document.documentElement.style.setProperty('--radius-lg', `${preset.borderRadius * 1.5}px`);
  }

  saveCustomization();
}

function applyBackgroundType(type) {
  const body = document.body;

  // Remove all background classes
  body.classList.remove('bg-animated-gradient', 'bg-static-gradient', 'bg-solid', 'bg-transparent');

  // Add new class
  switch(type) {
    case 'animated-gradient':
      body.classList.add('bg-animated-gradient');
      break;
    case 'static-gradient':
      body.classList.add('bg-static-gradient');
      break;
    case 'solid':
      body.classList.add('bg-solid');
      break;
    case 'transparent':
      body.classList.add('bg-transparent');
      break;
  }
}

async function saveCustomization() {
  const settings = {
    primaryColor: document.getElementById('primaryColor')?.value,
    secondaryColor: document.getElementById('secondaryColor')?.value,
    accentColor: document.getElementById('accentColor')?.value,
    backgroundType: document.getElementById('backgroundType')?.value,
    blurAmount: document.getElementById('blurAmount')?.value,
    glassOpacity: document.getElementById('glassOpacity')?.value,
    borderRadius: document.getElementById('borderRadius')?.value,
    animationSpeed: document.getElementById('animationSpeed')?.value,
    rotatingBg: document.getElementById('rotatingBg')?.checked
  };

  await chrome.storage.local.set({ customization: settings });
}

async function loadCustomization() {
  try {
    const result = await chrome.storage.local.get('customization');
    const settings = result.customization;

    if (!settings) return;

    // Apply saved settings with null checks
    const primaryColor = document.getElementById('primaryColor');
    if (settings.primaryColor && primaryColor) {
      primaryColor.value = settings.primaryColor;
      document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
    }

    const secondaryColor = document.getElementById('secondaryColor');
    if (settings.secondaryColor && secondaryColor) {
      secondaryColor.value = settings.secondaryColor;
      document.documentElement.style.setProperty('--color-secondary', settings.secondaryColor);
    }

    const accentColor = document.getElementById('accentColor');
    if (settings.accentColor && accentColor) {
      accentColor.value = settings.accentColor;
      document.documentElement.style.setProperty('--accent', settings.accentColor);
    }

    const backgroundType = document.getElementById('backgroundType');
    if (settings.backgroundType && backgroundType) {
      backgroundType.value = settings.backgroundType;
      applyBackgroundType(settings.backgroundType);
    }

    const blurAmount = document.getElementById('blurAmount');
    const blurValue = document.getElementById('blurValue');
    if (settings.blurAmount && blurAmount && blurValue) {
      blurAmount.value = settings.blurAmount;
      blurValue.textContent = `${settings.blurAmount}px`;
      document.documentElement.style.setProperty('--blur-amount', `${settings.blurAmount}px`);
    }

    const glassOpacity = document.getElementById('glassOpacity');
    const glassOpacityValue = document.getElementById('glassOpacityValue');
    if (settings.glassOpacity && glassOpacity && glassOpacityValue) {
      glassOpacity.value = settings.glassOpacity;
      glassOpacityValue.textContent = `${settings.glassOpacity}%`;
      document.documentElement.style.setProperty('--glass-opacity', settings.glassOpacity / 100);
    }

    const borderRadius = document.getElementById('borderRadius');
    const borderRadiusValue = document.getElementById('borderRadiusValue');
    if (settings.borderRadius && borderRadius && borderRadiusValue) {
      borderRadius.value = settings.borderRadius;
      document.getElementById('borderRadiusValue').textContent = `${settings.borderRadius}px`;
      document.documentElement.style.setProperty('--radius-md', `${settings.borderRadius}px`);
      document.documentElement.style.setProperty('--radius-lg', `${settings.borderRadius * 1.5}px`);
    }

    const animationSpeed = document.getElementById('animationSpeed');
    if (settings.animationSpeed && animationSpeed) {
      animationSpeed.value = settings.animationSpeed;
      document.documentElement.style.setProperty('--transition', `${settings.animationSpeed}s ease`);
    }

    const rotatingBg = document.getElementById('rotatingBg');
    if (settings.rotatingBg !== undefined && rotatingBg) {
      rotatingBg.checked = settings.rotatingBg;
      const radialBg = document.querySelector('.radial-gradient-bg');
      if (radialBg) {
        radialBg.style.display = settings.rotatingBg ? 'block' : 'none';
      }
    }
  } catch (error) {
    console.error('Error loading customization:', error);
  }
}

function resetCustomizationSettings() {
  // Reset to defaults
  document.getElementById('primaryColor').value = '#6366f1';
  document.getElementById('secondaryColor').value = '#a855f7';
  document.getElementById('accentColor').value = '#ec4899';
  document.getElementById('backgroundType').value = 'animated-gradient';
  document.getElementById('blurAmount').value = '20';
  document.getElementById('blurValue').textContent = '20px';
  document.getElementById('glassOpacity').value = '8';
  document.getElementById('glassOpacityValue').textContent = '8%';
  document.getElementById('borderRadius').value = '16';
  document.getElementById('borderRadiusValue').textContent = '16px';
  document.getElementById('animationSpeed').value = '0.3';
  document.getElementById('rotatingBg').checked = true;

  // Apply defaults
  document.documentElement.style.setProperty('--color-primary', '#6366f1');
  document.documentElement.style.setProperty('--color-secondary', '#a855f7');
  document.documentElement.style.setProperty('--accent', '#ec4899');
  document.documentElement.style.setProperty('--blur-amount', '20px');
  document.documentElement.style.setProperty('--glass-opacity', '0.08');
  document.documentElement.style.setProperty('--radius-md', '16px');
  document.documentElement.style.setProperty('--radius-lg', '24px');
  document.documentElement.style.setProperty('--transition', '0.3s ease');
  applyBackgroundType('animated-gradient');

  const radialBg = document.querySelector('.radial-gradient-bg');
  if (radialBg) {
    radialBg.style.display = 'block';
  }

  // Reset theme preset selection
  document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.theme === 'glass') {
      btn.classList.add('active');
    }
  });

  saveCustomization();
  showMessage('Reset to default settings', true);
}

// ==================== CLEANUP ON UNLOAD ====================
// Prevent memory leaks by removing event listeners when popup closes
window.addEventListener('unload', () => {
  // Remove tab event listeners
  chrome.tabs.onCreated.removeListener(updateTabCount);
  chrome.tabs.onRemoved.removeListener(updateTabCount);

  // Clear auto-save interval
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
});
