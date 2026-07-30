---
title: Rewriting how the extension gets injected
date: 2024-02-09
tags: [devlog, emojitype, browser-extension]
---

[Switched from declaring content scripts in the manifest to injecting them from the background script instead](https://github.com/stcksmsh/EmojiType/commit/648947ad06b987ee74e9cfe42550eca215986ef4). Sounds like a lateral move, but it's what makes per-site whitelist/blacklist possible — you can't selectively not-inject a script the manifest already told the browser to always run. A few days later: full popup UI for managing the white/blacklist and editing the dictionary, then [actual persistent storage handling](https://github.com/stcksmsh/EmojiType/commit/f4b8a7757c321a0780af4c8a4ad76bd5969b0473) (previously it wasn't really saving anything properly — "LES GO" commit message, appropriately, once it finally worked). Called it 1.08 and shipped it.
