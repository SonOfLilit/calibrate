let listOfSites = {}
let listOfPages = {}
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ listOfSites })
  chrome.storage.sync.set({ listOfPages })
});

function backgroundScript(site, page) {
  var transform = false;
  if (site === undefined || page === undefined) {
    console.log("Couldn't grab site or page.");
    return;
  }
  if (site == "www.google.com") {
    console.log("This page is not supported for transformation.")
    return;
  }
  chrome.storage.sync.get("listOfSites", ({ listOfSites }) => {
    list = listOfSites;
    if (site in list) {
      transform = list[site];
    }
    chrome.storage.sync.get("listOfPages", ({ listOfPages }) => {
      list = listOfPages;
      if (page in list) {
        if (list[page])
        transform = list[page];
      }
      if (transform) {
        _transformNumbersOfPage();
      }
    });
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
  });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.status == 'complete') {
    let url = new URL(tab.url);
    site = url.hostname;
    page = url.hostname + url.pathname;

    chrome.scripting.executeScript({
      args: [site, page],
      target: { tabId: tabId },
      func: backgroundScript
    });
  }
});