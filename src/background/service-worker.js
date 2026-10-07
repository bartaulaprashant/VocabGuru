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

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  //open sidepanel from context menu
  if (info.menuItemId === "open-sidepanel") {
    //for a specific tab
    // chrome.sidePanel.open({tabId:tab.id})
    //for opening globally in all tabs of current window
    chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }

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
        Return ONLY a valid JSON object with exact keys(collocations, ielts_tips, meanings, parts_of_speech_examples, pronunciation, synonyms, antonyms, word, ielts_relevant_topics). Give array of  clear, concise meanings(if there are multiple meaning of the word) of the word, give a simple string of pronunciation, give array of Part of speech it can be used in along with example for each of the context its used in, collocations of the word, synonyms of the word, antonyms of the word, Ielts tips, ielts relevant topics it can be used in along with example for each and also the word provided as well.  

        Explain the English word "${info.selectionText.toLowerCase().trim()}" for an IELTS student.

        Do not include markdown.
        Do not include \`\`\`json.
          `,
          },
        ],

        temperature: 1,
        response_format: {
          type: "json_object",
        },
      }),
    },
  );

  const data = await response.json();
  const wordDataResult = JSON.parse(data.choices[0].message.content);

  const newWordObject = {
      id: `${crypto.randomUUID()}`,
      favourite:false,
      ...wordDataResult
  };

  const result = await chrome.storage.local.get("vocabulary");

  const vocabulary = result.vocabulary || {};

  vocabulary.length > 0
    ? Object.values(vocabulary).filter(
        (wordObject) =>
          wordObject.word === info.selectionText.toLowerCase().trim(),
      ).length > 0
      ? console.log("Word Already exists")
      : (vocabulary[wordDataResult.word.trim().toLowerCase()] = newWordObject)
    : (vocabulary[wordDataResult.word.trim().toLowerCase()] = newWordObject);

    let recentWordKeys=await chrome.storage.local.get('recentWordKeys');
    recentWordKeys.hasOwnProperty('recentWordKeys')?recentWordKeys=recentWordKeys.recentWordKeys:recentWordKeys=[]
    recentWordKeys.push(wordDataResult.word.trim().toLowerCase())
    await chrome.storage.local.set({recentWordKeys})

  await chrome.storage.local.set({
   vocabulary
  });
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
