// ==================== WORKSPACES FEATURE ====================

let allWorkspaces = [];
let activeWorkspaceId = null;

// Load and display workspaces
async function loadAndDisplayWorkspaces() {
  try {
    const result = await chrome.storage.local.get([WORKSPACES_KEY, ACTIVE_WORKSPACE_KEY]);
    allWorkspaces = result[WORKSPACES_KEY] || [];
    activeWorkspaceId = result[ACTIVE_WORKSPACE_KEY] || null;

    renderWorkspaces();
  } catch (error) {
    console.error('Error loading workspaces:', error);
  }
}

// Render workspaces list
function renderWorkspaces() {

  if (!workspacesContainer || !workspacesEmpty) {
    console.error('Workspace elements not found!');
    return;
  }

  if (allWorkspaces.length === 0) {
    workspacesContainer.style.display = 'none';
    workspacesEmpty.style.display = 'block';
    return;
  }

  workspacesContainer.style.display = 'flex';
  workspacesEmpty.style.display = 'none';

  workspacesContainer.innerHTML = allWorkspaces.map(workspace => {
    const isActive = workspace.id === activeWorkspaceId;
    const collectionCount = workspace.collections ? workspace.collections.length : 0;

    let scheduleText = '';
    if (workspace.schedule && workspace.schedule.enabled) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNames = workspace.schedule.days.map(d => days[d]).join(', ');
      scheduleText = `${workspace.schedule.time} on ${dayNames}`;
    }

    return `
      <div class="workspace-card ${isActive ? 'active' : ''}" data-id="${workspace.id}">
        <div class="workspace-header">
          <div class="workspace-info">
            <div class="workspace-title">
              <span>${escapeHtml(workspace.name)}</span>
            </div>
            <div class="workspace-description">${escapeHtml(workspace.description || 'No description')}</div>
            <div class="workspace-meta">
              <span>${collectionCount} collection${collectionCount !== 1 ? 's' : ''}</span>
              ${scheduleText ? `<span class="workspace-schedule">${scheduleText}</span>` : ''}
            </div>
          </div>
          <div class="workspace-actions">
            <button class="workspace-btn workspace-btn-primary" data-action="activate" data-id="${workspace.id}">
              ${isActive ? 'Active' : 'Activate'}
            </button>
            <button class="workspace-btn" data-action="edit" data-id="${workspace.id}">Edit</button>
            <button class="workspace-btn workspace-btn-delete" data-action="delete" data-id="${workspace.id}">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners
  workspacesContainer.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', handleWorkspaceAction);
  });
}

// Handle workspace actions
async function handleWorkspaceAction(e) {
  e.stopPropagation();
  const action = e.target.dataset.action;
  const workspaceId = parseInt(e.target.dataset.id);

  switch (action) {
    case 'activate':
      await activateWorkspace(workspaceId);
      break;
    case 'edit':
      await editWorkspace(workspaceId);
      break;
    case 'delete':
      await deleteWorkspace(workspaceId);
      break;
  }
}

// Create new workspace
async function createWorkspace() {
  showModal(
    'Create Workspace',
    `
      <div class="modal-form">
        <div class="form-group">
          <label>Workspace Name</label>
          <input type="text" id="workspaceName" class="input-field" placeholder="Work Mode" maxlength="50" />
        </div>
        <div class="form-group">
          <label>Description (optional)</label>
          <input type="text" id="workspaceDescription" class="input-field" placeholder="My daily work setup" maxlength="100" />
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="workspaceScheduleEnabled" />
            Enable auto-open schedule
          </label>
        </div>
        <div id="scheduleOptions" style="display: none;">
          <div class="form-group">
            <label>Time</label>
            <input type="time" id="workspaceTime" class="input-field" value="09:00" />
          </div>
          <div class="form-group">
            <label>Days</label>
            <div class="days-selector">
              <label><input type="checkbox" value="0" /> Sun</label>
              <label><input type="checkbox" value="1" checked /> Mon</label>
              <label><input type="checkbox" value="2" checked /> Tue</label>
              <label><input type="checkbox" value="3" checked /> Wed</label>
              <label><input type="checkbox" value="4" checked /> Thu</label>
              <label><input type="checkbox" value="5" checked /> Fri</label>
              <label><input type="checkbox" value="6" /> Sat</label>
            </div>
          </div>
        </div>
      </div>
    `,
    [
      { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
      {
        text: 'Create',
        className: 'modal-btn modal-btn-primary',
        onClick: async () => {
          const name = document.getElementById('workspaceName').value.trim();
          if (!name) {
            showToast('Please enter a workspace name', null, null, 2000);
            return;
          }

          const scheduleEnabled = document.getElementById('workspaceScheduleEnabled').checked;
          const selectedDays = scheduleEnabled
            ? Array.from(document.querySelectorAll('.days-selector input:checked')).map(cb => parseInt(cb.value))
            : [];

          const newWorkspace = {
            id: Date.now(),
            name,
            description: document.getElementById('workspaceDescription').value.trim(),
            collections: allLists.map(l => l.id), // Include all current collections
            schedule: {
              enabled: scheduleEnabled,
              days: selectedDays,
              time: document.getElementById('workspaceTime').value,
              autoClose: true
            },
            createdAt: Date.now(),
            lastUsed: null
          };

          allWorkspaces.push(newWorkspace);
          await chrome.storage.local.set({ [WORKSPACES_KEY]: allWorkspaces });

          // Set up alarm if schedule is enabled
          if (scheduleEnabled && selectedDays.length > 0) {
            await setupWorkspaceAlarm(newWorkspace);
          }

          closeModal();
          renderWorkspaces();
          showToast(`Workspace "${name}" created`, null, null, 2000);
        }
      }
    ]
  );

  // Toggle schedule options
  setTimeout(() => {
    const checkbox = document.getElementById('workspaceScheduleEnabled');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        document.getElementById('scheduleOptions').style.display = e.target.checked ? 'block' : 'none';
      });
    }
  }, 100);
}

// Edit workspace (placeholder for now)
async function editWorkspace(workspaceId) {
  showToast('Edit feature coming soon!', null, null, 2000);
}

// Activate workspace
async function activateWorkspace(workspaceId) {
  const workspace = allWorkspaces.find(w => w.id === workspaceId);
  if (!workspace) return;

  // Close all current tabs except extension pages
  const currentTabs = await chrome.tabs.query({});
  const tabsToClose = currentTabs.filter(tab =>
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://')
  ).map(tab => tab.id);

  if (tabsToClose.length > 0) {
    await chrome.tabs.remove(tabsToClose);
  }

  // Open all collections in this workspace
  for (const collectionId of workspace.collections) {
    const collection = allLists.find(l => l.id === collectionId);
    if (collection) {
      await handleRestoreList(collectionId);
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Mark as active
  activeWorkspaceId = workspaceId;
  workspace.lastUsed = Date.now();
  await chrome.storage.local.set({
    [ACTIVE_WORKSPACE_KEY]: activeWorkspaceId,
    [WORKSPACES_KEY]: allWorkspaces
  });

  renderWorkspaces();
  showToast(`Activated workspace "${workspace.name}"`, null, null, 2000);
}

// Delete workspace
async function deleteWorkspace(workspaceId) {
  const workspace = allWorkspaces.find(w => w.id === workspaceId);
  if (!workspace) return;

  showModal(
    'Delete Workspace',
    `<p>Are you sure you want to delete "${escapeHtml(workspace.name)}"?</p><p style="color: var(--text-muted); font-size: 13px;">This won't delete your collections.</p>`,
    [
      { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
      {
        text: 'Delete',
        className: 'modal-btn modal-btn-danger',
        onClick: async () => {
          allWorkspaces = allWorkspaces.filter(w => w.id !== workspaceId);
          if (activeWorkspaceId === workspaceId) {
            activeWorkspaceId = null;
            await chrome.storage.local.set({ [ACTIVE_WORKSPACE_KEY]: null });
          }
          await chrome.storage.local.set({ [WORKSPACES_KEY]: allWorkspaces });

          // Remove alarm
          await chrome.alarms.clear(`workspace_${workspaceId}`);

          closeModal();
          renderWorkspaces();
          showToast('Workspace deleted', null, null, 2000);
        }
      }
    ]
  );
}

// Setup workspace alarm
async function setupWorkspaceAlarm(workspace) {
  if (!workspace.schedule || !workspace.schedule.enabled) return;

  const [hours, minutes] = workspace.schedule.time.split(':').map(Number);

  // Calculate next occurrence
  const now = new Date();
  let next = new Date();
  next.setHours(hours, minutes, 0, 0);

  // If time has passed today, start from tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  // Find next scheduled day
  while (!workspace.schedule.days.includes(next.getDay())) {
    next.setDate(next.getDate() + 1);
  }

  await chrome.alarms.create(`workspace_${workspace.id}`, {
    when: next.getTime(),
    periodInMinutes: 24 * 60 // Repeat daily
  });

}

// ==================== AI SMART GROUPING ====================

// Load API key from storage
async function loadGeminiApiKey() {
  try {
    const result = await chrome.storage.local.get(GEMINI_API_KEY);
    if (result[GEMINI_API_KEY]) {
      geminiApiKeyInput.value = result[GEMINI_API_KEY];
    }
  } catch (error) {
    console.error('Error loading API key:', error);
  }
}

// Save API key
async function saveGeminiApiKey() {
  const apiKey = geminiApiKeyInput.value.trim();
  if (!apiKey) {
    showToast('Please enter an API key', null, null, 2000);
    return;
  }

  await chrome.storage.local.set({ [GEMINI_API_KEY]: apiKey });
  showToast('API key saved', null, null, 2000);
}

// Test API connection
async function testGeminiApi() {
  const result = await chrome.storage.local.get(GEMINI_API_KEY);
  const apiKey = result[GEMINI_API_KEY];

  if (!apiKey) {
    showToast('Please save your API key first', null, null, 3000);
    return;
  }

  testApiBtn.disabled = true;
  testApiBtn.innerHTML = '<span>Testing...</span>';

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hello!' }]
        }]
      })
    });

    if (response.ok) {
      showToast('API connection successful', null, null, 3000);
    } else {
      const error = await response.json();
      showToast(`API Error: ${error.error?.message || 'Invalid API key'}`, null, null, 5000);
    }
  } catch (error) {
    showToast('Connection failed. Check your internet connection.', null, null, 5000);
  } finally {
    testApiBtn.disabled = false;
    testApiBtn.innerHTML = '<span>Test</span>';
  }
}

