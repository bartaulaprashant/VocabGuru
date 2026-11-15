const wordList = document.getElementById("word-list");
const recentCountBadge = document.getElementById("recent-count-badge");
const openSidepanelButton = document.getElementById("open-sidepanel-button");
const manageExtensionButton = document.getElementById("manage-extension-button");
const MAX_RECENT_WORDS = 3;

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPosTag(wordObject) {
  const posList = Array.isArray(wordObject?.parts_of_speech_examples)
    ? wordObject.parts_of_speech_examples
    : [];

  const firstPos = posList[0]?.part_of_speech || wordObject?.part_of_speech || "Word";
  const label = String(firstPos).trim();

  if (!label) return "Word";
  if (label.toLowerCase().includes("noun")) return "Noun";
  if (label.toLowerCase().includes("verb")) return "Verb";
  if (label.toLowerCase().includes("adjective")) return "Adj";
  if (label.toLowerCase().includes("adverb")) return "Adv";
  if (label.toLowerCase().includes("pronoun")) return "Pron";
  if (label.toLowerCase().includes("preposition")) return "Prep";
  return label.slice(0, 4);
}

function normalizeMeaning(wordObject) {
  const meanings = Array.isArray(wordObject?.meanings)
    ? wordObject.meanings.filter((item) => item != null && item !== "")
    : [];

  if (meanings.length) return meanings[0];
  if (wordObject?.meaning) return wordObject.meaning;
  return "Meaning not available yet.";
}

function getIeltsRelevance(wordObject) {
  const relevance = wordObject?.ielts?.relevance || wordObject?.ielts_relevance || "medium";
  return String(relevance).toLowerCase();
}

function normalizeTopicEntry(topicEntry) {
  if (typeof topicEntry === "string") {
    return { topic: topicEntry, example: "" };
  }

  if (topicEntry && typeof topicEntry === "object") {
    return {
      topic: topicEntry.topic || topicEntry.name || topicEntry.label || "General",
      example: topicEntry.example || topicEntry.example_sentence || topicEntry.description || "",
    };
  }

  return { topic: "General", example: "" };
}

function getIeltsTopics(wordObject) {
  const topics =
    Array.isArray(wordObject?.ielts_relevant_topics)
      ? wordObject.ielts_relevant_topics
      : Array.isArray(wordObject?.ielts?.topics)
        ? wordObject.ielts.topics
        : [];

  return topics
    .map((item) => normalizeTopicEntry(item))
    .filter((item) => item && item.topic && String(item.topic).trim() !== "");
}

