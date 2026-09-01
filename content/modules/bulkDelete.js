/**
 * Bulk Delete Module for Gemini Superpowers
 * Allows deleting all recent conversations in bulk with safety confirmation
 */
(function () {
  'use strict';

  let isDeleting = false;
  let shouldCancel = false;

  function findSidebarRecentContainer() {
    const selectors = [
      'nav .recent-conversations',
      'nav .conversations-list',
      'mat-nav-list',
      '.conversation-list',
      '[data-test-id="recent-conversations-list"]',
      'side-nav',
      'nav'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getConversationItems() {
    const itemSelectors = [
      'nav mat-list-item',
      'nav a[role="listitem"]',
      'nav .conversation-item',
      'nav [data-test-id="conversation-item"]',
      'nav .conversation-row'
    ];

    const list = Array.from(document.querySelectorAll(itemSelectors.join(', ')));
    // Filter out items that are not conversations (like "Help", "Settings", etc.)
    return list.filter(item => {
      const text = item.textContent?.trim() || '';
      const href = item.getAttribute('href') || item.querySelector('a')?.getAttribute('href') || '';
      return href.includes('/app/') || item.querySelector('button[aria-haspopup="menu"]');
    });
  }

  function injectBulkDeleteButton() {
    if (document.getElementById('gsp-bulk-delete-btn')) return;

    // Look for recent header or sidebar top
    const headers = Array.from(document.querySelectorAll('nav h2, nav .section-title, nav span, nav div'));
    const recentHeader = headers.find(h => {
      const t = (h.textContent || '').toLowerCase().trim();
      return t === 'recents' || t === 'recientes' || t === 'recent' || t === 'recent chats' || t === 'chats recientes';
    });

    if (recentHeader && recentHeader.parentElement) {
      const container = recentHeader.parentElement;
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'space-between';

      const btn = document.createElement('button');
      btn.id = 'gsp-bulk-delete-btn';
      btn.className = 'gsp-bulk-delete-btn';
      btn.title = 'Delete all recent conversations';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
        <span>Delete all</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        openBulkDeleteModal();
      });

      container.appendChild(btn);
    }
  }

  function openBulkDeleteModal() {
    const items = getConversationItems();
    const count = items.length;

    const backdrop = document.createElement('div');
    backdrop.className = 'gsp-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'gsp-modal';

    modal.innerHTML = `
      <h3 class="gsp-modal-title">🗑️ Delete All Conversations</h3>
      <p class="gsp-modal-desc" id="gsp-bulk-status">
        Are you sure you want to delete all visible recent conversations (${count})?
        This action cannot be undone.
      </p>
      <div class="gsp-progress-bar-container" style="display: none;" id="gsp-bulk-prog-box">
        <div class="gsp-progress-bar-fill" id="gsp-bulk-prog-fill"></div>
      </div>
      <div class="modal-actions gsp-modal-actions">
        <button type="button" class="gsp-btn-secondary" id="gsp-bulk-cancel">Cancel</button>
        <button type="button" class="gsp-btn-danger" id="gsp-bulk-confirm">Delete ${count} chats</button>
      </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    const cancelBtn = modal.querySelector('#gsp-bulk-cancel');
    const confirmBtn = modal.querySelector('#gsp-bulk-confirm');
    const statusText = modal.querySelector('#gsp-bulk-status');
    const progBox = modal.querySelector('#gsp-bulk-prog-box');
    const progFill = modal.querySelector('#gsp-bulk-prog-fill');

    function cleanup() {
      shouldCancel = true;
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    }

    cancelBtn.addEventListener('click', () => {
      if (isDeleting) {
        shouldCancel = true;
        cancelBtn.textContent = 'Cancelling...';
        cancelBtn.disabled = true;
      } else {
        cleanup();
      }
    });

    confirmBtn.addEventListener('click', async () => {
      isDeleting = true;
      shouldCancel = false;
      confirmBtn.style.display = 'none';
      progBox.style.display = 'block';

      const allItems = getConversationItems();
      const total = allItems.length;

      if (total === 0) {
        statusText.textContent = 'No recent conversations to delete.';
        setTimeout(cleanup, 1200);
        return;
      }

      for (let i = 0; i < total; i++) {
        if (shouldCancel) {
          statusText.textContent = 'Operation cancelled.';
          break;
        }

        const currentItems = getConversationItems();
        if (currentItems.length === 0) break;

        const item = currentItems[0];
        statusText.textContent = `Deleting conversation ${i + 1} of ${total}...`;
        progFill.style.width = `${Math.round(((i + 1) / total) * 100)}%`;

        await deleteSingleConversation(item);
        await new Promise(r => setTimeout(r, 450)); // Safety delay for DOM updates
      }

      isDeleting = false;
      statusText.textContent = shouldCancel ? 'Process cancelled.' : 'All conversations have been deleted!';
      setTimeout(() => {
        cleanup();
        if (window.GSP?.showToast) {
          window.GSP.showToast('Conversations deleted successfully');
        }
      }, 1000);
    });
  }

  async function deleteSingleConversation(item) {
    try {
      // Trigger hover over item to reveal the 3 dots menu
      item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

      // Find the three dots menu button inside item
      const menuBtn = item.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i], button[aria-label*="opciones" i], button[aria-label*="options" i], button.more-actions');
      if (menuBtn) {
        menuBtn.click();
        await new Promise(r => setTimeout(r, 120));

        // Find "Delete" option in menu
        const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], .mat-mdc-menu-item, button'));
        const deleteOption = menuItems.find(el => {
          const t = (el.textContent || '').toLowerCase();
          return t.includes('delete') || t.includes('eliminar') || t.includes('borrar');
        });

        if (deleteOption) {
          deleteOption.click();
          await new Promise(r => setTimeout(r, 150));

          // Confirm in dialog if one pops up
          const dialogConfirmBtn = Array.from(document.querySelectorAll('mat-dialog-actions button, dialog button, .dialog-buttons button')).find(b => {
            const t = (b.textContent || '').toLowerCase();
            return t.includes('delete') || t.includes('eliminar') || t.includes('confirm');
          });

          if (dialogConfirmBtn) {
            dialogConfirmBtn.click();
            await new Promise(r => setTimeout(r, 200));
          }
        }
      }
    } catch (err) {
      console.debug('Error deleting conversation item:', err);
    }
  }

  function initBulkDelete() {
    setInterval(injectBulkDeleteButton, 1500);
  }

  window.GSP = window.GSP || {};
  window.GSP.initBulkDelete = initBulkDelete;
})();
