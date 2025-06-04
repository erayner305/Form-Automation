// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	let iframeDocument =
		window.top.frames["fraMain"].contentDocument.querySelector(
			"#iframeMain"
		).contentDocument;
	const profile = request.profile || 'default';

	// Use profile as a key in storage
	if (request.action === "capture" && request.form_ids) {
		const state = {
			radio: {},
			text: {},
			textarea: {},
		};
		request.form_ids.radio.forEach((groupId) => {
			const groupEl = iframeDocument.getElementById(groupId);
			if (!groupEl) return;
			const radios = groupEl.querySelectorAll("input[type=radio]");
			for (const radio of radios) {
				if (radio.checked) {
					state.radio[groupId] = radio.value;
					break;
				}
			}
		});
		request.form_ids.text.forEach((id) => {
			const el = iframeDocument.getElementById(id);
			if (!el) return;
			state.text[id] = el.value;
		});
		request.form_ids.textarea.forEach((id) => {
			const el = iframeDocument.getElementById(id);
			if (!el) return;
			state.textarea[id] = el.value;
		});
		chrome.storage.local.get(["form_state"], (result) => {
			const allStates = result.form_state || {};
			allStates[profile] = state;
			chrome.storage.local.set({ form_state: allStates }, () => {
				// Optionally notify user
			});
		});
	}

	if (request.action === "autofill" && request.form_ids) {
		chrome.storage.local.get(["form_state"], (result) => {
			const allStates = result.form_state || {};
			const state = allStates[profile] || { radio: {}, text: {}, textarea: {} };
			request.form_ids.radio.forEach((groupId) => {
				const groupEl = iframeDocument.getElementById(groupId);
				if (!groupEl || !(groupId in state.radio)) return;
				const radios = groupEl.querySelectorAll("input[type=radio]");
        for (const radio of radios) {
          if (radio.value === state.radio[groupId]) {
            radio.checked = true;
            break;
          }
        }
			});

			request.form_ids.text.forEach((id) => {
				const el = iframeDocument.getElementById(id);
				if (!el || !(id in state.text)) return;
				el.value = state.text[id];
			});
			request.form_ids.textarea.forEach((id) => {
				const el = iframeDocument.getElementById(id);
				if (!el || !(id in state.textarea)) return;
				el.value = state.textarea[id];
			});
		});
	}

	// Export: trigger file download of stored form_state for the profile
	if (request.action === "export") {
		chrome.storage.local.get(["form_state"], (result) => {
			const allStates = result.form_state || {};
			const state = allStates[profile] || {};
			const blob = new Blob([JSON.stringify(state, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `form_profile_${profile}.json`;
			document.body.appendChild(a);
			a.click();
			setTimeout(() => {
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}, 100);
		});
	}

	// Import: save provided data to chrome.storage.local for the profile
	if (request.action === "import" && request.data) {
		chrome.storage.local.get(["form_state"], (result) => {
			const allStates = result.form_state || {};
			allStates[profile] = request.data;
			chrome.storage.local.set({ form_state: allStates }, () => {
				// Optionally notify user
			});
		});
	}
});
