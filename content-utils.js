async function sendSeriesToMedusa(provider, id) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "addSeries", provider, id },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      }
    );
  });
}

function createMedusaButton(onClickHandler) {
  const button = document.createElement("button");
  button.className = "medusa-add-button";
  button.title = chrome.i18n.getMessage("contentAddToMedusa");
  button.textContent = chrome.i18n.getMessage("contentAddToMedusa");
  
  button.style.cssText = `
    padding: 6px 12px;
    margin-left: 8px;
    border: none;
    border-radius: 4px;
    background: linear-gradient(135deg, #0f766e, #22c55e);
    color: white;
    font-size: 0.85rem;
    cursor: pointer;
    font-weight: 500;
    transition: opacity 0.2s;
  `;
  
  button.addEventListener("mouseover", () => {
    button.style.opacity = "0.8";
  });
  
  button.addEventListener("mouseout", () => {
    button.style.opacity = "1";
  });
  
  button.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    button.disabled = true;
    button.style.opacity = "0.5";
    
    try {
      await onClickHandler();
      button.textContent = chrome.i18n.getMessage("contentAdded");
      button.style.background = "#22c55e";
      setTimeout(() => {
        button.textContent = chrome.i18n.getMessage("contentAddToMedusa");
        button.style.background = "linear-gradient(135deg, #0f766e, #22c55e)";
        button.disabled = false;
        button.style.opacity = "1";
      }, 2000);
    } catch (error) {
      button.textContent = chrome.i18n.getMessage("contentError");
      button.style.background = "#ef4444";
      setTimeout(() => {
        button.textContent = chrome.i18n.getMessage("contentAddToMedusa");
        button.style.background = "linear-gradient(135deg, #0f766e, #22c55e)";
        button.disabled = false;
        button.style.opacity = "1";
      }, 2000);
    }
  });
  
  return button;
}
