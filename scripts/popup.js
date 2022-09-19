// Initialize button with user's preferred color
// let transform = document.getElementById("transform");
let disabledPagesElement = document.getElementById("disabledPages").getElementsByTagName("input")[0];
let disabledSitesElement = document.getElementById("disabledSites").getElementsByTagName("input")[0];
let site, page;

chrome.tabs.query({ active: true, currentWindow: true },
  function (foundTabs) {
    let url = new URL(foundTabs[0].url);
    site = url.hostname;
    page = url.hostname + url.pathname;
  });

//Set the toggles appropriately
chrome.storage.sync.get("listOfSites", ({ listOfSites }) => {
  disabledSitesElement.checked = (site in listOfSites ? listOfSites[site] : false);
  chrome.storage.sync.get("listOfPages", ({ listOfPages }) => {
    shouldEnablePage = false;
    if (page in listOfPages) {
      shouldEnablePage = listOfPages[page];
    } else {
      if (site in listOfSites) {
        if (listOfSites[site] === true) {
          shouldEnablePage = true;
        }
      } else {
        shouldEnablePage = false;
      }
    }
    disabledPagesElement.checked = shouldEnablePage
  });
});

//Set click listeners
disabledSitesElement.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let siteEnabled = disabledSitesElement.checked;
  chrome.storage.sync.get("listOfPages", ({ listOfPages }) => {
    shouldEnablePage = false;
    if (page in listOfPages) {
      shouldEnablePage = listOfPages[page];
    } else {
      shouldEnablePage = siteEnabled;
    }
    disabledPagesElement.checked = shouldEnablePage
  });

  //execute injected script
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: handleToggle,
    args: [0, siteEnabled, site, page]
  });
});

//TODO So the issue is that it clicks twice once and then when it turns on
disabledPagesElement.addEventListener("click", async (e) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let pageEnabled = disabledPagesElement.checked;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: handleToggle,
    args: [1, pageEnabled, site, page]
  });
});


function handleToggle(type, status, site, page) {
  //initially we have site and page set to true.
  //when we disable site, then page also disables.
  //but when site and page are disabled, and then we enable page, it bypasses the site disabling only for that page.
  if (type === 0) {
    chrome.storage.sync.get({ listOfSites: {} },
      function (data) {
        _update(type, status, data.listOfSites, site, page);
      }
    );
  } else {
    chrome.storage.sync.get({ listOfPages: {} },
      function (data) {
        _update(type, status, data.listOfPages, site, page);
      }
    );
  }

  function _update(type, status, dict, site, page) {
    current = undefined;

    if (type === 0) {
      current = site;
    } else if (type === 1) {
      current = page;
    }
    if (current === undefined) {
      console.log("Couldn't grab URL");
      return;
    }
    dict[current] = status

    if (status) {
      _transformNumbersOfPage()
    }
    //then call the set to update with modified value
    if (type == 0) {
      chrome.storage.sync.set({
        listOfSites: dict
      });
    } else {
      chrome.storage.sync.set({
        listOfPages: dict
      });
    }
  }

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
        let regex = /(?:\d+|\d{1,3}(,\d{3})+)(\.\d+)?/g
        if (!regex.test(text)) continue;
        text = text.replace(
          /((?:\d+|\d{1,3}(,\d{3})+)(\.\d+)?)/g,
          "<span style=\"background-color: black; color: black\" onMouseOver='this.replaceWith(document.createTextNode(\"$1\"))'>XXXX</span>"
        );
        const span = document.createElement("span");
        span.innerHTML = text;
        child.replaceWith(span);
      }
    }
    if (site == "www.google.com") {
      console.log("This page is not supported for transformation.")
      return;
    }
    replaceNumbers(document.body);
  }
}
