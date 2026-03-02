var delim = ":";
getDelimiter().then((value) => {
  delim = value;
});
try {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    window.__emojitypeExtensionId = chrome.runtime.id;
  }
} catch (_) {}

function getDeepActiveElement(root) {
  root = root || document;
  var el = root.activeElement;
  if (!el) return null;
  if (el.shadowRoot) {
    var deep = getDeepActiveElement(el.shadowRoot);
    if (deep) return deep;
    var fallback = el.shadowRoot.querySelector(
      'input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]'
    );
    if (fallback) return fallback;
  }
  return el;
}

function getContentEditableRoot(node) {
  while (node) {
    if (node.nodeType === 1) {
      if (
        node.contentEditable === "true" ||
        node.contentEditable === "plaintext-only"
      )
        return node;
    }
    var parent = node.parentElement;
    if (
      !parent &&
      node.getRootNode &&
      node.getRootNode() instanceof ShadowRoot
    ) {
      parent = node.getRootNode().host;
    }
    node = parent;
  }
  return null;
}

function getEditableContext() {
  var el = getDeepActiveElement(document);
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
    sel.anchorNode.nodeType === 3
      ? sel.anchorNode.parentElement
      : sel.anchorNode;
  var ce = container ? getContentEditableRoot(container) : null;
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

function getTextNodesInOrder(container) {
  var list = [];
  function walk(n) {
    if (n.nodeType === 3) list.push(n);
    var children = n.childNodes;
    for (var i = 0; i < children.length; i++) walk(children[i]);
    if (n.nodeType === 1 && n.shadowRoot) {
      var shadowChildren = n.shadowRoot.childNodes;
      for (var j = 0; j < shadowChildren.length; j++) walk(shadowChildren[j]);
    }
  }
  walk(container);
  return list;
}

function offsetToPosition(container, charOffset) {
  var nodes = getTextNodesInOrder(container);
  var acc = 0;
  for (var i = 0; i < nodes.length; i++) {
    var len = nodes[i].length;
    if (acc + len > charOffset) {
      return { node: nodes[i], offset: charOffset - acc };
    }
    acc += len;
  }
  if (nodes.length > 0) {
    var last = nodes[nodes.length - 1];
    return { node: last, offset: last.length };
  }
  return { node: container, offset: 0 };
}

function applySegmentReplacement(ctx, startOffset, endOffset, replacementText) {
  if (ctx.isInput) {
    var text = ctx.text;
    var newText =
      text.slice(0, startOffset) + replacementText + text.slice(endOffset);
    var newCaretPos = startOffset + replacementText.length;
    ctx.element.value = newText;
    ctx.element.setSelectionRange(newCaretPos, newCaretPos);
    return;
  }
  var start = offsetToPosition(ctx.element, startOffset);
  var end = offsetToPosition(ctx.element, endOffset);
  var range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  if (document.execCommand("insertText", false, replacementText)) {
    return;
  }
  range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  range.deleteContents();
  var textNode = document.createTextNode(replacementText);
  range.insertNode(textNode);
  range.setStart(textNode, textNode.length);
  range.collapse(true);
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
  return box ? { x: box.right, top: box.top, bottom: box.bottom } : null;
}

async function keyDown(event) {
  if (
    window.__emojitypeSuggestionsVisible &&
    (event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter")
  ) {
    event.preventDefault();
    if (window.__emojitypeSuggestionsKey) {
      window.__emojitypeSuggestionsKey(event.key);
    }
    return;
  }
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
      var backspaceReplaceText = delim + replacement + " ";
      applySegmentReplacement(
        ctx,
        caretPos - character.length,
        caretPos,
        backspaceReplaceText
      );
      word = replacement;
      sequence.push("");
    }
  } else if (event.key === delim) {
    if (sequence.length === 0) return;
    var replacement = DICT[word];
    if (replacement == null || replacement === "") return;
    event.preventDefault();
    var delimStart = Math.max(0, caretPos - word.length - delim.length);
    applySegmentReplacement(ctx, delimStart, caretPos, replacement);
    word = null;
  } else if (event.key !== "Tab") {
    word += event.key;
  }
  if (sequence.length === 0) word = null;

  var coords = getSuggestionBoxCoords(ctx);
  if (!coords) return;
  var replacementSug = updateSuggestions(
    coords.x,
    coords.top,
    coords.bottom,
    word
  );

  if (event.key === "Tab") {
    if (replacementSug != null && DICT[replacementSug] != null) {
      event.preventDefault();
      var tabStart = Math.max(
        0,
        caretPos - word.length - (word ? delim.length : 0)
      );
      applySegmentReplacement(ctx, tabStart, caretPos, DICT[replacementSug]);
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

chrome.runtime.onMessage.addListener(
  function (request, _sender, _sendResponse) {
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
  }
);

document.addEventListener("emojitype-insert-suggestion", function (e) {
  var keyword = e.detail && e.detail.keyword;
  if (!keyword || DICT[keyword] == null) return;
  var ctx = getEditableContext();
  if (!ctx) return;
  var text = ctx.text;
  var caretPos = ctx.caretPos;
  var sequence = text.slice(0, caretPos).split(delim);
  var word = sequence.pop();
  var replacement = DICT[keyword];
  var insertStart = Math.max(
    0,
    caretPos - (word ? word.length + delim.length : 0)
  );
  applySegmentReplacement(ctx, insertStart, caretPos, replacement);
  if (window.__emojitypeHideSuggestions) window.__emojitypeHideSuggestions();
});

window.addEventListener("keydown", keyDown, true);
