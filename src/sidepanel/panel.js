chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reload-call") {
    renderWordOverview();
  }
});
let vocabulary = {}, recentVocabularyKeys=[],
  dataKeys = [];

async function renderWordOverview() {
  const { wordObject } = await chrome.storage.session.get("wordObject");

  if (!wordObject) {
    document.getElementById("word-overview-wrapper").innerHTML = `
      <div style="text-align:center;word-break:none;color:#d0d0d0;font-weight:500;font-size:18px">
          <h2>Click some words to see overviews</h2>      
      </div>
    `;
    return;
  }
  document.getElementById("word-overview-wrapper").innerHTML = "";
  let partsOfSpeech = "",
    meanings = "",
    examples = "",
    ieltsTips = "",
    collocations = "",
    synonyms = "",
    antonyms = "";
  Object.values(wordObject.parts_of_speech_examples).forEach((element) => {
    partsOfSpeech += `<li>${element.part_of_speech}</li>`;
    examples += `
        <p class="example-data">
                  ${element.example}
                  <span class="part-of-speech-tag">${element.part_of_speech}</span>
                </p>
    `;
  });
  wordObject.meanings.forEach((element) => {
    meanings += `  <p class="highlighted-data">
                ${element}
              </p>`;
  });
  Array.isArray(wordObject.ielts_tips)
    ? wordObject.ielts_tips.forEach((element) => {
        ieltsTips += `
   <p>
                  <span
                    style="margin-right: 5px; font-size: 22px; font-weight: 700"
                    >↬</span
                  >
                  ${element}
                </p>
  `;
      })
    : (ieltsTips += `<p> ${wordObject.ielts_tips} </p>`);
  wordObject.collocations.forEach((element) => {
    collocations += `  <span>"${element}"</span>`;
  });
  wordObject.synonyms.forEach((element) => {
    synonyms += ` <li> <span
                    style="margin-right: 5px; font-size: 22px; font-weight: 700"
                    >↬</span>${element}</li>`;
  });
  wordObject.antonyms.forEach((element) => {
    antonyms += ` <li> <span
                    style="margin-right: 5px; font-size: 22px; font-weight: 700"
                    >↬</span>${element}</li>`;
  });

  document.getElementById("word-overview-wrapper").innerHTML = `
     <!-- main data - top part -->
          <div id="word-header">
            <div id="word-options">
              <h3>
                ${wordObject.word}
                <span
                  style="
                    font-style: italic;
                    font-size: 13px;
                    color: rgb(157, 157, 156);
                  "
                  >${wordObject.pronunciation}</span
                >
              </h3>

              <div id="word-options-buttons">
                <button>
                  <img src="/icons/megaphone.png" height="20" width="20" />
                </button>
                <button id="favourite-button" data-word="${wordObject.word}">
                ${wordObject.favourite?'<img src="/icons/starfilled.png" height="15" width="15" />':'<img src="/icons/star.png" height="20" width="20" />'}
                  
                </button>
              </div>
            </div>
            </div>

            <!-- parts of speech  -->
            <div id="part-of-wrapper">
              <h4>Parts of Speech</h4>
              <ul id="part-of-speech-item">
               ${partsOfSpeech}
              </ul>
            </div>

                <!-- divider line  -->
          <div id="dividier-line"></div>

           <!-- rest of data -->
          <div id="word-rest-data">

            <!-- meanings  -->
            <div class="data-wrapper">
              <h4>Meanings</h4>
              <div>
                ${meanings}
              </div>
            </div>
  
              <!-- Examples  -->
            <div class="data-wrapper">
              <h4>Examples</h4>
              <div style="display: flex; flex-direction: column; gap: 20px;word-break:normal">
               ${examples}
              </div>
            </div>

              <!-- Ielts tips  -->
            <div class="data-wrapper">
              <h4>IELTS tips</h4>
              <div style="display: flex; flex-direction: column; gap: 5px">
              ${ieltsTips}
              </div>
            </div>

            <!-- collocations  -->
            <div class="data-wrapper">
              <h4>Collocations</h4>
              <div style="display: flex; flex-direction: column; gap: 5px">
                <p>
                  ${collocations}
                </p>
              </div>
            </div>

             <!-- synonyms and antonyms -->
            <div id="syn-ant-outer">
              <!-- synonyms  -->
              <div id="left-side">
                <h4>Synonyms</h4>
                <ul class="syn-ant-wrapper">
                ${synonyms}
                </ul>
              </div>
              <div id="right-side">
                <h4>Antonyms</h4>
                <ul class="syn-ant-wrapper" >
                  ${antonyms}
                </ul>
              </div>
            </div>
           
          </div>
  `;
  document
    .getElementById("favourite-button")
    .addEventListener("click", async (e) => {
      //change the favourite icon
      vocabulary[wordObject.word].favourite? (e.target.outerHTML = `<img src="/icons/star.png" height="15" width="15" />`)
        : (e.target.outerHTML = `<img src="/icons/starfilled.png" height="15" width="15" />`);
      vocabulary[wordObject.word].favourite =
        !vocabulary[wordObject.word].favourite;

      await chrome.storage.local.set({ vocabulary });
    });
}

renderWordOverview();

async function loadAllVocabulary() {
  const response = await chrome.runtime.sendMessage({
    action: "get-vocabulary",
  });
  const response2=await chrome.runtime.sendMessage({
    action:"get-recent-word-keys"
  })
  vocabulary = response.data;
  recentVocabularyKeys=response2.data;
  vocabulary && Object.keys(vocabulary).forEach((key) => {
    dataKeys.push(key);
  });
  vocabulary?renderAllVocabulary(Object.values(vocabulary)):renderAllVocabulary();
}

function renderAllVocabulary(wordsObject=[]) {
  document.getElementById("words-list").innerHTML = "";
  if (wordsObject.length === 0) {
    document.getElementById("words-list").innerHTML =
      `<h2 style="text-align:center;padding: 30px 0;"> No vocabulary found </h2>`;
    return;
  }
  wordsObject.forEach((wordObject, index) => {
    document.getElementById("words-list").innerHTML += `<li>
                          <div class="top-part">
                              <h3>${wordObject.word}</h3>
                              <p>${wordObject.pronunciation}</p>
                          </div>
                          <div class="bottom-part">
                            <p>${wordObject.meanings[0]}</p>
                          </div>
                        </li>`;
  });
}
loadAllVocabulary();

document.getElementById("search-input").addEventListener("input", (e) => {
  const searchTerm = e.target.value.trim().toLowerCase();
  const filteredKey = dataKeys.filter((key) => {
    return key.startsWith(searchTerm);
  });
  const filteredData = filteredKey.map((key) => {
    return vocabulary[key];
  });
  renderAllVocabulary(filteredData);
});


function handleTabSelection(e) {
  const tab=e.target.textContent.trim().toLowerCase();
  const recentVocab=Object.keys(vocabulary).map((key) => {
    if(recentVocabularyKeys.includes(key)){
      return vocabulary[key];
    }
  })
  console.log(recentVocab)
  tab === "all"? renderAllVocabulary(Object.values(vocabulary)):
 tab=== "favourites" ? renderAllVocabulary(Object.values(vocabulary).filter((wordObject) => wordObject.favourite)):(
  renderAllVocabulary(recentVocab));
}
document.getElementById("all-vocab-button").addEventListener("click", handleTabSelection);
document.getElementById("favourite-vocab-button").addEventListener("click", handleTabSelection);
document.getElementById("recent-vocab-button").addEventListener("click", handleTabSelection);
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
