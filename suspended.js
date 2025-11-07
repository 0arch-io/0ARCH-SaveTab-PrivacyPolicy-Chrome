// Get tab ID from URL hash
const tabId = parseInt(window.location.hash.substring(1));

// Validate tab ID
if (!tabId || isNaN(tabId)) {
  console.error('Invalid tab ID in URL hash');
  document.getElementById('title').textContent = 'Error: Invalid suspended tab';
  document.getElementById('url').textContent = 'This tab cannot be restored';
  document.getElementById('wakeButton').disabled = true;
}

// Load suspended tab data
async function loadSuspendedData() {
  try {
    const data = await chrome.storage.local.get(`suspended_${tabId}`);
    const suspended = data[`suspended_${tabId}`];

    if (suspended) {
      // Set favicon
      const favicon = document.getElementById('favicon');
      if (suspended.favIconUrl) {
        // Hide on error (broken image)
        favicon.onerror = () => {
          favicon.style.display = 'none';
        };
        favicon.src = suspended.favIconUrl;
        favicon.style.display = 'block';
      } else {
        favicon.style.display = 'none';
      }

      // Set title
      document.getElementById('title').textContent = suspended.title || 'Suspended Tab';
      document.title = suspended.title || 'Tab Sleeping';

      // Set URL
      document.getElementById('url').textContent = suspended.url || '';
    }
  } catch (error) {
    console.error('Error loading suspended data:', error);
  }
}

// Wake tab function
async function wakeTab() {
  try {
    const data = await chrome.storage.local.get(`suspended_${tabId}`);
    const suspended = data[`suspended_${tabId}`];

    if (suspended && suspended.url) {
      // Just wake the tab - don't try to maintain groups through suspension

      // Navigate to original URL
      window.location.href = suspended.url;

      // Clean up storage
      chrome.storage.local.remove(`suspended_${tabId}`);
    }
  } catch (error) {
    console.error('Error waking tab:', error);
  }
}

// Wake button click handler
document.getElementById('wakeButton').addEventListener('click', (e) => {
  e.stopPropagation();
  wakeTab();
});

// Click anywhere to wake
document.body.addEventListener('click', (e) => {
  // Don't wake if clicking the button (already handled)
  if (e.target.id !== 'wakeButton') {
    wakeTab();
  }
});

// Keyboard shortcut - Space or Enter to wake
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    wakeTab();
  }
});

// Load data when page loads
loadSuspendedData();

// Add smooth fade-in animation
document.body.style.opacity = '0';
setTimeout(() => {
  document.body.style.transition = 'opacity 300ms ease';
  document.body.style.opacity = '1';
}, 100);
