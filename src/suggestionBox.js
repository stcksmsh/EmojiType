var floatingDiv = document.createElement("div");
floatingDiv.id = "emojitype-suggestions";
floatingDiv.className = "emojitype-suggestions";

var style = document.createElement("style");
style.id = "emojitype-suggestions-styles";
style.textContent =
  "#emojitype-suggestions, .emojitype-suggestions { " +
  "  --et-bg: #ffffff; " +
  "  --et-border: #e5e7eb; " +
  "  --et-text: #111827; " +
  "  --et-text-muted: #6b7280; " +
  "  --et-hover: #f3f4f6; " +
  "  --et-highlight: #eff6ff; " +
  "  --et-highlight-border: #3b82f6; " +
  "  position: absolute; display: none; flex-direction: column; " +
  "  background: var(--et-bg); border: 1px solid var(--et-border); " +
  "  border-radius: 10px; padding: 6px 0; max-height: 240px; overflow-y: auto; " +
  "  width: 240px; box-shadow: 0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04); " +
  "  color: var(--et-text); font: 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; " +
  "  z-index: 2147483647; " +
  "} " +
  ".emojitype-suggestion-row { " +
  "  display: flex; align-items: center; justify-content: space-between; " +
  "  padding: 8px 12px; cursor: pointer; gap: 10px; " +
  "  border: none; background: transparent; " +
  "  transition: background 0.12s ease; " +
  "} " +
  ".emojitype-suggestion-row + .emojitype-suggestion-row { border-top: 1px solid var(--et-border); } " +
  ".emojitype-suggestion-row:hover { background: var(--et-hover); } " +
  ".emojitype-suggestion-row.emojitype-highlighted { " +
  "  background: var(--et-highlight); " +
  "  box-shadow: inset 3px 0 0 var(--et-highlight-border); " +
  "} " +
  ".emojitype-suggestion-row .emojitype-suggestion-key { " +
  "  flex: 1; min-width: 0; text-overflow: ellipsis; overflow: hidden; " +
  "  color: var(--et-text); font-weight: 500; " +
  "} " +
  ".emojitype-suggestion-row .emojitype-suggestion-emoji { " +
  "  flex-shrink: 0; font-size: 1.2em; line-height: 1; " +
  "} ";
document.head.appendChild(style);

document.body.appendChild(floatingDiv);

DICT = {};
REVDICT = {};

chrome.runtime
  .sendMessage({
    action: "get",
    dictionary: true,
  })
  .then(function (response) {
    DICT = response;
    for (var key in DICT) {
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
    var r = rows[i];
    r.classList.toggle("emojitype-highlighted", i === index);
    r.setAttribute("aria-selected", i === index ? "true" : "false");
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
  if (text === "") {
    floatingDiv.style.display = "none";
    window.__emojitypeSuggestionsVisible = false;
    return null;
  }
  floatingDiv.style.display = "flex";
  while (floatingDiv.lastChild) {
    floatingDiv.removeChild(floatingDiv.lastChild);
  }

  var suggestions = [];
  for (var key in DICT) {
    if (key.startsWith(text)) suggestions.push(key);
  }

  if (suggestions.length === 0) {
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
    var row = document.createElement("div");
    row.className = "emojitype-suggestion-row" + (i === 0 ? " emojitype-highlighted" : "");
    row.dataset.keyword = suggestion;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", i === 0 ? "true" : "false");

    var keySpan = document.createElement("span");
    keySpan.className = "emojitype-suggestion-key";
    keySpan.textContent = suggestion;
    row.appendChild(keySpan);

    var emojiSpan = document.createElement("span");
    emojiSpan.className = "emojitype-suggestion-emoji";
    emojiSpan.textContent = DICT[suggestion];
    row.appendChild(emojiSpan);

    row.addEventListener("click", function (e) {
      var kw = e.currentTarget.dataset.keyword;
      if (kw && DICT[kw] != null) {
        document.dispatchEvent(
          new CustomEvent("emojitype-insert-suggestion", {
            detail: { keyword: kw },
          })
        );
      }
    });

    floatingDiv.appendChild(row);
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
  floatingDiv.style.opacity = String(suggestionsOpacity);
  if (suggestionsOn) {
    floatingDiv.style.display = "flex";
  } else {
    floatingDiv.style.display = "none";
  }
}
