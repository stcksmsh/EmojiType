var whitelistValue = [];
var blacklistValue = [];
var whitelistState = false;
var blacklistState = false;
var delimiter = ":";
var dictionary = {};
var suggestionsOn = false;
var suggestionsOpacity = 0.75;
var currentTabUrl = null;

function switchTab(tabId) {
  var panels = document.querySelectorAll(".tab-panel");
  var tabs = document.querySelectorAll(".tab");
  for (var i = 0; i < panels.length; i++) {
    panels[i].classList.remove("active");
    panels[i].hidden = true;
  }
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].setAttribute("aria-selected", "false");
  }
  var panel = document.getElementById("panel-" + tabId);
  var tab = document.getElementById("tab-" + tabId);
  if (panel) {
    panel.classList.add("active");
    panel.hidden = false;
  }
  if (tab) tab.setAttribute("aria-selected", "true");
}

function initWhitelist() {
  var ta = document.getElementById("whitelist-textarea");
  if (ta) ta.value = (whitelistValue || []).join("\n");
}

function initBlacklist() {
  var ta = document.getElementById("blacklist-textarea");
  if (ta) ta.value = (blacklistValue || []).join("\n");
}

function initDelimiter() {
  var input = document.getElementById("delimiter-input");
  var chips = document.querySelectorAll(".chip[data-delim]");
  if (input) {
    input.value = "";
    input.placeholder = delimiter || ":";
  }
  for (var i = 0; i < chips.length; i++) {
    var chip = chips[i];
    chip.setAttribute("aria-pressed", chip.getAttribute("data-delim") === delimiter);
  }
}

function initDictionary() {
  var container = document.getElementById("dictionary-container");
  if (!container) return;
  container.innerHTML = "";
  for (var key in dictionary) {
    appendDictionaryRow(container, key, dictionary[key]);
  }
}

function appendDictionaryRow(container, key, value) {
  var row = document.createElement("div");
  row.className = "dictionary-element";
  row.setAttribute("role", "listitem");

  var keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.className = "dictionary-key";
  keyInput.value = key;
  keyInput.placeholder = "keyword";
  keyInput.setAttribute("data-original-key", key);

  var valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.className = "dictionary-value";
  valueInput.value = value;
  valueInput.placeholder = "emoji";

  var deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "dictionary-delete";
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", function () {
    row.remove();
    collectAndSendDictionary();
  });

  keyInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewDictionaryRow(row);
    }
  });
  valueInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewDictionaryRow(row);
    }
  });

  row.appendChild(keyInput);
  row.appendChild(valueInput);
  row.appendChild(deleteBtn);
  container.appendChild(row);
}

function addNewDictionaryRow(afterRow) {
  var container = document.getElementById("dictionary-container");
  if (!container) return;
  var row = document.createElement("div");
  row.className = "dictionary-element";
  row.setAttribute("role", "listitem");
  var keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.className = "dictionary-key";
  keyInput.value = "";
  keyInput.placeholder = "keyword";
  var valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.className = "dictionary-value";
  valueInput.value = "";
  valueInput.placeholder = "emoji";
  var deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "dictionary-delete";
  deleteBtn.textContent = "×";
  deleteBtn.addEventListener("click", function () {
    row.remove();
    collectAndSendDictionary();
  });
  keyInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewDictionaryRow(row);
    }
  });
  valueInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addNewDictionaryRow(row);
    }
  });
  row.appendChild(keyInput);
  row.appendChild(valueInput);
  row.appendChild(deleteBtn);
  if (afterRow && afterRow.nextSibling) {
    container.insertBefore(row, afterRow.nextSibling);
  } else {
    container.appendChild(row);
  }
  keyInput.focus();
}

