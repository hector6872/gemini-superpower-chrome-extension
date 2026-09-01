/**
 * Message Navigator Module for Gemini Superpowers
 * Allows jumping to previous / next messages in the chat without manual scrolling
 */
(function () {
  'use strict';

  function getAllMessages() {
    const selectors = [
      'user-query',
      'model-response',
      '.user-query-container',
      '.model-response-container',
      '[data-test-id="user-query"]',
      '[data-test-id="model-response"]',
      '.conversation-turn'
    ];

    const elements = Array.from(document.querySelectorAll(selectors.join(', ')));
    
    // Deduplicate and filter visible elements sorted by vertical position
    const unique = [];
    const seen = new Set();

    for (const el of elements) {
      // Find top-level message container if nested
      const container = el.closest('user-query, model-response, .conversation-turn') || el;
      if (!seen.has(container) && container.offsetParent !== null) {
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

  function scrollUp() {
    const messages = getAllMessages();
    if (!messages.length) return;

    // Find the message just above the current viewport center
    const viewportTop = 120; // accounting for headers
    let target = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      const rect = messages[i].getBoundingClientRect();
      if (rect.top < viewportTop - 20) {
        target = messages[i];
        break;
      }
    }

    // If already at the top or not found, jump to the first message
    if (!target && messages.length > 0) {
      target = messages[0];
    }

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flashHighlight(target);
    }
  }

  function scrollDown() {
    const messages = getAllMessages();
    if (!messages.length) return;

    const viewportTop = 150;
    let target = null;

    for (let i = 0; i < messages.length; i++) {
      const rect = messages[i].getBoundingClientRect();
      if (rect.top > viewportTop + 20) {
        target = messages[i];
        break;
      }
    }

    // If at bottom or none below, scroll to the bottom of the page
    if (!target && messages.length > 0) {
      target = messages[messages.length - 1];
    }

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flashHighlight(target);
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
