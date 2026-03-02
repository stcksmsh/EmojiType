import { describe, it, expect } from "vitest";

// Mirror of background.js / content.js: build reverse map emoji -> keyword (last wins)
function buildRevDict(dict) {
  var rev = {};
  for (var key in dict) {
    if (Object.prototype.hasOwnProperty.call(dict, key)) {
      rev[dict[key]] = key;
    }
  }
  return rev;
}

describe("buildRevDict", function () {
  it("inverts key -> value to value -> key", function () {
    var dict = { smile: "😄", wave: "👋" };
    expect(buildRevDict(dict)).toEqual({ "😄": "smile", "👋": "wave" });
  });
  it("last key wins when two keys map to same emoji", function () {
    var dict = { a: "x", b: "x" };
    expect(buildRevDict(dict)).toEqual({ x: "b" });
  });
  it("returns empty object for empty dict", function () {
    expect(buildRevDict({})).toEqual({});
  });
});
