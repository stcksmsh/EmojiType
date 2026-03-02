// Sample whitelist and blacklist arrays
var whitelistValue;
var blacklistValue;
var whitelistState;
var blacklistState;
var delimiter;
var dictionary = {};
var suggestionsOn;
var suggestionsOpacity;

// Function to update whitelist container
function initWhitelist() {
  var container = document.getElementById("whitelist-container");
  container.innerHTML = "";
  whitelistValue.forEach(function (item) {
    var div = document.createElement("div");
    div.className = "list-element";
    div.innerText = item;
    container.appendChild(div);
  });
  /// Add an empty element if the whitelist is empty
  if (whitelistValue.length === 0) {
    var div = document.createElement("div");
    div.className = "list-element";
    div.innerText = "";
    container.appendChild(div);
  }
}

// Function to update blacklist container
function initBlacklist() {
  var container = document.getElementById("blacklist-container");
  container.innerHTML = "";
  blacklistValue.forEach(function (item) {
    var div = document.createElement("div");
    div.className = "list-element";
    div.innerText = item;
    container.appendChild(div);
  });
  /// Add an empty element if the blacklist is empty
  if (blacklistValue.length === 0) {
    var div = document.createElement("div");
    div.className = "list-element";
    div.innerText = "";
    container.appendChild(div);
  }
}

function initDelimiter() {
  var container = document.getElementById("delimiter-container");
  container.innerHTML = "";
  container.innerText = delimiter;
}

// Function to update dictionary
function initDictionary() {
  var container = document.getElementById("dictionary-container");
  container.innerHTML = "";
  for (var key in dictionary) {
    var pairDiv = document.createElement("div");
    pairDiv.className = "dictionary-element";

    var keyDiv = document.createElement("div");
    keyDiv.className = "dictionary-key";
    keyDiv.innerHTML = key;
    pairDiv.appendChild(keyDiv);

    var valueDiv = document.createElement("div");
    valueDiv.className = "dictionary-value";
    valueDiv.innerHTML = dictionary[key];
    pairDiv.appendChild(valueDiv);

    var deleteButton = document.createElement("button");
    deleteButton.innerHTML = "X";
    deleteButton.className = "dictionary-delete";
    deleteButton.addEventListener("click", deleteItem);
    pairDiv.appendChild(deleteButton);

    keyDiv.contentEditable = true;
    valueDiv.contentEditable = true;

    container.appendChild(pairDiv);
  }
}

// Function to toggle whitelist
function toggleWhitelist() {
  whitelistState = !whitelistState;
  var whitelistToggle = document.getElementById("whitelist-toggle");
  whitelistToggle.classList.toggle("active", whitelistState);
  whitelistToggle.innerText = whitelistState ? "ON" : "OFF";
  chrome.runtime.sendMessage({
    action: "set",
    whitelist: { state: whitelistState, value: whitelistValue },
  });
}

// Function to toggle blacklist
function toggleBlacklist() {
  blacklistState = !blacklistState;
  var blacklistToggle = document.getElementById("blacklist-toggle");
  blacklistToggle.classList.toggle("active", blacklistState);
  blacklistToggle.innerText = blacklistState ? "ON" : "OFF";
  chrome.runtime.sendMessage({
    action: "set",
    blacklist: { state: blacklistState, value: blacklistValue },
  });
}

// Function to toggle suggestions
function toggleSuggestions() {
  suggestionsOn = !suggestionsOn;
  var suggestionsToggle = document.getElementById("suggestions-toggle");
  suggestionsToggle.classList.toggle("active", suggestionsOn);
  suggestionsToggle.innerText = suggestionsOn ? "ON" : "OFF";
  chrome.runtime.sendMessage({
    action: "set",
    suggestions: { state: suggestionsOn, opacity: suggestionsOpacity },
  });
}

// Function to update whitelist items
function updateWhitelistItems() {
  // Get the whitelist container
  var container = document.getElementById("whitelist-container");
  // Get the innerText of the container and split it by '\n'
  let divs = container.getElementsByTagName("div");
  whitelistValue = [];
  for (var i = 0; i < divs.length; i++) {
    if (divs[i].innerText === "") {
      continue;
    }
    whitelistValue.push(divs[i].innerText);
  }
  // Send message to background.js to update the whitelist
  chrome.runtime.sendMessage({
    action: "set",
    whitelist: { state: whitelistState, value: whitelistValue },
  });
}

