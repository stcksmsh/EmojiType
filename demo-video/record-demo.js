/**
 * EmojiType promo video recorder.
 * Runs a local server (so the extension can inject), loads the extension,
 * types example keywords with pacing, and saves a video to demo-video/videos/
 * and still images to demo-video/stills/ (for store listing, README, etc.).
 *
 * Prerequisites: npm run build (so dist/ exists)
 * Run: node demo-video/record-demo.js
 */

import { chromium } from "playwright";
import path from "path";
import { createServer } from "http";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXTENSION_PATH = path.resolve(ROOT, "dist");
const VIDEOS_DIR = path.join(__dirname, "videos");
const STILLS_DIR = path.join(__dirname, "stills");
const PROFILE_DIR = path.join(__dirname, "tmp-profile");
// Chrome requires absolute paths; use forward slashes in args
const EXTENSION_PATH_ARG = EXTENSION_PATH.replace(/\\/g, "/");

const TYPING_DELAY_MS = 200;
const PAUSE_AFTER_REPLACE_MS = 900;
const PAUSE_BETWEEN_EXAMPLES_MS = 1200;
const INITIAL_WAIT_MS = 3500;
const EXTENSION_INIT_MS = 5000;
const SUGGEST_WAIT_MS = 700; // Wait for suggestion dropdown to appear
const ARROW_DELAY_MS = 400; // Delay between ArrowDown/Up so viewer sees each suggestion highlight

// 10 different emojis, one per step; mix of delim, tab, suggest so all use cases are shown.
function loadDemoSteps() {
  return [
    { mode: "delim", keys: ":smile:" },
    { mode: "tab", keys: ":cla" },
    { mode: "suggest", prefix: ":s", arrowDowns: 0 },
    { mode: "delim", keys: ":party:" },
    { mode: "tab", keys: ":ang" },
    { mode: "suggest", prefix: ":c", arrowDowns: 1 },
    { mode: "delim", keys: ":hug:" },
    { mode: "tab", keys: ":con" },
    { mode: "suggest", prefix: ":d", arrowDowns: 2 },
    { mode: "delim", keys: ":kiss:" },
  ];
}

function serveDemoPage() {
  const htmlPath = path.join(__dirname, "demo-page.html");
  const html = fs.readFileSync(htmlPath, "utf-8");
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(html);
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = addr && typeof addr === "object" && addr.port;
      const url = `http://127.0.0.1:${port}/`;
      resolve({ server, url });
    });
  });
}