async function deleteWordFromPopupStorage(wordObject) {
  const key = String(wordObject?.word || "").trim().toLowerCase();
  if (!key) return;

  const vocabularyResult = await chrome.storage.local.get("vocabulary");
  const vocabulary = vocabularyResult?.vocabulary || {};
  delete vocabulary[key];
  await chrome.storage.local.set({ vocabulary });

  const recentKeysResult = await chrome.storage.local.get("recentWordKeys");
  let recentKeys = Array.isArray(recentKeysResult?.recentWordKeys) ? recentKeysResult.recentWordKeys : [];
  recentKeys = recentKeys.filter((item) => String(item).trim().toLowerCase() !== key);
  await chrome.storage.local.set({ recentWordKeys: recentKeys });

  const response = await chrome.runtime.sendMessage({ action: "get-vocabulary" });
  const updatedVocabulary = response?.data || {};
  const recentKeysResponse = await chrome.storage.local.get("recentWordKeys");
  const updatedRecentKeys = Array.isArray(recentKeysResponse?.recentWordKeys)
    ? recentKeysResponse.recentWordKeys
    : [];

  const uniqueRecentKeys = [...new Set(updatedRecentKeys.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
  const selectedKeys = uniqueRecentKeys.slice(-MAX_RECENT_WORDS).reverse();
  const recentWords = selectedKeys.map((entryKey) => updatedVocabulary[entryKey]).filter(Boolean);

  renderVocabulary(recentWords);
}

function renderEmptyState() {
  wordList.innerHTML = `
    <li class="empty-state">
      No recent words yet.<br />
      Save a word to see it here.
    </li>
  `;
  recentCountBadge.textContent = `0 / ${MAX_RECENT_WORDS}`;
}

async function loadRecentWords() {
  try {
    const response = await chrome.runtime.sendMessage({ action: "get-vocabulary" });
    const vocabulary = response?.data || {};
    const recentKeysResult = await chrome.storage.local.get("recentWordKeys");
    const recentWordKeys = Array.isArray(recentKeysResult?.recentWordKeys)
      ? recentKeysResult.recentWordKeys
      : [];

    const uniqueRecentKeys = [...new Set(recentWordKeys.map((key) => String(key).trim()).filter(Boolean))];
    const selectedKeys = uniqueRecentKeys.slice(-MAX_RECENT_WORDS).reverse();
    const recentWords = selectedKeys.map((key) => vocabulary[key]).filter(Boolean);

    renderVocabulary(recentWords);
  } catch (error) {
    console.error(error?.message || error);
    renderEmptyState();
  }
}

function renderVocabulary(recentWords) {
  wordList.innerHTML = "";

  if (!recentWords.length) {
    renderEmptyState();
    return;
  }

  recentCountBadge.textContent = `${Math.min(recentWords.length, MAX_RECENT_WORDS)} / ${MAX_RECENT_WORDS}`;

  recentWords.forEach((wordObject) => {
    const listItem = document.createElement("li");
    listItem.className = "word-item";

    const relevance = getIeltsRelevance(wordObject);
    const topics = getIeltsTopics(wordObject);
    const posTag = getPosTag(wordObject);
    const meaning = normalizeMeaning(wordObject);
    const pronunciation = wordObject?.pronunciation || "Pronunciation unavailable";

    listItem.innerHTML = `
      <div class="word-head">
        <div class="word-main">
          <button class="word-name" type="button">${escapeHtml(wordObject.word)}</button>
          <span class="word-pronunciation">${escapeHtml(pronunciation)}</span>
        </div>
      </div>

      <div class="word-meta">
        <span class="pos-pill">${escapeHtml(posTag)}</span>
        <span class="relevance-pill ${escapeHtml(relevance)}">IELTS ${escapeHtml(relevance)}</span>
      </div>

      <p class="word-meaning">${escapeHtml(meaning)}</p>

      <div class="topic-list">
        ${
          topics.length
            ? topics
                .slice(0, 1)
                .map(
                  (topicItem) => `
                    <div class="topic-chip">
                      <span class="topic-tag">${escapeHtml(topicItem.topic)}</span>
                      ${topicItem.example ? `<span class="topic-example">${escapeHtml(topicItem.example)}</span>` : ""}
                    </div>
                  `,
                )
                .join("")
            : '<span class="word-pronunciation">No topic data</span>'
        }
      </div>
    `;

    const openWordButton = listItem.querySelector(".word-name");
    const head = listItem.querySelector(".word-head");
    const speakerButton = document.createElement("button");
    speakerButton.type = "button";
    speakerButton.className = "speaker-button";
    speakerButton.setAttribute("aria-label", "Pronounce word");
    speakerButton.textContent = "🔊";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-word-button";
    deleteButton.setAttribute("aria-label", "Delete word");
    deleteButton.textContent = "✕";

    const actionWrap = document.createElement("div");
    actionWrap.className = "word-action-row";
    actionWrap.appendChild(speakerButton);
    actionWrap.appendChild(deleteButton);
    head.appendChild(actionWrap);

    deleteButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteWordFromPopupStorage(wordObject);
    });

    async function openWordDetails() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.storage.session.set({ wordObject });
        chrome.runtime.sendMessage({ action: "reload-call" });

        const recentKey = String(wordObject.word || "").trim().toLowerCase();
        const recentKeysResult = await chrome.storage.local.get("recentWordKeys");
        let recentWordKeys = Array.isArray(recentKeysResult?.recentWordKeys)
          ? recentKeysResult.recentWordKeys
          : [];

        recentWordKeys = recentWordKeys.filter((key) => String(key).trim().toLowerCase() !== recentKey);
        recentWordKeys.push(recentKey);
        recentWordKeys = [...new Set(recentWordKeys)].slice(-10);
        await chrome.storage.local.set({ recentWordKeys });

        await chrome.sidePanel.open({ windowId: tab.windowId });
      } catch (error) {
        console.error(error?.message || error);
      }
    }

    openWordButton.addEventListener("click", openWordDetails);

    listItem.addEventListener("click", (event) => {
      if (event.target.closest(".speaker-button")) return;
      if (event.target.closest(".word-name")) return;
      openWordDetails();
    });

    speakerButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const utterance = new SpeechSynthesisUtterance(wordObject.word || "");
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });

    wordList.appendChild(listItem);
  });
}

openSidepanelButton?.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.sidePanel.open({ windowId: tab.windowId });
    window.close();
  } catch (error) {
    console.error(error?.message || error);
  }
});

manageExtensionButton?.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions" });
});

loadRecentWords();