function collectAndSendDictionary() {
  var container = document.getElementById("dictionary-container");
  if (!container) return;
  var rows = container.querySelectorAll(".dictionary-element:not(.filter-hidden)");
  var items = {};
  for (var i = 0; i < rows.length; i++) {
    var keyEl = rows[i].querySelector(".dictionary-key");
    var valEl = rows[i].querySelector(".dictionary-value");
    if (!keyEl || !valEl) continue;
    var k = keyEl.value.trim();
    var v = valEl.value.trim();
    if (k === "" && v === "") continue;
    if (k !== "") items[k] = v || " ";
  }
  dictionary = items;
  chrome.runtime.sendMessage({ action: "set", dictionary: items });
}

function updateDictionaryFromDOM() {
  var container = document.getElementById("dictionary-container");
  if (!container) return;
  var rows = container.querySelectorAll(".dictionary-element:not(.filter-hidden)");
  var items = {};
  for (var i = 0; i < rows.length; i++) {
    var keyEl = rows[i].querySelector(".dictionary-key");
    var valEl = rows[i].querySelector(".dictionary-value");
    if (!keyEl || !valEl) continue;
    var k = keyEl.value.trim();
    var v = valEl.value.trim();
    if (k === "" && v === "") continue;
    if (k !== "") items[k] = v || " ";
  }
  dictionary = items;
  chrome.runtime.sendMessage({ action: "set", dictionary: items });
}

function filterDictionary() {
  var q = (document.getElementById("dictionary-filter").value || "").trim().toLowerCase();
  var rows = document.querySelectorAll("#dictionary-container .dictionary-element");
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var keyEl = row.querySelector(".dictionary-key");
    var valEl = row.querySelector(".dictionary-value");
    var key = (keyEl && keyEl.value) || "";
    var val = (valEl && valEl.value) || "";
    var match = !q || key.toLowerCase().indexOf(q) !== -1 || val.indexOf(q) !== -1;
    row.classList.toggle("filter-hidden", !match);
  }
}

function toggleWhitelist() {
  whitelistState = !whitelistState;
  var el = document.getElementById("whitelist-toggle");
  el.textContent = whitelistState ? "ON" : "OFF";
  el.classList.toggle("active", whitelistState);
  el.setAttribute("aria-checked", whitelistState);
  chrome.runtime.sendMessage({
    action: "set",
    whitelist: { state: whitelistState, value: whitelistValue },
  });
  updateCurrentSiteStatus();
}

function toggleBlacklist() {
  blacklistState = !blacklistState;
  var el = document.getElementById("blacklist-toggle");
  el.textContent = blacklistState ? "ON" : "OFF";
  el.classList.toggle("active", blacklistState);
  el.setAttribute("aria-checked", blacklistState);
  chrome.runtime.sendMessage({
    action: "set",
    blacklist: { state: blacklistState, value: blacklistValue },
  });
  updateCurrentSiteStatus();
}

function toggleSuggestions() {
  suggestionsOn = !suggestionsOn;
  var el = document.getElementById("suggestions-toggle");
  el.textContent = suggestionsOn ? "ON" : "OFF";
  el.classList.toggle("active", suggestionsOn);
  el.setAttribute("aria-checked", suggestionsOn);
  chrome.runtime.sendMessage({
    action: "set",
    suggestions: { state: suggestionsOn, opacity: suggestionsOpacity },
  });
}

function updateWhitelistItems() {
  var ta = document.getElementById("whitelist-textarea");
  if (!ta) return;
  whitelistValue = ta.value
    .split("\n")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
  chrome.runtime.sendMessage({
    action: "set",
    whitelist: { state: whitelistState, value: whitelistValue },
  });
  updateCurrentSiteStatus();
}

function updateBlacklistItems() {
  var ta = document.getElementById("blacklist-textarea");
  if (!ta) return;
  blacklistValue = ta.value
    .split("\n")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
  chrome.runtime.sendMessage({
    action: "set",
    blacklist: { state: blacklistState, value: blacklistValue },
  });
  updateCurrentSiteStatus();
}

