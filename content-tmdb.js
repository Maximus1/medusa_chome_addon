function extractSeriesData() {
  const titleElement = document.querySelector("h2.title");
  const title = titleElement?.textContent?.trim();
  
  const match = location.pathname.match(/tv\/(\d+)/);
  const seriesId = match ? match[1] : null;
  
  return { title, seriesId };
}

async function initMedusaButton() {
  const { title, seriesId } = extractSeriesData();
  
  if (!seriesId) return;
  
  const headerElement = document.querySelector("h2.title");
  const parent = headerElement?.parentNode;
  // Vermeide Duplikate: existierenden Button für denselben Provider im Parent prüfen
  if (!headerElement || parent?.querySelector('.medusa-add-button[data-provider="tmdb"]')) return;
  
  const button = await createMedusaButton(async () => {
    await sendSeriesToMedusa("tmdb", seriesId);
  });
  // Markiere Button mit Provider, damit spätere Läufe ihn erkennen können
  button.dataset.provider = "tmdb";
  
  const container = document.createElement("div");
  container.style.display = "inline-flex";
  container.style.alignItems = "center";
  container.style.marginTop = "12px";
  container.style.gap = "8px";
  container.appendChild(button);
  
  headerElement.parentNode?.insertBefore(container, headerElement.nextSibling);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMedusaButton);
} else {
  initMedusaButton();
}
