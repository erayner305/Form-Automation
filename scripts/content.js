// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture" && request.form_ids) {
    const state = {};
    request.form_ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.type === "checkbox" || el.type === "radio") {
        state[id] = el.checked;
      } else {
        state[id] = el.value;
      }
    });
    chrome.storage.local.set({form_state: state}, () => {
      // Optionally notify user
    });
  }

  if (request.action === "autofill" && request.form_ids) {
    chrome.storage.local.get(["form_state"], (result) => {
      const state = result.form_state || {};
      request.form_ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !(id in state)) return;
        if (el.type === "checkbox" || el.type === "radio") {
          el.checked = state[id];
        } else {
          el.value = state[id];
        }
      });
    });
  }

  // Export: trigger file download of stored form_state
  if (request.action === "export") {
    chrome.storage.local.get(["form_state"], (result) => {
      const state = result.form_state || {};
      const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'form_profile.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
  }

  // Import: save provided data to chrome.storage.local
  if (request.action === "import" && request.data) {
    chrome.storage.local.set({form_state: request.data}, () => {
      // Optionally notify user
    });
  }
});
