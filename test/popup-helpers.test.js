import { describe, it, expect } from "vitest";

// Mirror of popup.js delimiter validation
function isAlphanumeric(str) {
  if (!str || str.length !== 1) return false;
  var c = str.charCodeAt(0);
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

// Mirror of popup.js regex validation for whitelist/blacklist
function validateRegexPatterns(lines) {
  for (var i = 0; i < lines.length; i++) {
    try {
      new RegExp(lines[i]);
    } catch (e) {
      return { valid: false, line: i + 1, message: e.message || "Invalid regex" };
    }
  }
  return { valid: true };
}

// Mirror of popup.js applyImportMerge: merge imported into current
function mergeDictionaries(current, imported) {
  current = current || {};
  var result = Object.assign({}, current);
  for (var k in imported) {
    if (Object.prototype.hasOwnProperty.call(imported, k) && k) {
      result[k] = imported[k];
    }
  }
  return result;
}

describe("popup helpers", function () {
  describe("isAlphanumeric", function () {
    it("returns true for single letter a-z A-Z", function () {
      expect(isAlphanumeric("a")).toBe(true);
      expect(isAlphanumeric("Z")).toBe(true);
    });
    it("returns true for single digit 0-9", function () {
      expect(isAlphanumeric("0")).toBe(true);
      expect(isAlphanumeric("9")).toBe(true);
    });
    it("returns false for colon, semicolon, empty", function () {
      expect(isAlphanumeric(":")).toBe(false);
      expect(isAlphanumeric(";")).toBe(false);
      expect(isAlphanumeric("")).toBe(false);
    });
    it("returns false for string of length 2", function () {
      expect(isAlphanumeric("ab")).toBe(false);
      expect(isAlphanumeric("::")).toBe(false);
    });
    it("returns false for null/undefined", function () {
      expect(isAlphanumeric(null)).toBe(false);
      expect(isAlphanumeric(undefined)).toBe(false);
    });
  });

  describe("validateRegexPatterns", function () {
    it("returns valid for empty array", function () {
      expect(validateRegexPatterns([])).toEqual({ valid: true });
    });
    it("returns valid for valid regexes", function () {
      expect(validateRegexPatterns(["example\\.com", ".*"])).toEqual({ valid: true });
    });
    it("returns invalid with line number for bad regex", function () {
      var r = validateRegexPatterns(["ok", "[invalid"]);
      expect(r.valid).toBe(false);
      expect(r.line).toBe(2);
      expect(r.message).toBeDefined();
    });
  });

  describe("mergeDictionaries", function () {
    it("merges imported keys into current", function () {
      var current = { a: "1", b: "2" };
      var imported = { b: "2b", c: "3" };
      expect(mergeDictionaries(current, imported)).toEqual({
        a: "1",
        b: "2b",
        c: "3",
      });
    });
    it("returns copy of current when imported empty", function () {
      var current = { x: "y" };
      expect(mergeDictionaries(current, {})).toEqual({ x: "y" });
    });
    it("handles null current", function () {
      expect(mergeDictionaries(null, { a: "1" })).toEqual({ a: "1" });
    });
  });
});
