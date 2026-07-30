---
title: Started EmojiType
date: 2024-02-06
tags: [devlog, emojitype, browser-extension]
---

Browser extension: type `:smile:`, get 😄. [First commit message](https://github.com/stcksmsh/EmojiType/commit/1dd2aceec3235838e0b534e258e763575e09cd86) is basically a bug report I wrote to myself: "It works!!! Need to clean up the emoji names... For some reason it does not change text on certain sites (like Instagram)." That Instagram problem would come back to bite me for a year.

Spent the rest of day one just trying to make it consistently work at all — swapped `insertText` for `insertHTML`, then [got it working "EVERYWHERE"](https://github.com/stcksmsh/EmojiType/commit/641af7536cce12b196b7eda6b8d207aabf6668cd) (my caps, not exaggerating for effect, I was relieved). By day two: [delete support](https://github.com/stcksmsh/EmojiType/commit/3a48aa2897e4676d0231739b0f2f160c9fee0890) (backspace after an emoji un-replaces it back to the typed text), and a real fix for replacing mid-string instead of only at the very end of whatever you were typing.
