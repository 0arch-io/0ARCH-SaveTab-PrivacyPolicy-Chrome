# SaveTab - Chrome Extension

A powerful and beautiful tab management extension for Chrome that helps you organize, save, and restore your browsing sessions.

## Features

- **Tab Collections**: Save and restore groups of tabs with one click
- **Smart Workspaces**: Organize collections into different contexts
- **AI Smart Grouping**: Use Google Gemini AI to automatically categorize tabs
- **Tab Suspender**: Automatically suspend inactive tabs to save memory
- **Beautiful UI**: Ultra-modern dark theme with customizable colors
- **Privacy First**: All data stored locally, no tracking

## Installation

### From Chrome Web Store
1. Visit the [SaveTab Chrome Web Store page](#) (link coming soon)
2. Click "Add to Chrome"
3. Start organizing your tabs!

### Manual Installation (Development)
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `savetab-extension` folder
6. The extension is now installed!

## Usage

### Quick Start
1. Click the SaveTab icon or press `Ctrl+Shift+S` to open the side panel
2. Click "Save Current Tabs" to create a collection
3. Give your collection a name
4. Your tabs are saved! You can now close them to free up memory
5. Click "Open All" on any collection to restore those tabs

### Workspaces
- Switch between different contexts (Work, Personal, Research)
- Each workspace has its own collections
- Click "Create Workspace" to add a new one
- Right-click workspace cards for options

### AI Smart Grouping
1. Go to Settings tab
2. Enter your [Google Gemini API key](https://aistudio.google.com/app/apikey) (free)
3. Go to Workspaces tab
4. Click "AI Smart Group" to automatically organize your tabs

### Tab Suspension
1. Go to Settings tab
2. Enable "Auto-suspend tabs"
3. Set your preferred suspension delay
4. Inactive tabs will automatically suspend to save memory
5. Click suspended tabs to wake them instantly

### Customization
1. Click the customize button on any collection
2. Choose custom colors for the collection
3. Or use preset color schemes
4. Go to Customize tab for global theme settings

## Privacy

SaveTab respects your privacy:
- All data is stored locally using Chrome's storage API
- No external servers or tracking (except optional AI features)
- API keys are encrypted before storage
- No analytics or telemetry
- See [PRIVACY.md](PRIVACY.md) for full details

## Development

### Project Structure
```
savetab-extension/
├── manifest.json          # Extension manifest
├── popup.html            # Main UI
├── popup.js              # Main logic
├── workspace.js          # Workspace & AI features
├── customize.js          # Customization logic
├── background.js         # Background service worker
├── suspended.html        # Tab suspension page
├── suspended.js          # Suspension logic
├── styles-dark.css       # Main stylesheet
├── icons/                # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── *.svg                 # Source icon files
```

### Building

No build step required. The extension runs directly from source files.

### Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Requirements

- Chrome version 89 or higher (for Tab Groups API support)
- Optional: Google Gemini API key for AI features

## Keyboard Shortcuts

- `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac): Open SaveTab side panel

## Permissions Explained

SaveTab requires the following permissions:

- **tabs**: To save and restore your tab collections
- **storage**: To save collections and settings locally
- **alarms**: For automatic tab suspension scheduling
- **tabGroups**: To organize tabs into visual groups
- **sidePanel**: To display the extension interface

## Support

- [Report Issues](https://github.com/yourusername/savetab-extension/issues)
- [Privacy Policy](PRIVACY.md)
- [Chrome Web Store Page](#)

## License

[Your chosen license - MIT recommended]

## Credits

Made with care for productive browsing.

Icons based on [Feather Icons](https://feathericons.com/)

---

**Version 2.0.0** - Complete redesign with modern UI, AI features, and enhanced functionality