// AI Smart Grouping
async function performSmartGrouping() {
  const result = await chrome.storage.local.get(GEMINI_API_KEY);
  const apiKey = result[GEMINI_API_KEY];

  if (!apiKey) {
    showToast('Please set up your Gemini API key in Settings first', 'Go to Settings', () => {
      switchTab('settings');
    }, 5000);
    return;
  }

  // Get all open tabs
  const tabs = await chrome.tabs.query({});
  const validTabs = tabs.filter(tab =>
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://')
  );

  if (validTabs.length === 0) {
    showToast('No tabs to group', null, null, 2000);
    return;
  }

  smartGroupBtn.disabled = true;
  smartGroupBtn.innerHTML = '<span class="btn-text">AI is analyzing...</span>';

  try {
    // Prepare tab data for AI
    const tabData = validTabs.map(tab => ({
      title: tab.title,
      url: new URL(tab.url).hostname
    }));

    const prompt = `Analyze these browser tabs and group them into logical categories. Return ONLY a JSON array of groups.

Tabs:
${JSON.stringify(tabData, null, 2)}

Return format:
[
  {
    "name": "Group Name",
    "description": "Brief description",
    "tabIndices": [0, 2, 5]
  }
]

Rules:
- Create 2-6 groups maximum
- Each tab should be in exactly one group
- Use descriptive names (e.g., "Work Documents", "Shopping", "Social Media")
- Keep descriptions under 50 characters
- Return ONLY the JSON array, no other text`;

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
    const aiResponse = data.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const groups = JSON.parse(jsonMatch[0]);

    // Show preview modal
    showSmartGroupPreview(groups, validTabs);

  } catch (error) {
    console.error('Smart grouping error:', error);
    showToast('AI grouping failed. Please try again.', null, null, 5000);
  } finally {
    smartGroupBtn.disabled = false;
    smartGroupBtn.innerHTML = '<span class="btn-text">AI Smart Group</span>';
  }
}

