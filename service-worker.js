import "./localization.js";

const API_SERIES_PATH = "/api/v2/series";

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

function buildNumericId(value, key) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    return null;
  }
  return { [key]: number };
}

function buildSeriesPayload(provider, id) {
  const builders = {
    tvdb: (value) => buildNumericId(value, "tvdb"),
    tmdb: (value) => buildNumericId(value, "tmdb"),
    tvmaze: (value) => buildNumericId(value, "tvmaze"),
    imdb: (value) => (value ? { imdb: value } : null),
  };
  
  const builder = builders[provider];
  if (!builder) {
    return null;
  }
  
  const idFragment = builder(id);
  if (!idFragment) {
    return null;
  }
  
  return { id: idFragment };
}

async function sendSeries(apiUrl, apiKey, payload) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
  }
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const responseBody = await response.json().catch(() => null);
    const detail = typeof responseBody?.fields === "string" ? responseBody.fields : null; // Medusa-spezifische Fehlermeldung
    const statusMessage = detail ?? t("httpStatusError", response.status.toString());
    throw new Error(statusMessage);
  }
  
  return { success: true };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addSeries") {
    (async () => {
      try {
        // Stelle sicher, dass die Lokalisierung abgeschlossen ist, bevor Fehler-Strings verwendet werden.
        await localizationReady;
        
        const settings = await chrome.storage.sync.get(["apiUrl", "apiKey"]);
        
        if (!settings.apiUrl) {
          sendResponse({ error: t("statusMissingApiUrlSetting") });
          return;
        }
        
        const normalizedUrl = buildApiEndpoint(settings.apiUrl.trim());
        if (!normalizedUrl) {
          sendResponse({ error: t("statusInvalidApiUrl") });
          return;
        }
        
        const payload = buildSeriesPayload(request.provider, request.id);
        if (!payload) {
          // "statusSeriesNotProcessable" passt hier am besten.
          sendResponse({ error: t("statusSeriesNotProcessable") });
          return;
        }
        
        await sendSeries(normalizedUrl, settings.apiKey?.trim(), payload);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    
    return true;
  }
});
