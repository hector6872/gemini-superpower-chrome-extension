/**
 * Toolbar Module for Gemini Superpowers
 * Injects the pill toolbar above the Gemini prompt input
 */
(function () {
  'use strict';

  let isPopoverOpen = false;

  function findInputContainer() {
    const selectors = [
      'input-area',
      '.input-area-container',
      '.chat-input-container',
      'rich-textarea',
      '.ql-container',
      'form.input-area',
      'div[contenteditable="true"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        // Find parent container suitable for placing a toolbar above it
        const container = el.closest('input-area, .input-area-container, .bottom-container, .chat-input-container') || el.parentElement;
        if (container) return container;
      }
    }
    return null;
  }

  async function updateUsagePopoverContent(popover) {
    if (!window.GSP?.getRealUsageData) return;
    const data = await window.GSP.getRealUsageData();

    popover.innerHTML = `
      <div class="gsp-usage-row">
        <span class="gsp-usage-label">5-hour usage</span>
        <span class="gsp-usage-value" id="gsp-5h-val">${data.fiveHourUsage}</span>
      </div>
      <div class="gsp-usage-row">
        <span class="gsp-usage-label">Resets in</span>
        <span class="gsp-usage-value" id="gsp-5h-reset">${data.resetsIn}</span>
      </div>
      <div class="gsp-usage-divider"></div>
      <div class="gsp-usage-row">
        <span class="gsp-usage-label">Weekly usage</span>
        <span class="gsp-usage-value" id="gsp-wk-val">${data.weeklyUsage}</span>
      </div>
      <div class="gsp-usage-row">
        <span class="gsp-usage-label">Weekly resets in</span>
        <span class="gsp-usage-value" id="gsp-wk-reset">${data.weeklyResetsIn}</span>
      </div>
      <div class="gsp-usage-footer">
        <span>Refreshed <span id="gsp-refreshed-time">${data.refreshed}</span></span>
        <button type="button" class="gsp-usage-refresh-btn" id="gsp-btn-refresh-usage">↻ Refresh</button>
      </div>
    `;

    // Also update pill badge text
    const badgeText = document.getElementById('gsp-usage-pill-text');
    if (badgeText) {
      badgeText.textContent = data.fiveHourUsage;
    }

    // Bind refresh button
    const refreshBtn = popover.querySelector('#gsp-btn-refresh-usage');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        refreshBtn.textContent = 'Refreshing...';
        setTimeout(async () => {
          await updateUsagePopoverContent(popover);
        }, 250);
      });
    }
  }

  function injectToolbar() {
    if (document.getElementById('gsp-toolbar-root')) return;

    const inputContainer = findInputContainer();
    if (!inputContainer) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'gsp-toolbar-root';
    toolbar.className = 'gsp-toolbar-container';

    toolbar.innerHTML = `
      <div class="gsp-toolbar-left">
        <button type="button" class="gsp-pill-btn gsp-btn-optimize" id="gsp-btn-optimize" title="Optimize prompt structure, role and constraints">
          <svg viewBox="0 0 24 24">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span>Optimize</span>
        </button>

        <div class="gsp-usage-wrapper">
          <button type="button" class="gsp-pill-btn" id="gsp-btn-usage" title="View 5-hour and weekly usage and reset timers">
            <svg viewBox="0 0 24 24">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            <span id="gsp-usage-pill-text">0%</span>
          </button>
          <div class="gsp-usage-popover" id="gsp-usage-popover">
            <!-- Dynamic popover content -->
          </div>
        </div>
      </div>

      <div class="gsp-toolbar-right">
        <div class="gsp-nav-group" title="Navigate messages">
          <button type="button" class="gsp-nav-btn" id="gsp-btn-nav-up" title="Previous message (Scroll Up)">
            <svg viewBox="0 0 24 24">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
            </svg>
          </button>
          <button type="button" class="gsp-nav-btn" id="gsp-btn-nav-down" title="Next message (Scroll Down)">
            <svg viewBox="0 0 24 24">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Insert directly before the prompt input
    inputContainer.parentNode.insertBefore(toolbar, inputContainer);

    // Event Listeners
    const optimizeBtn = toolbar.querySelector('#gsp-btn-optimize');
    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', () => {
        if (window.GSP?.optimizeCurrentPrompt) {
          window.GSP.optimizeCurrentPrompt();
        }
      });
    }

    const usageBtn = toolbar.querySelector('#gsp-btn-usage');
    const popover = toolbar.querySelector('#gsp-usage-popover');

    if (usageBtn && popover) {
      usageBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        isPopoverOpen = !isPopoverOpen;
        if (isPopoverOpen) {
          await updateUsagePopoverContent(popover);
          popover.classList.add('gsp-visible');
        } else {
          popover.classList.remove('gsp-visible');
        }
      });

      // Close popover when clicking outside
      document.addEventListener('click', (e) => {
        if (!toolbar.contains(e.target) && isPopoverOpen) {
          isPopoverOpen = false;
          popover.classList.remove('gsp-visible');
        }
      });
    }

    const navUpBtn = toolbar.querySelector('#gsp-btn-nav-up');
    if (navUpBtn) {
      navUpBtn.addEventListener('click', () => {
        if (window.GSP?.scrollUp) window.GSP.scrollUp();
      });
    }

    const navDownBtn = toolbar.querySelector('#gsp-btn-nav-down');
    if (navDownBtn) {
      navDownBtn.addEventListener('click', () => {
        if (window.GSP?.scrollDown) window.GSP.scrollDown();
      });
    }

    // Initial usage computation
    if (popover) {
      updateUsagePopoverContent(popover);
    }
  }

  function initToolbar() {
    setInterval(injectToolbar, 1200);
  }

  window.GSP = window.GSP || {};
  window.GSP.initToolbar = initToolbar;
})();
