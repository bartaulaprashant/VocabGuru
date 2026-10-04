chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "word-overview") {
    document.getElementById("word-overview-inner").innerHTML = "";
    const wordData = message.payload.wordObject;
    const overviewInner=document.createElement("div");
    Object.keys(wordData).forEach((key) => {
      if (Array.isArray(wordData[key]) && typeof(wordData[key]) === "object") {
        let dataArrayWrapper = document.createElement("div");
        dataArrayWrapper.className = "overview-data-array";
        const h4 = document.createElement("h4");
        h4.textContent = key;
        dataArrayWrapper.appendChild(h4);
        const ul = document.createElement("ul");
        for (const innerKey in wordData[key]) {
          const li = document.createElement("li");
          console.log(wordData[key][innerKey])
          li.innerHTML = `${wordData[key][innerKey]}`;
          ul.appendChild(li);
        }
        dataArrayWrapper.appendChild(ul);
        overviewInner.appendChild(dataArrayWrapper);
        return;
      }


      if ((Array.isArray(wordData[key]!=true) || typeof(wordData[key]) != "string") && typeof(wordData[key]) === "object"){
        let dataObjectWrapper = document.createElement("div");
        dataObjectWrapper.className = "overview-data-object";
        const h4 = document.createElement("h4");
        h4.textContent = key;
        dataObjectWrapper.appendChild(h4);
        const ul = document.createElement("ul");
        for (const innerKey in wordData[key]) {
          const li = document.createElement("li");
          li.innerHTML = `<strong>${innerKey}:</strong> ${wordData[key][innerKey]}`;
          ul.appendChild(li);
        }
        dataObjectWrapper.appendChild(ul);
        overviewInner.appendChild(dataObjectWrapper);
        return;
      }
      

      const div = document.createElement("div");
      div.className = "overview-data";
      div.innerHTML = `<h4>${key}</h4><p>${wordData[key]}</p>`;
      overviewInner.appendChild(div);
    });
    document.getElementById("word-overview-inner").appendChild(overviewInner);
  }
});

//sidepanel close button
document
  .getElementById("panel-close-button")
  .addEventListener("click", async () => {
    const response = await chrome.runtime.sendMessage({
      action: "get-currentTab",
    });
    chrome.sidePanel.close({ windowId: response.tab.windowId });
  });
