/**
 * Message Navigator Module for Gemini Superpowers
 * Allows jumping up/down exclusively between user query messages with smooth scroll
 */
(function () {
  'use strict';

  function findScrollContainer() {
    const selectors = [
      'infinite-scroller',
      '.chat-history',
      '.conversation-container',
      '.chat-window',
      'main',
      '[class*="scroller"]',
      '[class*="scrollable"]',
      'mat-sidenav-content'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.scrollHeight > el.clientHeight && el.clientHeight > 200) {
        return el;
      }
    }

    // Search for overflow scroll ancestor of any user query
    const sampleMsg = document.querySelector('user-query, [class*="user-query"], [data-test-id="user-query"]');
    if (sampleMsg) {
      let cur = sampleMsg.parentElement;
      while (cur && cur !== document.body) {
        const style = window.getComputedStyle(cur);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          if (cur.scrollHeight > cur.clientHeight) {
            return cur;
          }
        }
        cur = cur.parentElement;
      }
    }

    return document.documentElement || document.body;
  }

  function getUserMessages() {
    const selectors = [
      'user-query',
      '.user-query-container',
      '[data-test-id="user-query"]',
      '.user-query',
      '[class*="user-query"]',
      '[class*="query-container"]',
      '.query-content'
    ];

    const elements = Array.from(document.querySelectorAll(selectors.join(', ')));
    
    // Deduplicate top-level user message containers
    const unique = [];
    const seen = new Set();

    for (const el of elements) {
      // Exclude model response containers
      if (el.closest('model-response, [data-test-id="model-response"], .model-response-container')) {
        continue;
      }

      const container = el.closest('user-query, .user-query-container, [data-test-id="user-query"]') || el;
      if (!seen.has(container) && container.offsetHeight > 10 && container.offsetParent !== null) {
        seen.add(container);
        unique.push(container);
      }
    }

    return unique.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top;
    });
  }

  function scrollToMessage(target, scrollContainer) {
    if (!target) return;

    if (scrollContainer && scrollContainer !== document.documentElement && scrollContainer !== document.body) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetScrollTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 75;
      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    flashHighlight(target);
  }

  function scrollUp() {
    const messages = getUserMessages();
    const scrollContainer = findScrollContainer();

    if (!messages.length) {
      if (scrollContainer) scrollContainer.scrollBy({ top: -350, behavior: 'smooth' });
      else window.scrollBy({ top: -350, behavior: 'smooth' });
      return;
    }

    // Find the last message that is above the current view threshold
    const topThreshold = 70;
    let target = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      const rect = messages[i].getBoundingClientRect();
      if (rect.top < topThreshold - 10) {
        target = messages[i];
        break;
      }
    }

    if (target) {
      scrollToMessage(target, scrollContainer);
    } else {
      // If already at or above first message, scroll to very top
      if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
      if (messages[0]) flashHighlight(messages[0]);
    }
  }

  function scrollDown() {
    const messages = getUserMessages();
    const scrollContainer = findScrollContainer();

    if (!messages.length) {
      if (scrollContainer) scrollContainer.scrollBy({ top: 350, behavior: 'smooth' });
      else window.scrollBy({ top: 350, behavior: 'smooth' });
      return;
    }

    // Find the first message that is strictly below the current view threshold
    const topThreshold = 85;
    let target = null;

    for (let i = 0; i < messages.length; i++) {
      const rect = messages[i].getBoundingClientRect();
      if (rect.top > topThreshold + 15) {
        target = messages[i];
        break;
      }
    }

    if (target) {
      scrollToMessage(target, scrollContainer);
    } else {
      // If at or past the last message, scroll to the bottom of the chat
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
      if (messages[messages.length - 1]) flashHighlight(messages[messages.length - 1]);
    }
  }

  function flashHighlight(element) {
    const originalTransition = element.style.transition;
    const originalOutline = element.style.outline;

    element.style.transition = 'outline 0.2s ease';
    element.style.outline = '2px solid rgba(26, 115, 232, 0.4)';
    element.style.borderRadius = '8px';

    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.transition = originalTransition;
    }, 800);
  }

  window.GSP = window.GSP || {};
  window.GSP.scrollUp = scrollUp;
  window.GSP.scrollDown = scrollDown;
})();
