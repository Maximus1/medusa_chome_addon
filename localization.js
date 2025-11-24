/**
 * @file localization.js
 * Stellt eine globale Übersetzungsfunktion `t` bereit, die die in den Einstellungen
 * gespeicherte Sprache berücksichtigt. Dieses Skript initialisiert sich selbst.
 */

// Globale Übersetzungsfunktion, die initial auf die Standard-API zurückfällt.
// Sie wird nach der Initialisierung überschrieben.
let t = (key, substitutions) => chrome.i18n.getMessage(key, substitutions) || key;

// Erstelle ein globales Promise, das von anderen Skripten awaited werden kann.
// Es wird aufgelöst, sobald die Lokalisierung abgeschlossen ist.
const localizationReady = (async function initialize() {
  const DEFAULT_LOCALE = "en";
  const SUPPORTED_LOCALES = ["en", "de"]; // Manuell definieren
  const loadedMessages = {};
  let currentLocale = DEFAULT_LOCALE;

  function normalizeLocale(locale) {
    if (!locale) return DEFAULT_LOCALE;
    const base = locale.toLowerCase().split("-")[0];
    return SUPPORTED_LOCALES.includes(base) ? base : DEFAULT_LOCALE;
  }

  async function loadLocale(locale) {
    const normalized = normalizeLocale(locale);
    if (loadedMessages[normalized]) return; // Bereits geladen

    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${normalized}/messages.json`));
      if (response.ok) {
        loadedMessages[normalized] = await response.json();
      } else {
        loadedMessages[normalized] = {}; // Fehler markieren, um erneutes Laden zu verhindern
      }
    } catch {
      loadedMessages[normalized] = {};
    }
  }

  function formatMessage(template, substitutions) {
    if (!template) return "";
    if (!substitutions) return template;
    const values = Array.isArray(substitutions) ? substitutions : [substitutions];
    return values.reduce(
      (acc, value, index) => acc.replace(new RegExp(`\\$${index + 1}`, "g"), String(value)),
      template
    );
  }

  function resolveMessage(locale, key, substitutions) {
    const dict = loadedMessages[locale];
    const entry = dict?.[key];
    if (!entry?.message) return null;
    return formatMessage(entry.message, substitutions);
  }

  // Die eigentliche Übersetzungslogik
  function translate(key, substitutions) {
    // 1. Versuche die vom Benutzer gewählte Sprache
    const primary = resolveMessage(currentLocale, key, substitutions);
    if (primary != null) return primary;

    // 2. Versuche die Fallback-Sprache (Englisch)
    const fallback = resolveMessage(DEFAULT_LOCALE, key, substitutions);
    if (fallback != null) return fallback;

    // 3. Als letztes Fallback die Standard-API von Chrome nutzen
    const chromeMessage = chrome.i18n.getMessage(key, substitutions);
    if (chromeMessage) return chromeMessage;

    return key; // Wenn nichts gefunden wird, den Schlüssel selbst zurückgeben
  }

  // --- Initialisierungs-Sequenz ---
  try {
    // Fallback-Sprache immer laden
    await loadLocale(DEFAULT_LOCALE);

    const stored = await chrome.storage.sync.get("language");
    const desired = stored.language ?? chrome.i18n.getUILanguage();
    
    currentLocale = normalizeLocale(desired);
    await loadLocale(currentLocale);

    // Überschreibe die globale `t`-Funktion mit der voll initialisierten Version.
    t = translate;
  } catch (error) {
    console.error("Medusa Add-on: Fehler bei der Initialisierung der Lokalisierung.", error);
  }
})(); // Die IIFE wird sofort ausgeführt und ihr zurückgegebenes Promise wird in localizationReady gespeichert.