// Function to update blacklist items
function updateBlacklistItems() {
  // Get the blacklist container
  var container = document.getElementById("blacklist-container");
  // Get the innerText of the container and split it by '\n'
  let divs = container.getElementsByTagName("div");
  blacklistValue = [];
  for (var i = 0; i < divs.length; i++) {
    if (divs[i].innerText === "") {
      continue;
    }
    blacklistValue.push(divs[i].innerText);
  }
  // Send message to background.js to update the blacklist
  chrome.runtime.sendMessage({
    action: "set",
    blacklist: { state: blacklistState, value: blacklistValue },
  });
}

function updateDelimiter() {
  // Get the delimiter container
  var container = document.getElementById("delimiter-container");
  // Get the div inside the container
  // var div = container.children[0];
  // Get the innerText of the div
  delimiter = container.innerText;
  // Send message to background.js to update the delimiter
  chrome.runtime.sendMessage({ action: "set", delim: delimiter });
}

function updateSuggestionsOpacity(event) {
  suggestionsOpacity = event.target.value;
  chrome.runtime.sendMessage({
    action: "set",
    suggestions: { state: suggestionsOn, opacity: suggestionsOpacity },
  });
}

function deleteItem(event) {
  var button = event.target || event.sourceElement;
  var pair = button.parentElement;
  delete dictionary[pair.children[0].innerHTML]; // remove the element
  pair.remove();
  chrome.runtime.sendMessage({ action: "set", dictionary: dictionary });
}

// Function to update dictionary items
function updateDictionaryItems() {
  // Get the dictionary container
  var container = document.getElementById("dictionary-container");
  // get all the divs inside the container
  var elements = container.getElementsByClassName("dictionary-element");
  // create an empty object to store the items
  var items = {};
  // iterate over the divs
  for (var i = 0; i < elements.length; i++) {
    // split the innerText of the div by ' - ' and push it to the items object
    var key = elements[i].children[0].innerHTML;
    var value = elements[i].children[1].innerHTML;
    if (key === "" || value === "") {
      elements[i].remove(); // remove the element
      i--; // decrement the counter (since we removed an element, the next element will take its place, so we need to check the current index again)
      continue;
    }
    items[key] = value;
  }
  // Send message to background.js to update the dictionary
  chrome.runtime.sendMessage({ action: "set", dictionary: items });
}

