let floatingDiv = document.createElement("div");

floatingDiv.style =
  "position: absolute; display: none; background: #fff; border: 1px solid #ccc; " +
  "opacity: 0.95; z-index: 100000; flex-direction: column; color: #222; " +
  "border-radius: 6px; padding: 4px 0; max-height: 200px; overflow-y: auto; " +
  "width: 220px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font: 14px sans-serif;";

var style = document.createElement("style");
style.textContent =
  ".emojitype-highlighted { background-color: #e0e8ff !important; }";
document.head.appendChild(style);

document.body.appendChild(floatingDiv);

DICT = {};
REVDICT = {};

/// now get the dictionary from the background script, initially
chrome.runtime
  .sendMessage({
    action: "get",
    dictionary: true,
  })
  .then(function (response) {
    DICT = response;
    /// now initialise the revdictionary
    for (let key of Object.keys(DICT)) {
      REVDICT[DICT[key]] = key;
    }
  });

var suggestionsOn = false;
var suggestionsOpacity = 0.75;

chrome.runtime
  .sendMessage({
    action: "get",
    suggestions: true,
  })
  .then(function (response) {
    suggestionsOn = response.state;
    suggestionsOpacity = response.opacity;
    updateSuggestionBox();
  });

var currentSuggestionsList = [];
var currentHighlightedIndex = 0;

window.__emojitypeHideSuggestions = function () {
  floatingDiv.style.display = "none";
  window.__emojitypeSuggestionsVisible = false;
};

window.__emojitypeSuggestionsVisible = false;

function setHighlight(index) {
  var rows = floatingDiv.querySelectorAll("[data-keyword]");
  for (var i = 0; i < rows.length; i++) {
    rows[i].classList.toggle("emojitype-highlighted", i === index);
  }
  currentHighlightedIndex = index;
  var row = rows[index];
  if (row) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function selectHighlighted() {
  var kw = currentSuggestionsList[currentHighlightedIndex];
  if (kw && DICT[kw] != null) {
    document.dispatchEvent(
      new CustomEvent("emojitype-insert-suggestion", {
        detail: { keyword: kw },
      })
    );
  }
}

window.__emojitypeSuggestionsKey = function (key) {
  if (
    !window.__emojitypeSuggestionsVisible ||
    currentSuggestionsList.length === 0
  )
    return;
  if (key === "ArrowDown") {
    setHighlight(
      Math.min(currentHighlightedIndex + 1, currentSuggestionsList.length - 1)
    );
  } else if (key === "ArrowUp") {
    setHighlight(Math.max(currentHighlightedIndex - 1, 0));
  } else if (key === "Enter") {
    selectHighlighted();
  }
};

function updateSuggestions(x, top, bottom, text) {
  if (!suggestionsOn) {
    floatingDiv.style.display = "none";
    window.__emojitypeSuggestionsVisible = false;
    return null;
  }
  if (text == "") {
    floatingDiv.style.display = "none";
    window.__emojitypeSuggestionsVisible = false;
    return null;
  }
  floatingDiv.style.display = "flex";
  for (
    var child = floatingDiv.lastChild;
    child;
    child = floatingDiv.lastChild
  ) {
    floatingDiv.removeChild(child);
  }

  var suggestions = [];
  for (var key in DICT) {
    if (key.startsWith(text)) suggestions.push(key);
  }

  if (suggestions.length == 0) {
    floatingDiv.style.display = "none";
    window.__emojitypeSuggestionsVisible = false;
    return null;
  }

  suggestions.sort(function (a, b) {
    return a.localeCompare(b);
  });
  currentSuggestionsList = suggestions;
  currentHighlightedIndex = 0;
  window.__emojitypeSuggestionsVisible = true;

  for (var i = 0; i < suggestions.length; i++) {
    var suggestion = suggestions[i];
    var suggestionDiv = document.createElement("div");
    suggestionDiv.className = "emojitype-suggestion-row";
    suggestionDiv.style =
      "padding: 5px; cursor: pointer; display: flex; justify-content: space-between;";
    suggestionDiv.dataset.keyword = suggestion;
    if (i === 0) suggestionDiv.classList.add("emojitype-highlighted");
    suggestionDiv.onclick = function (e) {
      var kw = e.currentTarget.dataset.keyword;
      if (kw && DICT[kw] != null) {
        document.dispatchEvent(
          new CustomEvent("emojitype-insert-suggestion", {
            detail: { keyword: kw },
          })
        );
      }
    };

    if (i > 0) suggestionDiv.style.borderTop = "1px solid #ccc";

    var suggestionText = document.createElement("span");
    suggestionText.textContent = suggestion;
    suggestionText.style = "margin: 0;";
    suggestionDiv.appendChild(suggestionText);

    var suggestionValue = document.createElement("span");
    suggestionValue.textContent = DICT[suggestion];
    suggestionValue.style = "margin: 0;";
    suggestionDiv.appendChild(suggestionValue);

    floatingDiv.appendChild(suggestionDiv);
  }

  if (window.screen.availHeight - bottom < floatingDiv.clientHeight + 150) {
    top -= floatingDiv.clientHeight;
    floatingDiv.style.left = x + "px";
    floatingDiv.style.top = top + "px";
  } else {
    floatingDiv.style.left = x + "px";
    floatingDiv.style.top = bottom + "px";
  }

  return suggestions[0];
}

function updateSuggestionBox() {
  floatingDiv.style.opacity = suggestionsOpacity;
  if (suggestionsOn) {
    floatingDiv.style.display = "flex";
  } else {
    floatingDiv.style.display = "none";
  }
}
