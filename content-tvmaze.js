function extractSeriesData() {
  const titleElement = document.querySelector("h1");
  const title = titleElement?.textContent?.trim();
  
  const match = location.pathname.match(/shows\/(\d+)/);
  const seriesId = match ? match[1] : null;
  
  return { title, seriesId };
}

async function initMedusaButton() {
  const { title, seriesId } = extractSeriesData();
  
  if (!seriesId) return;
  
  const headerElement = document.querySelector("h1");
  const parent = headerElement?.parentNode;
  if (!headerElement || parent?.querySelector('.medusa-add-button[data-provider="tvmaze"]')) return;
  
  const button = await createMedusaButton(async () => {
    await sendSeriesToMedusa("tvmaze", seriesId);
  });
  button.dataset.provider = "tvmaze";
  
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
