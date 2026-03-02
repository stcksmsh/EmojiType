import { describe, it, expect } from "vitest";

// Mirror of content.js: text before caret, split by delim, last segment is "word"
function parseSegmentBeforeCaret(text, caretPos, delim) {
  var beforeCaret = text.slice(0, caretPos);
  var parts = beforeCaret.split(delim);
  var word = parts.pop();
  return { word: word, sequenceLength: parts.length };
}

// When user presses delim: replace (caret - word.length - delim.length) to caret with DICT[word]
function getReplacementForDelimKey(text, caretPos, delim, dict) {
  var beforeCaret = text.slice(0, caretPos);
  var parts = beforeCaret.split(delim);
  var word = parts.pop();
  if (parts.length === 0) return null;
  var replacement = dict[word];
  if (replacement == null || replacement === "") return null;
  var start = Math.max(0, caretPos - word.length - delim.length);
  return { start: start, end: caretPos, replacement: replacement, word: word };
}

// Tab completion: same segment, replace with DICT[firstSuggestion]
function getTabReplacementRange(text, caretPos, delim, word) {
  var start = Math.max(0, caretPos - (word ? word.length + delim.length : 0));
  return { start: start, end: caretPos };
}

describe("replacement logic", function () {
  var dict = { smile: "😄", wave: "👋" };
  var delim = ":";

  describe("parseSegmentBeforeCaret", function () {
    it("returns word after last delim before caret", function () {
      var r = parseSegmentBeforeCaret(":smi", 4, ":");
      expect(r.word).toBe("smi");
      expect(r.sequenceLength).toBe(1);
    });
    it("returns full keyword when caret after closing delim", function () {
      var r = parseSegmentBeforeCaret(":smile:", 7, ":");
      expect(r.word).toBe("");
      expect(r.sequenceLength).toBe(2);
    });
    it("returns empty word when no delim before caret", function () {
      var r = parseSegmentBeforeCaret("hello", 5, ":");
      expect(r.word).toBe("hello");
      expect(r.sequenceLength).toBe(0);
    });
  });

  describe("getReplacementForDelimKey", function () {
    it("returns replacement when word in dict and sequence has content", function () {
      var r = getReplacementForDelimKey(":smile", 6, ":", dict);
      expect(r).not.toBeNull();
      expect(r.replacement).toBe("😄");
      expect(r.start).toBe(0);
      expect(r.end).toBe(6);
    });
    it("returns null when word not in dict", function () {
      var r = getReplacementForDelimKey(":unknown", 8, ":", dict);
      expect(r).toBeNull();
    });
    it("returns null when only one segment (no leading delim)", function () {
      var r = getReplacementForDelimKey("smile", 5, ":", dict);
      expect(r).toBeNull();
    });
    it("computes correct start for multi-char delim", function () {
      var r = getReplacementForDelimKey("::wave", 6, "::", { wave: "👋" });
      expect(r).not.toBeNull();
      expect(r.start).toBe(0);
      expect(r.end).toBe(6);
      expect(r.replacement).toBe("👋");
    });
  });

  describe("getTabReplacementRange", function () {
    it("returns range for word + delim before caret", function () {
      var r = getTabReplacementRange(":smi", 4, ":", "smi");
      expect(r.start).toBe(0);
      expect(r.end).toBe(4);
    });
    it("handles empty word (no prefix typed)", function () {
      var r = getTabReplacementRange(":", 1, ":", null);
      expect(r.start).toBe(1);
      expect(r.end).toBe(1);
    });
  });
});
