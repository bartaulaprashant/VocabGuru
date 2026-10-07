const wordList = document.getElementById("word-list");
const searchInput = document.getElementById("search-input");
let vocabulary = {};
async function loadVocabulary() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "get-vocabulary",
    });
    let recentWordKeys=await chrome.storage.local.get('recentWordKeys');
    recentWordKeys.hasOwnProperty('recentWordKeys')?recentWordKeys=recentWordKeys.recentWordKeys:recentWordKeys=[]
    vocabulary = response.data;
    const wordsOnly = Object.values(vocabulary).map(
      (wordObject) => wordObject.word,
    );
    renderVocabulary(vocabulary, recentWordKeys);
  } catch (error) {
    console.error(error.message);
  }
}
function renderVocabulary(wordsObject, recentWordKeys) {
  wordList.innerHTML = "";
  Object.keys(wordsObject).forEach((key, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = wordsObject[key].word;
    wordList.appendChild(listItem);
    listItem.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      //  Store data while popup is alive
      await chrome.storage.session.set({
        wordObject: wordsObject[key],
      });
      chrome.runtime.sendMessage({
        action: "reload-call",
      });
      
      //store recently interacted data keys into the recent keys array and push to storage 

      recentWordKeys.length > 9 && recentWordKeys.shift();
      recentWordKeys.push(key);

      const unique = new Set(recentWordKeys.reverse());  
      recentWordKeys = Array.from(unique).reverse();
      await chrome.storage.local.set({ recentWordKeys: recentWordKeys });

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
