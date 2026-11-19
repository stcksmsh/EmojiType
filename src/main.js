import "./style.css";
import DEFAULTS from "./data/default-dictionary.json";

const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const $ = (id) => document.getElementById(id);

let DICT = { ...DEFAULTS };
let REV = {};
const rebuildRev = () => {
  REV = {};
  for (const k in DICT) REV[DICT[k]] = k;
};
rebuildRev();

/* ---------- hero: a field that types keywords and swaps them ---------- */
const PHRASES = [
  ["shipped it ", "party"],
  ["monday again ", "zzz"],
  ["that demo ", "clap"],
  ["merge conflict ", "sob"],
  ["tests pass ", "muscle"],
];
function heroLoop() {
  const out = $("hero-text");
  if (reduce.matches) {
    out.textContent = PHRASES[0][0] + DICT[PHRASES[0][1]];
    return;
  }
  let p = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  (async () => {
    for (;;) {
      const [lead, kw] = PHRASES[p++ % PHRASES.length];
      const typed = lead + ":" + kw + ":";
      for (let i = 1; i <= typed.length; i++) {
        out.textContent = typed.slice(0, i);
        await wait(55 + Math.random() * 60);
      }
      await wait(160);
      out.textContent = lead + DICT[kw];
      out.parentElement.classList.remove("pop");
      void out.offsetWidth;
      out.parentElement.classList.add("pop");
      await wait(1700);
      if (reduce.matches) return;
    }
  })();
}

/* ---------- playground (rules from the extension's content.js) ---------- */
const pad = $("pad");
const list = $("suggest");
const live = $("live");
let delim = ":";
let suggOn = true;
let items = [];
let hi = 0;

const say = (t) => (live.textContent = t);

// Word after the last delimiter before the caret; null if there is no delimiter.
function currentWord() {
  const before = pad.value.slice(0, pad.selectionStart);
  const seq = before.split(delim);
  const word = seq.pop();
  return seq.length === 0 ? null : word;
}

function replaceRange(start, end, text) {
  pad.setRangeText(text, start, end, "end");
  pad.dispatchEvent(new Event("input"));
}

function insertEmoji(word, emoji) {
  const caret = pad.selectionStart;
  replaceRange(caret - word.length - delim.length, caret, emoji);
  burst(emoji);
  say(`Inserted ${emoji}`);
  hideSuggest();
}

function hideSuggest() {
  list.hidden = true;
  items = [];
  pad.removeAttribute("aria-activedescendant");
}

function showSuggest() {
  const word = currentWord();
  if (!suggOn || word == null || word === "" || /\s/.test(word)) return hideSuggest();
  items = Object.keys(DICT).filter((k) => k.startsWith(word)).slice(0, 6);
  if (!items.length) return hideSuggest();
  hi = Math.min(hi, items.length - 1);
  list.replaceChildren(
    ...items.map((k, i) => {
      const li = document.createElement("li");
      li.id = "sg-" + i;
      li.role = "option";
      li.setAttribute("aria-selected", String(i === hi));
      li.innerHTML = `<span class="k"></span><span class="e"></span>`;
      li.firstChild.textContent = k;
      li.lastChild.textContent = DICT[k];
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        insertEmoji(currentWord() ?? "", DICT[k]);
      });
      return li;
    }),
  );
  const c = caretXY();
  list.style.left = Math.min(c.x, pad.clientWidth - 200) + "px";
  list.style.top = c.y + 26 + "px";
  list.hidden = false;
  pad.setAttribute("aria-activedescendant", "sg-" + hi);
}

