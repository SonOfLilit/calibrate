let listOfDisabledSites = []
let listOfDisabledPages = []

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ listOfDisabledSites })
  chrome.storage.sync.set({ listOfDisabledPages })
});

function backgroundScript() {

  function _transformNumbersOfPage() {
    function escapeHtml(unsafe) {
      return unsafe.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    }
    function replaceNumbers(node) {
      for (const child of node.childNodes) {
        if (child.nodeType !== 3) {
          replaceNumbers(child);
          continue;
        }
        let text = escapeHtml(child.textContent);
        if (!/\d/.test(text)) continue;
        text = text.replace(
          /(\d+)/g,
          "<span onMouseOver='this.replaceWith(document.createTextNode(\"$1\"))'>XXXX</span>"
        );
        const span = document.createElement("span");
        span.innerHTML = text;
        child.replaceWith(span);
      }
    }
    replaceNumbers(document.body);
  }

  var transform = true;
  let hostname = "www.google.com"; // how do we define this
  let href = "www.google.com/"; // and this
  
  chrome.storage.sync.get("listOfDisabledSites", ({ listOfDisabledSites }) => {
    list = listOfDisabledSites;
    console.log(hostname, href);
    console.log("sites: ", list);
    console.log("Checking if contains... ", hostname, list.includes(hostname));
    if (list.includes(hostname)) {
      transform = false;
    }
    chrome.storage.sync.get("listOfDisabledPages", ({ listOfDisabledPages }) => {
      list = listOfDisabledPages;
      console.log("pages: ", list)
      console.log("Checking if pages contains... ", href)
      if (list.includes(href)) {
        transform = false;
      }
      if (transform) {
        console.log("We transformed");
        _transformNumbersOfPage();
      } else {
        console.log("we didn't transform")
      }
    });
  });
}



chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  //grab fancy urls
  if (changeInfo.status == 'complete' && tab.status == 'complete') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: backgroundScript
    });
  }
});