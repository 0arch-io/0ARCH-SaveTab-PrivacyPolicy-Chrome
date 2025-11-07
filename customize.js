// Customization System for SaveTab

// Default customization settings
const DEFAULT_CUSTOMIZATION = {
  theme: 'glass',
  primaryColor: '#6366f1',
  secondaryColor: '#a855f7',
  accentColor: '#ec4899',
  backgroundType: 'animated-gradient',
  blurAmount: 20,
  glassOpacity: 8,
  borderRadius: 16,
  animationSpeed: 0.3,
  rotatingBg: true
};

// Load saved customization
async function loadCustomization() {
  try {
    const result = await chrome.storage.local.get('customization');
    return result.customization || DEFAULT_CUSTOMIZATION;
  } catch (error) {
    console.error('Error loading customization:', error);
    return DEFAULT_CUSTOMIZATION;
  }
}

// Save customization
async function saveCustomization(settings) {
  try {
    await chrome.storage.local.set({ customization: settings });
  } catch (error) {
    console.error('Error saving customization:', error);
  }
}

// Apply theme to page
function applyTheme(settings) {
  const root = document.documentElement;

  // Set CSS custom properties
  root.style.setProperty('--custom-primary', settings.primaryColor);
  root.style.setProperty('--custom-secondary', settings.secondaryColor);
  root.style.setProperty('--custom-accent', settings.accentColor);
  root.style.setProperty('--custom-blur', `${settings.blurAmount}px`);
  root.style.setProperty('--custom-glass-opacity', `${settings.glassOpacity / 100}`);
  root.style.setProperty('--custom-border-radius', `${settings.borderRadius}px`);
  root.style.setProperty('--custom-animation-speed', `${settings.animationSpeed}s`);

  // Apply background type
  const body = document.body;
  body.className = ''; // Clear classes

  switch (settings.backgroundType) {
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

  // Toggle rotating background
  if (settings.rotatingBg) {
    body.classList.add('rotating-bg');
  } else {
    body.classList.remove('rotating-bg');
  }

  // Apply theme preset class
  body.setAttribute('data-theme', settings.theme);
}

// Theme presets
const THEME_PRESETS = {
  glass: {
    ...DEFAULT_CUSTOMIZATION,
    backgroundType: 'animated-gradient',
    blurAmount: 20,
    glassOpacity: 8,
    rotatingBg: true
  },
  solid: {
    ...DEFAULT_CUSTOMIZATION,
    backgroundType: 'solid',
    blurAmount: 0,
    glassOpacity: 100,
    rotatingBg: false,
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7'
  },
  minimal: {
    ...DEFAULT_CUSTOMIZATION,
    backgroundType: 'transparent',
    blurAmount: 5,
    glassOpacity: 5,
    rotatingBg: false,
    primaryColor: '#000000',
    secondaryColor: '#6b7280',
    borderRadius: 8
  },
  gradient: {
    ...DEFAULT_CUSTOMIZATION,
    backgroundType: 'static-gradient',
    blurAmount: 10,
    glassOpacity: 15,
    rotatingBg: false,
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    accentColor: '#3b82f6'
  }
};

// Initialize customization UI
async function initializeCustomization() {
  const settings = await loadCustomization();

  // Apply current theme
  applyTheme(settings);

  // Set form values
  document.getElementById('primaryColor').value = settings.primaryColor;
  document.getElementById('secondaryColor').value = settings.secondaryColor;
  document.getElementById('accentColor').value = settings.accentColor;
  document.getElementById('backgroundType').value = settings.backgroundType;
  document.getElementById('blurAmount').value = settings.blurAmount;
  document.getElementById('blurValue').textContent = `${settings.blurAmount}px`;
  document.getElementById('glassOpacity').value = settings.glassOpacity;
  document.getElementById('glassOpacityValue').textContent = `${settings.glassOpacity}%`;
  document.getElementById('borderRadius').value = settings.borderRadius;
  document.getElementById('borderRadiusValue').textContent = `${settings.borderRadius}px`;
  document.getElementById('animationSpeed').value = settings.animationSpeed;
  document.getElementById('rotatingBg').checked = settings.rotatingBg;

  // Set active theme preset
  document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === settings.theme);
  });

  // Add event listeners
  setupEventListeners(settings);
}

function setupEventListeners(currentSettings) {
  // Theme preset buttons
  document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.addEventListener('click', async () => {
      const theme = btn.dataset.theme;
      const preset = THEME_PRESETS[theme];

      // Update active state
      document.querySelectorAll('.theme-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Apply preset
      await saveCustomization(preset);
      applyTheme(preset);

      // Update form values
      initializeCustomization();
    });
  });

  // Color pickers
  ['primaryColor', 'secondaryColor', 'accentColor'].forEach(id => {
    document.getElementById(id).addEventListener('input', async (e) => {
      currentSettings[id] = e.target.value;
      await saveCustomization(currentSettings);
      applyTheme(currentSettings);
    });
  });

  // Background type
  document.getElementById('backgroundType').addEventListener('change', async (e) => {
    currentSettings.backgroundType = e.target.value;
    await saveCustomization(currentSettings);
    applyTheme(currentSettings);
  });

  // Blur amount slider
  document.getElementById('blurAmount').addEventListener('input', async (e) => {
    const value = parseInt(e.target.value);
    currentSettings.blurAmount = value;
    document.getElementById('blurValue').textContent = `${value}px`;
    await saveCustomization(currentSettings);
    applyTheme(currentSettings);
  });

  // Glass opacity slider
  document.getElementById('glassOpacity').addEventListener('input', async (e) => {
    const value = parseInt(e.target.value);
    currentSettings.glassOpacity = value;
    document.getElementById('glassOpacityValue').textContent = `${value}%`;
    await saveCustomization(currentSettings);
    applyTheme(currentSettings);
  });

  // Border radius slider
  document.getElementById('borderRadius').addEventListener('input', async (e) => {
    const value = parseInt(e.target.value);
    currentSettings.borderRadius = value;
    document.getElementById('borderRadiusValue').textContent = `${value}px`;
    await saveCustomization(currentSettings);
    applyTheme(currentSettings);
  });

  // Animation speed
  document.getElementById('animationSpeed').addEventListener('change', async (e) => {
    currentSettings.animationSpeed = parseFloat(e.target.value);
    await saveCustomization(currentSettings);
    applyTheme(currentSettings);
  });

  // Rotating background toggle
  document.getElementById('rotatingBg').addEventListener('change', async (e) => {
    currentSettings.rotatingBg = e.target.checked;
    await saveCustomization(currentSettings);
    applyTheme(currentSettings);
  });

  // Reset button
  document.getElementById('resetCustomization').addEventListener('click', async () => {
    await saveCustomization(DEFAULT_CUSTOMIZATION);
    await initializeCustomization();
    showToast('Customization reset to default!');
  });
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadCustomization, applyTheme, initializeCustomization };
}
