const form = document.getElementById("settings-form");
const sendButton = document.getElementById("send-button");
const statusNode = document.getElementById("status");
const logNode = document.getElementById("log");
const languageSelect = document.getElementById("language-select");

function showStatus(message, state) {
  statusNode.textContent = message;
  statusNode.className = state || "";
}

const API_SERIES_PATH = "/api/v2/series";

function translateText(node, key) {
  const message = t(key);
  if (node && message) {
    node.textContent = message;
  }
}

function translateAttribute(node, attribute, key) {
  const message = t(key);
  if (node && message) {
    node.setAttribute(attribute, message);
  }
}

async function generateLanguageOptions() {
  if (!languageSelect) return;

  languageSelect.innerHTML = "";
  const supportedLocales = ["en", "de"]; // Die Liste der zu prüfenden Sprachen

  for (const locale of supportedLocales) {
    const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
    if (!response.ok) continue;

    const messages = await response.json();
    const languageName = messages?.languageName?.message;
    if (!languageName) continue;

    const option = document.createElement("option");
    option.value = locale;
    option.textContent = languageName;
    languageSelect.appendChild(option);
  }
}

function applyTranslations() {
  const lang = t("htmlLang");
  if (lang) {
    document.documentElement.lang = lang;
  }
  const pageTitle = t("extensionName");
  if (pageTitle) {
    document.title = pageTitle;
  }
  translateText(document.querySelector(".container h1"), "extensionName");
  translateText(document.querySelector('label[for="api-url"]'), "apiUrlLabel");
  translateText(document.querySelector('label[for="api-key"]'), "apiKeyLabel");
  translateText(document.querySelector('label[for="language-select"]'), "languageLabel");
  translateAttribute(document.getElementById("api-url"), "placeholder", "apiUrlPlaceholder");
  translateAttribute(document.getElementById("api-key"), "placeholder", "apiKeyPlaceholder");
  translateText(form.querySelector('button[type="submit"]'), "saveSettingsButton");
  translateText(sendButton, "sendButtonLabel");
  translateText(document.querySelector("#communication p"), "communicationHeading");
}

async function initializePopup() {
  // Warte, bis die zentrale Lokalisierung bereit ist
  await localizationReady;
  
  // Führe alle UI-Übersetzungen durch
  applyTranslations();
  
  // Generiere die Sprachoptionen und setze den aktuell gespeicherten Wert
  await generateLanguageOptions();
  const { language } = await chrome.storage.sync.get("language");
  if (language && languageSelect) {
    languageSelect.value = language;
  }
}

async function handleLanguageChange(event) {
  const nextLocale = event?.target?.value;
  if (nextLocale) {
    await chrome.storage.sync.set({ language: nextLocale });
    // Lade das Popup neu, um alle Änderungen konsistent anzuwenden
    window.location.reload();
  }
}

function setCommunicationLog(details) {
  if (!logNode) {
    return;
  }
  logNode.textContent = details ? JSON.stringify(details, null, 2) : "";
}

function loadSettings() {
  chrome.storage.sync.get(["apiUrl", "apiKey"], (result) => {
    if (result.apiUrl) {
      document.getElementById("api-url").value = result.apiUrl;
    }
    if (result.apiKey) {
      document.getElementById("api-key").value = result.apiKey;
    }
  });
}

function saveSettings(event) {
  event.preventDefault();
  const apiUrl = document.getElementById("api-url").value.trim();
  const apiKey = document.getElementById("api-key").value.trim();
  if (!apiUrl) {
    showStatus(t("statusMissingApiUrlField"), "error");
    return;
  }
  chrome.storage.sync.set({ apiUrl, apiKey }, () => {
    showStatus(t("statusSettingsSaved"), "success");
  });
}

async function handleSend() {
  showStatus(t("statusDetectingSeries"), "");
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length) {
    showStatus(t("statusNoActiveTab"), "error");
    return;
  }
  const tab = tabs[0];
  const series = await detectSeries(tab);
  if (!series) {
    showStatus(t("statusNoSupportedSeries"), "error");
    return;
  }
  const payload = buildSeriesPayload(series);
  if (!payload) {
    showStatus(t("statusSeriesNotProcessable"), "error");
    return;
  }
  const { apiUrl, apiKey } = await getSettings();
  if (!apiUrl) {
    showStatus(t("statusMissingApiUrlSetting"), "error");
    return;
  }
  const normalizedUrl = buildApiEndpoint(apiUrl.trim());
  if (!normalizedUrl) {
    showStatus(t("statusInvalidApiUrl"), "error");
    return;
  }
  try {
    const logEntry = await sendSeries(normalizedUrl, apiKey?.trim(), payload);
    setCommunicationLog(logEntry);
    showStatus(t("statusSeriesSent", [series.provider, series.id]), "success");
  } catch (error) {
    if (error?.log) {
      setCommunicationLog(error.log);
    }
    showStatus(t("statusError", error.message), "error");
  }
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiUrl", "apiKey", "language"], resolve);
  });
}

