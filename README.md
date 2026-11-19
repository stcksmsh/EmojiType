# EmojiType — website branch

The source of EmojiType's website, <https://kostavukicevic.com/EmojiType/>. This is an orphan
branch: it shares no history with `master` and holds only the site.

- Plain Vite, no framework, one dev dependency. `npm install && npm run dev` to work on it,
  `npm run build` for `dist/`.
- `.github/workflows/deploy-website.yml` builds and deploys it to this repository's GitHub
  Pages on every push to `website` (Settings → Pages → Source: "GitHub Actions").
- Base path: `/EmojiType/` by default (`vite.config.js`). For a custom domain, set the
  repository variable `BASE_PATH` to `/`, add `public/CNAME`, and update `url` in
  `publication.json`.
- `publication.json` is the only file stcksmsh.github.io reads from this branch (its project
  index links here). `visibility: "unlisted"` hides EmojiType from that index without taking
  the site down.
- Content comes from `master`'s README, manifest and privacy policy. `src/data/default-dictionary.json`
  and `public/media/icon128.png` are copies from `master`'s `src/`; update them here when they
  change there. The playground in `src/main.js` re-implements the typing rules of
  `master`'s `src/content.js` for a single textarea.
