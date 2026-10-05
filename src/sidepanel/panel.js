chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reload-call") {
    // renderWordOverview();
  }
});

const demoData = {
  collocations: [
    "strong collocation",
    "common collocation",
    "natural collocation",
    "verb collocation",
    "noun collocation",
    "study collocations",
    "master collocations",
  ],
  ielts_tips: [
    "Using correct collocations significantly improves …ctions by making your language sound native-like.",
    "Memorize words in chunks (e.g., 'heavy rain' not just 'rain') to sound more fluent and accurate.",
    "Read academic articles to encounter collocations i…stand which words naturally pair with each other.",
  ],
  meanings: [
    "The natural and customary association of one word with another in English",
    "A phrase or group of words that are habitually used together",
  ],
  parts_of_speech_examples: [
    {
      example:
        "Learners often struggle with verb-noun collocations such as 'make a decision' rather than 'do a decision'.",
      part_of_speech: "noun",
    },
    {
      example:
        "The textbook focuses heavily on verbal collocations to improve fluency.",
      part_of_speech: "adjective (in compound nouns)",
    },
  ],

  pronunciation: "/ˌkɒləˈkeɪʃən/",
  synonyms:[
    "idiom", "phrase", "set phrase", "binomial pair" 
  ],
  antonyms: [
    "random combination", "incorrect pair"
  ],
  word:"collocation"
};
// async function renderWordOverview() {
//   document.getElementById("word-overview-wrapper").innerHTML = "";
//   const { wordObject } = await chrome.storage.session.get("wordObject");
//   let overviewInner = document.createElement("div");
//   overviewInner.id = "word-overview-inner";
//   Object.keys(wordObject).forEach((key) => {
//     if (Array.isArray(wordObject[key]) && typeof wordObject[key] === "object") {

//       return;
//     }

//     if (
//       (Array.isArray(wordObject[key] != true) ||
//         typeof wordObject[key] != "string") &&
//       typeof wordObject[key] === "object"
//     ) {

//       return;
//     }

//     const div = document.createElement("div");
//     div.className = "overview-data";
//     div.innerHTML = `<h4>${key}</h4><p>${wordObject[key]}</p>`;
//     overviewInner.appendChild(div);
//   });
//   document.getElementById("word-overview-wrapper").appendChild(overviewInner);
// }

// renderWordOverview();

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
