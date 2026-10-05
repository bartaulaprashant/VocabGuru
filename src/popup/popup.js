// const apiUrl = `https://api.groq.com/openai/v1/chat/completions`;

// const fetchWord = async () => {
//   const response = await fetch(apiUrl, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer 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`,
//     },
//     body: JSON.stringify({
//       model: "qwen/qwen3.8-27b",

//       messages: [
//         {
//           role: "user",
//           content: `
//         Return ONLY a valid JSON object. Give array of  clear, concise meanings(if there are multiple meaning of the word) of the word, give a simple string of pronunciation, give array of Part of speech it can be used in along with example for each of the context its used in, collocations of the word, synonyms of the word, antonyms of the word, Ielts tips and also the word provided as well.  

//         Explain the English word "collocation" for an IELTS student.

//         Do not include markdown.
//         Do not include \`\`\`json.
//           `,
//         },
//       ],

//       temperature: 1,
//       response_format: {
//         type: "json_object",
//       },
//     }),
//   });

//   const data = await response.json();
//   const result = JSON.parse(data.choices[0].message.content);

//   console.log(result);
// };
// fetchWord();

const wordList = document.getElementById("word-list");
const searchInput = document.getElementById("search-input");
let vocabulary = {},
  filteredWords = [];
async function loadVocabulary() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "get-vocabulary",
    });
    vocabulary = response.data;
    const wordsOnly = Object.values(vocabulary).map(
      (wordObject) => wordObject.word,
    );
    filteredWords = Object.values(wordsOnly.slice(0, wordsOnly.length - 1));
    renderVocabulary(Object.values(vocabulary));
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
      chrome.runtime.sendMessage({
        action: "reload-call",
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
