//This is an additional feature that is not part of the extension's core functionality. It basically enables the user to select text on the webpage and have a floating tooltip appear on top of the selected text instead of having to open context window to save the vocabulary. They are basically doing same thing but from different architecture. Word is not sent to the background script yet. It can just detect the selected text and pass it to the UI(tooltip)

function getSelectedText() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (!selectedText) {
    return null;
  }

  //get the spatial coordinates of the selection on the screen
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    text: selectedText,
    bounds: {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    },
  };
}

//Mouse drag event
document.addEventListener("mouseup", (event) => {
  if (event.target.closest("#extension-tooltip")) {
    return;
  }
  handleSelectionChange();
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Shift" || event.key.startsWith("Arrow")) {
    handleSelectionChange();
  }
});

//process selection changes and triggers UI updates or message passing
function handleSelectionChange() {
  const selectionInfo = getSelectedText();
  if (!selectionInfo) {
    removeFloatingTooltip();
    return;
  }

  console.log("selected text", selectionInfo.text);

  showFloatingTooltip(selectionInfo);

  chrome.runtime.sendMessage({
    action: "TEXT_SELECTED",
    payload: { text: selectionInfo.text },
  });
}

function showFloatingTooltip(selectionInfo) {
  let tooltip = document.getElementById("extension-tooltip");

  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "extension-tooltip";
    tooltip.innerText = "Search Term";

    Object.assign(tooltip.style, {
      position: "absolute",
      backgroundColor: "#1e293b",
      color: "#ffffff",
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      zIndex: "999999",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      transition: "opacity 0.2s ease",
    });

    tooltip.addEventListener('click', ()=>{
        alert(`Action triggered for: "${selectionInfo.text}`)
    })

    document.body.appendChild(tooltip)
  }

  // Position the tooltip slightly above the selected text
  tooltip.style.top = `${selectionInfo.bounds.top - 38}px`;
  tooltip.style.left = `${selectionInfo.bounds.left}px`;
}


function removeFloatingTooltip(){
    const tooltip=document.getElementById('extension-tooltip')
    if(tooltip){
        tooltip.remove()
    }
}