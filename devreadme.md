## Browser Extension

- A browser extension is basically a small web application that gets extra powers from the browser through browser APIs.It Listen for browser events and respond to them through a small popup UI or a notification or background workers that does something in the background. Similarly they can modify webpage, read web content, react to user input, selection and much more, create popups, add context menus, communicate with webpages, interact with tabs, intercept navigation related events, add keyboard shortcuts, custom side panels,authenticate users, handle files, There are also APIS for things like bookmarks, history, alarms, storage, commands, downloads, notifications, identity, and more.

## How to create a browser extension

## Manifest.json

- Basically a configuration blueprint of a browser extension. It tells the browser crucial details about the extension: its name, version, permissions, background scripts, and user interface elements

```bash

{
    # it determines the standard by which browser extension operates under the hood. Version 2 used persistent background pages than ran continuosly in the background, version 3 uses service workers which is triggered by events
    "manifest_version":3,
    "name":"Vocab Guru",
    "version":"0.1.0",
    "description":"Save and manage vocabulary while browsing",

    # Permission blocks in a manifest.json file tell the browser what privileged browser features, Web APIs, and website origins your extension is allowed to access.Requesting permissions triggers installation warnings for users and ensures security boundaries around user data. core utilities and functionalities of a browser extension are activetab, storage, unlimitedstorage with indexedDb, alarms, notifications, contextMenus, offscreen, tabs, history, identity,downloads, cookies,, clipboardsread and write,scripting,declarativenetrequest, webRequest, webNavigation
    "permissions":[
        "contextMenus",
        "storage"
    ],
    # Browser API permissions that are not requested at install time. Instead, the extension prompts the user at runtime via JavaScript (chrome.permissions.request()) when a specific feature is activated.
    "optional_permissions": ["downloads"],
    # Defines which website URLs or domain patterns the extension can interact with at install time (e.g., to run fetch() calls or inject content scripts).
    "host_permissions": ["https://*.example.com/*"],
    # Same match-pattern rules as host_permissions, but requested on-demand at runtime rather than at installation
  "optional_host_permissions": ["https://*/*"]


  # action and background blocks control how users interact with your extension's visual UI and how your extension executes code behind the scenes. You can dynamically modify these properties at runtime using the chrome.action API: Change icon state: chrome.action.setIcon({ path: "images/active.png" }
    "action":{
      "default_icon": {
      "16": "images/icon16.png",
      "32": "images/icon32.png",
      "48": "images/icon48.png",
      "128": "images/icon128.png"
    },
    "default_title": "Click to open menu",
    "default_popup": "popup/popup.html"
    },


# The background block defines the non-visual script running behind the scenes to handle browser events, network requests, or long-running tasks.
    "background":{
    # Manifest V3 service workers are event-driven and short-lived. auto-terminate, no global variables, no dom access, top-level event listeners
        "service_worker":"src/background/service-worker.js",
        "type":"module"
    },

    # The commands block declares keyboard shortcuts for your extension. These trigger actions or notify the background service worker when pressed.
    "commands": {
    # Opens your extension's default popup window (defined in the action key) when pressed.
    "_execute_action": {
      "suggested_key": {
        "default": "Ctrl+Shift+Y",
        "mac": "Command+Shift+Y"
      },
      "description": "Opens the extension popup menu"
    },
    #You can define custom names (e.g., "toggle-feature") and catch them inside your background Service Worker using JavaScript:
#     // Listening for keybindings in background.js
# chrome.commands.onCommand.addListener((command) => {
#   if (command === "toggle-feature") {
#     console.log("Keyboard shortcut pressed!");
#   }
# });
    "toggle-feature": {
      "suggested_key": {
        "default": "Ctrl+Shift+U",
        "mac": "Command+Shift+U",
        "linux": "Ctrl+Shift+U",
        "win": "Ctrl+Shift+U"
      },
      "description": "Toggles dark mode on the current page"
    }
  },
  # Options pages in manifest.json are user-configurable interfaces that allow users to customize an extension's behavior and settings.
  "options_ui": {
    "page": "options.html",
    # If true, the options page is opened in a new tab. If false, This method defines an HTML file that is embedded directly within the browser's extension management page (e.g., chrome://extensions). It is the recommended approach for Manifest V3
    "open_in_tab": false
  },

  # side_panel API allows extensions to display a persistent, full-height UI panel pinned to the right or left edge of the browser window. You can use the JavaScript chrome.sidePanel API from your background Service Worker to change side panel behavior dynamically based on what page the user is viewing:

  "side_panel": {
    "default_path": "sidepanel.html"
  },

  "content_scripts": [
    {
      # To tell Chrome where and when to run your content script, you register it under the content_scripts key in your manifest.json
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      # : CSS files listed in css automatically get applied to the page matching the patterns.
      "css": ["style.css"],
      "run_at": "document_idle"
    }
  ]

}
```

