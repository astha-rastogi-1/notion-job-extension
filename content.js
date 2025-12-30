// content.js
// Best-effort scraping heuristics for job title / company on common job pages
(function() {
    // Try meta tags first
    const metaTitle = document.querySelector('meta[property="og:title"], meta[name="og:title"], meta[name="twitter:title"]');
    const jobTitleGuess = metaTitle?.getAttribute('content') || document.querySelector('h1')?.innerText?.trim() || "";
  
    // company heuristics
    const companySelectors = [
      '[data-test-company-name]', // some sites
      '.company', '.topcard__org-name-link', '.icl-u-lg-mr--sm.icl-u-xs-mr--xs', '.posting-header__company'
    ];
    let company = "";
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText) { company = el.innerText.trim(); break; }
    }
    // fallback: find an element with "Company" label nearby
    if (!company) {
      const labels = Array.from(document.querySelectorAll('div, span, p, li'))
        .filter(el => /company/i.test(el.innerText || '') && (el.innerText || '').length < 40);
    if (labels.length) {
      const neighbor = labels[0].nextElementSibling;
      const text = neighbor?.innerText;
      if (typeof text === "string" && text.trim()) {
        company = text.trim();
      }
    }
    }
  
    // description: take first paragraph or meta description
    const metaDesc = document.querySelector('meta[name="description"], meta[property="og:description"]');
    const desc = metaDesc?.getAttribute('content') || document.querySelector('p')?.innerText?.slice(0, 500) || "";
  
    // page url and site
    const url = location.href;
    const site = location.hostname.replace('www.', '');
  
    // expose to popup via DOM (simple) — popup will request via messaging
    window.__NOTION_JOB_SCRAPE = {
      jobTitle: jobTitleGuess,
      companyName: company,
      url,
      site,
      description: desc
    };
  })();
  