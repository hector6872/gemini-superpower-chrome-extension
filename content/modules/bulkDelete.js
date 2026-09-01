/**
 * Bulk Delete Module for Gemini Superpowers
 * Performs direct RPC and silent background deletion of conversations
 * with native browser confirmation dialog.
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

  function extractConversationId(item) {
    const href = item.getAttribute('href') || item.querySelector('a')?.getAttribute('href') || '';
    const match = href.match(/\/app\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  function findRecentSectionHeader() {
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
        <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
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

  function deleteViaRPC(conversationId) {
    return new Promise((resolve) => {
      const requestId = 'req_' + Math.random().toString(36).substring(2, 9);

      const handler = (e) => {
        if (e.source === window && e.data && e.data.type === 'GSP_DELETE_RPC_RESULT' && e.data.requestId === requestId) {
          window.removeEventListener('message', handler);
          resolve(e.data.success);
        }
      };

      window.addEventListener('message', handler);
      window.postMessage({
        type: 'GSP_EXECUTE_DELETE_RPC',
        conversationId,
        requestId
      }, '*');

      // Timeout after 600ms
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(false);
      }, 600);
    });
  }

  async function deleteSingleConversationSilent(item) {
    try {
      const convId = extractConversationId(item);
      if (convId) {
        const rpcOk = await deleteViaRPC(convId);
        if (rpcOk) {
          // Remove from DOM immediately
          const row = item.closest('[role="listitem"], mat-list-item, div, li') || item;
          row.remove();
          return true;
        }
      }

      // Fallback: silent UI automation (cdk overlays kept completely hidden by CSS)
      item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      item.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

      await new Promise(r => setTimeout(r, 60));

      let menuBtn = item.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i], button[aria-label*="más" i], button[aria-label*="opcion" i], button[aria-label*="option" i], button[data-test-id*="more"]') ||
                    item.parentElement?.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i]') ||
                    item.closest('[role="listitem"], mat-list-item, [class*="item"]')?.querySelector('button[aria-haspopup="menu"], button[aria-label*="more" i]');

      if (!menuBtn) {
        const containerRow = item.closest('[role="listitem"], mat-list-item, div, li') || item;
        const btns = Array.from(containerRow.querySelectorAll('button'));
        menuBtn = btns.find(b => b.getAttribute('aria-haspopup') === 'menu' || b.querySelector('svg') || b.querySelector('mat-icon'));
      }

      if (!menuBtn) return false;

      menuBtn.click();
      await new Promise(r => setTimeout(r, 120));

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
      await new Promise(r => setTimeout(r, 140));

      const dialogConfirmBtn = Array.from(document.querySelectorAll('.cdk-overlay-container mat-dialog-actions button, .cdk-overlay-pane mat-dialog-container button, [role="dialog"] button, dialog button')).find(b => {
        const t = (b.textContent || '').toLowerCase().trim();
        const isConfirm = t.includes('delete') || t.includes('eliminar') || t.includes('borrar') || t.includes('confirm') || t.includes('yes') || t.includes('sí') || t.includes('si');
        const isCancel = t.includes('cancel') || t.includes('cancelar') || t.includes('no');
        return isConfirm && !isCancel;
      });

      if (dialogConfirmBtn) {
        dialogConfirmBtn.click();
        await new Promise(r => setTimeout(r, 200));
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

    const confirmed = window.confirm(`Are you sure you want to delete all ${total} recent conversations?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    isDeleting = true;
    document.body.classList.add('gsp-silent-deleting');

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

      const success = await deleteSingleConversationSilent(item);
      if (success) {
        deletedCount++;
      }
      await new Promise(r => setTimeout(r, 120));
    }

    document.body.classList.remove('gsp-silent-deleting');
    isDeleting = false;

    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
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
