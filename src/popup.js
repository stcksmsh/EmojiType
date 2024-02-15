// Sample whitelist and blacklist arrays
var whitelistValue;
var blacklistValue;
var whitelistState;
var blacklistState;
var delimiter;
var dictionary = {};


// Function to update whitelist container
function initWhitelist() {
    var container = document.getElementById('whitelist-container');
    container.innerHTML = '';
    whitelistValue.forEach(function(item) {
        var div = document.createElement('div');
        div.innerText = item;
        container.appendChild(div);
    });
}

// Function to update blacklist container
function initBlacklist() {
    var container = document.getElementById('blacklist-container');
    container.innerHTML = '';
    blacklistValue.forEach(function(item) {
        var div = document.createElement('div');
        div.innerText = item;
        container.appendChild(div);
    });
}

function initDelimiter() {
    var container = document.getElementById('delimiter-container');
    container.innerHTML = '';
    container.innerText = delimiter;
    // var div = document.createElement('div');
    // div.innerText = delimiter;
    // container.appendChild(div);
}

// Function to update dictionary
function initDictionary() {
    var container = document.getElementById('dictionary-container');
    container.innerHTML = '';
    for (var key in dictionary) {
        var div = document.createElement('div');
        div.innerText = key + ' - ' + dictionary[key];
        container.appendChild(div);
    }
}

// Function to toggle whitelist
function toggleWhitelist(){
    var whitelistToggle = document.getElementById('whitelist-toggle');
    whitelistToggle.classList.toggle('active');
    if (whitelistToggle.innerText === 'ON') {
        whitelistToggle.innerText = 'OFF';
    } else {
        whitelistToggle.innerText = 'ON';
    }
    chrome.runtime.sendMessage({action: "set", whitelist: {state: whitelistToggle.innerText.toLowerCase(), value: whitelistValue}});
}

// Function to toggle blacklist
function toggleBlacklist() {
    var blacklistToggle = document.getElementById('blacklist-toggle');
    blacklistToggle.classList.toggle('active');
    if (blacklistToggle.innerText === 'ON') {
        blacklistToggle.innerText = 'OFF';
    } else {
        blacklistToggle.innerText = 'ON';
    }
    chrome.runtime.sendMessage({action: "set", blacklist: {state: blacklistToggle.innerText.toLowerCase(), value: blacklistValue}});
}

// Function to update whitelist items
function updateWhitelistItems() {
    // Get the whitelist container
    var container = document.getElementById('whitelist-container');
    // Get the innerText of the container and split it by '\n'
    whitelistValue = container.innerText.split('\n');
    // Send message to background.js to update the whitelist
    chrome.runtime.sendMessage({action: "set", whitelist: {state: whitelistState, value: whitelistValue}});
}

// Function to update blacklist items
function updateBlacklistItems() {
    // Get the blacklist container
    var container = document.getElementById('blacklist-container');
    // Get the innerText of the container and split it by '\n'
    blacklistValue = container.innerText.split('\n');
    // Send message to background.js to update the blacklist
    chrome.runtime.sendMessage({action: "set", blacklist: {state: blacklistState, value: blacklistValue}});
}

function updateDelimiter() {
    // Get the delimiter container
    var container = document.getElementById('delimiter-container');
    // Get the div inside the container
    // var div = container.children[0];
    // Get the innerText of the div
    delimiter = container.innerText;
    // Send message to background.js to update the delimiter
    chrome.runtime.sendMessage({action: "set", delim: delimiter});
}

// Function to update dictionary items
function updateDictionaryItems() {
    // Get the dictionary container
    var container = document.getElementById('dictionary-container');
    // get all the divs inside the container
    var divs = container.getElementsByTagName('div');
    // create an empty object to store the items
    var items = {};
    // iterate over the divs
    for (var i = 0; i < divs.length; i++) {
        // split the innerText of the div by ' - ' and push it to the items object
        var parts = divs[i].innerText.split(' - ');
        items[parts[0]] = parts[1];
    }
    // Send message to background.js to update the dictionary
    chrome.runtime.sendMessage({action: "set", dictionary: items});
}


async function init(){
    whitelistValue = await chrome.runtime.sendMessage({action: "get", whitelist: true});
    console.log(whitelistValue);
    blacklistValue = await chrome.runtime.sendMessage({action: "get", blacklist: true});
    console.log(blacklistValue);
    whitelistState = whitelistValue.state;
    whitelistValue = whitelistValue.value;
    blacklistState = blacklistValue.state;
    blacklistValue = blacklistValue.value;
    if(whitelistState === "on"){
        document.getElementById('whitelist-toggle').classList.toggle('active');
        document.getElementById('whitelist-toggle').innerText = "ON";
    }
    if(blacklistState === "on"){
        document.getElementById('blacklist-toggle').classList.toggle('active');
        document.getElementById('blacklist-toggle').innerText = "ON";
    }
    delimiter = await chrome.runtime.sendMessage({action: "get", delim: true});
    console.log(delimiter);
    dictionary = await chrome.runtime.sendMessage({action: "get", dictionary: true});
    console.log(dictionary);
    // Initial update
    initWhitelist();
    initBlacklist();
    initDelimiter();
    initDictionary();
    
    // Add event listeners after the fact
    document.getElementById('whitelist-toggle').addEventListener('click', toggleWhitelist);
    document.getElementById('blacklist-toggle').addEventListener('click', toggleBlacklist);
    document.getElementById('update-whitelist-btn').addEventListener('click', updateWhitelistItems);
    document.getElementById('update-blacklist-btn').addEventListener('click', updateBlacklistItems);

    document.getElementById('update-delimiter-btn').addEventListener('click', updateDelimiter);

    document.getElementById('update-dictionary-btn').addEventListener('click', updateDictionaryItems);
    
}

document.addEventListener('DOMContentLoaded', init, false);

