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
var whitelistValue;
var blacklistOn;
var blacklistValue;

var delim;


chrome.storage.local.get({whitelist: {state: false, value: []}, blacklist: {state: false, value: []}}, result => {
    whitelistOn = result.whitelist.state;
    whitelistValue = result.whitelist.value;
    blacklistOn = result.blacklist.state;
    blacklistValue = result.blacklist.value;
    console.log(whitelistOn + " " + whitelistValue + " " + blacklistOn + " " + blacklistValue);
});

chrome.storage.local.get({dictionary: defaultDictionary}, function(result) {
    DICT = result.dictionary;
    for (let key of Object.keys(DICT)) {
        REVDICT[DICT[key]] = key;
    }
});

chrome.storage.local.get({delim: ":"}, function(result) {
    delim = result.delim;
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
    },
    "delim": ":"
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
            let response = {state: whitelistOn, value: whitelistValue};
            // let response = whitelistValue;
            sendResponse(response);
        }else if(request.blacklist !== undefined){
            let response = {state: blacklistOn, value: blacklistValue};
            // let response = blacklistValue;
            sendResponse(response);
        }else if(request.dictionary !== undefined){
            sendResponse(DICT);
        }else if(request.delim !== undefined){
            sendResponse(delim);
        }else{
            sendResponse("");
        }
    }else if (request.action === "set") {
        if(request.key !== undefined && request.value !== undefined){
            DICT[request.key] = request.value;
            REVDICT[request.value] = request.key;
            chrome.storage.local.set({dictionary: DICT});
            sendResponse("success");
        }else if(request.whitelist !== undefined){
            whitelistValue = request.whitelist.value;
            whitelistOn = request.whitelist.state;
            chrome.storage.local.set({whitelist: {state: whitelistOn, value: whitelistValue}});
            sendResponse("success");
        }else if(request.blacklist !== undefined){
            blacklistValue = request.blacklist.value;
            blacklistOn = request.blacklist.state;
            chrome.storage.local.set({blacklist: {state: blacklistOn, value: blacklistValue}});
            sendResponse("success");
        }else if(request.dictionary !== undefined){
            DICT = request.dictionary;
            for (let key of Object.keys(DICT)) {
                REVDICT[DICT[key]] = key;
            }
            chrome.storage.local.set({dictionary: DICT});
            sendResponse("success");
        }else if(request.delim !== undefined){
            delim = request.delim;
            chrome.storage.local.set({delim: delim});
            sendResponse("success");
        }else{
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
    if(url == undefined){
        return false;
    }
    if(blacklistOn){
        for (let pattern of blacklistValue) {
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
                target: { tabId: tabId },
                files: ["content.js"]
              });
    }
});