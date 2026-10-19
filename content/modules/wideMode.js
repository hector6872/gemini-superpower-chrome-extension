/**
 * Wide Mode (Full Width) Module for Gemini Superpowers
 * Adds a toggle switch/button in the top-right header right next to the overflow menu
 */
(function () {
  'use strict';

  let isWideMode = false;

  const EXPAND_ICON = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
  `;

  const COLLAPSE_ICON = `
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
    </svg>
  `;

  function isDesktop() {
    return window.innerWidth > 768;
  }

  function setWideMode(enable) {
    isWideMode = enable;
    if (isWideMode && isDesktop()) {
      document.body.classList.add('gsp-wide-mode');
      document.documentElement.classList.add('gsp-wide-mode');
    } else {
      document.body.classList.remove('gsp-wide-mode');
      document.documentElement.classList.remove('gsp-wide-mode');
    }

    updateWideButtonState();

    // Persist preference
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ gsp_wide_mode: isWideMode });
      }
    } catch (e) {
      console.debug('Error saving wide mode preference:', e);
    }

    // Sync toolbar width directly without firing global window resize events
    const toolbar = document.getElementById('gsp-toolbar-root');
    const inputCard = document.querySelector('rich-textarea, div[contenteditable="true"], textarea')?.closest('form, .input-area-container, [class*="input-box"]');
    if (toolbar && inputCard && window.GSP?.syncToolbarWidth) {
      window.GSP.syncToolbarWidth(toolbar, inputCard);
    }
  }

  function toggleWideMode() {
    setWideMode(!isWideMode);
  }

  function updateWideButtonState() {
    const btn = document.getElementById('gsp-btn-wide-mode');
    if (btn) {
      btn.innerHTML = isWideMode ? COLLAPSE_ICON : EXPAND_ICON;
      const t = window.GSP?.t || ((k) => k);
      btn.title = t('wide_mode_title');
      btn.setAttribute('aria-pressed', isWideMode ? 'true' : 'false');
      btn.classList.toggle('gsp-pill-active', isWideMode);
      btn.classList.toggle('gsp-wide-active', isWideMode);
    }
  }

  async function initWideMode() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('gsp_wide_mode');
        if (data && data.gsp_wide_mode === true) {
          setWideMode(true);
        }
      }
    } catch (e) {
      console.debug('Error loading wide mode:', e);
    }

    updateWideButtonState();
    setInterval(updateWideButtonState, 1000);

    window.addEventListener('resize', () => {
      setWideMode(isWideMode);
    });
  }

  window.GSP = window.GSP || {};
  window.GSP.initWideMode = initWideMode;
  window.GSP.setWideMode = setWideMode;
  window.GSP.toggleWideMode = toggleWideMode;
  window.GSP.isWideMode = () => isWideMode;
  window.GSP.getWideMode = () => isWideMode;
  window.GSP.updateWideButtonState = updateWideButtonState;
})();
