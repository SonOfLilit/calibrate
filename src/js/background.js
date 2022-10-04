let listOfSites = {};
let listOfPages = {};
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ listOfSites });
  chrome.storage.sync.set({ listOfPages });
});

function backgroundScript(site, page) {
  var transform = false;
  if (site === undefined || page === undefined) {
    console.log("calibrate: Couldn't grab site or page.");
    return;
  }
  //google breaks upon transformation.
  if (site == "www.google.com") {
    console.log("calibrate: This page is not supported for transformation.");
    return;
  }
  chrome.storage.sync.get("listOfSites", ({ listOfSites }) => {
    transform = site in listOfSites ? listOfSites[site] : false;
    chrome.storage.sync.get("listOfPages", ({ listOfPages }) => {
      if (page in listOfPages) {
        transform = listOfPages[page];
      } else {
        transform = site in listOfSites ? listOfSites[site] : false;
      }
      if (transform) {
        _transformNumbersOfPage();
      }
      //debug should be taken out on version >= 1
      console.log(
        "calibrate: {transform=" +
          transform +
          ", listOfSites[site]=" +
          listOfSites[site] +
          " ,listOfPages[page]=" +
          listOfPages[page],
      );
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
          let regex = /(?:\d{1,3}(,\d{3})+|\d+)(\.\d+)?/g;
          if (!regex.test(text)) continue;
          text = text.replace(
            regex,
            '<span style="background-color: black; color: black" onMouseOver=\'this.replaceWith(document.createTextNode("$&"))\'>XXXX</span>',
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
  if (changeInfo.status == "complete" && tab.status == "complete") {
    let url = new URL(tab.url);
    site = url.hostname;
    page = url.hostname + url.pathname;

    chrome.scripting.executeScript({
      args: [site, page],
      target: { tabId: tabId },
      func: backgroundScript,
    });
  }
});
