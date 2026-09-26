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
  }

}
```

## Extension life cycle and termination
- Unlike Manifest V2's persistent background pages—which ran continuously in the background using memory for as long as the browser was open—MV3 Extension Service Workers are short-lived and event-driven. 
    1. Sleep (Dormant State): When no tasks are actively being processed, the service worker shuts down completely.
    2. Wake (In-Memory Spin-up): When an event occurs (such as a keyboard shortcut, web request, message from a content script, or timer alarm), Chrome spins up the service worker thread, runs the root JS file to register event handlers, and dispatches the incoming event.
    3. Automatic Termination (Shutdown): Chrome automatically kills the service worker context:   Inactivity timeout: After 30 seconds of non-activity.   Task execution timeout: If a single synchronous/asynchronous task runs longer than 5 minutes

- chrome is the foundational Chrome Extension API that acts as the bridge between your extension’s background service worker, popups, options pages, side panels, and content scripts. Lifecycle Events: Listens to extension lifecycle events (e.g., onInstalled, onStartup, onSuspend).   Message Passing: Allows communication across extension contexts using chrome.runtime.sendMessage() and chrome.runtime.onMessage.addListener().Metadata & URLs: Fetches public asset URLs (e.g., chrome.runtime.getURL('icon.p   ng')) or version info (chrome.runtime.getManifest()).

### Context Menus 
- 