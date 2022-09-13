let pageStatus = true
let disabledSites = {}
let disabledPages = {}
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ pageStatus });
  chrome.storage.sync.set({ disabledSites })
  chrome.storage.sync.set({ disabledPages })
  console.log('Initiailed by default value of ', `page-status: ${pageStatus}`);
});