const wordList=document.getElementById("word-list")
const searchInput=document.getElementById("search-input");
let vocabulary=[]
async function loadVocabulary(){
    const result=await chrome.storage.local.get("vocabulary");

    vocabulary=result.vocabulary || [];
   renderVocabulary(vocabulary);
}

function renderVocabulary(words){
    wordList.innerHTML=""
    words.forEach((word)=>{
        const listItem=document.createElement("li");
        listItem.textContent=word;
        wordList.appendChild(listItem);
    })
}

searchInput.addEventListener("input", ()=>{
    const searchTerm=searchInput.value.toLowerCase().trim();
    const filteredWords=vocabulary.filter((word)=>{
        return word.includes(searchTerm);
    })
    renderVocabulary(filteredWords);
})

loadVocabulary();