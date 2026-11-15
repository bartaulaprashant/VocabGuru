chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "reload-call") {
    renderWordOverview();
    renderWordList(getVisibleWords());
  }
});

const state = {
  vocabulary: {},
  recentKeys: [],
  activeView: "all",
};

function normalizeWordKey(value) {
  return String(value || "").trim().toLowerCase();
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSafeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item !== null && item !== undefined && String(item).trim() !== "");
}

function getWordEntries() {
  return Object.values(state.vocabulary || {}).filter(Boolean);
}

function getRecentWords() {
  const uniqueKeys = [...new Set((state.recentKeys || []).map((key) => normalizeWordKey(key)).filter(Boolean))];
  return uniqueKeys;
}

function getMeaningPreview(wordObject) {
  const meanings = getSafeArray(wordObject?.meanings);
  if (meanings.length) return meanings[0];
  if (wordObject?.meaning) return wordObject.meaning;
  return "Meaning not available yet.";
}

function getFirstPartOfSpeech(wordObject) {
  const options = getSafeArray(wordObject?.parts_of_speech_examples);
  if (!options.length) return "Word";
  return options[0]?.part_of_speech || "Word";
}

function getExamples(wordObject) {
  const options = getSafeArray(wordObject?.parts_of_speech_examples);
  return options
    .map((entry) => entry?.example)
    .filter((example) => example && String(example).trim() !== "");
}

function getTopics(wordObject) {
  const rawTopics = Array.isArray(wordObject?.ielts_relevant_topics)
    ? wordObject.ielts_relevant_topics
    : Array.isArray(wordObject?.ielts?.topics)
      ? wordObject.ielts.topics
      : [];

  return rawTopics
    .map((entry) => {
      if (typeof entry === "string") {
        return { topic: entry, example: "" };
      }

      if (entry && typeof entry === "object") {
        return {
          topic: entry.topic || entry.name || entry.label || "General",
          example: entry.example || entry.example_sentence || entry.description || "",
        };
      }

      return null;
    })
    .filter(Boolean);
}

function getRelevanceLabel(wordObject) {
  const raw =  wordObject?.ielts_relevance_level || "medium";
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "low") return "low";
  if (normalized === "high") return "high";
  return "medium";
}

async function deleteWordFromStorage(wordObject) {
  const key = normalizeWordKey(wordObject?.word);
  if (!key) return;

  const vocabularyResult = await chrome.storage.local.get("vocabulary");
  const vocabulary = vocabularyResult?.vocabulary || {};
  delete vocabulary[key];
  await chrome.storage.local.set({ vocabulary });

  const recentResult = await chrome.storage.local.get("recentWordKeys");
  let recentKeys = Array.isArray(recentResult?.recentWordKeys) ? recentResult.recentWordKeys : [];
  recentKeys = recentKeys.filter((item) => normalizeWordKey(item) !== key);
  await chrome.storage.local.set({ recentWordKeys: recentKeys });

  const { wordObject: selectedWord } = await chrome.storage.session.get("wordObject");
  if (selectedWord && normalizeWordKey(selectedWord.word) === key) {
    await chrome.storage.session.remove("wordObject");
  }

  state.vocabulary = vocabulary;
  state.recentKeys = recentKeys;
  renderStats();
  renderWordList(getVisibleWords());
  renderWordOverview();
}

function getVisibleWords() {
  const words = getWordEntries();
  const selectedView = state.activeView;
  const searchInput = document.getElementById("search-input");
  const searchTerm = (searchInput?.value || "").trim().toLowerCase();

  let filtered = words;

  if (selectedView === "recent") {
    const recentKeySet = new Set(getRecentWords());
    filtered = filtered.filter((word) => recentKeySet.has(normalizeWordKey(word.word)));
  } else if (selectedView === "favourite") {
    filtered = filtered.filter((word) => Boolean(word.favourite));
  } else if (selectedView === "important") {
    filtered = filtered.filter((word) => Boolean(word.important));
  }

  if (searchTerm) {
    filtered = filtered.filter((word) => String(word.word || "").toLowerCase().includes(searchTerm));
  }

  return filtered;
}

