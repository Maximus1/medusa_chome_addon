function extractSeriesData() {
  // Aktualisierter Selektor für den Titel-Text basierend auf der neuen IMDb-Struktur.
  const titleElement = document.querySelector("[data-testid='hero__primary-text']");
  const title = titleElement?.textContent?.trim();
  
  const match = location.pathname.match(/title\/(tt\d+)/);
  const seriesId = match ? match[1] : null;
  
  return { title, seriesId };
}

async function initMedusaButton() {
  const { title, seriesId } = extractSeriesData();
  
  if (!seriesId) return;
  
  // Aktualisierter Selektor für das H1-Element, das als Anker für den Button dient.
  const headerElement = document.querySelector("h1[data-testid='hero__pageTitle']");
  if (!headerElement || headerElement.querySelector(".medusa-add-button")) return;
  
  // Die createMedusaButton-Funktion ist nicht async. Das 'await' wird entfernt.
  const button = createMedusaButton(async () => {
    await sendSeriesToMedusa("imdb", seriesId);
  });
  
  // Der Button wird direkt in den Elter-Container des H1-Elements eingefügt.
  // Das H1-Element selbst ist der beste Anker.
  const container = headerElement.parentElement;
  
  container?.appendChild(button);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMedusaButton);
} else {
  initMedusaButton();
}

setTimeout(initMedusaButton, 1000);