// Show smart group preview
function showSmartGroupPreview(groups, allTabs) {
  const previewHTML = `
    <div class="smart-group-preview">
      <p style="color: var(--text-muted); margin-bottom: 16px;">
        AI found ${groups.length} logical groups. Review and apply:
      </p>
      ${groups.map((group, idx) => `
        <div class="preview-group">
          <div class="preview-group-header">
            <strong>${escapeHtml(group.name)}</strong>
            <span style="color: var(--text-muted);">(${group.tabIndices.length} tabs)</span>
          </div>
          <div class="preview-group-description">${escapeHtml(group.description)}</div>
          <div class="preview-tabs">
            ${group.tabIndices.slice(0, 5).map(i => {
              const tab = allTabs[i];
              return `<div class="preview-tab">${escapeHtml(tab.title.substring(0, 50))}</div>`;
            }).join('')}
            ${group.tabIndices.length > 5 ? `<div class="preview-tab">... and ${group.tabIndices.length - 5} more</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  showModal(
    'AI Smart Grouping Results',
    previewHTML,
    [
      { text: 'Cancel', className: 'modal-btn modal-btn-secondary', onClick: closeModal },
      {
        text: 'Apply Groups',
        className: 'modal-btn modal-btn-primary',
        onClick: async () => {
          await applySmartGroups(groups, allTabs);
          closeModal();
        }
      }
    ]
  );
}

// Apply smart groups
async function applySmartGroups(groups, allTabs) {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const existingLists = result[STORAGE_KEY] || [];

  for (const group of groups) {
    const groupTabs = group.tabIndices.map(i => ({
      title: allTabs[i].title,
      url: allTabs[i].url
    }));

    const newList = {
      id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique integer IDs
      name: group.name,
      tabs: groupTabs,
      tabCount: groupTabs.length,
      color: getRandomColor(),
      savedAt: new Date().toISOString(),
      groupId: null
    };

    existingLists.push(newList);

    // Small delay to ensure unique IDs
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: existingLists });
  await loadAndDisplayLists();

  // Switch to collections tab
  switchTab('collections');

  showToast(`Created ${groups.length} smart collections`, null, null, 3000);
}

// Get random color for collections
function getRandomColor() {
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6b7280'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ==================== EVENT LISTENERS ====================

// Workspace event listeners
if (createWorkspaceBtn) {
  createWorkspaceBtn.addEventListener('click', createWorkspace);
}

if (smartGroupBtn) {
  smartGroupBtn.addEventListener('click', performSmartGrouping);
}

if (saveApiKeyBtn) {
  saveApiKeyBtn.addEventListener('click', saveGeminiApiKey);
}

if (testApiBtn) {
  testApiBtn.addEventListener('click', testGeminiApi);
}

// Load workspaces and API key on init
document.addEventListener('DOMContentLoaded', () => {

  if (workspacesTab) {
    loadAndDisplayWorkspaces();
    loadGeminiApiKey();
  }
});
