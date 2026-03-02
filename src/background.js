var DICT;
var REVDICT = {};
var whitelistOn;
var whitelistValue;
var blacklistOn;
var blacklistValue;
var delim;
var suggestionsOn;
var suggestionsOpacity = 0.5;

var defaultDictFallback = { smile: "😄", angry: "😠" };

(async function init() {
  var defaultDict = defaultDictFallback;
  try {
    var r = await fetch(
      chrome.runtime.getURL("data/default-dictionary.json")
    );
    defaultDict = await r.json();
  } catch (_) {}

  chrome.storage.local.get(
    {
      dictionary: defaultDict,
      whitelist: { state: false, value: [] },
      blacklist: { state: false, value: [] },
      delim: ":",
      suggestions: { state: true, opacity: 0.75 },
    },
    function (result) {
      DICT = result.dictionary;
      REVDICT = {};
      for (var key in DICT) REVDICT[DICT[key]] = key;
      whitelistOn = result.whitelist.state;
      whitelistValue = result.whitelist.value;
      blacklistOn = result.blacklist.state;
      blacklistValue = result.blacklist.value;
      delim = result.delim;
      suggestionsOn = result.suggestions.state;
      suggestionsOpacity = result.suggestions.opacity;
      setupMessageListener();
    }
  );
})();

function notifyTabs(message) {
  chrome.tabs.query({}, function (tabs) {
    for (var i = 0; i < tabs.length; i++) {
      chrome.tabs.sendMessage(tabs[i].id, message).catch(function () {});
    }
  });
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
  if (request.action === "get") {
    if (request.key !== undefined) {
      let response = DICT[request.key];
      sendResponse(response);
    } else if (request.value !== undefined) {
      let response = REVDICT[request.value];
      sendResponse(response);
    } else if (request.whitelist !== undefined) {
      let response = { state: whitelistOn, value: whitelistValue };
      // let response = whitelistValue;
      sendResponse(response);
    } else if (request.blacklist !== undefined) {
      let response = { state: blacklistOn, value: blacklistValue };
      // let response = blacklistValue;
      sendResponse(response);
    } else if (request.dictionary !== undefined) {
      sendResponse(DICT);
    } else if (request.delim !== undefined) {
      sendResponse(delim);
    } else if (request.suggestions !== undefined) {
      sendResponse({ state: suggestionsOn, opacity: suggestionsOpacity });
    } else {
      sendResponse("");
    }
  } else if (request.action === "set") {
    if (request.key !== undefined && request.value !== undefined) {
      DICT[request.key] = request.value;
      REVDICT[request.value] = request.key;
      chrome.storage.local.set({ dictionary: DICT });
      sendResponse("success");
      notifyTabs({ action: "set", key: request.key, value: request.value });
    } else if (request.whitelist !== undefined) {
      whitelistValue = request.whitelist.value;
      whitelistOn =
        request.whitelist.state === true || request.whitelist.state === "on";
      chrome.storage.local.set({
        whitelist: { state: whitelistOn, value: whitelistValue },
      });
      sendResponse("success");
    } else if (request.blacklist !== undefined) {
      blacklistValue = request.blacklist.value;
      blacklistOn =
        request.blacklist.state === true || request.blacklist.state === "on";
      chrome.storage.local.set({
        blacklist: { state: blacklistOn, value: blacklistValue },
      });
      sendResponse("success");
    } else if (request.dictionary !== undefined) {
      DICT = request.dictionary;
      for (let key of Object.keys(DICT)) {
        REVDICT[DICT[key]] = key;
      }
      chrome.storage.local.set({ dictionary: DICT });
      sendResponse("success");
      notifyTabs({ action: "set", dictionary: DICT, revdictionary: REVDICT });
    } else if (request.delim !== undefined) {
      delim = request.delim;
      chrome.storage.local.set({ delim: delim });
      sendResponse("success");
      notifyTabs({ action: "set", delim: delim });
    } else if (request.suggestions !== undefined) {
      suggestionsOn =
        request.suggestions.state === true ||
        request.suggestions.state === "on";
      suggestionsOpacity = request.suggestions.opacity;
      chrome.storage.local.set({
        suggestions: { state: suggestionsOn, opacity: suggestionsOpacity },
      });
      sendResponse("success");
      notifyTabs({
        action: "set",
        suggestions: { state: suggestionsOn, opacity: suggestionsOpacity },
      });
    } else {
      sendResponse("");
    }
  } else {
    sendResponse("");
  }
  });
}

function IsUrlWhitelisted(url) {
  if (url == undefined) {
    return false;
  }
  if (whitelistOn === true) {
    for (let pattern of whitelistValue) {
      if (url.match(pattern)) {
        return true;
      }
    }
    return false;
  }
  return true;
}

function IsUrlBlacklisted(url) {
  if (url == undefined) {
    return false;
  }
  if (blacklistOn === true) {
    for (let pattern of blacklistValue) {
      if (url.match(pattern)) {
        return true;
      }
    }
    return false;
  }
  return false;
}

function initiateContentScript(tab, changeInfo, tabId) {
  if (changeInfo.status === "complete") {
    if (IsUrlWhitelisted(tab.url) && !IsUrlBlacklisted(tab.url)) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js", "suggestionBox.js"],
      });
    }
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  initiateContentScript(tab, changeInfo, tabId);
});
