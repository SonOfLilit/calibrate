// Initialize button with user's preferred color
// let transform = document.getElementById("transform");
let disabledPagesElement = document.getElementById("disabledPages");
let disabledSitesElement = document.getElementById("disabledSites");
let site = undefined;
let page = undefined;

//Grab urls 
chrome.tabs.query(
  {
    currentWindow: true, active: true
  },
  function (foundTabs) {
      let url = new URL(foundTabs[0].url);
      site = url.site; // doesn't define? TODO
      page = url.site + url.pathname; 
  }
);

//Set the toggles appropriately
chrome.storage.sync.get("listOfDisabledSites", ({ listOfDisabledSites }) => {
  disabledSitesElement.getElementsByClassName("toggle-checkbox")[0].checked =
    listOfDisabledSites.includes(site);
});
chrome.storage.sync.get("listOfDisabledPages", ({ listOfDisabledPages }) => {
  disabledPagesElement.getElementsByClassName("toggle-checkbox")[0].checked =
    listOfDisabledPages.includes(page);
});

//Set click listeners
disabledSitesElement.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  _status = disabledSitesElement.getElementsByClassName("toggle-checkbox")[0].checked;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: handleToggle,
    args: [0, _status]
  });
});

disabledPagesElement.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  _status = disabledPagesElement.getElementsByClassName("toggle-checkbox")[0].checked;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: handleToggle,
    args: [1, _status]
  });
});


// 0 = site, 1 = page
function handleToggle(type, status) {
  if (_checkDoubleAccess(type, status)) {
    return;
  }
  console.log("Inside received: (" + type + ") ", `${status}`)
  if (type === 0) {
    chrome.storage.sync.get({ listOfDisabledSites: [] },
      function (data) {
        _update(type, data.listOfDisabledSites); //storing the storage value in a variable and passing to update function
      }
    );
  } else {
    chrome.storage.sync.get({ listOfDisabledPages: [] },
      function (data) {
        _update(type, data.listOfDisabledPages);
      }
    );
  }
  function _update(type, array) {
    current = null;
    if (type == 0) {
      current = site;
    } else if (type == 1) {
      current = page;
    }
    if (current == null) {
      console.log("Couldn't grab URL");
    }
    console.log(array + " @ " + current)
    if (array.includes(current)) {
      console.log((type === 0 ? "Site" : "Page") + " already disabled. Undo!");
    } else {
      console.log("Added to list of disabled.");
      array.push(current);

      _transformNumbersOfPage();
    }
    //then call the set to update with modified value
    if (type == 0) {
      chrome.storage.sync.set({
        listOfDisabledSites: array
      }, function () {
        console.log("added to site list with new values ", `${array}`);
      });
    } else {
      chrome.storage.sync.set({
        listOfDisabledPages: array
      }, function () {
        console.log("added to page list with new values ", `${array}`);
      });
    }
  }

  //Transform the page
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

  function _checkDoubleAccess(type, status) {
    if (document["guysExtensionHandleToggle" + type] === status) {
      console.log("already called " + (type == 0 ? "site" : "page") + " with same status, returning");
      return true;
    }
    document["guysExtensionHandleToggle" + type] = status;
    return false;
  }
}

// The body of this function will be executed as a content script inside the
// current page



//  /(?:\d+|\d{1,3}(,\d{3})+)(\.\d+)?/