function updateDelimiter() {
  var input = document.getElementById("delimiter-input");
  var chips = document.querySelectorAll(".chip[data-delim]");
  var val = (input && input.value.trim()) || "";
  if (val.length === 0) {
    var chipVal = "";
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].getAttribute("aria-pressed") === "true") {
        chipVal = chips[i].getAttribute("data-delim") || "";
        break;
      }
    }
    val = chipVal || delimiter || ":";
  }
  if (val.length > 2) val = val.slice(0, 2);
  delimiter = val || ":";
  if (input) {
    input.value = "";
    input.placeholder = delimiter;
  }
  for (var j = 0; j < chips.length; j++) {
    var c = chips[j];
    c.setAttribute("aria-pressed", c.getAttribute("data-delim") === delimiter);
  }
  chrome.runtime.sendMessage({ action: "set", delim: delimiter });
  updateShortcutHint();
}

function updateSuggestionsOpacity(e) {
  suggestionsOpacity = parseFloat(e.target.value, 10);
  chrome.runtime.sendMessage({
    action: "set",
    suggestions: { state: suggestionsOn, opacity: suggestionsOpacity },
  });
}

function updateShortcutHint() {
  var el = document.getElementById("shortcut-hint");
  if (!el) return;
  var d = delimiter || ":";
  el.textContent = "Type " + d + "keyword" + d + " or " + d + "keyword + Tab";
}

function setBackupStatus(message, isError) {
  var el = document.getElementById("backup-status");
  if (!el) return;
  el.textContent = message;
  el.className = "backup-status " + (isError ? "error" : "success");
  setTimeout(function () {
    el.textContent = "";
    el.className = "backup-status";
  }, 4000);
}

function exportSettings() {
  (async function () {
    try {
      var whitelist = await chrome.runtime.sendMessage({ action: "get", whitelist: true });
      var blacklist = await chrome.runtime.sendMessage({ action: "get", blacklist: true });
      var delim = await chrome.runtime.sendMessage({ action: "get", delim: true });
      var dict = await chrome.runtime.sendMessage({ action: "get", dictionary: true });
      var suggestions = await chrome.runtime.sendMessage({ action: "get", suggestions: true });
      var data = {
        whitelist: whitelist,
        blacklist: blacklist,
        delim: delim,
        dictionary: dict,
        suggestions: suggestions,
      };
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "emojitype-settings.json";
      a.click();
      URL.revokeObjectURL(a.href);
      setBackupStatus("Settings exported.");
    } catch (err) {
      setBackupStatus("Export failed.", true);
    }
  })();
}

function importSettings() {
  document.getElementById("import-file-input").click();
}

