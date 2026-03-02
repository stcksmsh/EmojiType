import { describe, it, expect } from "vitest";

function isUrlWhitelisted(url, whitelistOn, whitelistValue) {
  if (url == null) return false;
  if (whitelistOn === true) {
    for (var i = 0; i < whitelistValue.length; i++) {
      try {
        if (url.match(whitelistValue[i])) return true;
      } catch (_) {}
    }
    return false;
  }
  return true;
}

function isUrlBlacklisted(url, blacklistOn, blacklistValue) {
  if (url == null) return false;
  if (blacklistOn === true) {
    for (var i = 0; i < blacklistValue.length; i++) {
      try {
        if (url.match(blacklistValue[i])) return true;
      } catch (_) {}
    }
  }
  return false;
}

describe("url whitelist", function () {
  it("allows all when whitelist off", function () {
    expect(isUrlWhitelisted("https://example.com", false, [])).toBe(true);
  });

  it("allows only matching pattern when whitelist on", function () {
    expect(
      isUrlWhitelisted("https://a.com", true, ["https://a\\.com"])
    ).toBe(true);
    expect(
      isUrlWhitelisted("https://b.com", true, ["https://a\\.com"])
    ).toBe(false);
  });
});

describe("url blacklist", function () {
  it("blocks none when blacklist off", function () {
    expect(isUrlBlacklisted("https://example.com", false, [])).toBe(false);
  });

  it("blocks matching pattern when blacklist on", function () {
    expect(
      isUrlBlacklisted("https://a.com", true, ["https://a\\.com"])
    ).toBe(true);
    expect(
      isUrlBlacklisted("https://b.com", true, ["https://a\\.com"])
    ).toBe(false);
  });
});
