---
title: Popup rewrite and v1.10
date: 2024-02-19
tags: [devlog, emojitype, browser-extension, ui]
---

Redid the popup twice in a week — first restructuring the dictionary editor into key/value pairs with a delete button per entry, then a full CSS/HTML pass that (deliberately) looks almost the same but isn't held together with duct tape underneath. Along the way fixed a genuinely annoying bug where the content script was loading multiple times on the same page, and cleaned up whitelist/blacklist edge cases around blank entries. [Called this one done](https://github.com/stcksmsh/EmojiType/commit/aa5d70a29a83dcbc2863c5a16be4feeb9dcbac6f) — v1.10, closes both open issues.
