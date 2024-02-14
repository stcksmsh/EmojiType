let defaultDictionary = {
    "angry": "😠",
    "blushing": "😊",
    "clap": "👏",
    "confounded": "😖",
    "confused": "😕",
    "crying": "😢",
    "disappointed": "😞",
    "dizzy": "😵",
    "drooling": "🤤",
    "fist": "✊",
    "flushed": "😳",
    "hug": "🤗",
    "kiss": "😘",
    "money": "🤑",
    "muscle": "💪",
    "neutral": "😐",
    "party": "🥳",
    "plead": "🥺",
    "rage": "😡",
    "eye_roll": "🙄",
    "quiet": "🤫",
    "zzz": "😴",
    "snoring": "😪",
    "smile": "😄",
    "sob": "😭",
    "sweat": "😓",
    "vomit": "🤮"
};



var DICT;
var REVDICT = {};

var whitelistOn;
var whitelist;
var blacklistOn;
var blacklist;


chrome.storage.local.get({whitelist: {state: false, value: []}, blacklist: {state: false, value: []}}, function(result) {
    whitelistOn = result.whitelist.state;
    whitelist = result.whitelist.value;
    blacklistOn = result.blacklist.state;
    blacklist = result.blacklist.value;
});

chrome.storage.local.get({dictionary: defaultDictionary}, function(result) {
    DICT = result.dictionary;
    for (let key of Object.keys(DICT)) {
        REVDICT[DICT[key]] = key;
    }
});

/// what requests should look like
let request = {
    "action": "get/set", 
    "key": "hello",
    "value": "world",
    "whitelist": {state: "on/off", value:["https://*.example.com/*"]},
    "blacklist": {state: "on/off", value:["https://example.com/*"]},
    "dictionary": {
        "hello": "world"
    }
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request);
    if (request.action === "get") {
        if(request.key !== undefined){
            let response = DICT[request.key];
            sendResponse(response);
        }else if(request.value !== undefined){
            let response = REVDICT[request.value];
            sendResponse(response);
        }else if(request.whitelist !== undefined){
            let response = {state: whitelistOn, value: whitelist};
            sendResponse(response);
        }else if(request.blacklist !== undefined){
            let response = {state: blacklistOn, value: blacklist};
            sendResponse(response);
        }else if(request.dictionary !== undefined){
            sendResponse(DICT);
        }else{
            sendResponse("");
        }
    }else if (request.action === "set") {
        if(request.key !== undefined && request.value !== undefined){
            DICT[request.key] = request.value;
            REVDICT[request.value] = request.key;
            sendResponse("success");
        }else if(request.whitelist !== undefined){
            whitelist = request.whitelist;
            sendResponse("success");
        }else if(request.blacklist !== undefined){
            blacklist = request.blacklist;
            sendResponse("success");
        }else if(request.dictionary !== undefined){
            DICT = request.dictionary;
            for (let key of Object.keys(DICT)) {
                REVDICT[DICT[key]] = key;
            }
            sendResponse("success");
        }
        else{
            sendResponse("");
        }
    }else{
        sendResponse("");
    }
});

function IsUrlWhitelisted(url) {
    if(url == undefined){
        return false;
    }
    if(whitelistOn){
        for (let pattern of whitelist) {
            if (url.match(pattern)) {
                return true;
            }
        }
        return false;
    }
    return true;
}

function IsUrlBlacklisted(url) {
    if(url == undefined){
        return false;
    }
    if(blacklistOn){
        for (let pattern of blacklist) {
            if (url.match(pattern)) {
                return true;
            }
        }
        return false;
    }
    return false;
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if(IsUrlWhitelisted(tab.url) && !IsUrlBlacklisted(tab.url)){
        chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
              });
    }
});