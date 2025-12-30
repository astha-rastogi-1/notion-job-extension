// popup.js
const jobTitleInput = document.getElementById('jobTitle');
const companyInput = document.getElementById('companyName');
const urlInput = document.getElementById('jobUrl');
const descInput = document.getElementById('description');
const statusSelect = document.getElementById('status');
const addBtn = document.getElementById('addBtn');
const msg = document.getElementById('msg');
const openOptions = document.getElementById('openOptions');

openOptions.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// When popup opens, ask content script for scraped fields
async function populateFromPage() {
  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  // Execute a small script to read the window.__NOTION_JOB_SCRAPE if present
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.__NOTION_JOB_SCRAPE || null
  });

  const data = res?.result || null;
  if (data) {
    jobTitleInput.value = data.jobTitle || "";
    companyInput.value = data.companyName || "";
    urlInput.value = data.url || "";
    descInput.value = data.description || "";
  } else {
    // fallback: set url to active tab
    urlInput.value = tab.url || "";
  }
}

populateFromPage();

// click handler -> send details to background to create notion page
addBtn.addEventListener('click', async () => {
  addBtn.disabled = true;
  msg.textContent = 'Adding...';

  const payload = {
    title: jobTitleInput.value.trim(),
    company: companyInput.value.trim(),
    url: urlInput.value.trim(),
    description: descInput.value.trim(),
    status: statusSelect.value
  };

  try {
    const resp = await chrome.runtime.sendMessage({ action: 'create_notion_page', payload });
    if (resp?.ok) {
      msg.textContent = "Added to Notion ✅";
    } else {
      msg.innerHTML = `Error: ${resp?.error || 'unknown'}`;
    }
  } catch (err) {
    msg.textContent = 'Error: ' + err.message;
  } finally {
    addBtn.disabled = false;
  }
});
