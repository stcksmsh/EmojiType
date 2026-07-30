---
title: Instagram and WhatsApp, again
date: 2024-03-19
tags: [devlog, emojitype, browser-extension]
---

A month later, back to the sites that never worked right. [Switched the whole "what am I even editing" detection over to `window.getSelection()`](https://github.com/stcksmsh/EmojiType/commit/55b9bd62898714dda4fcca6ba83db83ba3e6a2af) instead of whatever I was doing before, which finally got the text-element/caret detection working consistently. Also [added a small delay between setting the replaced text and setting the caret position](https://github.com/stcksmsh/EmojiType/commit/1dad72e6f98258904e027ad2ebd4c99d4b4f76d1) — turned out to matter specifically on Instagram, seemingly a latency thing between their JS framework updating the DOM and the browser actually being ready for a new selection. Never fully cracked getting the *pre-deletion* text on Instagram/WhatsApp, though — noted that as still broken and moved on.
