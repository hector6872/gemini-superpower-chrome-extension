/**
 * Message Navigator Module for Gemini Superpowers
 * Allows jumping up/down between user query messages and scrolling directly to top
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
    const unique = [];
    const seen = new Set();

    for (const el of elements) {
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

  function scrollToTop() {
    const scrollContainer = findScrollContainer();
    if (scrollContainer && scrollContainer !== document.documentElement && scrollContainer !== document.body) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const messages = getUserMessages();
    if (messages.length > 0) {
      flashHighlight(messages[0]);
    }
  }

  function scrollUp() {
    const messages = getUserMessages();
    const scrollContainer = findScrollContainer();

    if (!messages.length) {
      if (scrollContainer) scrollContainer.scrollBy({ top: -350, behavior: 'smooth' });
      else window.scrollBy({ top: -350, behavior: 'smooth' });
      return;
    }

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
      scrollToTop();
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

  function updateScrollState() {
    const topBtn = document.getElementById('gsp-btn-nav-top');
    const upBtn = document.getElementById('gsp-btn-nav-up');
    const downBtn = document.getElementById('gsp-btn-nav-down');
    
    if (!upBtn && !downBtn && !topBtn) return;

    const messages = getUserMessages();
    const container = findScrollContainer();
    
    const isWindow = !container || container === document.documentElement || container === document.body;
    const scrollTop = isWindow
      ? (window.scrollY || document.documentElement.scrollTop || 0)
      : container.scrollTop;
    const scrollHeight = isWindow
      ? document.documentElement.scrollHeight
      : container.scrollHeight;
    const clientHeight = isWindow
      ? window.innerHeight
      : container.clientHeight;

    const isAtTop = scrollTop <= 30;
    const isAtBottom = (scrollTop + clientHeight) >= (scrollHeight - 40);

    // Can we scroll up?
    const topThreshold = 70;
    let hasMessageAbove = false;
    for (let i = messages.length - 1; i >= 0; i--) {
      const rect = messages[i].getBoundingClientRect();
      if (rect.top < topThreshold - 10) {
        hasMessageAbove = true;
        break;
      }
    }
    const canScrollUp = messages.length > 0 && (hasMessageAbove || !isAtTop);

    // Can we scroll down?
    const bottomThreshold = 85;
    let hasMessageBelow = false;
    for (let i = 0; i < messages.length; i++) {
      const rect = messages[i].getBoundingClientRect();
      if (rect.top > bottomThreshold + 15) {
        hasMessageBelow = true;
        break;
      }
    }
    const canScrollDown = messages.length > 0 && (hasMessageBelow || !isAtBottom);

    if (upBtn) {
      upBtn.disabled = !canScrollUp;
      upBtn.classList.toggle('gsp-nav-disabled', !canScrollUp);
    }
    if (downBtn) {
      downBtn.disabled = !canScrollDown;
      downBtn.classList.toggle('gsp-nav-disabled', !canScrollDown);
    }
    if (topBtn) {
      topBtn.disabled = isAtTop;
      if (!isAtTop && scrollTop > 80) {
        topBtn.classList.add('gsp-nav-top-visible');
      } else {
        topBtn.classList.remove('gsp-nav-top-visible');
      }
    }
  }

  function initNavigator() {
    window.addEventListener('scroll', updateScrollState, { passive: true });
    setInterval(() => {
      const container = findScrollContainer();
      if (container && container !== document.documentElement && container !== document.body && !container.__gsp_nav_scroll_bound) {
        container.__gsp_nav_scroll_bound = true;
        container.addEventListener('scroll', updateScrollState, { passive: true });
      }
      updateScrollState();
    }, 1000);
  }

  initNavigator();

  window.GSP = window.GSP || {};
  window.GSP.findScrollContainer = findScrollContainer;
  window.GSP.scrollToTop = scrollToTop;
  window.GSP.scrollUp = scrollUp;
  window.GSP.scrollDown = scrollDown;
  window.GSP.updateScrollState = updateScrollState;
})();
