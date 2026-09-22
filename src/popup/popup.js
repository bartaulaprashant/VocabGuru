const wordList=document.getElementById("word-list")
async function loadVocabulary(){
    const result=await chrome.storage.local.get("vocabulary");

    const vocabulary=result.vocabulary || [];
   vocabulary.forEach((word)=>{
    const listItem=document.createElement("li");
    listItem.textContent=word;
    wordList.appendChild(listItem);
   })
}

loadVocabulary();