async function run() {
  if (!fs.existsSync(EXTENSION_PATH)) {
    console.error("Run 'npm run build' first so dist/ exists.");
    process.exit(1);
  }

  console.log("Extension path:", EXTENSION_PATH_ARG);
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  fs.mkdirSync(STILLS_DIR, { recursive: true });

  if (fs.existsSync(PROFILE_DIR)) {
    try {
      fs.rmSync(PROFILE_DIR, { recursive: true });
    } catch (_) {}
  }

  const { server, url } = await serveDemoPage();
  console.log("Demo URL (must be 127.0.0.1 for extension to load):", url);
  if (url.includes("192.168") || url.includes("10.")) {
    console.warn("Warning: Extension may not inject on 192.168.x.x / 10.x URLs. Use 127.0.0.1.");
  }

  const launchOptions = {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH_ARG}`,
      `--load-extension=${EXTENSION_PATH_ARG}`,
      "--no-sandbox",
    ],
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1280, height: 800 },
    },
    ignoreDefaultArgs: ["--enable-automation"],
  };

  // Use Chromium (Playwright's). Run: npx playwright install chromium
  const context = await chromium.launchPersistentContext(PROFILE_DIR, launchOptions);

  // Let extension background finish init (storage.get + setupMessageListener) before we load a page
  console.log("Waiting", EXTENSION_INIT_MS / 1000, "s for extension background to init...");
  await new Promise((r) => setTimeout(r, EXTENSION_INIT_MS));

  // Single tab: create new page with our URL so it's the only tab and loads after extension is ready
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const actualUrl = page.url();
  if (actualUrl.includes("192.168") || actualUrl.includes("10.")) {
    console.warn("Page loaded at", actualUrl, "- extension may not run on this host. Expect 127.0.0.1.");
  }
  // Close any other tabs (e.g. default about:blank) so only our demo tab exists
  const allPages = context.pages();
  for (let i = 0; i < allPages.length; i++) {
    if (allPages[i] !== page) {
      await allPages[i].close();
    }
  }
  // Dismiss "Restore pages" / session restore bubble if present (browser UI; Escape often closes it)
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  // Wait for extension background to init and content scripts to inject + receive dictionary
  await page.waitForTimeout(INITIAL_WAIT_MS);
  console.log("Page URL:", page.url());

  const input = "textarea#input";
  await page.click(input);
  await page.waitForTimeout(300);

  const examples = loadDemoSteps();
  console.log("Recording one full loop:", examples.length, "steps. Video is loopable. Stills (page + extension) saved to stills/.");

  async function captureStill(name, targetPage = page) {
    const p = path.join(STILLS_DIR, name);
    await targetPage.screenshot({ path: p });
    console.log("Still saved:", name);
  }

  // Extension popup stills (open popup in new tab, capture each panel, close)
  const extensionId = await page.evaluate(() => window.__emojitypeExtensionId);
  if (extensionId) {
    const popupPage = await context.newPage();
    const popupUrl = `chrome-extension://${extensionId}/popup.html`;
    await popupPage.goto(popupUrl, { waitUntil: "networkidle" });
    await popupPage.setViewportSize({ width: 1280, height: 800 });
    await popupPage.waitForTimeout(600);
    await captureStill("extension-sites.png", popupPage);
    await popupPage.click('button[data-tab="options"]');
    await popupPage.waitForTimeout(300);
    await captureStill("extension-options.png", popupPage);
    await popupPage.click('button[data-tab="dictionary"]');
    await popupPage.waitForTimeout(300);
    await captureStill("extension-dictionary.png", popupPage);
    await popupPage.close();
  } else {
    console.warn("Extension ID not available; skipping extension popup stills.");
  }

  await page.waitForTimeout(800);

  await captureStill("01-empty.png");

  for (let i = 0; i < examples.length; i++) {
    const step = examples[i];
    await page.click(input, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(200);

    if (step.mode === "delim") {
      for (const char of step.keys) {
        await page.keyboard.type(char, { delay: TYPING_DELAY_MS });
      }
      await page.waitForTimeout(PAUSE_AFTER_REPLACE_MS);
      if (i === 0) await captureStill("02-delim-replace.png");
    } else if (step.mode === "tab") {
      for (const char of step.keys) {
        await page.keyboard.type(char, { delay: TYPING_DELAY_MS });
      }
      await page.waitForTimeout(SUGGEST_WAIT_MS);
      await page.keyboard.press("Tab");
      await page.waitForTimeout(PAUSE_AFTER_REPLACE_MS);
      if (i === 1) await captureStill("04-tab-complete.png");
    } else if (step.mode === "suggest") {
      for (const char of step.prefix) {
        await page.keyboard.type(char, { delay: TYPING_DELAY_MS });
      }
      await page.waitForTimeout(SUGGEST_WAIT_MS);
      if (i === 2) await captureStill("03-suggestions-open.png");
      for (let a = 0; a < step.arrowDowns; a++) {
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(ARROW_DELAY_MS);
      }
      await page.keyboard.press("Enter");
      await page.waitForTimeout(PAUSE_AFTER_REPLACE_MS);
    }

    await page.waitForTimeout(PAUSE_BETWEEN_EXAMPLES_MS);
    if (i === 5) await captureStill("05-multiple-emojis.png");
  }

  await page.waitForTimeout(1000);
  await captureStill("06-final.png");

  const video = page.video();
  const videoPath = video ? video.path() : null;
  await context.close();
  server.close();
  if (fs.existsSync(PROFILE_DIR)) {
    try {
      fs.rmSync(PROFILE_DIR, { recursive: true });
    } catch (_) {}
  }

  if (videoPath) {
    console.log("Video saved:", videoPath);
  }
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
