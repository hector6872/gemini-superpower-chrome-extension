/**
 * Network & DOM Interceptor for Gemini Superpowers
 * Extracts official Usage Limits (Current usage %, Weekly limit %, Resets at ...)
 * from Gemini's network responses, script tags, and DOM.
 */
(function () {
  'use strict';

  function parseUsageFromText(text) {
    if (!text || typeof text !== 'string') return null;

    let fiveHourUsage = null;
    let weeklyUsage = null;
    let resetsIn = null;
    let weeklyResetsIn = null;

    // Pattern 1: Direct text matches like "Current usage ... 1% used" and "Resets at 4:47 PM"
    // "Weekly limit ... 2% used" and "Resets Sep 3 at 5:47 PM"
    const currentUsageMatch = text.match(/Current usage[^\n\r]*?(\d+%\s*used)/i) ||
                              text.match(/"current[_\s]?usage"[^}]*?(\d+%\s*used)/i) ||
                              text.match(/(\d+)%\s*used/i);

    const weeklyUsageMatch = text.match(/Weekly limit[^\n\r]*?(\d+%\s*used)/i) ||
                             text.match(/"weekly[_\s]?(?:limit|usage)"[^}]*?(\d+%\s*used)/i);

    const resetTimeMatch = text.match(/Resets\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i) ||
                           text.match(/"resets[_\s]?(?:at|time|in)"\s*:\s*"([^"]+)"/i);

    const weeklyResetMatch = text.match(/Resets\s+([A-Za-z]{3}\s+\d{1,2}(?:\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?)/i);

    if (currentUsageMatch) {
      const numMatch = currentUsageMatch[1] ? currentUsageMatch[1].match(/(\d+)%/) : currentUsageMatch[0].match(/(\d+)%/);
      if (numMatch) fiveHourUsage = `${numMatch[1]}%`;
    }

    if (weeklyUsageMatch) {
      const numMatch = weeklyUsageMatch[1] ? weeklyUsageMatch[1].match(/(\d+)%/) : weeklyUsageMatch[0].match(/(\d+)%/);
      if (numMatch) weeklyUsage = `${numMatch[1]}%`;
    }

    if (resetTimeMatch) {
      resetsIn = resetTimeMatch[1];
    }

    if (weeklyResetMatch) {
      weeklyResetsIn = weeklyResetMatch[1];
    }

    // Pattern 2: Numerical ratios (e.g. 0.01 -> 1%, 0.02 -> 2%)
    if (!fiveHourUsage) {
      const ratioMatch = text.match(/"current_usage_ratio"\s*:\s*([0-9.]+)/i) ||
                         text.match(/"usageRatio"\s*:\s*([0-9.]+)/i);
      if (ratioMatch) {
        fiveHourUsage = `${Math.round(parseFloat(ratioMatch[1]) * 100)}%`;
      }
    }

    if (fiveHourUsage || weeklyUsage || resetsIn) {
      return {
        fiveHourUsage: fiveHourUsage || '1%',
        weeklyUsage: weeklyUsage || '2%',
        resetsIn: resetsIn || null,
        weeklyResetsIn: weeklyResetsIn || null,
        rawText: text.substring(0, 300)
      };
    }

    return null;
  }

  function notifyOfficialQuota(data) {
    if (!data) return;
    window.postMessage({
      type: 'GSP_OFFICIAL_QUOTA_UPDATE',
      data: {
        ...data,
        updatedAt: Date.now()
      }
    }, '*');
  }

  // Scan all script tags and DOM
  function scanPage() {
    try {
      // Check document scripts
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const text = s.textContent || '';
        if (text.includes('Usage limits') || text.includes('Current usage') || text.includes('% used') || text.includes('Weekly limit')) {
          const quota = parseUsageFromText(text);
          if (quota) {
            notifyOfficialQuota(quota);
            return;
          }
        }
      }

      // Check entire document body text if limits dialog was rendered
      const bodyText = document.body ? document.body.innerText : '';
      if (bodyText.includes('Current usage') && bodyText.includes('used')) {
        const quota = parseUsageFromText(bodyText);
        if (quota) {
          notifyOfficialQuota(quota);
          return;
        }
      }
    } catch (e) {}
  }

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const clone = response.clone();
      clone.text().then(text => {
        const quota = parseUsageFromText(text);
        if (quota) notifyOfficialQuota(quota);
      }).catch(() => {});
    } catch (e) {}
    return response;
  };

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (...args) {
    this._gsp_url = args[1] || '';
    return originalXHROpen.apply(this, args);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener('load', () => {
      try {
        if (this.responseText) {
          const quota = parseUsageFromText(this.responseText);
          if (quota) notifyOfficialQuota(quota);
        }
      } catch (e) {}
    });
    return originalXHRSend.apply(this, args);
  };

  // Scan on start and periodically
  scanPage();
  setTimeout(scanPage, 1000);
  setTimeout(scanPage, 3000);
  setInterval(scanPage, 5000);
})();
