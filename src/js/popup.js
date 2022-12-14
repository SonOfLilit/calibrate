// Initialize button with user's preferred color
// let transform = document.getElementById("transform");
let disabledPagesElement = document
  .getElementById("disabledPages")
  .getElementsByTagName("input")[0];
let disabledSitesElement = document
  .getElementById("disabledSites")
  .getElementsByTagName("input")[0];
let site, page;

chrome.tabs.query({ active: true, currentWindow: true }, function (foundTabs) {
  let url = new URL(foundTabs[0].url);
  site = url.hostname;
  page = url.hostname + url.pathname;
});

//Set the toggles appropriately
chrome.storage.sync.get("listOfSites", ({ listOfSites }) => {
  disabledSitesElement.checked =
    site in listOfSites ? listOfSites[site] : false;
  chrome.storage.sync.get("listOfPages", ({ listOfPages }) => {
    shouldEnablePage = false;
    if (page in listOfPages) {
      shouldEnablePage = listOfPages[page];
    } else {
      shouldEnablePage = site in listOfSites ? listOfSites[site] : false;
    }
    disabledPagesElement.checked = shouldEnablePage;
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
    disabledPagesElement.checked = shouldEnablePage;
  });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: handleToggle,
    args: [0, siteEnabled, site, page],
  });
});

disabledPagesElement.addEventListener("click", async (e) => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let pageEnabled = disabledPagesElement.checked;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: handleToggle,
    args: [1, pageEnabled, site, page],
  });
});

function handleToggle(type, status, site, page) {
  SITE = 0;
  PAGE = 1;

  if (site == "www.google.com") {
    console.log("This page is not supported for transformation.");
    return;
  }

  if (type === SITE) {
    chrome.storage.sync.get({ listOfSites: {} }, function (data) {
      _update(type, status, data.listOfSites, site, page);
    });
  } else {
    chrome.storage.sync.get({ listOfPages: {} }, function (data) {
      _update(type, status, data.listOfPages, site, page);
    });
  }

  function _update(type, status, dict, site, page) {
    current = undefined;

    if (type === SITE) {
      current = site;
    } else if (type === PAGE) {
      current = page;
    }
    if (current === undefined) {
      console.log("Couldn't grab URL");
      return;
    }
    dict[current] = status;

    if (status) {
      _transformNumbersOfPage();
    } else {
      if (type === SITE) {
        chrome.storage.sync.get("listOfPages", ({ listOfPages }) => {
          shouldEnablePage = false;
          if (page in listOfPages) {
            shouldEnablePage = listOfPages[page];
          } else {
            if (current in dict) {
              shouldEnablePage = dict[current];
            }
          }
          if (!shouldEnablePage) {
            _revertPage();
          }
        });
      } else {
        _revertPage();
      }
    }
    if (type === SITE) {
      chrome.storage.sync.set({
        listOfSites: dict,
      });
    } else {
      chrome.storage.sync.set({
        listOfPages: dict,
      });
    }
  }

  function _revertPage() {
    const mouseoverEvent = new Event("mouseover");
    const allElements = document.querySelectorAll("*");

    for (const element of allElements) {
      element.dispatchEvent(mouseoverEvent);
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
        let regex = /(?:\d{1,3}(,\d{3})+|\d+)(\.\d+)?/g;
        if (!regex.test(text)) continue;
        text = text.replace(
          regex,
          "<span class='calibrate-ext-figure' style=\"background-color: black; color: black\" onMouseOver='this.replaceWith(document.createTextNode(\"$&\"))'>XXXX</span>",
        );
        const span = document.createElement("span");
        span.innerHTML = text;
        child.replaceWith(span);
      }
    }
    replaceNumbers(document.body);
  }
}
