const demoData = {
  id: "sldkfljowe",
  meaning: "so surprising or impressive as to stun or overwhelm; amazing, extraordinary, or breathtaking",
  partOfSpeech: "verb",
  examples: ["Fashion is by nature ephemeral", "The beauty of cherry blossoms is ephemeral, lasting only a few weeks each spring."],
  synonyms: ["transient", "passing"]
}
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
  const currentTab = await getCurrentTab();
  const newWordObject = {
    id: `${demoData.id} ${info.selectionText.toLowerCase().trim()}`,
    word: info.selectionText.toLowerCase().trim(),
    learningContext: {
      title: currentTab.title,
      url: currentTab.url,
      sourceSentence: "",
      date: Date.now().toString(),
    },
    ...demoData,
  };

  const result = await chrome.storage.local.get("vocabulary");

  const vocabulary = result.vocabulary || {};

  vocabulary.length > 0
    ? Object.values(vocabulary).filter(
        (wordObject) =>
          wordObject.word === info.selectionText.toLowerCase().trim(),
      ).length > 0
      ? console.log("Word Already exists")
      : Array.prototype.push.call(vocabulary, newWordObject)
    : Array.prototype.push.call(vocabulary, newWordObject);

  await chrome.storage.local.set({
    vocabulary: vocabulary,
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

  
  /**
     * chrome.runtime.onMcessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchDataFromAPI") {
        fetch("https://api.example.com/data")
        .then((res) => res.json())
      .then((data) => sendResponse({ status: "ok", data }))
      .catch((err) => sendResponse({ status: "error", error: err.message }));

    return true; // Keep channel open for async sendResponse
  }
});
     */

  //For asynchronous response like fetching from other API.
});
