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
    const word=info.selectionText.trim().toLowerCase();
    
    const result =await chrome.storage.local.get("vocabulary");

    const vocabulary=result.vocabulary || [];

    if(vocabulary.includes(word)){
        console.log("Already Saved:", word);
        return;
    }
    vocabulary.push(word);

    await chrome.storage.local.set({
        vocabulary:vocabulary
    })

    console.log("Saved: ", word);
})