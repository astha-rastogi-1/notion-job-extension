// options.js
const tokenInput = document.getElementById('token');
const dbInput = document.getElementById('dbid');
const versionInput = document.getElementById('version');
const saveBtn = document.getElementById('save');
const status = document.getElementById('status');

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(['notion_token', 'notion_database_id', 'notion_version']);
  tokenInput.value = data.notion_token || "";
  dbInput.value = data.notion_database_id || "";
  versionInput.value = data.notion_version || "";
});

saveBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({
    notion_token: tokenInput.value.trim(),
    notion_database_id: dbInput.value.trim(),
    notion_version: versionInput.value.trim() || "2025-09-03"
  });
  status.textContent = "Saved ✅";
  setTimeout(()=> status.textContent = "", 3000);
});
