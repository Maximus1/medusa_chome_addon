# Medusa Serienimporter

Eine Browser-Erweiterung für Google Chrome (und kompatible Browser), um Serien von populären Datenbanken schnell und einfach zu Ihrer Medusa-Instanz hinzuzufügen.

## Features

-   **Direkte Integration:** Fügt einen "Zu Medusa hinzufügen"-Button direkt auf den Detailseiten von Serien ein.
-   **Breite Unterstützung:** Funktioniert mit TheTVDB, IMDb (aktuell leider nicht), TVmaze und TheMovieDB.
-   **Popup-Funktionalität:** Ermöglicht das Hinzufügen der Serie aus dem aktiven Tab über das Extension-Icon.
-   **Einfache Konfiguration:** Einmalige Einrichtung der Medusa API-URL und des API-Schlüssels.
-   **Mehrsprachig:** Benutzeroberfläche in Deutsch und Englisch verfügbar.
-   **Detailliertes Logging:** Zeigt im Popup die genauen API-Anfragen und -Antworten zur einfachen Fehlerdiagnose an.

## Unterstützte Webseiten

-   TheTVDB
-   IMDb
-   TVmaze
-   TheMovieDB (TMDB)

## Installation

Da diese Erweiterung nicht im offiziellen Chrome Web Store verfügbar ist, muss sie manuell als "entpackte Erweiterung" geladen werden.

1.  Laden Sie den gesamten Projektordner (`medusa_chome_addon`) auf Ihren Computer herunter.
2.  Öffnen Sie Google Chrome und navigieren Sie zu `chrome://extensions`.
3.  Aktivieren Sie oben rechts den **Entwicklermodus**.
4.  Klicken Sie auf den Button **"Entpackte Erweiterung laden"**.
5.  Wählen Sie den Ordner `medusa_chome_addon` auf Ihrer Festplatte aus.
6.  Die Erweiterung "Medusa Serienimporter" sollte nun in Ihrer Liste der Erweiterungen erscheinen.

## Einrichtung

Bevor Sie die Erweiterung nutzen können, müssen Sie die Verbindung zu Ihrer Medusa-Instanz konfigurieren.

1.  Klicken Sie auf das Medusa-Icon in Ihrer Browser-Symbolleiste, um das Popup zu öffnen.
2.  Geben Sie im Einstellungsbereich Ihre vollständige **Medusa API-URL** ein.
    -   *Beispiel:* `http://192.168.1.12:8081` (Der Pfad `/api/v2/series` wird automatisch angehängt).
3.  Geben Sie Ihren **API-Schlüssel** ein, falls Sie einen in Medusa konfiguriert haben.
4.  Wählen Sie Ihre bevorzugte Sprache aus.
5.  Klicken Sie auf **"Einstellungen speichern"**.

## Verwendung

Es gibt zwei Wege, eine Serie hinzuzufügen:

### 1. Über den Button auf der Webseite

-   Navigieren Sie zu einer Serien-Detailseite auf einer der unterstützten Webseiten (z.B. die TVDB-Seite von "Breaking Bad").
-   Neben dem Serientitel erscheint ein Button **"Zu Medusa hinzufügen"**.
-   Ein Klick darauf sendet die Serie direkt an Medusa. Der Button-Text ändert sich kurzzeitig, um den Erfolg oder einen Fehler anzuzeigen.

### 2. Über das Popup-Menü

-   Besuchen Sie eine Serien-Detailseite.
-   Klicken Sie auf das Medusa-Icon in der Browser-Symbolleiste.
-   Die Erweiterung erkennt die Serie automatisch.
-   Klicken Sie auf den Button **"Aktuelle Serie hinzufügen"**.
-   Im unteren Bereich des Popups ("Letzte Kommunikation") sehen Sie die Details der API-Anfrage und der Antwort von Medusa.

## Projektstruktur

-   `manifest.json`: Definiert die Erweiterung, ihre Berechtigungen und Skripte.
-   `service-worker.js`: Der Hintergrundprozess, der die API-Kommunikation mit Medusa abwickelt.
-   `popup.html` / `popup.js`: Die Benutzeroberfläche und Logik für das Einstellungs- und Sende-Popup.
-   `content-*.js`: Content-Skripte, die auf den jeweiligen Webseiten (TMDB, TVDB etc.) ausgeführt werden, um die Serien-ID zu extrahieren und den Button zu platzieren.
-   `content-utils.js`: Hilfsfunktionen, die von allen Content-Skripten gemeinsam genutzt werden (z.B. zum Erstellen des Buttons).
-   `_locales/`: Enthält die Übersetzungsdateien für Deutsch (`de`) und Englisch (`en`).
-   `localization.js`: Ein globales Skript zur Verwaltung der Übersetzungen.

---

Dieses Projekt ist für den persönlichen Gebrauch bestimmt und steht in keiner offiziellen Verbindung zu Medusa oder den genannten Datenbank-Webseiten.
