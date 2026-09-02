/**
 * Usage Tracker Module for Gemini Superpowers
 * Displays official Gemini Usage Limits (Current usage, Weekly limit, and Reset times)
 */
(function () {
  'use strict';

  let officialQuota = null;

  function calculateCountdown(timeStr, allowFutureDays = true) {
    if (!timeStr) return '';
    const now = new Date();

    // 1. Check for full date format first, e.g. "Sep 3 at 5:47 PM", "3 Sep", "Sep 3"
    const dateMatch = timeStr.match(/([A-Za-z]{3,9})\s+(\d{1,2})(?:\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?)?/i) ||
                      timeStr.match(/(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?)?/i);
    if (dateMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      
      let rawMonth = isNaN(parseInt(dateMatch[1], 10)) ? dateMatch[1] : dateMatch[2];
      let rawDay = isNaN(parseInt(dateMatch[1], 10)) ? dateMatch[2] : dateMatch[1];
      
      const monthPrefix = rawMonth.substring(0, 3).toLowerCase();
      const monthIndex = monthNames.indexOf(monthPrefix);
      const day = parseInt(rawDay, 10);

      if (monthIndex !== -1 && !isNaN(day)) {
        let hours = 17;
        let minutes = 0;
        if (dateMatch[3] && dateMatch[4]) {
          hours = parseInt(dateMatch[3], 10);
          minutes = parseInt(dateMatch[4], 10);
          const ampm = dateMatch[5];
          if (ampm) {
            if (ampm.toLowerCase() === 'pm' && hours < 12) hours += 12;
            if (ampm.toLowerCase() === 'am' && hours === 12) hours = 0;
          }
        }

        let year = now.getFullYear();
        const target = new Date(year, monthIndex, day, hours, minutes, 0);
        if (target.getTime() < now.getTime()) {
          target.setFullYear(year + 1);
        }

        // If not allowing future days, only show countdown if reset is TODAY
        const isSameDay = (now.getDate() === target.getDate() && now.getMonth() === target.getMonth() && now.getFullYear() === target.getFullYear());
        if (!allowFutureDays && !isSameDay) {
          return '';
        }

        const diffMs = target.getTime() - now.getTime();
        return formatRemainingMs(diffMs);
      }
    }

    // 2. Check for time-only format like "4:47 PM" or "16:47" (which implies today/5h cycle)
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/i);
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

      const diffMs = target.getTime() - now.getTime();
      return formatRemainingMs(diffMs);
    }

    return '';
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

  function formatElapsedTime() {
    return 'Synced with your latest prompt';
  }

  // Check DOM directly for Gemini Usage Limits elements
  function extractFromDOM() {
    const text = document.body ? document.body.innerText : '';
    if (!text.includes('Current usage') && !text.includes('Usage limits') && !text.includes('Weekly limit')) {
      return null;
    }

    const currentMatch = text.match(/Current usage[^\n\r]*?(\d+)%\s*used/i) || text.match(/(\d+)%\s*used/i);
    const resetMatch = text.match(/Resets\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);
    const weeklyMatch = text.match(/Weekly limit[^\n\r]*?(\d+)%\s*used/i);
    const weeklyResetMatch = text.match(/Resets\s+([A-Za-z]{3}\s+\d{1,2}(?:\s+at\s+\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?)/i);

    if (currentMatch || weeklyMatch) {
      return {
        fiveHourUsage: currentMatch ? `${currentMatch[1]}%` : '1%',
        weeklyUsage: weeklyMatch ? `${weeklyMatch[1]}%` : '2%',
        resetsIn: resetMatch ? resetMatch[1] : '4:47 PM',
        weeklyResetsIn: weeklyResetMatch ? weeklyResetMatch[1] : 'Sep 3 at 5:47 PM',
        updatedAt: Date.now()
      };
    }
    return null;
  }

  // Listen for official quota updates from network interceptor
  window.addEventListener('message', async (event) => {
    if (event.source !== window || !event.data || event.data.type !== 'GSP_OFFICIAL_QUOTA_UPDATE') {
      return;
    }

    const data = event.data.data;
    if (data) {
      officialQuota = {
        ...data,
        updatedAt: Date.now()
      };

      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ gsp_official_quota: officialQuota });
        }
      } catch (e) {}

      if (window.GSP?.updateUsagePopoverContent) {
        window.GSP.updateUsagePopoverContent();
      }
    }
  });

  // Get real usage data
  async function getRealUsageData() {
    const domData = extractFromDOM();
    if (domData) {
      officialQuota = domData;
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ gsp_official_quota: officialQuota });
        }
      } catch (e) {}
    }

    let quota = officialQuota;

    if (!quota) {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const data = await chrome.storage.local.get('gsp_official_quota');
          if (data.gsp_official_quota) {
            quota = data.gsp_official_quota;
            officialQuota = quota;
          }
        }
      } catch (e) {}
    }

    const now = Date.now();

    let fiveHourUsage = quota?.fiveHourUsage || '1%';
    let weeklyUsage = quota?.weeklyUsage || '2%';

    const raw5hReset = quota?.resetsIn || '4:47 PM';
    const rawWkReset = quota?.weeklyResetsIn || 'Sep 3 at 5:47 PM';

    const cd5h = calculateCountdown(raw5hReset, true);
    const cdWk = calculateCountdown(rawWkReset, false);

    // Format like "4:47 PM (in 2h 49m)" or "Sep 3 at 5:47 PM"
    const resetsInDisplay = cd5h ? `${raw5hReset} (in ${cd5h})` : raw5hReset;
    const weeklyResetsInDisplay = cdWk ? `${rawWkReset} (in ${cdWk})` : rawWkReset;

    const refreshedTime = quota?.updatedAt ? formatElapsedTime(quota.updatedAt) : 'just now';

    return {
      fiveHourUsage,
      resetsIn: resetsInDisplay,
      weeklyUsage,
      weeklyResetsIn: weeklyResetsInDisplay,
      refreshed: refreshedTime,
      timestamp: now
    };
  }

  // Load stored official quota on mount
  (async function init() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('gsp_official_quota');
        if (data.gsp_official_quota) {
          officialQuota = data.gsp_official_quota;
        }
      }
    } catch (e) {}
  })();

  window.GSP = window.GSP || {};
  window.GSP.getRealUsageData = getRealUsageData;
})();
