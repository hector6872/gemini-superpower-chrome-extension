/**
 * Auto-Focus Module for Gemini Superpowers
 * Keeps the Gemini chat prompt input focused and ready for typing
 */
(function () {
  'use strict';

  function getGeminiInput() {
    const selectors = [
      'rich-textarea .ql-editor',
      'rich-textarea div[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]',
      'textarea.text-input',
      'textarea[aria-label]',
      'textarea'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) { // visible
        return el;
      }
    }
    return null;
  }

  function focusGeminiInput() {
    const input = getGeminiInput();
    if (!input) return false;

    // Check if an active modal or popup is open
    if (document.querySelector('.gsp-modal-backdrop, .gsp-prompt-menu')) {
      return false;
    }

    input.focus();

    // Place caret at the end
    if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(input);
      range.collapse(false); // false = collapse to end
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (typeof input.setSelectionRange === 'function') {
      const len = input.value?.length || 0;
      input.setSelectionRange(len, len);
    }

    return true;
  }

  function initAutoFocus() {
    // Focus on initial load
    setTimeout(focusGeminiInput, 500);
    setTimeout(focusGeminiInput, 1500);

    // Focus when user returns to window / tab
    window.addEventListener('focus', () => {
      setTimeout(focusGeminiInput, 100);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(focusGeminiInput, 150);
      }
    });

    // Global keyboard shortcuts: "/" or Cmd/Ctrl+K or Escape
    window.addEventListener('keydown', (e) => {
      const target = e.target;
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute?.('contenteditable') === 'true'
      );

      // Cmd+K / Ctrl+K always focuses prompt input
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusGeminiInput();
        return;
      }

      // If user presses "/" outside of any input, focus prompt
      if (!isInput && e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        focusGeminiInput();
      }
    }, true);
  }

  window.GSP = window.GSP || {};
  window.GSP.getGeminiInput = getGeminiInput;
  window.GSP.focusGeminiInput = focusGeminiInput;
  window.GSP.initAutoFocus = initAutoFocus;
})();
