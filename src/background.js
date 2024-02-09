var DICT;
var REVDICT = {};

fetch("dictionary.json")
    .then((response) => response.json())
    .then((json) => {
        DICT = json;

        for (let key of Object.keys(DICT)) {
            REVDICT[DICT[key]] = key;
        }
    });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "get") {
        let response = DICT[request.word];
        if (response === undefined) {
            response = "";
        }
        sendResponse(response);
    }
    if (request.action === "reverse") {
        let response = REVDICT[request.word];
        if (response === undefined) {
            response = "";
        }
        sendResponse(response);
    }
    if (request.action === "set") {
        DICT[request.word] = request.replacement;
        REVDICT[request.replacement] = request.word;
        sendResponse("success");
    }
});

function whitelistURL(url) {
    return true;
}

function blacklistURL(url) {
    return false;
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(whitelistURL(tab.url) && !blacklistURL(tab.url)){
        chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
              });
    }
});