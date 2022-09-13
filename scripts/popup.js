// Initialize button with user's preferred color
let transform = document.getElementById("transform");
let disabledPages = document.getElementById("disabledPages");
let disabledSitesElement = document.getElementById("disabledSites");

chrome.storage.sync.get("pageStatus", ({ pageStatus }) => {
  transform.pageStatus = pageStatus;
});

chrome.storage.sync.get("disabledSites", ({ disabledSites }) => {
  disabledSitesElement.disabledSites = disabledSites;
});

// When the button is clicked, inject setPageBackgroundColor into current page
transform.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: transformNumbersOfPage,
  });
});

disabledSitesElement.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: disableThisSite,
  });
});

function disableThisSite() {
  chrome.storage.sync.get("disabledSites", ({ disabledSites }) => {
    console.log(disabledSites)
    current_site = window.location.href
    console.log("Found this site:", `${current_site}`)
    // disabledSites.push(current_site);
    console.log("New list", disabledSites)
    chrome.storage.sync.set({ disabledSites });
  });
}
// The body of this function will be executed as a content script inside the
// current page
function transformNumbersOfPage() {
  chrome.storage.sync.get("pageStatus", ({ pageStatus }) => {
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

    pageStatus = !pageStatus;
    chrome.storage.sync.set({ pageStatus });

    if (!pageStatus) {
      // revert ? [might be just refreshing]
    } else {
      replaceNumbers(document.body);
    }
    console.log("page status = " + pageStatus);
  });
}


//  /(?:\d+|\d{1,3}(,\d{3})+)(\.\d+)?/