function syncActiveViewButtons() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    const shouldBeActive = button.dataset.view === state.activeView;
    button.classList.toggle("active", shouldBeActive);
  });

  document.querySelectorAll("#filter-tabs button").forEach((button) => {
    const shouldBeActive =
      (state.activeView === "all" && button.id === "all-vocab-button") ||
      (state.activeView === "recent" && button.id === "recent-vocab-button") ||
      (state.activeView === "favourite" && button.id === "favourite-vocab-button");
    button.classList.toggle("active", shouldBeActive);
  });
}

function renderStats() {
  const totalWords = getWordEntries().length;
  const savedWords = getWordEntries().filter((word) => Boolean(word.favourite)).length;
  const recentWords = getRecentWords().length;

  const totalNode = document.getElementById("stat-total");
  const savedNode = document.getElementById("stat-saved");
  const recentNode = document.getElementById("stat-recent");
  const importantNode = document.getElementById("stat-important");

  if (totalNode) totalNode.textContent = String(totalWords);
  if (savedNode) savedNode.textContent = String(savedWords);
  if (recentNode) recentNode.textContent = String(recentWords);
  if (importantNode) importantNode.textContent = String(getWordEntries().filter((word) => Boolean(word.important)).length);
}

function renderWordList(words = []) {
  const listNode = document.getElementById("words-list");
  const countNode = document.getElementById("word-count-badge");

  if (!listNode || !countNode) return;

  if (!words.length) {
    listNode.innerHTML = `
      <li class="empty-state-panel">
        <div>
          <h3>No words here</h3>
          <p>Try a different filter or save a new word.</p>
        </div>
      </li>
    `;
    countNode.textContent = "0";
    return;
  }

  countNode.textContent = String(words.length);

  const selectedWordKey = normalizeWordKey((chrome.storage.session ? (async () => {
    const { wordObject } = await chrome.storage.session.get("wordObject");
    return wordObject?.word || "";
  })() : ""));

  listNode.innerHTML = words
    .map((wordObject) => {
      const key = normalizeWordKey(wordObject.word);
      const meaning = getMeaningPreview(wordObject);
      const pos = getFirstPartOfSpeech(wordObject);
      const isSelected = false;
      return `
        <li class="word-list-item ${isSelected ? "selected" : ""}" data-word-key="${escapeHtml(key)}" data-word-name="${escapeHtml(wordObject.word || "")}">
          <div class="top-part">
            <h3>${escapeHtml(wordObject.word || "Word")}</h3>
            <div class="word-item-actions">
              <button class="delete-word-button" type="button" aria-label="Delete word">✕</button>
            </div>
          </div>
          <p>${escapeHtml(wordObject.pronunciation || "Pronunciation unavailable")}</p>
          <div class="bottom-part">
            <span class="pos-tag">${escapeHtml(pos)}</span>
            <span>${escapeHtml(meaning)}</span>
          </div>
        </li>
      `;
    })
    .join("");

  listNode.querySelectorAll(".word-list-item").forEach((item) => {
    const deleteButton = item.querySelector(".delete-word-button");
    if (deleteButton) {
      deleteButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        const selectedKey = item.dataset.wordKey;
        const selectedWord = state.vocabulary[selectedKey];
        if (selectedWord) {
          await deleteWordFromStorage(selectedWord);
        }
      });
    }

    item.addEventListener("click", async () => {
      const selectedKey = item.dataset.wordKey;
      const selectedWord = state.vocabulary[selectedKey];
      if (!selectedWord) return;

      await chrome.storage.session.set({ wordObject: selectedWord });
      renderWordOverview();
      renderWordList(getVisibleWords());
    });
  });
}

