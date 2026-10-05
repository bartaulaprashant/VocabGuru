chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reload-call") {
    renderWordOverview();
  }
});

async function renderWordOverview() {
  document.getElementById("word-overview-wrapper").innerHTML = "";
  const { wordObject } = await chrome.storage.session.get("wordObject");
  let overviewInner = document.createElement("div");
  overviewInner.id = "word-overview-inner";
  Object.keys(wordObject).forEach((key) => {
    if (Array.isArray(wordObject[key]) && typeof wordObject[key] === "object") {
      let dataArrayWrapper = document.createElement("div");
      dataArrayWrapper.className = "overview-data-array";
      const h4 = document.createElement("h4");
      h4.textContent = key;
      dataArrayWrapper.appendChild(h4);
      const ul = document.createElement("ul");
      for (const innerKey in wordObject[key]) {
        const li = document.createElement("li");
        li.innerHTML = `${wordObject[key][innerKey]}`;
        ul.appendChild(li);
      }
      dataArrayWrapper.appendChild(ul);
      overviewInner.appendChild(dataArrayWrapper);
      return;
    }

    if (
      (Array.isArray(wordObject[key] != true) ||
        typeof wordObject[key] != "string") &&
      typeof wordObject[key] === "object"
    ) {
      let dataObjectWrapper = document.createElement("div");
      dataObjectWrapper.className = "overview-data-object";
      const h4 = document.createElement("h4");
      h4.textContent = key;
      dataObjectWrapper.appendChild(h4);
      const ul = document.createElement("ul");
      for (const innerKey in wordObject[key]) {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${innerKey}:</strong> ${wordObject[key][innerKey]}`;
        ul.appendChild(li);
      }
      dataObjectWrapper.appendChild(ul);
      overviewInner.appendChild(dataObjectWrapper);
      return;
    }

    const div = document.createElement("div");
    div.className = "overview-data";
    div.innerHTML = `<h4>${key}</h4><p>${wordObject[key]}</p>`;
    overviewInner.appendChild(div);
  });
  document.getElementById("word-overview-wrapper").appendChild(overviewInner);
}

renderWordOverview();

let vocabulary = {};
async function loadAllVocabulary() {
  const response = await chrome.runtime.sendMessage({
    action: "get-vocabulary",
  });
  vocabulary = response.data;
  renderAllVocabulary(Object.values(vocabulary));
}

function renderAllVocabulary(wordsObject) {
  document.getElementById("words-list").innerHTML = "";
  wordsObject.forEach((wordObject, index) => {
    if (wordsObject.length - 1 == index) {
      return;
    }
    document.getElementById("words-list").innerHTML += `<li>
                          <div class="top-part">
                              <h3>${wordObject.word}</h3>
                              <p>/prə-nŭn″sē-ā′shən/</p>
                          </div>
                          <div class="bottom-part">
                            <p>${wordObject.meaning}</p>
                          </div>
                        </li>`;
  });
}
loadAllVocabulary();
//sidepanel close button
document
  .getElementById("panel-close-button")
  .addEventListener("click", async () => {
    const response = await chrome.runtime.sendMessage({
      action: "get-currentTab",
    });
    chrome.storage.session.clear();
    chrome.sidePanel.close({ windowId: response.tab.windowId });
  });
