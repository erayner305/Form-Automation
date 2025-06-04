async function main() {
  const response = await fetch(chrome.runtime.getURL("scripts/data/form_ids.json"));
  const all_form_ids = await response.json();

  function getActiveProfile() {
    const select = document.querySelector('#profile');
    return select ? select.value : Object.keys(all_form_ids)[0];
  }

  async function Autofill() {
    const profile = getActiveProfile();
    if (window.confirm(`Are you sure you want to autofill the form using profile ${profile}?`)) {
      const form_ids = all_form_ids[profile];
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "autofill", form_ids, profile});
        window.close();
      });
    }
  }

  async function Capture() {
    const profile = getActiveProfile();
    if (window.confirm(`Are you sure you want to capture the current form state ${profile}?`)) {
      const form_ids = all_form_ids[profile];
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "capture", form_ids, profile});
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
    const profile = getActiveProfile();
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "export", profile});
    });
  });

  // Import profile
  let importBtn = document.querySelector("#import_btn");
  importBtn.addEventListener("click", async () => {
    const profile = getActiveProfile();
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
        chrome.tabs.sendMessage(tabs[0].id, {action: "import", data, profile});
      });
    });
    input.click();
    document.body.removeChild(input);
  });
}

main();
