# EmojiType promo video

Record a short demo video of the extension replacing keywords with emojis.

## Prerequisites

- Extension built: `npm run build` (creates `dist/`)
- Playwright installed: `npm install` (includes Playwright). Ensure Chromium is installed: `npx playwright install chromium`
- Run from **project root** so the script finds `dist/`: `node demo-video/record-demo.js`

## Run

```bash
npm run build
npm run demo:video
```

The script **runs one full loop** of the demo (no Ctrl+C): (1) **full keyword** — type `:keyword:` and the final `:` replaces with the emoji; (2) **Tab** — type `:prefix` and press Tab to complete; (3) **suggestions** — type a prefix like `:s` or `:c` so the dropdown shows multiple matches, then **ArrowDown/ArrowUp** to move and **Enter** to pick. When the loop finishes, the browser closes. The video is saved under `demo-video/videos/` and still images under `demo-video/stills/`.

If the extension doesn’t replace text: ensure you ran `npm run build`, run from the repo root, and run `npx playwright install chromium` so the demo has a browser. **The demo page must load at `http://127.0.0.1:...`**

## Output

- **Video:** `demo-video/videos/` (gitignored)
- **Stills:** `demo-video/stills/` (gitignored) — PNG screenshots for store listing or README:
  - **Extension popup:** `extension-sites.png`, `extension-options.png`, `extension-dictionary.png` (Sites, Options, Dictionary tabs)
  - **Demo page:** `01-empty.png`, `02-delim-replace.png`, `03-suggestions-open.png`, `04-tab-complete.png`, `05-multiple-emojis.png`, `06-final.png`
- **Temp profile:** `demo-video/tmp-profile/` (gitignored, removed after run)

Use the video and stills for the Chrome Web Store listing or README.
