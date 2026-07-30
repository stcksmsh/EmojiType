---
title: Coming back after two years to modernize the whole thing
date: 2026-03-02
tags: [devlog, emojitype, browser-extension]
---

Big gap since the last post — the extension just sat there working (mostly) for two years. Came back and, in one sitting with Cursor doing a lot of the typing, went from v2.1 to v3.0: added a real build/tooling setup, [unified whitelist/blacklist/suggestion state to actual booleans](https://github.com/stcksmsh/EmojiType/commit/99ef07a6af95fb88fb929e4210fad500e1774c01) instead of the boolean-or-legacy-string-`'on'` mess that had accumulated, and — the actually significant one — [replaced `execCommand` entirely with the Range API](https://github.com/stcksmsh/EmojiType/commit/7dc67e3414898927c8c65f16d94e26ac3800d26c) (`document.execCommand` has been deprecated forever, and it was the root of a lot of the old cross-site flakiness). New shared helpers detect input/textarea vs. contenteditable and handle each properly instead of one code path awkwardly serving both.

Also: a bundled default dictionary loaded from JSON instead of inline, export/import for settings, a full popup redesign into Sites/Options/Dictionary tabs with a compact layout, a proper whitelist/blacklist list UI with add/remove buttons, keyboard nav for the suggestion box, and — finally — [a GitHub Actions CI workflow plus real unit tests](https://github.com/stcksmsh/EmojiType/commit/7d707c9b441acdace936e728334644b3727f6a3d) (suggestion filtering/sorting, URL whitelist/blacklist matching, popup helpers, the replacement-parsing logic, reverse-dictionary building). [v3.0 shipped](https://github.com/stcksmsh/EmojiType/commit/f232234af3e369036ec00e955985c1ec2021b5e0) with actual test coverage for the first time in this project's life.
