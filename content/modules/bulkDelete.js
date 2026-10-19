/**
 * Bulk Delete Module for Gemini Superpowers
 * Performs direct RPC and silent background deletion of conversations
 * with native browser confirmation dialog.
 */
(function () {
  'use strict';

  let isDeleting = false;

  function getConversationLinks() {
    const candidateLinks = Array.from(document.querySelectorAll('side-nav a, mat-sidenav a, nav a, aside a, [class*="side-nav"] a, [class*="sidebar"] a, [class*="drawer"] a, [data-test-id*="sidebar"] a, a[href*="/app/"], a[href*="/chat/"]'));
    return candidateLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      return (href.includes('/app/') || href.includes('/chat/')) && a.offsetHeight > 0 && a.offsetParent !== null;
    });
  }

  function extractConversationId(item) {
    const href = item.getAttribute('href') || item.querySelector('a')?.getAttribute('href') || item.getAttribute('data-conversation-id') || '';
    const match = href.match(/\/(?:app|chat)\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : (item.getAttribute('data-conversation-id') || '');
  }

  function isPinnedConversation(item) {
    if (!item) return false;

    const row = item.closest('[role="listitem"], mat-list-item, div, li') || item;

    // 1. Direct class or attribute check
    const rowClasses = (row.className + ' ' + (item.className || '')).toLowerCase();
    if (rowClasses.includes('pinned') || rowClasses.includes('is-pinned') || rowClasses.includes('fijad')) {
      return true;
    }
    if (row.getAttribute('data-is-pinned') === 'true' || row.getAttribute('data-pinned') === 'true' || item.getAttribute('data-pinned') === 'true') {
      return true;
    }

    // 2. Pin / Keep icon inside the item row
    const icons = Array.from(row.querySelectorAll('mat-icon, svg, [role="img"]'));
    for (const icon of icons) {
      const text = (icon.textContent || '').trim().toLowerCase();
      if (text === 'keep' || text === 'push_pin' || text === 'pin' || text.includes('keep') || text.includes('pin')) {
        return true;
      }
      const label = (icon.getAttribute('aria-label') || icon.getAttribute('title') || '').toLowerCase();
      if (label.includes('pin') || label.includes('fijad') || label.includes('keep')) {
        return true;
      }
    }

    // 3. Section container check (inside a pinned section/group)
    const pinnedSection = item.closest(
      '[data-test-id*="pinned" i], [class*="pinned" i], [aria-label*="pinned" i], [aria-label*="fijad" i], [aria-label*="keep" i]'
    );
    if (pinnedSection) {
      return true;
    }

    // 4. Position relative to "Recent" / "Recientes" section header
    // In Gemini, pinned conversations appear in a section ABOVE the "Recent" section header.
    const recentHeaders = Array.from(document.querySelectorAll(
      '[data-test-id*="recent" i], [class*="recent" i], [aria-label*="recent" i], [aria-label*="reciente" i], h2, h3, h4'
    )).filter(el => {
      const t = (el.textContent || '').toLowerCase().trim();
      return t === 'recent' || t === 'recientes' || t === 'récents' || t === 'letzte' || t.includes('recent') || t.includes('reciente');
    });

    if (recentHeaders.length > 0) {
      const recentHeader = recentHeaders[0];
      const pos = row.compareDocumentPosition(recentHeader);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        const sidebar = row.closest('bard-sidenav, side-nav, mat-sidenav, nav, aside, [class*="sidebar"]');
        if (sidebar && sidebar.contains(recentHeader)) {
          return true;
        }
      }
    }

    return false;
  }

  function getActiveSidebar() {
    const sidebars = Array.from(document.querySelectorAll(
      'bard-sidenav, side-nav, mat-sidenav, mat-drawer, nav, aside, [class*="side-nav"], [class*="sidebar"], [class*="drawer"], [data-test-id*="sidebar"]'
    ));
    return sidebars.find(sb => sb.offsetHeight > 0 && sb.offsetWidth > 0) || sidebars[0] || document.body;
  }

  function findFilterButton() {
    const activeSidebar = getActiveSidebar();
    const candidates = Array.from(activeSidebar.querySelectorAll('button, [role="button"], a[role="button"]'));

    for (const el of candidates) {
      if (el.id === 'gsp-bulk-delete-btn') continue;
      if (el.offsetHeight === 0 && el.offsetParent === null) continue;

      const label = (el.getAttribute('aria-label') || el.title || el.getAttribute('data-test-id') || '').toLowerCase();
      if (label.includes('filtr') || label.includes('filter') || label.includes('busc') || label.includes('search') || label.includes('tune')) {
        return el;
      }

      const cls = (el.className || '').toString().toLowerCase();
      if (cls.includes('filter') || cls.includes('search')) {
        return el;
      }

      const matIcon = el.querySelector('mat-icon');
      if (matIcon) {
        const iconName = (matIcon.textContent || '').trim().toLowerCase();
        if (iconName.includes('filter') || iconName.includes('tune') || iconName.includes('search')) {
          return el;
        }
      }
    }

    // Also check left-side header/nav elements outside the immediate sidebar container
    const globalCandidates = Array.from(document.querySelectorAll('button, [role="button"]')).filter(b => {
      const rect = b.getBoundingClientRect();
      return rect.left < 360 && rect.top < 260 && b.offsetHeight > 0 && b.offsetParent !== null;
    });
    for (const el of globalCandidates) {
      if (el.id === 'gsp-bulk-delete-btn') continue;
      const label = (el.getAttribute('aria-label') || el.title || el.getAttribute('data-test-id') || '').toLowerCase();
      if (label.includes('filtr') || label.includes('filter') || label.includes('busc') || label.includes('search') || label.includes('tune')) {
        return el;
      }
      const matIcon = el.querySelector('mat-icon');
      if (matIcon) {
        const iconName = (matIcon.textContent || '').trim().toLowerCase();
        if (iconName.includes('filter') || iconName.includes('tune') || iconName.includes('search')) {
          return el;
        }
      }
    }

    return null;
  }

  function findHeaderFallback() {
    const activeSidebar = getActiveSidebar();

    // Direct text/attribute match for "Recent" / "Chats" header inside sidebar
    const allHeaders = Array.from(activeSidebar.querySelectorAll(
      '[data-test-id*="recent" i], [class*="recent" i], [aria-label*="recent" i], [aria-label*="reciente" i], [aria-label*="récent" i], [class*="section-header" i], [class*="header" i], [class*="title" i], [class*="label" i], [class*="heading" i], h2, h3, h4, [role="heading"]'
    ));

    const explicitHeader = allHeaders.find(el => {
      if (el.offsetHeight === 0 && el.offsetParent === null) return false;
      if (el.closest('[class*="brand" i], [class*="logo" i], [class*="new-chat" i], button, a, [role="listitem"]')) return false;
      const text = (el.textContent || '').toLowerCase().trim();
      const attr = (el.className + ' ' + (el.getAttribute('data-test-id') || '') + ' ' + (el.getAttribute('aria-label') || '')).toLowerCase();
      return text === 'recent' || text === 'recientes' || text === 'récents' || text === 'letzte' || text === 'recenti' ||
             text === 'chats' || text === 'mis chats' || text === 'chat history' || text === 'historial' ||
             text.includes('recent') || text.includes('reciente') || text.includes('récent') || text.includes('chat') ||
             attr.includes('recent') || attr.includes('chat');
    });

    if (explicitHeader) {
      const parent = explicitHeader.parentElement;
      if (parent && parent !== activeSidebar && parent.offsetHeight > 0 && parent.children.length > 1) {
        return { container: parent, anchor: null };
      }
      return { container: explicitHeader, anchor: null };
    }

    // Proximity match to first conversation link
    const links = getConversationLinks();
    if (links.length > 0) {
      const firstLink = links[0];
      const listContainer = firstLink.closest('mat-nav-list, mat-list, [role="list"], .conversation-list, [class*="list"]') || firstLink.parentElement;
      if (listContainer && listContainer.previousElementSibling) {
        const prev = listContainer.previousElementSibling;
        if (!prev.closest('[class*="brand" i], [class*="logo" i], [class*="new-chat" i], button, a')) {
          return { container: prev, anchor: null };
        }
      }
    }

    return null;
  }

  function injectBulkDeleteButton() {
    const existingBtn = document.getElementById('gsp-bulk-delete-btn');
    const filterBtn = findFilterButton();

    let container = null;
    let anchor = null;

    if (filterBtn) {
      // Find suitable container wide enough to host both buttons cleanly
      let targetParent = filterBtn.parentElement;
      while (targetParent && targetParent !== document.body && targetParent.offsetWidth < 60) {
        targetParent = targetParent.parentElement;
      }
      container = targetParent || filterBtn.parentElement;

      // Determine the reference child inside container
      let insertRef = filterBtn;
      while (insertRef.parentElement && insertRef.parentElement !== container) {
        insertRef = insertRef.parentElement;
      }
      anchor = insertRef;
    } else {
      const fallback = findHeaderFallback();
      if (!fallback || !fallback.container) return;
      container = fallback.container;
      anchor = fallback.anchor;
    }

    if (!container) return;

    if (existingBtn && existingBtn.isConnected && container.contains(existingBtn) && existingBtn.offsetParent !== null) {
      return;
    }

    if (existingBtn) {
      existingBtn.remove();
    }

    const t = window.GSP?.t || ((k) => k);

    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.boxSizing = 'border-box';

    const btn = document.createElement('button');
    btn.id = 'gsp-bulk-delete-btn';
    btn.className = 'gsp-bulk-delete-btn';
    btn.type = 'button';
    btn.title = t('delete_all_title');
    btn.style.marginLeft = 'auto';
    btn.style.marginRight = '6px';
    btn.style.flexShrink = '0';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
        <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
      </svg>
      <span>${t('delete_all_btn')}</span>
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const includePinned = !!e.shiftKey;
      startBulkDelete(includePinned);
    });

    if (anchor && anchor.parentNode === container) {
      container.insertBefore(btn, anchor);
    } else {
      container.appendChild(btn);
    }
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
        // 1. Vector SVG path or mat-icon for trashcan (language-agnostic)
        const hasDeleteIcon = el.querySelector('svg path[d*="M16 9"], svg path[d*="M6 19"], svg path[d*="M15 4"]') ||
                              (el.querySelector('mat-icon') && (el.querySelector('mat-icon').textContent || '').includes('delete'));
        if (hasDeleteIcon) return true;
        const t = (el.textContent || '').toLowerCase().trim();
        return t.includes('delete') || t.includes('eliminar') || t.includes('borrar') || t.includes('supprimer') || t.includes('löschen');
      }) || overlayMenuItems[overlayMenuItems.length - 1];

      if (!deleteOption) {
        document.body.click();
        return false;
      }

      deleteOption.click();
      await new Promise(r => setTimeout(r, 140));

      const dialogButtons = Array.from(document.querySelectorAll('.cdk-overlay-container mat-dialog-actions button, .cdk-overlay-pane mat-dialog-container button, [role="dialog"] button, dialog button'));
      const dialogConfirmBtn = dialogButtons.find(b => {
        if (b.classList.contains('mat-warn') || b.classList.contains('mat-primary') || b.getAttribute('color') === 'warn') return true;
        const t = (b.textContent || '').toLowerCase().trim();
        const isConfirm = t.includes('delete') || t.includes('eliminar') || t.includes('borrar') || t.includes('confirm') || t.includes('yes') || t.includes('sí') || t.includes('si');
        const isCancel = t.includes('cancel') || t.includes('cancelar') || t.includes('no');
        return isConfirm && !isCancel;
      }) || dialogButtons[dialogButtons.length - 1];

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

  let isShiftPressed = false;
  function updateShiftVisuals(pressed) {
    if (isShiftPressed === pressed) return;
    isShiftPressed = pressed;
    const btn = document.getElementById('gsp-bulk-delete-btn');
    if (!btn || isDeleting) return;
    const t = window.GSP?.t || ((k) => k);
    if (isShiftPressed) {
      btn.classList.add('gsp-bulk-delete-shift');
      btn.title = t('delete_all_with_pinned_title');
    } else {
      btn.classList.remove('gsp-bulk-delete-shift');
      btn.title = t('delete_all_title');
    }
  }

  async function startBulkDelete(includePinned = false) {
    if (isDeleting) return;
    const t = window.GSP?.t || ((k, p) => k);

    const allItems = getConversationLinks();
    if (allItems.length === 0) {
      window.alert(t('no_conversations'));
      return;
    }

    const targetItems = includePinned ? allItems : allItems.filter(item => !isPinnedConversation(item));
    const total = targetItems.length;

    if (total === 0) {
      window.alert(t('no_unpinned_conversations'));
      return;
    }

    const confirmMsg = includePinned
      ? t('confirm_delete_all_with_pinned', { count: total })
      : t('confirm_delete_all', { count: total });

    const confirmed = window.confirm(confirmMsg);
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
      const remainingItems = getConversationLinks().filter(item => includePinned || !isPinnedConversation(item));
      if (remainingItems.length === 0) break;

      const item = remainingItems[0];
      if (btn) {
        btn.innerHTML = `<span>${t('deleting_progress', { current: deletedCount + 1, total })}</span>`;
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
      btn.title = isShiftPressed ? t('delete_all_with_pinned_title') : t('delete_all_title');
      if (isShiftPressed) {
        btn.classList.add('gsp-bulk-delete-shift');
      } else {
        btn.classList.remove('gsp-bulk-delete-shift');
      }
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
        </svg>
        <span>${t('delete_all_btn')}</span>
      `;
    }
  }

  function initBulkDelete() {
    injectBulkDeleteButton();
    setInterval(injectBulkDeleteButton, 1000);

    const observer = new MutationObserver(() => {
      injectBulkDeleteButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') updateShiftVisuals(true);
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') updateShiftVisuals(false);
    });
  }

  window.GSP = window.GSP || {};
  window.GSP.initBulkDelete = initBulkDelete;
})();
