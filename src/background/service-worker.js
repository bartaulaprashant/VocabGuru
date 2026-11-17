//chrome provides event called onInstalled when the extension is installed, updated or sometimes reloaded during development. Basically execute this callback function when the user installs or .....
chrome.runtime.onInstalled.addListener(() => {
  // create a menu on right click when selection is made
  chrome.contextMenus.create({
    id: "save-word",
    title: "Save to vocabulary",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "open-sidepanel",
    title: "Open Sidepanel",
    //context is the situation in which you right clicked. It could be selection, right clicking image, audio, video, page itself, link or iframe
    contexts: ["page"],
  });

  //create sidepanel and use it to open sidepanel instead of popup
  // chrome.sidePanel.setPanelBehavior({
  //   openPanelOnActionClick:true
  // })
});

//use specialized sidepanel for specific tabs
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//   if(!tab.url) return ;

//   const url=new URL(tab.url)
//   if(url.origin==="https://github.com"){
//     await chrome.sidepanel.setOptions({
//       tabId, path:"github-panel.html",
//       enabled:true
//     })
//   }else{
//     await chrome.sidepanel.setOptions({
//       tabId, path:"index.html",
//       enabled:true
//     })
//   }
// })

async function getCurrentTab() {
  const tab = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  const currentTab = tab[0];
  return currentTab;
}

function normalizeWordForm(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getWordForms(wordObject) {
  const forms = Array.isArray(wordObject?.word_forms) ? wordObject.word_forms : [];
  return new Set(
    [wordObject?.word, ...forms]
      .map(normalizeWordForm)
      .filter(Boolean),
  );
}

function findDuplicateWord(vocabulary, incomingWord) {
  const incomingForms = getWordForms(incomingWord);
  return Object.values(vocabulary).find((savedWord) => {
    const savedForms = getWordForms(savedWord);
    return [...incomingForms].some((form) => savedForms.has(form));
  });
}

async function showDuplicateIndicator(word) {
  const displayWord = String(word || "this word").trim();
  await chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
  await chrome.action.setBadgeText({ text: "!" });
  await chrome.action.setTitle({ title: `Already saved: ${displayWord}` });
}

async function showSavingIndicator(word) {
  await chrome.action.setBadgeBackgroundColor({ color: "#5b2ec2" });
  await chrome.action.setBadgeText({ text: "..." });
  await chrome.action.setTitle({ title: `Saving ${word}...` });
}

async function showSavedIndicator(word) {
  await chrome.action.setBadgeBackgroundColor({ color: "#059669" });
  await chrome.action.setBadgeText({ text: "OK" });
  await chrome.action.setTitle({ title: `Saved: ${word}` });
}

async function showSaveErrorIndicator(word) {
  await chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
  await chrome.action.setBadgeText({ text: "!" });
  await chrome.action.setTitle({ title: `Could not save: ${word}` });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  //open sidepanel from context menu
  if (info.menuItemId === "open-sidepanel") {
    //for a specific tab
    // chrome.sidePanel.open({tabId:tab.id})
    //for opening globally in all tabs of current window
    chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }

  const selectedWord = normalizeWordForm(info.selectionText);
  if (!selectedWord) return;

  const existingResult = await chrome.storage.local.get("vocabulary");
  const existingVocabulary = existingResult.vocabulary || {};
  const existingWord = findDuplicateWord(existingVocabulary, { word: selectedWord });
  if (existingWord) {
    await showDuplicateIndicator(existingWord.word);
    return;
  }

  await showSavingIndicator(selectedWord);

  try {
    const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",

        messages: [
          {
            role: "user",
            content: `
        Return ONLY a valid JSON object with exact keys(collocations, ielts_tips, meanings, parts_of_speech_examples, pronunciation, synonyms, antonyms, word, word_forms, ielts_relevance_level ielts_relevant_topics). Give array of  clear, concise meanings(if there are multiple meaning of the word) of the word, give a simple string of pronunciation(dont give long string, just pronunciation that is spoken by native speaker), give array of part of speech examples where each array item should have  key value pair(example: ..., part_of_speech:...) , collocations of the word, synonyms of the word, antonyms of the word, Ielts tips, ielts_relevance_level should be in one of three values(low, medium, high),  ielts relevant topics it can be used in along with example for each and also the word provided as well. Also return word_forms as an array of common grammatical forms of the same word, not synonyms or related words. Donot give result in wrong format, follow the output format strictly. Give at least one possible result for each field.

        Return word as the base/dictionary form of the selected word, and make the first item in word_forms that same base form. Explain the English word "${info.selectionText.toLowerCase().trim()}" for an IELTS student.

        Do not include markdown.
        Do not include \`\`\`json.
        Donot provide empty values for any of the keys, at least provide a single value or a mockup text. 
          `,
          },
        ],

        temperature: 0,
        response_format: {
          type: "json_object",
        },
      }),
    },
    );

  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status})`);
  }

  const data = await response.json();
  const wordDataResult = JSON.parse(data.choices[0].message.content);
  const returnedForms = Array.isArray(wordDataResult.word_forms) ? wordDataResult.word_forms : [];
  const baseForm = normalizeWordForm(wordDataResult.word || returnedForms[0]);
  const wordForms = [...new Set([baseForm, selectedWord, ...returnedForms].map(normalizeWordForm).filter(Boolean))];

  const newWordObject = {
      id: `${crypto.randomUUID()}`,
      favourite:false,
      ...wordDataResult,
      word: baseForm || normalizeWordForm(wordDataResult.word),
      word_forms: wordForms,
  };

  const result = await chrome.storage.local.get("vocabulary");
  const vocabulary = result.vocabulary || {};
  const duplicateWord = findDuplicateWord(vocabulary, newWordObject);
  if (duplicateWord) {
    await showDuplicateIndicator(duplicateWord.word);
    return;
  }

  const wordKey = newWordObject.word;
  vocabulary[wordKey] = newWordObject;

  const recentResult = await chrome.storage.local.get("recentWordKeys");
  const recentWordKeys = Array.isArray(recentResult.recentWordKeys) ? recentResult.recentWordKeys : [];
  recentWordKeys.push(wordKey);
  await chrome.storage.local.set({ recentWordKeys });

  await chrome.storage.local.set({
    vocabulary,
  });

  await showSavedIndicator(newWordObject.word);
  } catch (error) {
    console.error("Could not save selected word:", error);
    await showSaveErrorIndicator(selectedWord);
  }
});

//communicating with popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "get-vocabulary") {
    const result = await chrome.storage.local.get("vocabulary");
    sendResponse({ success: true, data: result.vocabulary });
    return true;
  }
  if (message.action === "get-currentTab") {
    const currentTab = await getCurrentTab();
    sendResponse({ tab: currentTab });
    return true;
  }
  if(message.action==="get-recent-word-keys"){
    const result = await chrome.storage.local.get("recentWordKeys");
    sendResponse({ success: true, data: result?.recentWordKeys });
    return true;
  }
});
