chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reload-call") {
    renderWordOverview();
  }
});


async function renderWordOverview() {
  const {wordObject}=await chrome.storage.session.get('wordObject')
  document.getElementById("word-overview-wrapper").innerHTML = "";
  let partsOfSpeech = "",
    meanings = "",
    examples = "",
    ieltsTips = "", collocations="", synonyms="", antonyms="";
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
  Array.isArray(wordObject.ielts_tips)?(wordObject.ielts_tips.forEach((element) => {
    ieltsTips += `
   <p>
                  <span
                    style="margin-right: 5px; font-size: 22px; font-weight: 700"
                    >↬</span
                  >
                  ${element}
                </p>
  `;
  })):(ieltsTips+=`<p> ${wordObject.ielts_tips} </p>`);
  wordObject.collocations.forEach((element)=>{
    collocations+=`  <span>"${element}"</span>`
  })
  wordObject.synonyms.forEach((element)=>{
    synonyms+=` <li> <span
                    style="margin-right: 5px; font-size: 22px; font-weight: 700"
                    >↬</span>${element}</li>`
  })
  wordObject.antonyms.forEach((element)=>{
    antonyms+=` <li> <span
                    style="margin-right: 5px; font-size: 22px; font-weight: 700"
                    >↬</span>${element}</li>`
  })

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
                <button>
                  <img src="/icons/star.png" height="15" width="15" />
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
                              <p>${wordObject.pronunciation}</p>
                          </div>
                          <div class="bottom-part">
                            <p>${wordObject.meanings[0]}</p>
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