function buildApiEndpoint(baseUrl) {
  if (!baseUrl) {
    return null;
  }
  try {
    const normalized = baseUrl.includes("://") ? baseUrl : `http://${baseUrl}`;
    const url = new URL(normalized);
    url.pathname = API_SERIES_PATH;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch (error) {
    return null;
  }
}

async function sendSeries(apiUrl, apiKey, payload) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  const serializedBody = JSON.stringify(payload);
  const requestLog = {
    url: apiUrl,
    method: "POST",
    headers,
    body: serializedBody,
  };
  let response;
  let responseBody = null;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: serializedBody,
    });
    responseBody = await response.json().catch(() => null);
  } catch (networkError) {
    const logEntry = { request: requestLog, response: null, error: networkError.message };
    const err = new Error(t("networkError", networkError.message));
    err.log = logEntry;
    throw err;
  }
  const logEntry = {
    request: requestLog,
    response: {
      status: response.status,
      statusText: response.statusText,
      body: responseBody,
    },
  };
  if (!response.ok) {
    const detail = typeof responseBody?.fields === "string" ? responseBody.fields : null;
    const codeDetail = responseBody?.code ? t("apiErrorCode", responseBody.code.toString()) : null;
    const statusMessage = detail ?? codeDetail ?? t("httpStatusError", response.status.toString());
    const err = new Error(statusMessage);
    err.log = logEntry;
    throw err;
  }
  return logEntry;
}

async function detectSeries(tab) {
  if (!tab.url) {
    return null;
  }
  const url = new URL(tab.url);
  if (url.hostname.includes("thetvdb.com")) {
    const id = await runContentScript(tab.id, extractTvdbId);
    if (id) {
      return { provider: "tvdb", id };
    }
  }
  if (url.hostname.includes("imdb.com")) {
    const match = url.pathname.match(/title\/(tt\d+)/);
    if (match) {
      return { provider: "imdb", id: match[1] };
    }
  }
  if (url.hostname.includes("tvmaze.com")) {
    const match = url.pathname.match(/shows\/(\d+)/);
    if (match) {
      return { provider: "tvmaze", id: match[1] };
    }
  }
  if (url.hostname.includes("themoviedb.org")) {
    const match = url.pathname.match(/tv\/(\d+)/);
    if (match) {
      return { provider: "tmdb", id: match[1] };
    }
  }
  return null;
}

async function runContentScript(tabId, func) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func,
  });
  return result?.result ?? null;
}

function extractTvdbId() {
  const matchPath = location.pathname.match(/series\/(\d+)/);
  if (matchPath) {
    return matchPath[1];
  }
  const dataAttr = document.querySelector("[data-series-id]");
  if (dataAttr) {
    return dataAttr.getAttribute("data-series-id");
  }
  const listItem = Array.from(document.querySelectorAll("li.list-group-item")).find((node) =>
    node.textContent?.includes("Series ID")
  );
  if (listItem) {
    const span = listItem.querySelector("span");
    if (span?.textContent) {
      return span.textContent.trim();
    }
  }
  const metaMatch = document.documentElement.innerHTML.match(/seriesId\D*(\d+)/i);
  if (metaMatch) {
    return metaMatch[1];
  }
  return null;
}

const payloadBuilders = {
  tvdb: (value) => buildNumericId(value, "tvdb"),
  tmdb: (value) => buildNumericId(value, "tmdb"),
  tvmaze: (value) => buildNumericId(value, "tvmaze"),
  imdb: (value) => (value ? { imdb: value } : null),
};

function buildSeriesPayload(series) {
  const builder = payloadBuilders[series.provider];
  if (!builder) {
    return null;
  }
  const idFragment = builder(series.id);
  if (!idFragment) {
    return null;
  }
  return { id: idFragment };
}

function buildNumericId(value, key) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }
  return { [key]: number };
}

document.addEventListener("DOMContentLoaded", async () => {
  await initializePopup();
  loadSettings();
  form.addEventListener("submit", saveSettings);
  sendButton.addEventListener("click", handleSend);
  if (languageSelect) {
    languageSelect.addEventListener("change", handleLanguageChange);
  }
});
