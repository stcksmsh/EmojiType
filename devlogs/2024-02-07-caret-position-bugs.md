---
title: A day of chasing caret position bugs
date: 2024-02-07
tags: [devlog, emojitype, browser-extension]
---

The core problem on tricky sites (Instagram again) was that [`caretPos` would come back `undefined`](https://github.com/stcksmsh/EmojiType/commit/705386f346738c77d41bf859f312a0515b3a9506), and without it there's no reliable way to know what to delete/replace — you'd have to reprocess the entire text field, which also makes backspace-expansion basically impossible. Chased three different failure modes today: [the delimiter "removing itself"](https://github.com/stcksmsh/EmojiType/commit/fa0840fc91687e0a38ab041b5429e28497903c9b) if it was the last character you'd typed, random chunks of text turning into the literal string `undefined`, and text before the first delimiter getting deleted outright. All separately reproducible, all separately annoying.