pad.addEventListener("keydown", (e) => {
  if (!list.hidden && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault();
    hi = (hi + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
    showSuggest();
    return;
  }
  if (!list.hidden && e.key === "Escape") {
    e.preventDefault();
    hideSuggest();
    return;
  }
  const word = currentWord();
  if (e.key === delim && word != null && DICT[word]) {
    e.preventDefault();
    insertEmoji(word, DICT[word]);
    return;
  }
  if ((e.key === "Tab" || (e.key === "Enter" && !list.hidden)) && word) {
    const pick = !list.hidden ? items[hi] : Object.keys(DICT).find((k) => k.startsWith(word));
    if (pick) {
      e.preventDefault();
      insertEmoji(word, DICT[pick]);
    }
    return;
  }
  if (e.key === "Backspace" && pad.selectionStart === pad.selectionEnd && pad.selectionStart > 0) {
    const before = pad.value.slice(0, pad.selectionStart);
    const ch = Array.from(before).pop();
    if (REV[ch]) {
      e.preventDefault();
      const caret = pad.selectionStart;
      replaceRange(caret - ch.length, caret, delim + REV[ch]);
      say(`${ch} back to ${delim}${REV[ch]}`);
    }
  }
});
pad.addEventListener("input", () => {
  hi = 0;
  showSuggest();
});
pad.addEventListener("click", showSuggest);
pad.addEventListener("blur", () => setTimeout(hideSuggest, 100));

$("delim").addEventListener("change", (e) => {
  delim = e.target.value;
  document.querySelectorAll("kbd.d").forEach((k) => (k.textContent = delim));
  pad.placeholder = `Type ${delim}party${delim} or ${delim}sm and press Tab`;
  renderDict();
  pad.focus();
});
$("sugg").addEventListener("change", (e) => {
  suggOn = e.target.checked;
  suggOn ? showSuggest() : hideSuggest();
});
$("clear").addEventListener("click", () => {
  pad.value = "";
  hideSuggest();
  pad.focus();
});

// Caret position inside the textarea, via a mirror element.
function caretXY() {
  const m = document.createElement("div");
  const cs = getComputedStyle(pad);
  for (const p of ["font", "padding", "border", "lineHeight", "letterSpacing", "whiteSpace", "wordWrap", "boxSizing", "tabSize"])
    m.style[p] = cs[p];
  m.style.cssText += ";position:absolute;visibility:hidden;white-space:pre-wrap;overflow-wrap:break-word;width:" + pad.clientWidth + "px";
  m.textContent = pad.value.slice(0, pad.selectionStart);
  const s = document.createElement("span");
  s.textContent = "​";
  m.appendChild(s);
  document.body.appendChild(m);
  const x = s.offsetLeft;
  const y = s.offsetTop - pad.scrollTop;
  m.remove();
  return { x, y };
}

function burst(emoji) {
  if (reduce.matches) return;
  const host = $("burst");
  const c = caretXY();
  for (let i = 0; i < 9; i++) {
    const s = document.createElement("span");
    s.textContent = emoji;
    const a = (Math.PI * 2 * i) / 9 + Math.random() * 0.5;
    const r = 40 + Math.random() * 50;
    s.style.left = c.x + "px";
    s.style.top = c.y + "px";
    s.style.setProperty("--dx", Math.cos(a) * r + "px");
    s.style.setProperty("--dy", Math.sin(a) * r - 30 + "px");
    s.style.setProperty("--rot", (Math.random() * 120 - 60).toFixed(0) + "deg");
    host.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
  }
}

/* ---------- dictionary chips ---------- */
function renderDict() {
  $("dict-count").textContent = Object.keys(DICT).length;
  $("dict").replaceChildren(
    ...Object.entries(DICT)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.innerHTML = `<span class="e"></span><span class="k mono"></span>`;
        b.firstChild.textContent = v;
        b.lastChild.textContent = delim + k + delim;
        b.setAttribute("aria-label", `Type ${k} (${v}) into the playground`);
        b.addEventListener("click", () => typeInto(k));
        return b;
      }),
  );
}

// Types delim+keyword+delim into the playground, a key at a time, then converts it.
async function typeInto(k) {
  pad.focus();
  pad.setSelectionRange(pad.value.length, pad.value.length);
  if (pad.value && !/\s$/.test(pad.value)) replaceRange(pad.value.length, pad.value.length, " ");
  const seq = delim + k;
  for (const ch of seq) {
    replaceRange(pad.selectionStart, pad.selectionStart, ch);
    if (!reduce.matches) await new Promise((r) => setTimeout(r, 40));
  }
  insertEmoji(k, DICT[k]);
  document.getElementById("try").scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "nearest" });
}

$("add").addEventListener("submit", (e) => {
  e.preventDefault();
  const k = $("add-key").value.trim();
  const v = $("add-emoji").value.trim();
  if (!k || !v) return;
  DICT[k] = v;
  rebuildRev();
  renderDict();
  e.target.reset();
  say(`Added ${k} → ${v}`);
});

/* ---------- popup tabs ---------- */
const tabs = [...document.querySelectorAll('[role="tab"]')];
function select(t) {
  for (const x of tabs) {
    const on = x === t;
    x.setAttribute("aria-selected", String(on));
    x.tabIndex = on ? 0 : -1;
    $(x.getAttribute("aria-controls")).hidden = !on;
  }
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => select(t));
  t.addEventListener("keydown", (e) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length];
    select(n);
    n.focus();
  });
});

/* ---------- reveal on scroll ---------- */
if (!reduce.matches && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (es) => es.forEach((en) => en.isIntersecting && (en.target.classList.add("in"), io.unobserve(en.target))),
    { threshold: 0.12 },
  );
  document.querySelectorAll(".card").forEach((c) => (c.classList.add("rv"), io.observe(c)));
}

renderDict();
heroLoop();
