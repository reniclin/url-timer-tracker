# URL Timer Tracker

A Chrome Extension that helps you track and limit time spent on specified websites. Set custom time limits for different domains and get notifications when you've reached your allocated time.

![License](https://img.shields.io/badge/License-GPLv3-blue.svg)

## Features

- 🕒 Track total time spent on specified websites
- ⏰ Set custom time limits for each domain
- 🔔 Get visual notifications when time limit is reached
- 🎯 Easy domain management through popup interface
- 🖱️ Draggable timer overlay
- ⏸️ Auto-pause when tab is inactive
- 🔄 Snooze or reset timer when limit is reached
- 🎨 Clean and modern UI design
- 🌐 Support for Single Page Applications (SPA)

## Installation

1. Clone this repository or download the ZIP file:
```bash
git clone https://github.com/reniclin/url-timer-tracker.git
```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the extension directory

## Usage

### Setting Up Tracked URLs

1. Click the extension icon to open the popup interface
2. Enter domain names (one per line) in the URL list textarea
   - Enter domains without `https://` or `www.` (e.g., `github.com`)
3. Click "Add Current Domain" to quickly add the current website
4. Set your desired time limit using the time picker
5. Toggle tracking on/off using the switch
6. Click "Save Settings" to apply changes

### Timer Interface

The extension adds a draggable timer overlay to tracked websites showing:
- Total time spent on the site
- Time remaining before limit is reached
- Warning message when time limit is reached
- Options to reset timer or snooze (restart countdown)

### Features Details

- **Domain Validation**: Ensures proper domain format and prevents invalid entries
- **Automatic Pause**: Timer pauses when tab is inactive or hidden
- **Persistence**: Settings are synced across Chrome instances
- **Drag and Drop**: Timer overlay can be positioned anywhere on the page
- **SPA Support**: Timer continues tracking through client-side navigation
- **Time Limit Updates**: Handles time limit changes while timer is active

## Technical Details

### Project Structure
```
url-timer-tracker/
├── manifest.json        # Extension configuration
├── content.js          # Content script for timer functionality
├── popup.html          # Popup interface HTML
├── popup.js           # Popup interface logic
├── popup.css          # Popup styles
└── icons/             # Extension icons
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

### Technologies Used

- Chrome Extension APIs
  - Storage API for settings persistence
  - Tabs API for current tab information
  - Content Scripts for page integration
- Modern JavaScript (ES6+)
- CSS3 for styling and animations

### Key Components

- **State Management**: Centralized state object in content script
- **Event Listeners**: Handles visibility changes and SPA navigation
- **Domain Validation**: Regex-based domain format validation
- **Time Formatting**: Consistent time display formatting
- **Cleanup Handling**: Proper cleanup on page unload

## Development

### Prerequisites

- Google Chrome Browser
- Basic knowledge of JavaScript and Chrome Extension development
- Text editor or IDE of your choice

### Installation for Development

1. Clone the repository
2. Make your modifications
3. Load the unpacked extension in Chrome
4. Test your changes

### Building for Production

1. Update version in `manifest.json`
2. Package the extension:
   - Create ZIP file with all necessary files
   - Or use Chrome Web Store Developer Dashboard

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -am 'Add new feature'`
5. Push: `git push origin feature-name`
6. Submit a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see below for details:

```text
Copyright (C) 2024 Renic Lin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

## Author

- **Renic Lin** - *Initial work*

## Acknowledgments

- Thanks to Chrome Extension API documentation
- Inspired by the need for better time management online