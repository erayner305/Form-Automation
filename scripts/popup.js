async function main() {
  const response = await fetch(chrome.runtime.getURL("scripts/data/form_ids.json"));
  const form_ids = await response.json();

  async function Autofill() {
    if (window.confirm("Are you sure you want to autofill the form?")) {
      // Send message to content script to autofill
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "autofill", form_ids});
        window.close();
      });
    }
  }

  async function Capture() {
    if (window.confirm("Are you sure you want to capture the current form state?")) {
      // Send message to content script to capture
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "capture", form_ids});
        window.close();
      });
    }
  }

  let autofillBtn = document.querySelector("#autofill_btn");
  autofillBtn.addEventListener("click", Autofill);

  let captureBtn = document.querySelector("#capture_btn");
  captureBtn.addEventListener("click", Capture);

  // Export profile
  let exportBtn = document.querySelector("#export_btn");
  exportBtn.addEventListener("click", async () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "export"});
    });
  });

  // Import profile
  let importBtn = document.querySelector("#import_btn");
  importBtn.addEventListener("click", async () => {
    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        alert('Invalid JSON file.');
        return;
      }
      // Save to chrome.storage.local
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "import", data});
      });
    });
    input.click();
    document.body.removeChild(input);
  });
}

main();
