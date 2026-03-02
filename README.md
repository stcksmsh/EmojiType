# EmojiType

A browser extension that turns short keywords into emoji as you type. Use a delimiter (e.g. `:`) and type `:smile:` or `:smile` + Tab to get 😄.

## What it does

- **Replace on type:** Type `delimiter + keyword + delimiter` (e.g. `:smile:`) and it’s replaced by the emoji.
- **Tab completion:** Type `delimiter + keyword` and press **Tab** to autocomplete.
- **Suggestions:** Optional popup with matching keywords as you type.

You choose the delimiter in Options (default `:`) and manage your keyword→emoji map in the Dictionary tab.

## Tabs in the popup

1. **Sites** – Whitelist/blacklist by URL pattern so EmojiType runs only where you want. Enable or disable on the current site with one click.
2. **Options** – Set the **delimiter** (e.g. `:`, `;`), turn **Suggestions** on/off and set opacity, and pick **Theme** (light/dark).
3. **Dictionary** – Add, edit, and remove keyword→emoji entries. Use **Backup** to export/import or reset.

## How to use

1. Set your **delimiter** in Options (default is `:`).
2. In any text field, type `delimiter + keyword + delimiter` (e.g. `:smile:`) to replace with the emoji, or type `delimiter + keyword` and press **Tab** to autocomplete.
3. Turn on **Suggestions** in Options to see matches while typing.
4. Use the **Dictionary** tab to add or edit keywords and emoji.

## Install / build

- **From source:** Clone the repo, then load the extension in Chrome/Edge: open `chrome://extensions`, enable “Developer mode”, click “Load unpacked”, and select the project folder (the one containing `manifest.json`).
- **Build:** No build step required for development. If you use a build script (e.g. npm), run it from the project root; the extension runs from the `src` directory (or your build output).

---

*Icons: [happy face icons](https://www.flaticon.com/free-icons/happy-face) by NajmunNahar - Flaticon.*  
*Background image on Chrome Web Store by [Freepik](https://www.freepik.com/free-vector/hand-drawn-world-emoji-day-background-with-emoticons_28011899.htm).*
