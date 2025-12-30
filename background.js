// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'create_notion_page') {
      handleCreatePage(message.payload).then(result => sendResponse(result)).catch(err => sendResponse({ ok:false, error: err.message }));
      // must return true to indicate async response
      return true;
    }
  });
  
  async function handleCreatePage(payload) {
    // read token + database id from storage
    const { notion_token, notion_database_id, notion_version } = await chrome.storage.local.get(['notion_token', 'notion_database_id', 'notion_version']);
  
    if (!notion_token || !notion_database_id) {
      return { ok: false, error: 'Notion token or database ID not set. Open Options.' };
    }
  
    const notionVersion = notion_version || "2025-09-03"; // latest version as of 2025-12-30

    let dataSourceId;
    try {
      const dbResp = await fetch(`https://api.notion.com/v1/databases/${notion_database_id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${notion_token}`,
          "Content-Type": "application/json",
          "Notion-Version": notionVersion
        }
      });
      if (!dbResp.ok) {
        const txt = await dbResp.text();
        return {ok: false, error: `Error fetching database info: ${dbResp.status} ${txt}`};
      }

      const dbData = await dbResp.json();
      console.log(dbData)
      // take first data source
      if (!dbData.data_sources || dbData.data_sources.length === 0) {
        return { ok: false, error: "No data sources found for database."};
      }
      dataSourceId = dbData.data_sources[0].id;
    } catch (err) {
      return { ok: false, error: 'Failed to get data_source_id: ' + err.message};
    }
  
    // Build Notion properties - adapt to your DB schema keys
    const properties = {
        "Company": {
          title: [{ text: { content: payload.company || "" } }]
        },
        "Position": {
          rich_text: [{ text: { content: payload.title || "" } }]
        },
        "Posting URL": {
          url: payload.url || ""
        },
        "Stage": {
          select: { name: payload.status || "Applied" }
        },
        "Apply Date": {
          date: { start: new Date().toISOString() }
        }
      };
    
    // const properties = {
    //   "Position": {
    //     title: [{ text: { content: payload.title || "(no title)" } }]
    //   },
    //   "Company": {
    //     rich_text: [{ text: { content: payload.company || "" } }]
    //   },
    //   "Posting URL": {
    //     url: payload.url || ""
    //   },
    //   "Stage": {
    //     select: { name: payload.status || "Applied" }
    //   },
    //   "Apply Date": {
    //     date: { start: new Date().toISOString() }
    //   }
    // };
  
    // Optionally add a description as a child block
    // const children = payload.description ? [
    //   {
    //     object: "block",
    //     type: "paragraph",
    //     paragraph: {
    //       text: [
    //         { type: "text", text: { content: payload.description } }
    //       ]
    //     }
    //   }
    // ] : [];
  
    try {
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${notion_token}`,
          "Content-Type": "application/json",
          "Notion-Version": notionVersion
        },
        body: JSON.stringify({
          parent: { type: "data_source_id", data_source_id: dataSourceId },
          properties
        //   children
        })
      });
  
      if (!response.ok) {
        const text = await response.text();
        return { ok: false, error: `Notion API error: ${response.status} ${text}` };
      }
      const data = await response.json();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  