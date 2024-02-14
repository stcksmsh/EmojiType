// Sample whitelist and blacklist arrays
var whitelist;
var blacklist;
var whitelistState;
var blacklistState;
var dictionary = {};


// Function to update whitelist container
function updateWhitelist() {
    var container = document.getElementById('whitelist-container');
    container.innerHTML = '';
    whitelist.forEach(function(item) {
        var div = document.createElement('div');
        div.innerText = item;
        container.appendChild(div);
    });
}

// Function to update blacklist container
function updateBlacklist() {
    var container = document.getElementById('blacklist-container');
    container.innerHTML = '';
    blacklist.forEach(function(item) {
        var div = document.createElement('div');
        div.innerText = item;
        container.appendChild(div);
    });
}

// Function to update dictionary
function updateDictionary() {
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
    // Call your function here for handling whitelist toggle
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
    // Call your function here for handling blacklist toggle
}

// Function to update whitelist items
function updateWhitelistItems() {
    // Get the whitelist container
    var container = document.getElementById('whitelist-container');
    // get all the divs inside the container
    var divs = container.getElementsByTagName('div');
    // create an empty array to store the items
    var items = [];
    // iterate over the divs
    for (var i = 0; i < divs.length; i++) {
        // push the innerText of the div to the items array
        items.push(divs[i].innerText);
    }
    // Send message to background.js to update the whitelist
    chrome.runtime.sendMessage({action: "set", whitelist: items});
}

// Function to update blacklist items
function updateBlacklistItems() {
    // Get the blacklist container
    var container = document.getElementById('blacklist-container');
    // get all the divs inside the container
    var divs = container.getElementsByTagName('div');
    // create an empty array to store the items
    var items = [];
    // iterate over the divs
    for (var i = 0; i < divs.length; i++) {
        // push the innerText of the div to the items array
        items.push(divs[i].innerText);
    }
    // Send message to background.js to update the blacklist
    chrome.runtime.sendMessage({action: "set", blacklist: items});
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
    whitelist = await chrome.runtime.sendMessage({action: "get", whitelist: true});
    blacklist = await chrome.runtime.sendMessage({action: "get", blacklist: true});
    whitelistState = whitelist.state;
    whitelist = whitelist.value;
    blacklistState = blacklist.state;
    blacklist = blacklist.value;
    if(whitelistState === "on"){
        document.getElementById('whitelist-toggle').toggle('active');
        document.getElementById('whitelist-toggle').innerText = "ON";
    }
    if(blacklistState === "on"){
        document.getElementById('blacklist-toggle').toggle('active');
        document.getElementById('blacklist-toggle').innerText = "ON";
    }

    dictionary = await chrome.runtime.sendMessage({action: "get", dictionary: true});

    // Initial update
    updateWhitelist();
    updateBlacklist();
    updateDictionary();
    
    // Add event listeners after the fact
    document.getElementById('whitelist-toggle').addEventListener('click', toggleWhitelist);
    document.getElementById('blacklist-toggle').addEventListener('click', toggleBlacklist);
    document.getElementById('update-whitelist-btn').addEventListener('click', updateWhitelistItems);
    document.getElementById('update-blacklist-btn').addEventListener('click', updateBlacklistItems);

    document.getElementById('update-dictionary-btn').addEventListener('click', updateDictionaryItems);
    
}

document.addEventListener('DOMContentLoaded', init);