function onImportFileChange(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data || typeof data.dictionary !== "object") {
        setBackupStatus("Invalid file: missing dictionary.", true);
        event.target.value = "";
        return;
      }
      (async function () {
        try {
          if (data.whitelist != null) {
            await chrome.runtime.sendMessage({
              action: "set",
              whitelist: {
                state: data.whitelist.state === true || data.whitelist.state === "on",
                value: Array.isArray(data.whitelist.value) ? data.whitelist.value : [],
              },
            });
          }
          if (data.blacklist != null) {
            await chrome.runtime.sendMessage({
              action: "set",
              blacklist: {
                state: data.blacklist.state === true || data.blacklist.state === "on",
                value: Array.isArray(data.blacklist.value) ? data.blacklist.value : [],
              },
            });
          }
          if (data.delim != null) {
            await chrome.runtime.sendMessage({ action: "set", delim: String(data.delim) });
          }
          if (data.dictionary != null) {
            await chrome.runtime.sendMessage({ action: "set", dictionary: data.dictionary });
          }
          if (data.suggestions != null) {
            await chrome.runtime.sendMessage({
              action: "set",
              suggestions: {
                state: data.suggestions.state === true || data.suggestions.state === "on",
                opacity: typeof data.suggestions.opacity === "number" ? data.suggestions.opacity : 0.75,
              },
            });
          }
          await init();
          setBackupStatus("Settings imported.");
        } catch (err) {
          setBackupStatus("Import failed.", true);
        }
        event.target.value = "";
      })();
    } catch (err) {
      setBackupStatus("Invalid JSON: " + (err.message || "parse error"), true);
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function resetToDefaults() {
  chrome.runtime.sendMessage({ action: "resetDefaults" }, function () {
    init();
    setBackupStatus("Reset to defaults done.");
  });
}

function updateCurrentSiteStatus() {
  var statusEl = document.getElementById("status-value");
  var actionsEl = document.getElementById("status-actions");
  if (!statusEl || !actionsEl) return;
  if (currentTabUrl == null || currentTabUrl === "") {
    statusEl.textContent = "—";
    statusEl.className = "status-value";
    actionsEl.innerHTML = "";
    return;
  }
  chrome.runtime.sendMessage({ action: "get", urlStatus: currentTabUrl }, function (res) {
    if (!res || res.active === undefined) {
      statusEl.textContent = "—";
      statusEl.className = "status-value";
      actionsEl.innerHTML = "";
      return;
    }
    if (res.active) {
      statusEl.textContent = "Active";
      statusEl.className = "status-value active";
    } else {
      statusEl.textContent = "Off";
      statusEl.className = "status-value off";
    }
    try {
      var origin = new URL(currentTabUrl).origin;
      var pattern = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ".*";
      actionsEl.innerHTML = "";
      if (res.active) {
        var btnDisable = document.createElement("button");
        btnDisable.type = "button";
        btnDisable.className = "btn btn-secondary";
        btnDisable.textContent = "Disable on this site";
        btnDisable.addEventListener("click", function () {
          blacklistValue = blacklistValue || [];
          if (blacklistValue.indexOf(pattern) === -1) blacklistValue.push(pattern);
          document.getElementById("blacklist-textarea").value = blacklistValue.join("\n");
          chrome.runtime.sendMessage({
            action: "set",
            blacklist: { state: true, value: blacklistValue },
          });
          blacklistState = true;
          document.getElementById("blacklist-toggle").textContent = "ON";
          document.getElementById("blacklist-toggle").classList.add("active");
          document.getElementById("blacklist-toggle").setAttribute("aria-checked", "true");
          updateCurrentSiteStatus();
        });
        actionsEl.appendChild(btnDisable);
      } else {
        var btnEnable = document.createElement("button");
        btnEnable.type = "button";
        btnEnable.className = "btn btn-secondary";
        btnEnable.textContent = "Enable on this site";
        btnEnable.addEventListener("click", function () {
          whitelistValue = whitelistValue || [];
          if (whitelistValue.indexOf(pattern) === -1) whitelistValue.push(pattern);
          document.getElementById("whitelist-textarea").value = whitelistValue.join("\n");
          chrome.runtime.sendMessage({
            action: "set",
            whitelist: { state: true, value: whitelistValue },
          });
          whitelistState = true;
          document.getElementById("whitelist-toggle").textContent = "ON";
          document.getElementById("whitelist-toggle").classList.add("active");
          document.getElementById("whitelist-toggle").setAttribute("aria-checked", "true");
          updateCurrentSiteStatus();
        });
        actionsEl.appendChild(btnEnable);
      }
    } catch (_) {
      actionsEl.innerHTML = "";
    }
  });
}

async function init() {
  var whitelistRes = await chrome.runtime.sendMessage({ action: "get", whitelist: true });
  var blacklistRes = await chrome.runtime.sendMessage({ action: "get", blacklist: true });
  whitelistState = whitelistRes.state === true || whitelistRes.state === "on";
  whitelistValue = whitelistRes.value || [];
  blacklistState = blacklistRes.state === true || blacklistRes.state === "on";
  blacklistValue = blacklistRes.value || [];

  var wToggle = document.getElementById("whitelist-toggle");
  if (wToggle) {
    wToggle.textContent = whitelistState ? "ON" : "OFF";
    wToggle.classList.toggle("active", whitelistState);
    wToggle.setAttribute("aria-checked", whitelistState);
  }
  var bToggle = document.getElementById("blacklist-toggle");
  if (bToggle) {
    bToggle.textContent = blacklistState ? "ON" : "OFF";
    bToggle.classList.toggle("active", blacklistState);
    bToggle.setAttribute("aria-checked", blacklistState);
  }

  delimiter = await chrome.runtime.sendMessage({ action: "get", delim: true });
  dictionary = await chrome.runtime.sendMessage({ action: "get", dictionary: true }) || {};
  var suggestionsRes = await chrome.runtime.sendMessage({ action: "get", suggestions: true });
  suggestionsOn = suggestionsRes.state === true || suggestionsRes.state === "on";
  suggestionsOpacity = suggestionsRes.opacity;

  initWhitelist();
  initBlacklist();
  initDelimiter();
  initDictionary();
  updateShortcutHint();

  var sToggle = document.getElementById("suggestions-toggle");
  if (sToggle) {
    sToggle.textContent = suggestionsOn ? "ON" : "OFF";
    sToggle.classList.toggle("active", suggestionsOn);
    sToggle.setAttribute("aria-checked", suggestionsOn);
  }
  var opacitySlider = document.getElementById("opacity-slider");
  if (opacitySlider) opacitySlider.value = suggestionsOpacity;

  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabUrl = (tabs[0] && tabs[0].url) || null;
  } catch (_) {
    currentTabUrl = null;
  }
  updateCurrentSiteStatus();

  var stored = await chrome.storage.local.get("popupTheme");
  var theme = stored.popupTheme || "light";
  document.body.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-chip").forEach(function (c) {
    c.setAttribute("aria-pressed", c.getAttribute("data-theme") === theme);
  });
}

