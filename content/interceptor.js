/**
 * Network & DOM Interceptor for Gemini Superpowers
 * Extracts official Usage Limits and handles direct RPC conversation management in MAIN world.
 */
(function () {
  'use strict';

  let lastBatchExecuteUrl = '';
  let xsrfToken = '';

  function getXsrfToken() {
    if (xsrfToken) return xsrfToken;
    try {
      if (window.WIZ_global_data && window.WIZ_global_data.SNlM0e) {
        xsrfToken = window.WIZ_global_data.SNlM0e;
        return xsrfToken;
      }
      const match = document.documentElement.innerHTML.match(/"SNlM0e":"([^"]+)"/);
      if (match) {
        xsrfToken = match[1];
        return xsrfToken;
      }
    } catch (e) {}
    return '';
  }

  function parseUsageFromText(text) {
    if (!text || typeof text !== 'string') return null;
    if (text.length > 500000 || text.length < 20) return null;
    if (text.includes('StreamGenerateContent') || text.includes('prompt-suggestion')) return null;

    const cleanText = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '\n');

    const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const pctEntries = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/[{}:;]/.test(line)) continue;
      const m = line.match(/(\d{1,3})%/);
      if (m) {
        pctEntries.push({ index: i, pct: `${m[1]}%`, line });
      }
    }

    if (pctEntries.length < 2) {
      return null;
    }

    const fiveHourUsage = pctEntries[0].pct;
    const weeklyUsage = pctEntries[1].pct;

    // A genuine quota must have a valid reset time (e.g. 2:47 PM or 14:47)
    let resetsIn = null;
    const searchEnd5h = pctEntries[1].index;
    for (let i = pctEntries[0].index; i <= searchEnd5h; i++) {
      const m = lines[i]?.match(/\b(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)\b/);
      if (m) {
        resetsIn = m[1].trim();
        break;
      }
    }
    if (!resetsIn) {
      const generalTime = cleanText.match(/\b(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)\b/);
      if (generalTime) resetsIn = generalTime[1].trim();
    }

    if (!resetsIn) return null;

    let weeklyResetsIn = null;
    const afterPctIndex = cleanText.indexOf(weeklyUsage) + weeklyUsage.length;
    const textAfter = cleanText.substring(afterPctIndex);
    const weeklyTimeMatch = textAfter.match(/\b\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?\b/);

    if (weeklyTimeMatch) {
      const timeEnd = weeklyTimeMatch.index + weeklyTimeMatch[0].length;
      const segment = textAfter.substring(0, timeEnd).trim();
      const sLines = segment.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const timeLine = sLines.reverse().find(l => l.includes(weeklyTimeMatch[0])) || segment;

      const cleaned = timeLine.replace(/^.*?(?:resets?|restablece(?: el)?|сброс|リセット[:\s]*|إعادة الضبط[:\s]*|wird.*?zurückgesetzt[:\s]*)?\s*(\b\d{1,2}月.*|\b\d{1,2}\s+.*|\b[A-Za-z\u0400-\u04FF]{3,9}\b\s+\d{1,2}.*|\b\d{1,2}\..*)/i, '$1');
      weeklyResetsIn = (cleaned || timeLine).replace(/^[^A-Za-z0-9\u0400-\u04FF\u4E00-\u9FFF]+/, '').trim();
    }

    return {
      fiveHourUsage,
      weeklyUsage,
      resetsIn,
      weeklyResetsIn,
      rawText: text.substring(0, 300)
    };
  }

  function notifyOfficialQuota(data) {
    if (!data) return;
    if (!data.fiveHourUsage || !data.resetsIn) return;

    window.postMessage({
      type: 'GSP_OFFICIAL_QUOTA_UPDATE',
      data: {
        ...data,
        updatedAt: Date.now()
      }
    }, '*');
  }

  // Scan targeted script tags on load
  function scanPage() {
    try {
      const scripts = document.querySelectorAll('script');
      for (const s of scripts) {
        const text = s.textContent || '';
        if (text.includes('%') && /\b\d{1,2}:\d{2}\b/.test(text)) {
          const quota = parseUsageFromText(text);
          if (quota) {
            notifyOfficialQuota(quota);
            return;
          }
        }
      }
    } catch (e) {}
  }

  // Intercept window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
    if (url.includes('batchexecute')) {
      lastBatchExecuteUrl = url;
    }

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
    if (typeof this._gsp_url === 'string' && this._gsp_url.includes('batchexecute')) {
      lastBatchExecuteUrl = this._gsp_url;
    }
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

  // Listen for RPC delete requests from isolated content script
  window.addEventListener('message', async (e) => {
    if (e.source !== window) return;
    if (e.data && e.data.type === 'GSP_EXECUTE_DELETE_RPC') {
      const { conversationId, requestId } = e.data;
      const token = getXsrfToken();
      const endpoint = lastBatchExecuteUrl || `https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=GDMbFd&f.sid=${Date.now()}`;

      if (!token || !conversationId) {
        window.postMessage({ type: 'GSP_DELETE_RPC_RESULT', requestId, success: false }, '*');
        return;
      }

      try {
        const formattedId = conversationId.startsWith('c_') ? conversationId : `c_${conversationId}`;
        const reqPayload = JSON.stringify([[[ "GDMbFd", JSON.stringify([formattedId, 0, null, 1]), null, "generic" ]]]);
        const bodyParams = new URLSearchParams();
        bodyParams.append('f.req', reqPayload);
        bodyParams.append('at', token);

        const resp = await originalFetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
          },
          body: bodyParams.toString()
        });

        window.postMessage({ type: 'GSP_DELETE_RPC_RESULT', requestId, success: resp.ok }, '*');
      } catch (err) {
        window.postMessage({ type: 'GSP_DELETE_RPC_RESULT', requestId, success: false }, '*');
      }
    }
  });

  scanPage();
  setTimeout(scanPage, 1500);
  setTimeout(scanPage, 4000);
})();
