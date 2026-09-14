/**
 * Usage Tracker Module for Gemini Superpowers
 * Displays official Gemini Usage Limits (Current usage, Weekly limit, and Reset times)
 * 100% Language-Agnostic across all 45+ languages supported by Gemini.
 */
(function () {
  'use strict';

  let officialQuota = null;
  const isTopWindow = (window === window.top);

  function extractDateString(str) {
    if (!str || typeof str !== 'string') return null;
    if (/diagnostics/i.test(str) || str.includes('%')) return null;
    if (/\b\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?\b/.test(str) || /\d{1,2}月\d{1,2}日/.test(str) || /\b\d{1,2}\b/.test(str)) {
      return str.trim();
    }
    return null;
  }

  function formatRemainingMs(ms) {
    if (ms <= 0) return '0m';
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  // Language-agnostic countdown calculation
  function calculateCountdown(timeStr) {
    if (!timeStr) return '';
    const now = new Date();
    const year = now.getFullYear();

    // 1. Time only (e.g. "2:47 PM" or "14:47")
    const isTimeOnly = /^\s*(?:resets?\s+(?:at\s+)?)?\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?\s*$/i.test(timeStr);
    if (isTimeOnly) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3];
        if (ampm) {
          if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
          if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
        }
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
        if (target.getTime() < now.getTime()) {
          target.setDate(target.getDate() + 1);
        }
        return formatRemainingMs(target.getTime() - now.getTime());
      }
    }

    // 2. Weekly date format in all languages
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3];
      if (ampm) {
        if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
        if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
      }

      // Extract day of month (1-31)
      const cjk = timeStr.match(/\d{1,2}月(\d{1,2})日/);
      let day = null;
      if (cjk) {
        day = parseInt(cjk[1], 10);
      } else {
        const withoutTime = timeStr.replace(/\b\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?\b/g, '');
        const d1 = withoutTime.match(/\b([1-9]|[12]\d|3[01])(?:\.|\s*(?:st|nd|rd|th|de|сент|[A-Za-z\u0400-\u04FF]+))\b/i);
        if (d1) {
          day = parseInt(d1[1], 10);
        } else {
          const d2 = withoutTime.match(/\b[A-Za-z\u0400-\u04FF]+\s+([1-9]|[12]\d|3[01])\b/i);
          if (d2) {
            day = parseInt(d2[1], 10);
          } else {
            const d3 = withoutTime.match(/\b([1-9]|[12]\d|3[01])\b/);
            if (d3) day = parseInt(d3[1], 10);
          }
        }
      }

      if (day !== null) {
        let target = new Date(year, now.getMonth(), day, hours, minutes, 0);
        if (target.getTime() < now.getTime()) {
          target = new Date(year, now.getMonth() + 1, day, hours, minutes, 0);
        }
        const diffMs = target.getTime() - now.getTime();
        if (diffMs > 0 && diffMs <= 8 * 24 * 60 * 60 * 1000) {
          return formatRemainingMs(diffMs);
        }
      }
    }

    return '';
  }

  function formatElapsedTime() {
    return 'Synced with your latest prompt';
  }

  // Pure Language-Agnostic Quota Extractor (handles both multi-line and inline DOM text)
  function extractLimitsFromText(text) {
    if (!text || typeof text !== 'string') return null;

    // Filter out CSS, HTML tags, script content
    const cleanText = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '\n');

    // Find all percentages that are not CSS properties
    const allPcts = [...cleanText.matchAll(/(?:^|[^\d\w:])(\d{1,3})%/g)];
    if (allPcts.length < 2) {
      return null;
    }

    const fiveHourUsage = `${allPcts[0][1]}%`;
    const weeklyUsage = `${allPcts[1][1]}%`;

    // Find all reset times in the text (\d{1,2}:\d{2} with optional AM/PM)
    const allTimes = [...cleanText.matchAll(/\b(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)\b/g)];
    if (allTimes.length === 0) return null;

    const resetsIn = allTimes[0][1].trim();

    // The weekly reset is associated with the second time match
    let weeklyResetsIn = null;
    if (allTimes.length >= 2) {
      const firstTime = allTimes[0];
      const secondTime = allTimes[1];
      const between = cleanText.substring(firstTime.index + firstTime[0].length, secondTime.index + secondTime[0].length);
      const lines = between.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const targetLine = lines.reverse().find(l => l.includes(secondTime[0])) || between.trim();

      const m = targetLine.match(/(?:resets?|restablece(?: el)?|сброс|リセット[:\s]*|إعادة الضبط[:\s]*|wird.*?zurückgesetzt[:\s]*)?\s*(\b\d{1,2}月\d{1,2}日.*|\b\d{1,2}\s+(?:de\s+)?[A-Za-z\u0400-\u04FF]+.*|\b[A-Za-z\u0400-\u04FF]{3,9}\b\s+\d{1,2}.*|\b\d{1,2}\.\s*[A-Za-z\u0400-\u04FF]+.*|\b\d{1,2}[\/\-]\d{1,2}.*)/i);
      if (m) {
        weeklyResetsIn = m[1].replace(/^[^\w\u0400-\u04FF\u4E00-\u9FFF]+/, '').trim();
      } else {
        weeklyResetsIn = targetLine.replace(/^[^\w\u0400-\u04FF\u4E00-\u9FFF]+/, '').trim();
      }
    }

    return {
      fiveHourUsage,
      weeklyUsage,
      resetsIn,
      weeklyResetsIn: weeklyResetsIn || null,
      updatedAt: Date.now()
    };
  }

  function isValidQuotaData(data) {
    if (!data) return false;
    if (!data.fiveHourUsage || !data.resetsIn) return false;
    if (data.fiveHourUsage === '100%' && !data.resetsIn) return false;
    return true;
  }

  // Check DOM directly for Gemini Usage Limits elements
  // Strictly EXCLUDES extension's own toolbar elements to prevent self-poisoning
  function extractFromDOM() {
    // 1. In subframe on /usage: read directly from the page
    if (!isTopWindow && window.location.pathname.includes('/usage')) {
      try {
        const bodyText = (document.body ? (document.body.innerText || document.body.textContent) : '');
        const data = extractLimitsFromText(bodyText);
        if (isValidQuotaData(data)) return data;
      } catch (e) {}
    }

    // 2. In top window: check open dialogs or overlays
    try {
      const containers = document.querySelectorAll(
        '[role="dialog"]:not(#gsp-toolbar-root *):not([class*="gsp-"]), ' +
        'mat-dialog-container:not(#gsp-toolbar-root *):not([class*="gsp-"]), ' +
        '.cdk-overlay-pane:not(#gsp-toolbar-root *):not([class*="gsp-"])'
      );
      for (const c of containers) {
        if (c.closest('#gsp-toolbar-root') || c.id?.startsWith('gsp-') || (c.className && typeof c.className === 'string' && c.className.includes('gsp-'))) {
          continue;
        }
        const data = extractLimitsFromText((c.innerText || '') + '\n' + (c.textContent || ''));
        if (isValidQuotaData(data)) {
          return data;
        }
      }
    } catch (e) {}

    // 3. In top window if user navigated directly to /usage
    if (isTopWindow && window.location && window.location.pathname && window.location.pathname.includes('/usage')) {
      try {
        const toolbarEl = document.getElementById('gsp-toolbar-root');
        const toolbarText = toolbarEl ? (toolbarEl.innerText || '') : '';
        const rawText = document.body ? (document.body.innerText || '') : '';
        const cleanedText = toolbarText ? rawText.replace(toolbarText, '') : rawText;
        const data = extractLimitsFromText(cleanedText);
        if (isValidQuotaData(data)) {
          return data;
        }
      } catch (e) {}
    }

    return null;
  }

  function applyQuotaData(data) {
    if (!isValidQuotaData(data)) return false;

    const merged = { ...(officialQuota || {}) };
    let changed = false;

    if (data.fiveHourUsage && data.fiveHourUsage !== merged.fiveHourUsage) {
      merged.fiveHourUsage = data.fiveHourUsage;
      changed = true;
    }
    if (data.resetsIn && data.resetsIn !== merged.resetsIn) {
      merged.resetsIn = data.resetsIn;
      changed = true;
    }
    if (data.weeklyUsage && data.weeklyUsage !== merged.weeklyUsage) {
      merged.weeklyUsage = data.weeklyUsage;
      changed = true;
    }
    if (data.weeklyResetsIn && !data.weeklyResetsIn.includes('%')) {
      if (data.weeklyResetsIn !== merged.weeklyResetsIn) {
        merged.weeklyResetsIn = data.weeklyResetsIn;
        changed = true;
      }
    }

    if (changed || !officialQuota) {
      merged.updatedAt = Date.now();
      officialQuota = merged;
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ gsp_official_quota: officialQuota });
        }
      } catch (e) {}

      if (isTopWindow && window.GSP?.updateUsagePopoverContent) {
        window.GSP.updateUsagePopoverContent();
      }
      return true;
    }
    return false;
  }

  let isFetchingUsage = false;
  let lastFetchTime = 0;

  // Automatically fetch official usage limits in the background
  async function autoFetchUsage(force = false) {
    if (!isTopWindow) return;
    if (isFetchingUsage) return;
    const now = Date.now();
    if (!force && officialQuota?.fiveHourUsage && officialQuota?.weeklyResetsIn && (now - lastFetchTime < 30000)) return;
    isFetchingUsage = true;
    lastFetchTime = now;

    // 1. First attempt: Direct fetch of /usage
    try {
      const resp = await fetch('https://gemini.google.com/usage', {
        credentials: 'include',
        headers: { 'Accept': 'text/html,application/xhtml+xml' }
      });
      if (resp.ok) {
        const html = await resp.text();
        const data = extractLimitsFromText(html);
        if (isValidQuotaData(data)) {
          applyQuotaData(data);
          isFetchingUsage = false;
          return;
        }
      }
    } catch (e) {}

    // 2. Second attempt: Silent background helper iframe
    try {
      let existingFrame = document.getElementById('gsp-usage-helper-frame');
      if (existingFrame) {
        try { existingFrame.remove(); } catch (e) {}
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'gsp-usage-helper-frame';
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1200px;height:900px;opacity:0;pointer-events:none;border:none;';
      iframe.src = 'https://gemini.google.com/usage';

      let resolved = false;
      let attempts = 0;

      const checkFrame = () => {
        if (resolved) return;
        attempts++;
        try {
          if (iframe.contentDocument && iframe.contentDocument.body) {
            const text = (iframe.contentDocument.body.innerText || '') + '\n' + (iframe.contentDocument.body.textContent || '');
            const data = extractLimitsFromText(text);
            if (isValidQuotaData(data)) {
              resolved = true;
              applyQuotaData(data);
              cleanup();
              return;
            }
          }
        } catch (e) {}

        if (attempts >= 25) {
          cleanup();
        }
      };

      const cleanup = () => {
        clearInterval(frameInterval);
        clearTimeout(frameTimeout);
        try { iframe.remove(); } catch (e) {}
        isFetchingUsage = false;
      };

      const frameInterval = setInterval(checkFrame, 350);
      const frameTimeout = setTimeout(cleanup, 10000);

      iframe.addEventListener('load', () => {
        setTimeout(checkFrame, 200);
        setTimeout(checkFrame, 800);
        setTimeout(checkFrame, 1600);
      });

      (document.body || document.documentElement).appendChild(iframe);
      return;
    } catch (e) {
      isFetchingUsage = false;
    }
  }

  // Subframe scanner: runs inside the helper iframe on https://gemini.google.com/usage
  function initSubframeScanner() {
    if (isTopWindow) return;
    if (!window.location.pathname.includes('/usage')) return;

    let subframeAttempts = 0;
    const scanSubframe = () => {
      subframeAttempts++;
      const data = extractFromDOM();
      if (isValidQuotaData(data)) {
        applyQuotaData(data);
        clearInterval(subframeInterval);
        return;
      }
      if (subframeAttempts >= 30) {
        clearInterval(subframeInterval);
      }
    };

    const subframeInterval = setInterval(scanSubframe, 350);
    try {
      const observer = new MutationObserver(() => scanSubframe());
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }

  // Listen for official quota updates from network interceptor
  window.addEventListener('message', async (event) => {
    if (event.source !== window || !event.data || event.data.type !== 'GSP_OFFICIAL_QUOTA_UPDATE') {
      return;
    }
    const data = event.data.data;
    if (isValidQuotaData(data)) {
      applyQuotaData(data);
    }
  });

  // Listen for storage changes from background or helper frames
  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes.gsp_official_quota && changes.gsp_official_quota.newValue) {
          const newQ = changes.gsp_official_quota.newValue;
          if (isValidQuotaData(newQ)) {
            officialQuota = newQ;
            if (isTopWindow && window.GSP?.updateUsagePopoverContent) {
              window.GSP.updateUsagePopoverContent();
            }
            const helper = document.getElementById('gsp-usage-helper-frame');
            if (helper) {
              try { helper.remove(); } catch (e) {}
            }
          }
        }
      });
    }
  } catch (e) {}

  // Get real usage data
  async function getRealUsageData() {
    const domData = extractFromDOM();
    if (isValidQuotaData(domData)) {
      applyQuotaData(domData);
    }

    let quota = officialQuota;

    if (!quota) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const data = await chrome.storage.local.get('gsp_official_quota');
          if (data.gsp_official_quota && isValidQuotaData(data.gsp_official_quota)) {
            quota = data.gsp_official_quota;
            officialQuota = quota;
          }
        }
      } catch (e) {}
    }

    // If no quota, missing weekly reset, or older than 2 minutes, trigger automatic background fetch
    if (!quota || !quota.fiveHourUsage || !quota.weeklyResetsIn || (Date.now() - (quota.updatedAt || 0) > 120000)) {
      autoFetchUsage(false);
    }

    const now = Date.now();

    const fiveHourUsage = (quota && quota.fiveHourUsage)
      ? quota.fiveHourUsage
      : '--';
    const weeklyUsage = (quota && quota.weeklyUsage !== undefined && quota.weeklyUsage !== null)
      ? quota.weeklyUsage
      : '--';

    const raw5hReset = quota?.resetsIn || '';
    const rawWkReset = (quota?.weeklyResetsIn && !quota.weeklyResetsIn.includes('%')) ? quota.weeklyResetsIn : '';

    const cd5h = raw5hReset ? calculateCountdown(raw5hReset) : '';
    const cdWk = rawWkReset ? calculateCountdown(rawWkReset) : '';

    // Format like "2:47 PM (in 2h 49m)" or "Sep 17 at 5:47 PM (in 3d 6h)"
    const resetsInDisplay = raw5hReset
      ? (cd5h ? `${raw5hReset} (in ${cd5h})` : raw5hReset)
      : '--';
    const weeklyResetsInDisplay = rawWkReset
      ? (cdWk ? `${rawWkReset} (in ${cdWk})` : rawWkReset)
      : '--';

    const refreshedTime = quota?.updatedAt ? formatElapsedTime() : 'just now';

    return {
      fiveHourUsage,
      resetsIn: resetsInDisplay,
      weeklyUsage,
      weeklyResetsIn: weeklyResetsInDisplay,
      refreshed: refreshedTime,
      timestamp: now
    };
  }

  function syncFromDOM() {
    const domData = extractFromDOM();
    if (isValidQuotaData(domData)) {
      applyQuotaData(domData);
    }
  }

  // Load stored official quota on mount & cleanup any old invalid data
  (async function init() {
    if (!isTopWindow) {
      initSubframeScanner();
      return;
    }

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('gsp_official_quota');
        if (data.gsp_official_quota) {
          const q = data.gsp_official_quota;
          if (isValidQuotaData(q)) {
            officialQuota = q;
            if (!q.weeklyResetsIn) {
              setTimeout(() => autoFetchUsage(true), 300);
            }
          } else {
            await chrome.storage.local.remove('gsp_official_quota');
          }
        }
      }
    } catch (e) {}

    // Check DOM immediately
    syncFromDOM();

    // Trigger automatic background fetch on startup
    setTimeout(() => autoFetchUsage(true), 500);

    // Refresh automatically every 3 minutes in the background
    setInterval(() => autoFetchUsage(false), 180000);

    // Detect when Gemini settings/usage dialog opens in the DOM
    try {
      let debounceTimer = null;
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1 && (node.getAttribute?.('role') === 'dialog' || node.querySelector?.('[role="dialog"]'))) {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(syncFromDOM, 200);
              return;
            }
          }
        }
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  })();

  window.GSP = window.GSP || {};
  window.GSP.getRealUsageData = getRealUsageData;
  window.GSP.autoFetchUsage = autoFetchUsage;
  window.GSP.extractLimitsFromText = extractLimitsFromText;
  window.GSP.isValidQuotaData = isValidQuotaData;
})();
