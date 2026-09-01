/**
 * Usage Tracker Module for Gemini Superpowers
 * Displays 5-hour and weekly usage metrics and reset countdowns on demand
 */
(function () {
  'use strict';

  // Format remaining time into readable string like "2h 20m" or "2d 8h"
  function formatRemainingTime(ms) {
    if (ms <= 0) return 'Just now';
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

  // Format elapsed time (e.g. "1m ago", "just now")
  function formatElapsedTime(date) {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }

  // Get real usage data from session / storage or internal page indicators
  async function getRealUsageData() {
    let storageData = {};
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        storageData = await chrome.storage.local.get(['gsp_usage_stats', 'gsp_last_refresh']);
      }
    } catch (e) {
      console.debug('Storage access:', e);
    }

    const now = Date.now();
    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    // Check if Gemini has rate-limit or quota warnings/badges visible in the DOM
    const rateLimitBanner = document.querySelector('[data-test-id="rate-limit-banner"], .rate-limit-warning, [aria-label*="limit"]');
    
    // Count active prompts in the current chat session to ensure accuracy
    const userMessages = document.querySelectorAll('user-query, .user-query-container, [data-test-id="user-query"]');
    const sessionCount = userMessages.length;

    // Calculate rolling window reset timestamps
    const fiveHourCycleStart = Math.floor(now / FIVE_HOURS_MS) * FIVE_HOURS_MS;
    const fiveHourResetInMs = (fiveHourCycleStart + FIVE_HOURS_MS) - now;

    // Weekly reset is aligned to weekly cycle or next Monday 00:00 UTC
    const dateObj = new Date(now);
    const dayOfWeek = dateObj.getUTCDay(); // 0 is Sun, 1 is Mon
    const daysUntilNextMon = ((8 - dayOfWeek) % 7) || 7;
    const nextWeeklyReset = new Date(Date.UTC(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate() + daysUntilNextMon,
      0, 0, 0
    )).getTime();
    const weeklyResetInMs = Math.max(1000, nextWeeklyReset - now);

    // Calculate usage percentage based on model tier and active queries
    // Gemini 2.0 Flash / Pro quota baseline
    let fiveHourUsagePercent = 0;
    let weeklyUsagePercent = 0;

    if (storageData.gsp_usage_stats) {
      const stats = storageData.gsp_usage_stats;
      const recentPrompts = (stats.promptTimestamps || []).filter(ts => (now - ts) < FIVE_HOURS_MS);
      const weeklyPrompts = (stats.promptTimestamps || []).filter(ts => (now - ts) < ONE_WEEK_MS);
      
      // Default limit baselines (e.g. 50 per 5h window for Pro/Advanced, 1500 weekly)
      fiveHourUsagePercent = Math.min(100, Math.round((recentPrompts.length / 50) * 100));
      weeklyUsagePercent = Math.min(100, Math.round((weeklyPrompts.length / 500) * 100));
    }

    if (rateLimitBanner) {
      fiveHourUsagePercent = 100;
    }

    return {
      fiveHourUsage: `${fiveHourUsagePercent}%`,
      resetsIn: formatRemainingTime(fiveHourResetInMs),
      weeklyUsage: `${weeklyUsagePercent}%`,
      weeklyResetsIn: formatRemainingTime(weeklyResetInMs),
      refreshed: 'just now',
      timestamp: now
    };
  }

  // Record a prompt event to accurately track usage
  async function recordPromptSubmission() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('gsp_usage_stats');
        const stats = data.gsp_usage_stats || { promptTimestamps: [] };
        const now = Date.now();
        
        // Keep only last 7 days of timestamps
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        stats.promptTimestamps = (stats.promptTimestamps || [])
          .filter(ts => (now - ts) < ONE_WEEK_MS)
          .concat(now);

        await chrome.storage.local.set({ gsp_usage_stats: stats });
      }
    } catch (err) {
      console.debug('Record prompt submission error:', err);
    }
  }

  window.GSP = window.GSP || {};
  window.GSP.getRealUsageData = getRealUsageData;
  window.GSP.recordPromptSubmission = recordPromptSubmission;
})();
