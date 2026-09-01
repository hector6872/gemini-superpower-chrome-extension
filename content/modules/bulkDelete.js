/**
 * Bulk Delete Module for Gemini Superpowers
 * Injects a "Delete all" button in the recent conversations sidebar
 * using native browser confirmation dialog.
 */
(function () {
  'use strict';

  let isDeleting = false;

  function getConversationLinks() {
    const candidateLinks = Array.from(document.querySelectorAll('side-nav a, mat-sidenav a, nav a, aside a, [class*="side-nav"] a, [class*="sidebar"] a, a[href*="/app/"]'));
    return candidateLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      return href.includes('/app/') && a.offsetHeight > 0 && a.offsetParent !== null;
    });
  }

  function findRecentSectionHeader() {
    // 1. Search for headers/labels inside sidebar elements
    const sidebars = document.querySelectorAll('side-nav, mat-sidenav, nav, aside, [class*="side-nav"], [class*="sidebar"], [data-test-id*="sidebar"]');
    
    for (const sb of sidebars) {
      const candidates = sb.querySelectorAll('h2, h3, h4, span, div, p, [class*="title"], [class*="header"]');
      for (const el of candidates) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (text === 'recent' || text === 'recents' || text === 'recientes' || text === 'chats recientes' || text === 'recent chats' || text === 'conversaciones recientes') {
          if (el.offsetHeight > 0 && el.children.length <= 2) {
            return el;
          }
        }
      }
    }

    // 2. Search anywhere on the left side of the screen (sidebar area)
    const allLeftElements = Array.from(document.querySelectorAll('h2, h3, h4, span, div'));
    for (const el of allLeftElements) {
      const rect = el.getBoundingClientRect();
      if (rect.left < 360 && rect.top < 400 && rect.width > 0 && rect.height > 0) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (text === 'recent' || text === 'recents' || text === 'recientes' || text === 'chats recientes' || text === 'recent chats') {
          if (el.children.length <= 2) {
            return el;
          }
        }
      }
    }

    // 3. Fallback: parent of first conversation link
    const links = getConversationLinks();
    if (links.length > 0) {
      const listContainer = links[0].closest('mat-nav-list, mat-list, [role="list"], .conversation-list, [class*="list"]') || links[0].parentElement;
      if (listContainer && listContainer.previousElementSibling) {
        return listContainer.previousElementSibling;
      }
    }

    return null;
  }

  function injectBulkDeleteButton() {
    if (document.getElementById('gsp-bulk-delete-btn')) return;

    const recentHeader = findRecentSectionHeader();
    if (!recentHeader) return;

    if (recentHeader.querySelector('#gsp-bulk-delete-btn')) return;

    // Style the recentHeader element itself as flex row without affecting parent list
    recentHeader.style.display = 'flex';
    recentHeader.style.alignItems = 'center';
    recentHeader.style.justifyContent = 'space-between';
    recentHeader.style.boxSizing = 'border-box';
    recentHeader.style.paddingRight = '12px';

    const btn = document.createElement('button');
    btn.id = 'gsp-bulk-delete-btn';
    btn.className = 'gsp-bulk-delete-btn';
    btn.type = 'button';
    btn.title = 'Delete all recent conversations';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
      </svg>
      <span>Delete all</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      startBulkDelete();
    });

    recentHeader.appendChild(btn);
  }

  async function deleteSingleConversation(item) {
    try {
      // Scroll item into view in sidebar
      item.scrollIntoView({ block: 'nearest', inline: 'nearest' });

      // Trigger full pointer and mouse sequence to reveal hover actions
      item.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

      await new Promise(r => setTimeout(r, 100));

      // Look for the 3-dots button inside item, its parent, or next siblings
      let menuBtn = item.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i], button[aria-label*="más" i], button[aria-label*="opcion" i], button[aria-label*="option" i], button[data-test-id*="more"], button[data-test-id*="menu"]') ||
                    item.parentElement?.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i]') ||
                    item.closest('[role="listitem"], mat-list-item, [class*="item"]')?.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i]');

      if (!menuBtn) {
        const containerRow = item.closest('[role="listitem"], mat-list-item, div, li') || item;
        const btns = Array.from(containerRow.querySelectorAll('button'));
        menuBtn = btns.find(b => b.getAttribute('aria-haspopup') === 'menu' || b.querySelector('svg') || b.querySelector('mat-icon'));
      }

      if (!menuBtn) {
        return false;
      }

      // Click 3-dots button to open menu overlay
      menuBtn.click();
      await new Promise(r => setTimeout(r, 200));

      // Find "Delete" option in overlay
      const overlayMenuItems = Array.from(document.querySelectorAll('.cdk-overlay-container [role="menuitem"], .cdk-overlay-pane button, [role="menu"] [role="menuitem"], [role="menu"] button, .mat-mdc-menu-item'));
      const deleteOption = overlayMenuItems.find(el => {
        const t = (el.textContent || '').toLowerCase().trim();
        return t.includes('delete') || t.includes('eliminar') || t.includes('borrar') || t.includes('supprimer') || t.includes('löschen');
      });

      if (!deleteOption) {
        document.body.click();
        return false;
      }

      deleteOption.click();
      await new Promise(r => setTimeout(r, 250));

      // Find confirmation button in dialog
      const dialogConfirmBtn = Array.from(document.querySelectorAll('.cdk-overlay-container mat-dialog-actions button, .cdk-overlay-pane mat-dialog-container button, [role="dialog"] button, dialog button')).find(b => {
        const t = (b.textContent || '').toLowerCase().trim();
        const isConfirm = t.includes('delete') || t.includes('eliminar') || t.includes('borrar') || t.includes('confirm') || t.includes('yes') || t.includes('sí') || t.includes('si');
        const isCancel = t.includes('cancel') || t.includes('cancelar') || t.includes('no');
        return isConfirm && !isCancel;
      });

      if (dialogConfirmBtn) {
        dialogConfirmBtn.click();
        await new Promise(r => setTimeout(r, 350));
        return true;
      }

      return false;
    } catch (err) {
      console.debug('Error deleting conversation:', err);
      return false;
    }
  }

  async function startBulkDelete() {
    if (isDeleting) return;

    const items = getConversationLinks();
    const total = items.length;

    if (total === 0) {
      window.alert('No recent conversations found to delete.');
      return;
    }

    // Native browser confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete all ${total} recent conversations?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    isDeleting = true;
    const btn = document.getElementById('gsp-bulk-delete-btn');
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }

    let deletedCount = 0;
    for (let i = 0; i < total; i++) {
      const currentItems = getConversationLinks();
      if (currentItems.length === 0) break;

      const item = currentItems[0];
      if (btn) {
        btn.innerHTML = `<span>Deleting ${deletedCount + 1}/${total}...</span>`;
      }

      const success = await deleteSingleConversation(item);
      if (success) {
        deletedCount++;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    isDeleting = false;
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
        <span>Delete all</span>
      `;
    }
  }

  function initBulkDelete() {
    setInterval(injectBulkDeleteButton, 1000);

    const observer = new MutationObserver(() => {
      injectBulkDeleteButton();
    });

    const sidebar = document.querySelector('side-nav, mat-sidenav, nav, aside, [class*="side-nav"], [class*="sidebar"]');
    if (sidebar) {
      observer.observe(sidebar, { childList: true, subtree: true });
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.GSP = window.GSP || {};
  window.GSP.initBulkDelete = initBulkDelete;
})();
