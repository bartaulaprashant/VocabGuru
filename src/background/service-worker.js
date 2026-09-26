const demoData={
    id: 'sldkfljowe',
    meaning: " something related to the word",
    partOfSpeech: "noun",
    examples:[
        "example 1",
        "example 2"
    ],
    synonyms:[
        "synonym 1",
        "synonym 2"
    ]
}

//chrome provides event called onInstalled when the extension is installed, updated or sometimes reloaded during development. Basically execute this callback function when the user installs or .....
chrome.runtime.onInstalled.addListener(()=>{
    // create a menu on right click when selection is made
    chrome.contextMenus.create({
        id:"save-word",
        title:"Save to vocabulary",
        contexts:["selection"]
    })
})

chrome.contextMenus.onClicked.addListener( async (info)=>{
    const newWordObject={
        id:`${demoData.id} ${info.selectionText.toLowerCase().trim()}`,
        word: info.selectionText.toLowerCase().trim(),
        ...demoData
    }
    
    const result =await chrome.storage.local.get("vocabulary");

    const vocabulary=result.vocabulary || {};

    vocabulary.length > 0 ? Object.values(vocabulary).filter((wordObject)=>wordObject.word===info.selectionText.toLowerCase().trim()).length > 0 ? console.log("Word Already exists") : Array.prototype.push.call(vocabulary, newWordObject): Array.prototype.push.call(vocabulary, newWordObject);

    await chrome.storage.local.set({
        vocabulary:vocabulary
    })
})