function setupListeners() {
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      switchTab(tab.getAttribute("data-tab"));
    });
  });

  document.querySelectorAll(".chip[data-delim]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var d = chip.getAttribute("data-delim");
      document.querySelectorAll(".chip[data-delim]").forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-delim") === d);
      });
      var input = document.getElementById("delimiter-input");
      if (input) {
        input.value = "";
        input.placeholder = d;
      }
      delimiter = d;
      chrome.runtime.sendMessage({ action: "set", delim: delimiter });
      updateShortcutHint();
    });
  });

  document.getElementById("delimiter-input").addEventListener("change", updateDelimiter);
  document.getElementById("delimiter-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      updateDelimiter();
    }
  });
  document.getElementById("update-delimiter-btn").addEventListener("click", updateDelimiter);

  document.getElementById("whitelist-toggle").addEventListener("click", toggleWhitelist);
  document.getElementById("blacklist-toggle").addEventListener("click", toggleBlacklist);
  document.getElementById("suggestions-toggle").addEventListener("click", toggleSuggestions);
  document.getElementById("update-whitelist-btn").addEventListener("click", updateWhitelistItems);
  document.getElementById("update-blacklist-btn").addEventListener("click", updateBlacklistItems);
  document.getElementById("update-dictionary-btn").addEventListener("click", updateDictionaryFromDOM);
  document.getElementById("add-entry-btn").addEventListener("click", function () {
    var container = document.getElementById("dictionary-container");
    if (container) addNewDictionaryRow(container.lastElementChild || null);
  });
  document.getElementById("opacity-slider").addEventListener("input", updateSuggestionsOpacity);
  document.getElementById("dictionary-filter").addEventListener("input", filterDictionary);
  document.getElementById("export-settings-btn").addEventListener("click", exportSettings);
  document.getElementById("import-settings-btn").addEventListener("click", importSettings);
  document.getElementById("import-file-input").addEventListener("change", onImportFileChange);
  document.getElementById("reset-defaults-btn").addEventListener("click", resetToDefaults);

  document.querySelectorAll(".theme-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var theme = chip.getAttribute("data-theme");
      document.querySelectorAll(".theme-chip").forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-theme") === theme);
      });
      document.body.setAttribute("data-theme", theme);
      chrome.storage.local.set({ popupTheme: theme });
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  init().then(function () {
    setupListeners();
  });
});
