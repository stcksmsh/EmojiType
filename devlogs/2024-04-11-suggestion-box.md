---
title: Suggestion box
date: 2024-04-11
tags: [devlog, emojitype, browser-extension]
---

Added a popup suggestion box with Tab-to-autofill — type the delimiter + a partial keyword and it shows matching entries, Tab completes the top one. Took [two passes](https://github.com/stcksmsh/EmojiType/commit/19f04536f984e89fca70970aeaa27072ed54c84c) (closes #7) to get the interaction feeling right, mostly around when the box should appear versus just let you keep typing.
