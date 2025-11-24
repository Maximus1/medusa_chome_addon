function extractSeriesData() {
  const titleElement = document.querySelector("h1.series-header__title, h1, [class*='title']");
  const title = titleElement?.textContent?.trim();
  
  const seriesId = (() => {
    const match = location.pathname.match(/series\/(\d+)/);
    if (match) return match[1];
    
    const dataAttr = document.querySelector("[data-series-id]");
    if (dataAttr) return dataAttr.getAttribute("data-series-id");
    
    const listItem = Array.from(document.querySelectorAll("li.list-group-item")).find((node) =>
      node.textContent?.includes("Series ID")
    );
    if (listItem) {
      const span = listItem.querySelector("span");
      if (span?.textContent) return span.textContent.trim();
    }
    
    const metaMatch = document.documentElement.innerHTML.match(/seriesId\D*(\d+)/i);
    if (metaMatch) return metaMatch[1];
    
    return null;
  })();
  
  return { title, seriesId };
}

async function initMedusaButton() {
  const { title, seriesId } = extractSeriesData();
  
  if (!seriesId) return;
  
  const headerElement = document.querySelector("h1.series-header__title, h1");
  const parent = headerElement?.parentNode;
  if (!headerElement || parent?.querySelector('.medusa-add-button[data-provider="tvdb"]')) return;
  
  const container = document.createElement("div");
  container.style.display = "inline-flex";
  container.style.alignItems = "center";
  container.style.marginTop = "8px";
  container.style.gap = "8px";
  
  const button = await createMedusaButton(async () => {
    await sendSeriesToMedusa("tvdb", seriesId);
  });
  button.dataset.provider = "tvdb";
  
  container.appendChild(button);
  headerElement.parentNode?.insertBefore(container, headerElement.nextSibling);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMedusaButton);
} else {
  initMedusaButton();
}