async function renderWordOverview() {
  const { wordObject } = await chrome.storage.session.get("wordObject");
  const wrapper = document.getElementById("word-overview-wrapper");

  if (!wrapper) return;

  if (!wordObject) {
    wrapper.innerHTML = `
      <div class="empty-state-panel">
        <div>
          <h3>Select a word</h3>
          <p>Choose a saved word from the list to view its details.</p>
        </div>
      </div>
    `;
    return;
  }

  const meaningList = getSafeArray(wordObject.meanings);
  const examples = getExamples(wordObject);
  const collocations = getSafeArray(wordObject.collocations);
  const ieltsTips = getSafeArray(wordObject.ielts_tips);
  const synonyms = getSafeArray(wordObject.synonyms);
  const antonyms = getSafeArray(wordObject.antonyms);
  const topics = getTopics(wordObject);
  const relevance = getRelevanceLabel(wordObject);

  const overviewHtml = `
    <div class="detail-grid">
      <div class="info-card">
        <h3>Parts of speech</h3>
        <ul>
          ${getSafeArray(wordObject.parts_of_speech_examples).length
            ? getSafeArray(wordObject.parts_of_speech_examples)
                .map((entry) => `
                  <li>
                    <span class="pos-tag">${escapeHtml(entry?.part_of_speech || "Word")}</span>
                    ${escapeHtml(entry?.example || "Example unavailable.")}
                  </li>
                `)
                .join("")
            : '<li>Usage examples are not available yet.</li>'}
        </ul>
      </div>
      <div class="info-card">
        <h3>IELTS relevance</h3>
        <p>
          <span class="relevance-pill ${escapeHtml(relevance)}">${escapeHtml(relevance.toUpperCase())}</span>
        </p>
        <div class="topic-list">
          ${topics.length
            ? topics.slice(0, 3).map((item) => `
                <div class="topic-item">
                  <span class="topic-tag">${escapeHtml(item.topic)}</span>
                  ${item.example ? `<p class="topic-example">${escapeHtml(item.example)}</p>` : ""}
                </div>
              `).join("")
            : '<div class="topic-item"><span class="topic-tag">General</span></div>'}
        </div>
      </div>
    </div>
  `;

  const meaningsHtml = `
    <div class="info-card">
      <h3>Meanings</h3>
      <ul>
        ${meaningList.length
          ? meaningList.slice(0, 4).map((meaning) => `<li>• ${escapeHtml(meaning)}</li>`).join("")
          : '<li>Meaning not available yet.</li>'}
      </ul>
    </div>
  `;

  const examplesHtml = `
    <div class="info-card">
      <h3>Examples</h3>
      <ul>
        ${examples.length
          ? examples.slice(0, 4).map((example) => `<li>• ${escapeHtml(example)}</li>`).join("")
          : '<li>Example not available yet.</li>'}
      </ul>
    </div>
  `;

  const ieltsHtml = `
    <div class="info-card">
      <h3>IELTS guidance</h3>
      <ul>
        ${ieltsTips.length
          ? ieltsTips.slice(0, 4).map((tip) => `<li>• ${escapeHtml(tip)}</li>`).join("")
          : '<li>IELTS guidance not available yet.</li>'}
      </ul>
    </div>
  `;

  const collocationsHtml = `
    <div class="info-card">
      <h3>Collocations</h3>
      <ul>
        ${collocations.length
          ? collocations.slice(0, 4).map((entry) => `<li>• ${escapeHtml(entry)}</li>`).join("")
          : '<li>Collocations not available yet.</li>'}
      </ul>
    </div>
  `;

  const synonymsHtml = `
    <div class="info-card">
      <h3>Synonyms and antonyms</h3>
      <ul>
        ${synonyms.length ? synonyms.slice(0, 4).map((item) => `<li>• ${escapeHtml(item)}</li>`).join("") : '<li>No synonyms available yet.</li>'}
        ${antonyms.length ? antonyms.slice(0, 4).map((item) => `<li>• ${escapeHtml(item)}</li>`).join("") : ""}
      </ul>
    </div>
  `;

  wrapper.innerHTML = `
    <div class="word-detail-card">
      <div class="detail-header">
        <div class="word-title-row">
          <h2>${escapeHtml(wordObject.word || "Word")}</h2>
          <div class="word-actions">
            <button class="mini-button" type="button" aria-label="Pronounce word">🔊</button>
            <button class="mini-button" id="delete-word-button" type="button" aria-label="Delete word">🗑</button>
            <button class="mini-button" id="favourite-button" type="button" aria-label="Favourite word">
              ${Boolean(wordObject.favourite) ? "★" : "☆"}
            </button>
          </div>
        </div>
        <div class="word-subline">
          <span>${escapeHtml(wordObject.pronunciation || "Pronunciation unavailable")}</span>
          <span class="dot"></span>
          <span class="relevance-pill ${escapeHtml(relevance)}">IELTS ${escapeHtml(relevance)}</span>
        </div>
      </div>

      <div class="section-tabs">
        <button class="section-tab active" type="button" data-section="overview">Overview</button>
        <button class="section-tab" type="button" data-section="meanings">Meanings</button>
        <button class="section-tab" type="button" data-section="examples">Examples</button>
        <button class="section-tab" type="button" data-section="ielts">IELTS</button>
        <button class="section-tab" type="button" data-section="collocations">Collocations</button>
        <button class="section-tab" type="button" data-section="synonyms">Synonyms</button>
      </div>

      <div class="section-panel active" data-panel="overview">${overviewHtml}</div>
      <div class="section-panel" data-panel="meanings">${meaningsHtml}</div>
      <div class="section-panel" data-panel="examples">${examplesHtml}</div>
      <div class="section-panel" data-panel="ielts">${ieltsHtml}</div>
      <div class="section-panel" data-panel="collocations">${collocationsHtml}</div>
      <div class="section-panel" data-panel="synonyms">${synonymsHtml}</div>
    </div>
  `;

  wrapper.querySelectorAll(".section-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedSection = button.dataset.section;
      wrapper.querySelectorAll(".section-tab").forEach((tab) => {
        tab.classList.toggle("active", tab === button);
      });
      wrapper.querySelectorAll(".section-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.panel === selectedSection);
      });
    });
  });

  const pronounceButton = wrapper.querySelector(".mini-button[aria-label='Pronounce word']");
  if (pronounceButton) {
    pronounceButton.addEventListener("click", () => {
      const utterance = new SpeechSynthesisUtterance(wordObject.word || "");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  const favouriteButton = wrapper.querySelector("#favourite-button");
  if (favouriteButton) {
    favouriteButton.addEventListener("click", async () => {
      const key = normalizeWordKey(wordObject.word);
      const currentWord = state.vocabulary[key] || { ...wordObject };
      const updatedWord = {
        ...currentWord,
        favourite: !Boolean(currentWord.favourite),
      };
      state.vocabulary[key] = updatedWord;
      await chrome.storage.local.set({ vocabulary: state.vocabulary });
      await chrome.storage.session.set({ wordObject: updatedWord });
      renderStats();
      renderWordOverview();
      renderWordList(getVisibleWords());
    });
  }

  const deleteButton = wrapper.querySelector("#delete-word-button");
  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      await deleteWordFromStorage(wordObject);
    });
  }
}