function exportSettings() {
  (async function () {
    var whitelist = await chrome.runtime.sendMessage({
      action: "get",
      whitelist: true,
    });
    var blacklist = await chrome.runtime.sendMessage({
      action: "get",
      blacklist: true,
    });
    var delim = await chrome.runtime.sendMessage({
      action: "get",
      delim: true,
    });
    var dictionary = await chrome.runtime.sendMessage({
      action: "get",
      dictionary: true,
    });
    var suggestions = await chrome.runtime.sendMessage({
      action: "get",
      suggestions: true,
    });
    var data = {
      whitelist: whitelist,
      blacklist: blacklist,
      delim: delim,
      dictionary: dictionary,
      suggestions: suggestions,
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "emojitype-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  })();
}

function importSettings() {
  document.getElementById("import-file-input").click();
}

function onImportFileChange(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data || typeof data.dictionary !== "object") {
        alert("Invalid settings file: missing dictionary");
        return;
      }
      (async function () {
        if (data.whitelist != null) {
          await chrome.runtime.sendMessage({
            action: "set",
            whitelist: {
              state:
                data.whitelist.state === true || data.whitelist.state === "on",
              value: Array.isArray(data.whitelist.value)
                ? data.whitelist.value
                : [],
            },
          });
        }
        if (data.blacklist != null) {
          await chrome.runtime.sendMessage({
            action: "set",
            blacklist: {
              state:
                data.blacklist.state === true || data.blacklist.state === "on",
              value: Array.isArray(data.blacklist.value)
                ? data.blacklist.value
                : [],
            },
          });
        }
        if (data.delim != null) {
          await chrome.runtime.sendMessage({
            action: "set",
            delim: String(data.delim),
          });
        }
        if (data.dictionary != null) {
          await chrome.runtime.sendMessage({
            action: "set",
            dictionary: data.dictionary,
          });
        }
        if (data.suggestions != null) {
          await chrome.runtime.sendMessage({
            action: "set",
            suggestions: {
              state:
                data.suggestions.state === true ||
                data.suggestions.state === "on",
              opacity:
                typeof data.suggestions.opacity === "number"
                  ? data.suggestions.opacity
                  : 0.75,
            },
          });
        }
        init();
      })();
    } catch (err) {
      alert("Invalid JSON: " + (err.message || "parse error"));
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function addNewDictionaryItem(event) {
  if (event.key === "Enter") {
    event.preventDefault(); // prevent the default action, make sure the newline character is not added

    var sourceDiv = event.target || event.srcElement; // get the source of the event, which is either a dictionary-key or dictionary-value
    var parentElement = sourceDiv.parentElement; // get the parent element of the source
    var dictionaryContainer = document.getElementById("dictionary-container"); // get the dictionary container

    var newPair = document.createElement("div"); // create a new pair
    newPair.className = "dictionary-element"; // add the class name

    var newKey = document.createElement("div"); // create a new key div
    newKey.className = "dictionary-key"; // add the class name
    newKey.contentEditable = true; // make it content editable
    newKey.innerHTML = ""; // set the innerHTML to empty

    var newValue = document.createElement("div"); // create a new value div
    newValue.className = "dictionary-value"; // add the class name
    newValue.contentEditable = true; // make it content editable
    newValue.innerHTML = ""; // set the innerHTML to empty

    var deleteButton = document.createElement("button"); // create a delete button
    deleteButton.innerHTML = "X"; // set the innerHTML to X
    deleteButton.className = "dictionary-delete"; // add the class name
    deleteButton.addEventListener("click", deleteItem); // add the event listener

    newPair.appendChild(newKey); // append the key to the pair
    newPair.appendChild(newValue); // append the value to the pair
    newPair.appendChild(deleteButton); // append the delete button to the pair

    dictionaryContainer.insertBefore(newPair, parentElement.nextSibling); // insert the new pair after the source
  }
}

async function init() {
  whitelistValue = await chrome.runtime.sendMessage({
    action: "get",
    whitelist: true,
  });
  blacklistValue = await chrome.runtime.sendMessage({
    action: "get",
    blacklist: true,
  });
  whitelistState =
    whitelistValue.state === true || whitelistValue.state === "on";
  whitelistValue = whitelistValue.value;
  blacklistState =
    blacklistValue.state === true || blacklistValue.state === "on";
  blacklistValue = blacklistValue.value;
  document
    .getElementById("whitelist-toggle")
    .classList.toggle("active", whitelistState);
  document.getElementById("whitelist-toggle").innerText = whitelistState
    ? "ON"
    : "OFF";
  document
    .getElementById("blacklist-toggle")
    .classList.toggle("active", blacklistState);
  document.getElementById("blacklist-toggle").innerText = blacklistState
    ? "ON"
    : "OFF";
  delimiter = await chrome.runtime.sendMessage({ action: "get", delim: true });
  dictionary = await chrome.runtime.sendMessage({
    action: "get",
    dictionary: true,
  });
  // Initial update
  initWhitelist();
  initBlacklist();
  initDelimiter();
  initDictionary();

  var suggestions = await chrome.runtime.sendMessage({
    action: "get",
    suggestions: true,
  });
  suggestionsOn = suggestions.state === true || suggestions.state === "on";
  suggestionsOpacity = suggestions.opacity;
  document
    .getElementById("suggestions-toggle")
    .classList.toggle("active", suggestionsOn);
  document.getElementById("suggestions-toggle").innerText = suggestionsOn
    ? "ON"
    : "OFF";
  document.getElementById("opacity-slider").value = suggestionsOpacity;

  // Add event listeners after the fact
  document
    .getElementById("whitelist-toggle")
    .addEventListener("click", toggleWhitelist);
  document
    .getElementById("blacklist-toggle")
    .addEventListener("click", toggleBlacklist);
  document
    .getElementById("update-whitelist-btn")
    .addEventListener("click", updateWhitelistItems);
  document
    .getElementById("update-blacklist-btn")
    .addEventListener("click", updateBlacklistItems);

  document
    .getElementById("update-delimiter-btn")
    .addEventListener("click", updateDelimiter);

  document
    .getElementById("update-dictionary-btn")
    .addEventListener("click", updateDictionaryItems);

  document
    .getElementById("dictionary-container")
    .addEventListener("keydown", addNewDictionaryItem);

  document
    .getElementById("suggestions-toggle")
    .addEventListener("click", toggleSuggestions);

  document
    .getElementById("opacity-slider")
    .addEventListener("input", updateSuggestionsOpacity);

  document
    .getElementById("export-settings-btn")
    .addEventListener("click", exportSettings);
  document
    .getElementById("import-settings-btn")
    .addEventListener("click", importSettings);
  document
    .getElementById("import-file-input")
    .addEventListener("change", onImportFileChange);
}

document.addEventListener("DOMContentLoaded", init, false);