## Extension life cycle and termination
- Unlike Manifest V2's persistent background pages—which ran continuously in the background using memory for as long as the browser was open—MV3 Extension Service Workers are short-lived and event-driven. 
    1. Sleep (Dormant State): When no tasks are actively being processed, the service worker shuts down completely.
    2. Wake (In-Memory Spin-up): When an event occurs (such as a keyboard shortcut, web request, message from a content script, or timer alarm), Chrome spins up the service worker thread, runs the root JS file to register event handlers, and dispatches the incoming event.
    3. Automatic Termination (Shutdown): Chrome automatically kills the service worker context:   Inactivity timeout: After 30 seconds of non-activity.   Task execution timeout: If a single synchronous/asynchronous task runs longer than 5 minutes

- chrome is the foundational Chrome Extension API that acts as the bridge between your extension’s background service worker, popups, options pages, side panels, and content scripts. Lifecycle Events: Listens to extension lifecycle events (e.g., onInstalled, onStartup, onSuspend).   Message Passing: Allows communication across extension contexts using chrome.runtime.sendMessage() and chrome.runtime.onMessage.addListener().Metadata & URLs: Fetches public asset URLs (e.g., chrome.runtime.getURL('icon.p   ng')) or version info (chrome.runtime.getManifest()).

### Content scripts
- Content scripts are the bridge between your Chrome extension and the web pages your user visits. They are JavaScript files that run directly inside the browser tabs, giving you the power to read, modify, and interact with the DOM of any webpage.

- Content scripts live in an Isolated World. They share the exact same DOM as the web page, but their JavaScript environment is completely separate.
- Because the DOM is shared, standard DOM manipulation functions work out of the box:// content.js - Highlighting all H1 headings on the host page
const headers = document.querySelectorAll('h1');

# lifecycle of content script 
- document_start Before document element are parsed or scripts run. Used for hiding elements early to prevent visual flashes
- document_end After document element are parsed or scripts run(after DOM tree construction). Used to start DOM manipulation
- document_idle After the page is fully loaded and idle. Used to General tasks, heavy scraping, API fetches.
- We can inject content scripts programmatically on demand using chrome.scripting.executeScript() or chrome.tabs.executeScript(). for eg when user clicks 

# content script <-> Service worker communication 

- Pattern A - content script send a one time request 
```bash 
// Send a message to the Service Worker
chrome.runtime.sendMessage(
  { action: "FETCH_USER_SETTINGS", userId: 42 },
  (response) => {
    console.log("Service Worker replied:", response.status);
  }
);
```
```bash 
// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "FETCH_USER_SETTINGS") {
    // Perform async or privilege-restricted tasks
    sendResponse({ status: "SUCCESS", theme: "dark" });
  }
  return true; // Keeps the message channel open for async responses
});
```

- Pattern B - Service Worker sends a message to Content Script
```bash
// To send a message to a content script, target a specific tab
chrome.tabs.sendMessage(tabId, { action: "TOGGLE_DARK_MODE" }, (response) => {
  console.log("Content script acknowledged mode change");
});
```
### Chrome tabs

<!-- //Chrome tabs API
// async function openNewTab(){
//   const tab=await chrome.tabs.create({
//     url: "dev.to",
//     active:true
//   })
//   return tab;
// }

// async function getCurrentTab(){
  //   const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  //   console.log(tab)
  //   return tab;
  // }
  // getCurrentTab()


// async function getYoutubeTabs(){
//   const tabs=await chrome.tabs.query({
//     url:"*://*.youtube.com/*"
//   })
//   console.log(tabs)
// }


// async function getCurrentWindow(){
//   const tabs=await chrome.tabs.query({ currentWindow:true })
//   console.log(tabs)
// }
// setTimeout(getCurrentWindow, 3000);

// async function updateTab(tabId) {
//   // Navigate the tab to a new URL and mute it
//   await chrome.tabs.update(tabId, {
//     url: "https://developer.chrome.com",
//     muted: true
//   });
// }

// async function closeTab(tabId) {
//   await chrome.tabs.remove(tabId);
// }

// // Close multiple tabs by ID
// async function closeMultipleTabs(tabIds) {
//   await chrome.tabs.remove(tabIds); // Accepts an array of tab IDs
// } -->

<!-- // Triggered when a new tab is created
chrome.tabs.onCreated.addListener((tab) => {
  console.log("New tab opened:", tab.id);
});

// Triggered when a tab updates (e.g., URL change, loading status)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log(`Tab ${tabId} finished loading: ${tab.url}`);
  }
});

// Triggered when the user switches to a different tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log(`Active tab changed to ID: ${activeInfo.tabId}`);
});

// Triggered when a tab is closed
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`Tab closed: ${tabId}`);
}); -->


### Side panels 
- side panels can behave globally across all tabs or be targeted to specific sites or individual tabs
- 

## issed encountered
- popup context was closing after i opened sidepanel from its js code which caused the rest of the code to not execute and sidepanel only opened with no necessary data filled that was supposed to be sent from popup context to sidepanel.
 - AI apis SDK was throwing cors policy erros and parsing error from browser so i switches to REST api of those ai models and reduced the input to only few token because it burns limited token outputs quickly. 

### Pending Bug 
- filterd words not working
- cant get overview of another word from popup when sidepanel has already been filled with existing, if tried to refresh the sidepanel then popup js wont run: fixed