function setActiveView(view) {
  state.activeView = view;
  syncActiveViewButtons();
  renderWordList(getVisibleWords());
}

function attachEvents() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view || "all");
    });
  });

  document.querySelectorAll("#filter-tabs button").forEach((button) => {
    button.addEventListener("click", () => {
      const viewMap = {
        "all-vocab-button": "all",
        "recent-vocab-button": "recent",
        "favourite-vocab-button": "favourite",
      };
      setActiveView(viewMap[button.id] || "all");
    });
  });

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderWordList(getVisibleWords());
    });
  }

  const settingsButton = document.getElementById("settings-button");
  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      chrome.tabs.create({ url: "chrome://extensions" });
    });
  }

  const closeButton = document.getElementById("panel-close-button");
  if (closeButton) {
    closeButton.addEventListener("click", async () => {
      chrome.storage.session.clear();
      if (typeof chrome.sidePanel?.close === "function") {
        const response = await chrome.runtime.sendMessage({ action: "get-currentTab" });
        chrome.sidePanel.close({ windowId: response?.tab?.windowId });
        return;
      }
      window.close();
    });
  }
}

async function initializeSidePanel() {
  const response = await chrome.runtime.sendMessage({ action: "get-vocabulary" });
  const recentResponse = await chrome.runtime.sendMessage({ action: "get-recent-word-keys" });

  state.vocabulary = response?.data || {};
  state.recentKeys = Array.isArray(recentResponse?.data) ? recentResponse.data : [];

  renderStats();
  syncActiveViewButtons();
  renderWordList(getVisibleWords());
  attachEvents();

  const { wordObject } = await chrome.storage.session.get("wordObject");
  if (wordObject) {
    renderWordOverview();
  }
}

initializeSidePanel();
