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

  function setWideMode(enable) {
    isWideMode = enable;
    if (isWideMode) {
      document.body.classList.add('gsp-wide-mode');
      document.documentElement.classList.add('gsp-wide-mode');
    } else {
      document.body.classList.remove('gsp-wide-mode');
      document.documentElement.classList.remove('gsp-wide-mode');
    }

    const btn = document.getElementById('gsp-btn-wide-mode');
    if (btn) {
      btn.innerHTML = isWideMode ? COLLAPSE_ICON : EXPAND_ICON;
      btn.title = isWideMode ? 'Exit Wide Mode (Full Width)' : 'Enter Wide Mode (Full Width)';
      btn.setAttribute('aria-pressed', isWideMode ? 'true' : 'false');
      btn.classList.toggle('gsp-header-btn-active', isWideMode);
    }

    // Persist preference
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ gsp_wide_mode: isWideMode });
      }
    } catch (e) {
      console.debug('Error saving wide mode preference:', e);
    }

    // Trigger window resize event so toolbar & layout immediately recalculate width
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 250);
  }

  function toggleWideMode() {
    setWideMode(!isWideMode);
    if (window.GSP?.showToast) {
      window.GSP.showToast(isWideMode ? 'Wide mode enabled' : 'Standard view restored');
    }
  }

  function findOverflowButton() {
    const candidates = Array.from(document.querySelectorAll('header button, [role="banner"] button, #gb button, top-bar button, .top-bar button, button[aria-haspopup="menu"]'));
    
    // Look specifically for 3-dots / more / settings / options buttons in top header
    return candidates.find(b => {
      const rect = b.getBoundingClientRect();
      if (rect.top > 80 || rect.right < window.innerWidth - 250) return false;
      const text = (b.getAttribute('aria-label') || b.title || b.className || '').toLowerCase();
      return text.includes('more') || text.includes('overflow') || text.includes('opciones') || text.includes('options') || text.includes('settings') || text.includes('ajustes');
    });
  }

  function updateButtonPosition(btn) {
    const overflowBtn = findOverflowButton();
    if (overflowBtn && overflowBtn.offsetParent !== null) {
      const rect = overflowBtn.getBoundingClientRect();
      const rightDistance = window.innerWidth - rect.left + 6;
      const topPos = Math.max(8, rect.top + (rect.height - 36) / 2);
      btn.style.right = `${rightDistance}px`;
      btn.style.top = `${topPos}px`;
    } else {
      btn.style.right = '56px';
      btn.style.top = '12px';
    }
  }

  function injectWideModeButton() {
    let btn = document.getElementById('gsp-btn-wide-mode');

    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'gsp-btn-wide-mode';
      btn.className = 'gsp-header-btn';
      btn.type = 'button';
      btn.title = isWideMode ? 'Exit Wide Mode (Full Width)' : 'Enter Wide Mode (Full Width)';
      btn.setAttribute('aria-label', 'Toggle Wide Mode');
      btn.setAttribute('aria-pressed', isWideMode ? 'true' : 'false');
      btn.innerHTML = isWideMode ? COLLAPSE_ICON : EXPAND_ICON;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleWideMode();
      });

      document.body.appendChild(btn);
    }

    updateButtonPosition(btn);
  }

  async function initWideMode() {
    injectWideModeButton();

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

    setInterval(injectWideModeButton, 1000);
    window.addEventListener('resize', () => {
      const btn = document.getElementById('gsp-btn-wide-mode');
      if (btn) updateButtonPosition(btn);
    });
  }

  window.GSP = window.GSP || {};
  window.GSP.initWideMode = initWideMode;
  window.GSP.setWideMode = setWideMode;
  window.GSP.toggleWideMode = toggleWideMode;
})();
