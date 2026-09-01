/**
 * Toolbar Module for Gemini Superpowers
 * Injects the pill toolbar OUTSIDE and directly ABOVE the Gemini input card,
 * perfectly matching the card's width and alignment.
 */
(function () {
  'use strict';

  let isPopoverOpen = false;
  let resizeObserver = null;

  function findOutermostInputCard() {
    const inputEl = document.querySelector('rich-textarea') ||
                    document.querySelector('div[contenteditable="true"]') ||
                    document.querySelector('textarea.text-input') ||
                    document.querySelector('textarea');
    if (!inputEl) return null;

    const form = inputEl.closest('form');
    if (form && form.parentElement) {
      return form;
    }

    const inputArea = inputEl.closest('.input-area-container, .chat-input-container, input-area, .input-area-v2, [class*="input-box"]');
    if (inputArea && inputArea.parentElement) {
      return inputArea;
    }

    let current = inputEl;
    while (current && current.parentElement) {
      const parent = current.parentElement;
      const tag = parent.tagName.toLowerCase();
      if (tag === 'main' || tag === 'body' || parent.classList.contains('bottom-container') || parent.classList.contains('chat-window')) {
        return current;
      }
      current = parent;
    }

    return inputEl.parentElement || inputEl;
  }

  function syncToolbarWidth(toolbar, inputCard) {
    if (!toolbar || !inputCard) return;
    const rect = inputCard.getBoundingClientRect();
    if (rect.width > 0) {
      toolbar.style.width = `${rect.width}px`;
      toolbar.style.maxWidth = `${rect.width}px`;
      toolbar.style.marginLeft = 'auto';
      toolbar.style.marginRight = 'auto';
    }
  }

  async function updateUsagePopoverContent(popoverElement) {
    const popover = popoverElement || document.getElementById('gsp-usage-popover');
    if (!popover) return;
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
        <span class="gsp-usage-status-dot"></span>
        <span id="gsp-refreshed-time">${data.refreshed}</span>
      </div>
    `;

    // Also update pill badge text
    const badgeText = document.getElementById('gsp-usage-pill-text');
    if (badgeText) {
      badgeText.textContent = data.fiveHourUsage;
    }
  }

  function injectToolbar() {
    const inputCard = findOutermostInputCard();
    if (!inputCard || !inputCard.parentNode) return;

    let toolbar = document.getElementById('gsp-toolbar-root');

    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'gsp-toolbar-root';
      toolbar.className = 'gsp-toolbar-container';

      toolbar.innerHTML = `
        <div class="gsp-toolbar-left">
          <button type="button" class="gsp-pill-btn gsp-btn-prompts" id="gsp-btn-prompts" title="Quick Prompts (//) list and editor">
            <svg viewBox="0 0 24 24">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            <span>// Prompts</span>
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

      // Insert OUTSIDE and directly BEFORE the outermost input card
      inputCard.parentNode.insertBefore(toolbar, inputCard);

      // Event Listeners
      const promptsBtn = toolbar.querySelector('#gsp-btn-prompts');
      if (promptsBtn) {
        promptsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.GSP?.togglePromptMenu) {
            window.GSP.togglePromptMenu();
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

      if (popover) {
        updateUsagePopoverContent(popover);
      }
    } else if (toolbar.nextElementSibling !== inputCard) {
      inputCard.parentNode.insertBefore(toolbar, inputCard);
    }

    syncToolbarWidth(toolbar, inputCard);

    if (window.ResizeObserver && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        const currentToolbar = document.getElementById('gsp-toolbar-root');
        const currentInputCard = findOutermostInputCard();
        if (currentToolbar && currentInputCard) {
          syncToolbarWidth(currentToolbar, currentInputCard);
        }
      });
      resizeObserver.observe(inputCard);
    }
  }

  function initToolbar() {
    setInterval(injectToolbar, 1000);
    window.addEventListener('resize', () => {
      const toolbar = document.getElementById('gsp-toolbar-root');
      const inputCard = findOutermostInputCard();
      if (toolbar && inputCard) {
        syncToolbarWidth(toolbar, inputCard);
      }
    });
  }

  window.GSP = window.GSP || {};
  window.GSP.initToolbar = initToolbar;
  window.GSP.syncToolbarWidth = syncToolbarWidth;
  window.GSP.updateUsagePopoverContent = updateUsagePopoverContent;
})();
