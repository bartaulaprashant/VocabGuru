# Vocab Guru

> A Chrome extension for capturing vocabulary while browsing, generating IELTS-focused definitions and examples with Groq, and organizing saved words in a searchable sidepanel with recent, favourite, and importance views and filters.

Vocab Guru helps English learners collect unfamiliar words while browsing and review them later with AI-generated learning notes.

## Features

- Save selected text from a page using the right-click **Save to vocabulary** menu.
- Generate meanings, pronunciation, parts of speech and examples, collocations, synonyms, antonyms, IELTS tips, relevance, and related topics through the Groq API.
- Review the three most recent words in the popup.
- Search and browse the saved vocabulary in the sidepanel, with recent, favourite, and important views.
- Mark words as favourites and delete them.
- Export saved vocabulary and recent-word history to a downloadable JSON file.
- Import a Vocab Guru JSON backup; new words are merged into the library while duplicates and matching word forms are skipped.
- Store vocabulary in Chrome local storage.

## Screenshots

Add screenshots under `docs/screenshots/` using these filenames. Replace the image paths if you choose different names.

### Popup

![Vocab Guru popup](docs/Screenshot%20From%202026-11-15%2010-32-07.png)

### Sidepanel

![Vocab Guru sidepanel](docs/Screenshot%20From%202026-11-15%2010-32-34.png)

### Word details

![Vocab Guru word details](docs/Screenshot%20From%202026-11-15%2010-32-44.png)
![Vocab Guru word details large viewpoint](docs/Screenshot%20From%202026-11-15%2010-33-02.png)

## Install for development

1. Clone or download this repository.
2. Set up your Groq API key as described in [Using your own API key](#using-your-own-api-key).
3. Open `chrome://extensions` in Chrome or a compatible Chromium browser.
4. Turn on **Developer mode**.
5. Select **Load unpacked** and choose the project root (the folder containing `manifest.json`).
6. Pin Vocab Guru to the browser toolbar for quick access.

There is no build step. After changing extension files, reload Vocab Guru from `chrome://extensions`.

## Using your own API key

The current implementation sends requests to Groq from `src/background/service-worker.js`. To use your own key:

1. Create a Groq API key from your Groq account.
2. Open `src/background/service-worker.js` and find the `Authorization` header in the Groq `fetch` request.
3. Replace its current bearer credential with your own, preserving the `Bearer ` prefix. For example:

   ```js
   Authorization: "Bearer YOUR_GROQ_API_KEY",
   ```

4. Save the file and reload the extension in `chrome://extensions`.

**Security:** The current source has a developer credential directly in the service worker. Replace it before relying on the extension, and never publish your own key in a repository or distributed extension. Keys embedded in a browser extension can be extracted; a backend proxy is needed to keep a production API key private. If a real key has already been published, revoke it and create a new one.

## How to use

1. Select a word or phrase on a webpage.
2. Right-click and choose **Save to vocabulary**. Vocab Guru requests its learning information from Groq and stores the result locally.
3. Click the extension icon to review recent words, or open the sidepanel to search and manage your library.
4. Use the sidepanel controls to filter words, mark favourites, hear pronunciation, or delete entries.
5. In the **Word library** heading, select the download button to export a JSON backup. Select the upload button to choose a previously exported JSON file and import its words.

Imports merge into the current library without replacing existing entries. Words that match an existing saved word or one of its known grammatical forms are skipped. The transfer status below the library heading reports how many words were imported or exported and how many duplicates were skipped.

The extension also adds an **Open Sidepanel** page context-menu item. The selection tooltip in the content script is experimental and does not currently save a word; use the right-click menu for the working save flow.

## Strengths

- Uses native Chrome extension APIs and has no frontend build tooling or runtime package dependencies.
- Keeps the vocabulary library in browser local storage rather than requiring a Vocab Guru account.
- Combines quick capture with a popup for recent words and a searchable sidepanel for review.
- Returns several useful IELTS study fields in one vocabulary entry.

## Limitations

- The Groq key is currently embedded in client-side extension code, which is not suitable for a publicly distributed extension.
- AI output can be inaccurate or incomplete; generated study material should be reviewed.
- The extension currently has limited handling for API errors, rate limits, and unexpected response formats.
- Vocabulary is stored locally in the browser. Use the JSON export button for manual backups; there is no automatic cloud sync.
- The selection tooltip is unfinished; it currently displays a placeholder and does not save the selected text.
- The content script is declared for all URLs, so Chrome may show broad site-access permissions.

## Future improvements

- Move API requests behind a small authenticated backend, or add a clearly documented local development key setup that does not commit credentials.
- Add robust API error states, response validation, and retry guidance.
- Finish or remove the experimental selection tooltip.
- Add optional encrypted backup or sync across devices.
- Add focused tests for storage, API response parsing, filtering, and deletion.
- Add user settings for API configuration and study preferences.

## A note on the API key

I was supposed to replace my API key with a harmless dummy value before sharing the project. I got distracted by the thrilling world of not doing that. If it still works, you are borrowing my Groq account through the extension. How generous of me; please don't mistake that for an unlimited cloud budget. The sensible move is to replace it with your own key before use.