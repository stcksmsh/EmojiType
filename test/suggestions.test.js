import { describe, it, expect } from "vitest";

function getSuggestions(prefix, dict) {
  var list = [];
  for (var key in dict) {
    if (key.startsWith(prefix)) list.push(key);
  }
  list.sort(function (a, b) {
    return a.localeCompare(b);
  });
  return list;
}

describe("suggestions", function () {
  var dict = {
    smile: "😄",
    sob: "😭",
    sweat: "😓",
    angry: "😠",
    blush: "😊",
  };

  it("returns keys that start with prefix", function () {
    expect(getSuggestions("s", dict)).toEqual(["smile", "sob", "sweat"]);
    expect(getSuggestions("sm", dict)).toEqual(["smile"]);
    expect(getSuggestions("x", dict)).toEqual([]);
  });

  it("sorts by key localeCompare", function () {
    expect(getSuggestions("s", dict)[0]).toBe("smile");
    expect(getSuggestions("s", dict)).toEqual(["smile", "sob", "sweat"]);
  });

  it("returns empty for empty prefix", function () {
    var all = getSuggestions("", dict);
    expect(all).toContain("smile");
    expect(all).toContain("angry");
    expect(all.length).toBe(5);
  });
});
