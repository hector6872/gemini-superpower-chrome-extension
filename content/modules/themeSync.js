/**
 * Theme Synchronization Module for Gemini Superpowers
 * Ensures extension UI elements strictly follow Google Gemini's active theme setting,
 * rather than conflicting with the browser / OS system theme.
 */
(function () {
  'use strict';

  let currentTheme = null;
  let observer = null;

  function parseRgb(colorStr) {
    if (!colorStr) return null;
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  }

  function getElementBgColor(el) {
    if (!el) return null;
    try {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
        return null;
      }
      return bg;
    } catch (e) {
      return null;
    }
  }

  function detectGeminiTheme() {
    const html = document.documentElement;
    const body = document.body;

    // 1. Check explicit dark classes or data attributes
    const isExplicitDark =
      body?.classList.contains('dark-theme') ||
      html?.classList.contains('dark-theme') ||
      body?.classList.contains('theme-dark') ||
      html?.classList.contains('theme-dark') ||
      body?.classList.contains('dark') ||
      html?.classList.contains('dark') ||
      body?.getAttribute('data-theme') === 'dark' ||
      html?.getAttribute('data-theme') === 'dark' ||
      body?.getAttribute('data-color-mode') === 'dark' ||
      html?.getAttribute('data-color-mode') === 'dark';

    // 2. Check explicit light classes or data attributes
    const isExplicitLight =
      body?.classList.contains('light-theme') ||
      html?.classList.contains('light-theme') ||
      body?.classList.contains('theme-light') ||
      html?.classList.contains('theme-light') ||
      body?.classList.contains('light') ||
      html?.classList.contains('light') ||
      body?.getAttribute('data-theme') === 'light' ||
      html?.getAttribute('data-theme') === 'light' ||
      body?.getAttribute('data-color-mode') === 'light' ||
      html?.getAttribute('data-color-mode') === 'light';

    if (isExplicitDark && !isExplicitLight) return 'dark';
    if (isExplicitLight && !isExplicitDark) return 'light';

    // 3. Inspect computed background colors of key elements
    const candidates = [
      body,
      html,
      document.querySelector('main'),
      document.querySelector('.chat-history'),
      document.querySelector('chat-app'),
      document.querySelector('.main-container'),
      document.querySelector('body > div')
    ];

    for (const el of candidates) {
      const bg = getElementBgColor(el);
      if (bg) {
        const rgb = parseRgb(bg);
        if (rgb) {
          // Standard perceived luminance formula (ITU-R BT.601)
          const luminance = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
          return luminance < 128 ? 'dark' : 'light';
        }
      }
    }

    // 4. Fallback: If body has dark-theme, use dark; otherwise light
    if (body?.classList.contains('dark-theme')) {
      return 'dark';
    }

    return 'light';
  }

  function applyTheme(theme) {
    if (currentTheme === theme) return;
    currentTheme = theme;

    const html = document.documentElement;
    const body = document.body;

    if (html) {
      html.setAttribute('data-gsp-theme', theme);
      html.classList.toggle('gsp-theme-dark', theme === 'dark');
      html.classList.toggle('gsp-theme-light', theme === 'light');
    }

    if (body) {
      body.setAttribute('data-gsp-theme', theme);
      body.classList.toggle('gsp-theme-dark', theme === 'dark');
      body.classList.toggle('gsp-theme-light', theme === 'light');
    }
  }

  function syncTheme() {
    const theme = detectGeminiTheme();
    applyTheme(theme);
  }

  function initThemeSync() {
    syncTheme();

    if (!observer && (window.MutationObserver || window.WebKitMutationObserver)) {
      const ObserverClass = window.MutationObserver || window.WebKitMutationObserver;
      observer = new ObserverClass(() => {
        syncTheme();
      });

      if (document.documentElement) {
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'style', 'data-theme', 'data-color-mode']
        });
      }

      if (document.body) {
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['class', 'style', 'data-theme', 'data-color-mode']
        });
      }
    }

    // Re-check when system preference changes (for "Use system theme" Gemini mode)
    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      if (mql && mql.addEventListener) {
        mql.addEventListener('change', () => {
          setTimeout(syncTheme, 50);
        });
      }
    } catch (e) {}
  }

  // Execute immediately if DOM is already parsed, otherwise on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeSync);
  } else {
    initThemeSync();
  }

  window.GSP = window.GSP || {};
  window.GSP.initThemeSync = initThemeSync;
  window.GSP.getGeminiTheme = () => currentTheme || detectGeminiTheme();
})();
