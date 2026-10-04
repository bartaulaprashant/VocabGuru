const wordList = document.getElementById("word-list");
const searchInput = document.getElementById("search-input");
let vocabulary = {},
  filteredWords = [];
async function loadVocabulary() {
  try {
    await chrome.runtime.sendMessage(
      {
        action: "get-vocabulary",
      },
      (response) => {
        vocabulary = response.data || {};
        const wordsOnly = Object.values(vocabulary).map(
          (wordObject) => wordObject.word,
        );
        filteredWords = Object.values(wordsOnly.slice(0, wordsOnly.length - 1));
        renderVocabulary(Object.values(vocabulary));
      },
    );
  } catch (error) {
    console.error(error.message);
  }
}
function renderVocabulary(wordsObject) {
  wordList.innerHTML = "";
  wordsObject.forEach((wordObject, index) => {
    if (wordsObject.length - 1 == index) {
      return;
    }
    const listItem = document.createElement("li");
    listItem.textContent = wordObject.word;
    wordList.appendChild(listItem);
    listItem.addEventListener("click", async () => {

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      
      //  Store data while popup is alive
      await chrome.storage.session.set({
        wordObject: wordObject,
      });
      await chrome.sidePanel.open({
        windowId: tab.windowId,
      });
    });
  });
}

// searchInput.addEventListener("input", () => {
//   const searchTerm = searchInput.value.toLowerCase().trim();
//   const filteredSearchWords= filteredWords.filter((word) => {
//     return word.includes(searchTerm);
//   });
//   if(!searchTerm){
//     console.log('run')
//     renderVocabulary(Object.values(vocabulary));
//   }
//   renderVocabulary(filteredSearchWords);
// });

loadVocabulary();

async function updateWord(word) {
  for (const wordObjectKey in vocabulary) {
    if (vocabulary[wordObjectKey].word === word) {
      vocabulary[wordObjectKey].meaning =
        "updated meaning but added some extra words now";
      break;
    }
  }
  await chrome.storage.local.set({ vocabulary: vocabulary });
}

async function deleteWord(word) {
  for (const wordObject in vocabulary) {
    if (vocabulary[wordObject].word === word) {
      delete vocabulary[wordObject];
      break;
    }
  }
  await chrome.storage.local.set({ vocabulary: vocabulary });
}

// setTimeout(() => {
//   updateWord("vocabulary");
//   deleteWord("vocabulary");
// }, 10000);
