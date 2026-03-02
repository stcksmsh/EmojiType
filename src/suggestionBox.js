let floatingDiv = document.createElement("div");

floatingDiv.style =
  " position: absolute;\
                    display: none; \
                    background-color: #dfdfdf; \
                    border: 1px solid black; \
                    opacity: 0.75; \
                    z-index: 1000; \
                    flex-direction: column; \
                    color: black; \
                    border-radius: 5px; \
                    padding: 5px; \
                    max-height: 200px; \
                    overflow-y: auto; \
                    width: 200px; \
                    box-shadow: 0px 0px 5px 0px black;";

document.body.appendChild(floatingDiv);

DICT = {};
REVDICT = {};

let divX = 0,
  divY = 0;

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

window.__emojitypeHideSuggestions = function () {
  floatingDiv.style.display = "none";
};

function updateSuggestions(x, top, bottom, text) {
  if (!suggestionsOn) {
    floatingDiv.style.display = "none";
    return null;
  }
  if (text == "") {
    floatingDiv.style.display = "none";
    return null;
  }
  floatingDiv.style.display = "flex";
  for (
    let child = floatingDiv.lastChild;
    child;
    child = floatingDiv.lastChild
  ) {
    floatingDiv.removeChild(child);
  }

  /// now we need to add the suggestions to the floating div
  /// we need to get the suggestions from the dictionary which are similar to the text
  /// sort the suggestions by the similarity
  /// add the suggestions to the floating div
  var suggestions = [];
  for (var key in DICT) {
    if (key.startsWith(text)) {
      suggestions.push(key);
    }
  }

  if (suggestions.length == 0) {
    floatingDiv.style.display = "none";
    return null;
  }

  suggestions.sort((a, b) => a.localeCompare(b));
  for (var i = 0; i < suggestions.length; i++) {
    var suggestion = suggestions[i];
    var suggestionDiv = document.createElement("div");
    suggestionDiv.style =
      "padding: 5px; cursor: pointer; display: flex; justify-content: space-between;";
    suggestionDiv.dataset.keyword = suggestion;
    suggestionDiv.onclick = function (e) {
      var kw = e.currentTarget.dataset.keyword;
      if (kw && DICT[kw] != null) {
        document.dispatchEvent(
          new CustomEvent("emojitype-insert-suggestion", { detail: { keyword: kw } })
        );
      }
    };

    if (i > 0) suggestionDiv.style.borderTop = "1px solid black";

    var suggestionText = document.createElement("p");
    suggestionText.innerHTML = suggestion;
    suggestionText.style = "margin: 0;";
    suggestionDiv.appendChild(suggestionText);

    var suggestionValue = document.createElement("p");
    suggestionValue.innerHTML = DICT[suggestion];
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
