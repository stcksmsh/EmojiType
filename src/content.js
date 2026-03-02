var delim = ":";
getDelimiter().then((value) => {
  delim = value;
});

function getEditableContext() {
  var el = document.activeElement;
  if (!el) return null;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return {
      element: el,
      text: el.value,
      caretPos: el.selectionStart,
      isInput: true,
    };
  }
  var sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.anchorNode) return null;
  var container =
    sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
  var ce = container && container.closest("[contenteditable]");
  if (!ce) return null;
  var range = sel.getRangeAt(0).cloneRange();
  range.selectNodeContents(ce);
  range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
  var caretPos = range.toString().length;
  return {
    element: ce,
    text: ce.textContent || "",
    caretPos: caretPos,
    isInput: false,
  };
}

function applyReplacement(ctx, newText, newCaretPos) {
  if (ctx.isInput) {
    ctx.element.value = newText;
    ctx.element.setSelectionRange(newCaretPos, newCaretPos);
    return;
  }
  var range = document.createRange();
  range.selectNodeContents(ctx.element);
  range.deleteContents();
  var textNode = document.createTextNode(newText);
  range.insertNode(textNode);
  range.setStart(textNode, Math.min(newCaretPos, textNode.length));
  range.collapse(true);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function getSuggestionBoxCoords(ctx) {
  if (ctx.isInput) {
    var rect = ctx.element.getBoundingClientRect();
    return { x: rect.left, top: rect.top, bottom: rect.bottom };
  }
  var sel = window.getSelection();
  if (!sel.rangeCount) return null;
  var box = sel.getRangeAt(0).getClientRects()[0];
  return box
    ? { x: box.right, top: box.top, bottom: box.bottom }
    : null;
}

async function keyDown(event) {
  var ctx = getEditableContext();
  if (!ctx) return;
  var text = ctx.text;
  var caretPos = ctx.caretPos;
  var sequence = text.slice(0, caretPos).split(delim);
  var word = sequence.pop();

  if (event.key === "Backspace") {
    word = word.slice(0, -1);
    var codePointArray = Array.from(text);
    var codeCharPos = 0;
    var counter = 0;
    if (caretPos === 0) return;
    for (var c of codePointArray) {
      counter += c.length;
      codeCharPos++;
      if (counter === caretPos) break;
      if (counter > caretPos) {
        caretPos = counter;
        break;
      }
    }
    var character = codePointArray[codeCharPos - 1];
    var replacement = REVDICT[character];
    if (replacement != null && replacement !== "") {
      event.preventDefault();
      var newText =
        codePointArray.slice(0, codeCharPos - 1).join("") +
        delim +
        replacement +
        codePointArray.slice(codeCharPos).join("") +
        " ";
      var newCaretPos =
        caretPos - character.length + replacement.length + delim.length + 1;
      applyReplacement(ctx, newText, newCaretPos);
      word = replacement;
      sequence.push("");
    }
  } else if (event.key === delim) {
    if (sequence.length === 0) return;
    var replacement = DICT[word];
    if (replacement == null || replacement === "") return;
    event.preventDefault();
    var newText = sequence.join(delim) + replacement + text.slice(caretPos);
    var newCaretPos = caretPos - word.length + replacement.length - 1;
    applyReplacement(ctx, newText, newCaretPos);
    word = null;
  } else if (event.key !== "Tab") {
    word += event.key;
  }
  if (sequence.length === 0) word = null;

  var coords = getSuggestionBoxCoords(ctx);
  if (!coords) return;
  var replacementSug = updateSuggestions(coords.x, coords.top, coords.bottom, word);

  if (event.key === "Tab") {
    if (replacementSug != null) {
      event.preventDefault();
      var newTextTab =
        sequence.join(delim) + delim + replacementSug + text.slice(caretPos);
      var newCaretPosTab =
        sequence.join(delim).length + delim.length + replacementSug.length;
      applyReplacement(ctx, newTextTab, newCaretPosTab);
      updateSuggestions(coords.x, coords.top, coords.bottom, null);
    }
  }
}

async function getDelimiter() {
  var d = await chrome.runtime.sendMessage({
    action: "get",
    delim: true,
  });
  return d;
}

chrome.runtime.onMessage.addListener(function (request, _sender, _sendResponse) {
  if (request.action === "set") {
    if (request.key !== undefined && request.value !== undefined) {
      DICT[request.key] = request.value;
      REVDICT[request.value] = request.key;
    }
    if (request.dictionary !== undefined) {
      DICT = request.dictionary;
      REVDICT = {};
      for (var key in DICT) REVDICT[DICT[key]] = key;
    }
    if (request.delim !== undefined) delim = request.delim;
    if (request.suggestions !== undefined) {
      suggestionsOn = request.suggestions.state;
      suggestionsOpacity = request.suggestions.opacity;
      updateSuggestionBox();
    }
  }
});

document.addEventListener("emojitype-insert-suggestion", function (e) {
  var keyword = e.detail && e.detail.keyword;
  if (!keyword || DICT[keyword] == null) return;
  var ctx = getEditableContext();
  if (!ctx) return;
  var text = ctx.text;
  var caretPos = ctx.caretPos;
  var sequence = text.slice(0, caretPos).split(delim);
  sequence.pop();
  var replacement = DICT[keyword];
  var newText =
    sequence.join(delim) + delim + replacement + text.slice(caretPos);
  var newCaretPos =
    sequence.join(delim).length + delim.length + replacement.length;
  applyReplacement(ctx, newText, newCaretPos);
  if (window.__emojitypeHideSuggestions) window.__emojitypeHideSuggestions();
});

window.addEventListener("keydown", keyDown, true);
