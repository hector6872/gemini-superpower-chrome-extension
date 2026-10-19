/**
 * Bulk Delete Module for Gemini Superpowers
 * Performs direct RPC and silent background deletion of conversations
 * with native browser confirmation dialog.
 */
(function () {
  'use strict';

  let isDeleting = false;

  function extractConversationId(item) {
    if (!item) return '';
    const href = item.getAttribute('href') || item.querySelector('a')?.getAttribute('href') || item.getAttribute('data-conversation-id') || '';
    const match = href.match(/\/(?:app|chat)\/([a-zA-Z0-9_-]+)/);
    if (match && match[1] && match[1] !== 'app' && match[1] !== 'chat') {
      return match[1];
    }
    return item.getAttribute('data-conversation-id') || '';
  }

  function getConversationLinks() {
    const candidateLinks = Array.from(document.querySelectorAll(
      'bard-sidenav a, side-nav a, mat-sidenav a, nav a, aside a, [class*="side-nav"] a, [class*="sidebar"] a, [class*="drawer"] a, [data-test-id*="sidebar"] a, a[href*="/app/"], a[href*="/chat/"]'
    ));

    const uniqueLinks = Array.from(new Set(candidateLinks));

    return uniqueLinks.filter(a => {
      if (a.closest('#gsp-floating-toolbar, .gsp-toolbar')) return false;
      const href = a.getAttribute('href') || a.querySelector('a')?.getAttribute('href') || '';
      const hasConvPath = /\/(?:app|chat)\/[a-zA-Z0-9_-]+/i.test(href) || a.hasAttribute('data-conversation-id');
      if (!hasConvPath) return false;
      const isVisible = (a.offsetHeight > 0 && a.offsetWidth > 0) || (a.getClientRects && a.getClientRects().length > 0);
      return isVisible;
    });
  }

  function isMoreOptionsElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
    const title = (el.getAttribute('title') || '').toLowerCase();

    if (el.getAttribute('aria-haspopup') === 'menu') return true;
    if (aria.includes('more') || aria.includes('más') || aria.includes('opcion') || aria.includes('option') ||
        title.includes('more') || title.includes('más') || title.includes('opcion')) {
      return true;
    }
    const text = (el.textContent || '').trim().toLowerCase();
    if (text === 'more_vert' || text === 'more_horiz') return true;

    const path = el.querySelector?.('path')?.getAttribute('d') || (tag === 'path' ? el.getAttribute('d') : '') || '';
    if (path.includes('12 8') || path.includes('12 12') || path.includes('12 16') || path.includes('2 2s') || path.includes('2-2s')) {
      return true;
    }
    return false;
  }

  function getConversationRow(item) {
    if (!item) return item;
    const semantic = item.closest('side-navigation-item, [role="listitem"], mat-list-item, [class*="conversation-item"], [class*="chat-item"], li');
    if (semantic && !semantic.contains(document.getElementById('gsp-bulk-delete-btn'))) {
      const links = semantic.querySelectorAll('a[href*="/app/"], a[href*="/chat/"]');
      if (links.length <= 1) return semantic;
    }

    let curr = item.parentElement || item;
    for (let i = 0; i < 3; i++) {
      const parent = curr.parentElement;
      if (!parent || parent === document.body) break;
      if (parent.id === 'gsp-bulk-delete-btn' || parent.contains(document.getElementById('gsp-bulk-delete-btn'))) break;
      const links = parent.querySelectorAll('a[href*="/app/"], a[href*="/chat/"]');
      if (links.length > 1) break;
      curr = parent;
    }
    return curr;
  }

  function isPinnedConversation(item) {
    if (!item) return false;

    // 1. Check custom element container side-navigation-item and standard wrappers
    const row = getConversationRow(item) || item.parentElement || item;

    // Direct attributes on row or item
    const rowAttrs = (row.getAttribute('data-is-pinned') || '') + ' ' + (row.getAttribute('data-pinned') || '') + ' ' +
                     (item.getAttribute('data-is-pinned') || '') + ' ' + (item.getAttribute('data-pinned') || '');
    if (rowAttrs.includes('true')) return true;

    // 2. Check if row is inside a pinned section / container / group
    let cur = row.parentElement;
    while (cur && cur !== document.body) {
      if (cur.id === 'gsp-bulk-delete-btn' || cur.contains(document.getElementById('gsp-bulk-delete-btn'))) {
        cur = cur.parentElement;
        continue;
      }
      const label = (cur.getAttribute('aria-label') || cur.getAttribute('data-test-id') || (cur.className || '').toString()).toLowerCase();
      if (label.includes('pinned') || label.includes('fijad')) {
        const links = cur.querySelectorAll('a[href*="/app/"], a[href*="/chat/"]');
        const allLinks = getConversationLinks();
        if (links.length < allLinks.length) {
          return true;
        }
      }
      cur = cur.parentElement;
    }

    // 3. Positional check: Is the item located after "Pinned" header and before "Recent" header?
    const activeSidebar = getActiveSidebar() || document.body;
    const pinnedHeader = Array.from(activeSidebar.querySelectorAll('*')).find(el => {
      if (el.children.length > 3) return false;
      const t = (el.textContent || '').trim().toLowerCase();
      return (t === 'pinned' || t === 'fijadas' || t === 'fijados') && el.offsetHeight > 0;
    });

    const recentHeader = Array.from(activeSidebar.querySelectorAll('*')).find(el => {
      if (el.children.length > 3) return false;
      const t = (el.textContent || '').trim().toLowerCase();
      return (t === 'recent' || t === 'recientes') && el.offsetHeight > 0;
    });

    if (pinnedHeader && recentHeader) {
      const posPinned = pinnedHeader.compareDocumentPosition(item);
      const posRecent = recentHeader.compareDocumentPosition(item);
      // Following pinnedHeader and preceding recentHeader
      if ((posPinned & Node.DOCUMENT_POSITION_FOLLOWING) && (posRecent & Node.DOCUMENT_POSITION_PRECEDING)) {
        return true;
      }
    } else if (pinnedHeader && !recentHeader) {
      const pinnedContainer = pinnedHeader.closest('section, [class*="section"], [class*="group"], div');
      if (pinnedContainer && pinnedContainer !== activeSidebar && pinnedContainer.contains(item)) {
        return true;
      }
    }

    // 4. Scan elements inside the conversation row (both inside anchor and siblings)
    const elements = Array.from(new Set(Array.from(row.querySelectorAll('*')).concat(Array.from(item.querySelectorAll('*')))));
    for (const el of elements) {
      if (el === item) continue;

      // Skip the 3-dots kebab menu and its children
      if (isMoreOptionsElement(el) || el.closest('button[aria-haspopup="menu"]') || el.closest('.conversation-actions-menu-button')) {
        continue;
      }

      // Check text ligature on icon elements
      const text = (el.textContent || '').trim().toLowerCase();
      if (text === 'push_pin' || text === 'keep' || text === 'pin' || text === 'pushpin' || text === '📌' || text.includes('push_pin') || text.includes('📌')) {
        return true;
      }

      // Check icon attributes
      const fontIcon = (el.getAttribute('fonticon') || el.getAttribute('data-mat-icon-name') || '').toLowerCase();
      if (fontIcon.includes('pin') || fontIcon.includes('keep')) {
        return true;
      }

      // Check aria label / title specifically for pin/unpin
      const aria = (el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
      if (aria.includes('pinned') || aria.includes('fijad') || aria.includes('unpin') || aria.includes('desfijar') || aria === 'pin' || aria === 'fijar') {
        return true;
      }

      // Check classes on icon or element
      const cls = (el.className || '').toString().toLowerCase();
      if (cls.includes('pinned') || cls.includes('pushpin') || cls.includes('pin-icon')) {
        return true;
      }

      // SVG path check for pushpin geometry
      const svgEl = el.tagName.toLowerCase() === 'svg' ? el : el.querySelector('svg');
      if (svgEl) {
        const paths = Array.from(svgEl.querySelectorAll('path'));
        for (const p of paths) {
          const d = p.getAttribute('d') || '';
          if (/16\s*12|16\s*9V|14\s*4|17\s*4|19\s*12|v-?[67]l-?1|l-?1\s*-?1v-?[67]|h-?5v-?6|H7v|H7V|v[4-9](?:\.[0-9]+)?h[12]|v7l1|1v[78]l-?2/i.test(d)) {
            return true;
          }
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

  const TRASH_ICON = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/>
    </svg>
  `;

  const SPINNER_ICON = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="gsp-spin">
      <path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8zm0 16c4.41 0 8-3.59 8-8h2c0 5.52-4.48 10-10 10v-2z"/>
    </svg>
  `;

  function findFilterButton() {
    const activeSidebar = getActiveSidebar();
    const root = activeSidebar || document.body;

    const allButtons = Array.from(root.querySelectorAll('button, [role="button"]')).filter(b => {
      if (b.id === 'gsp-bulk-delete-btn') return false;
      return b.offsetHeight > 0 && b.offsetWidth > 0 && b.offsetParent !== null;
    });

    // 1. Strictly look for filter buttons ("filter", "filtrar", "filtro", funnel icon)
    const explicitFilter = allButtons.find(b => {
      const label = (b.getAttribute('aria-label') || b.title || b.getAttribute('data-test-id') || '').toLowerCase();
      const cls = (b.className || '').toString().toLowerCase();

      // Exclude top-level header controls like main menu, new chat
      if (label.includes('menu') || label.includes('menú') || label.includes('new') || label.includes('nuevo')) {
        return false;
      }

      if (label.includes('filtr') || label.includes('filter') || cls.includes('filter')) {
        return true;
      }

      const matIcon = b.querySelector('mat-icon');
      if (matIcon) {
        const iconName = (matIcon.textContent || '').trim().toLowerCase();
        if (iconName.includes('filter') || iconName === 'tune') {
          return true;
        }
      }

      if (b.querySelector('svg path[d*="M10 18"], svg path[d*="M3 18"], svg path[d*="M4.25"], svg path[d*="M3 4"]')) {
        return true;
      }

      return false;
    });

    if (explicitFilter) {
      return explicitFilter;
    }

    // 2. Look for any action button in the "Recent" / "Recientes" section header row
    const recentHeaders = Array.from(root.querySelectorAll(
      '[data-test-id*="recent" i], [class*="recent" i], [aria-label*="recent" i], [aria-label*="reciente" i], h2, h3, h4'
    )).filter(el => {
      if (el.offsetHeight === 0 && el.offsetParent === null) return false;
      const t = (el.textContent || '').toLowerCase().trim();
      return t === 'recent' || t === 'recientes' || t.includes('recent') || t.includes('reciente');
    });

    for (const h of recentHeaders) {
      let cur = h;
      for (let i = 0; i < 3 && cur && cur !== root; i++) {
        const btn = cur.querySelector('button, [role="button"]');
        if (btn && btn.id !== 'gsp-bulk-delete-btn' && btn.offsetHeight > 0) {
          const l = (btn.getAttribute('aria-label') || '').toLowerCase();
          if (!l.includes('menu') && !l.includes('menú') && !l.includes('new') && !l.includes('nuevo')) {
            return btn;
          }
        }
        cur = cur.parentElement;
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

    if (filterBtn && filterBtn.parentElement) {
      // If filterBtn is inside a narrow icon button wrapper (< 60px), walk up to the row container
      let anchor = filterBtn;
      let parent = filterBtn.parentElement;

      while (parent && parent !== document.body) {
        const rect = parent.getBoundingClientRect();
        if (rect.width > 0 && rect.width < 60) {
          anchor = parent;
          parent = parent.parentElement;
        } else {
          break;
        }
      }

      if (!parent) parent = filterBtn.parentElement;

      // If already connected directly before anchor in the correct parent, nothing to do
      if (existingBtn && existingBtn.isConnected && existingBtn.parentElement === parent && existingBtn.nextElementSibling === anchor) {
        return;
      }

      if (existingBtn) {
        existingBtn.remove();
      }

      // Ensure parent container is a horizontal flex row
      parent.style.display = 'flex';
      parent.style.flexDirection = 'row';
      parent.style.alignItems = 'center';

      // Ensure anchor does not push away from btn with auto margin
      anchor.style.marginLeft = '0';

      const t = window.GSP?.t || ((k) => k);

      const btn = document.createElement('button');
      btn.id = 'gsp-bulk-delete-btn';
      btn.className = 'gsp-bulk-delete-btn';
      btn.type = 'button';
      btn.title = t('delete_all_title');
      btn.innerHTML = TRASH_ICON;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const includePinned = !!e.shiftKey || isShiftPressed;
        startBulkDelete(includePinned);
      });

      // Insert directly to the left of the filter anchor horizontally
      parent.insertBefore(btn, anchor);
      return;
    }

    // Fallback: only if no filter button found, put in Recent header row
    const fallback = findHeaderFallback();
    if (!fallback || !fallback.container) return;
    const { container } = fallback;

    if (existingBtn && existingBtn.isConnected && container.contains(existingBtn)) {
      return;
    }

    if (existingBtn) {
      existingBtn.remove();
    }

    const t = window.GSP?.t || ((k) => k);
    const btn = document.createElement('button');
    btn.id = 'gsp-bulk-delete-btn';
    btn.className = 'gsp-bulk-delete-btn';
    btn.type = 'button';
    btn.title = t('delete_all_title');
    btn.innerHTML = TRASH_ICON;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const includePinned = !!e.shiftKey || isShiftPressed;
      startBulkDelete(includePinned);
    });

    container.appendChild(btn);
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

  function findMenuButtonForConversation(item) {
    if (!item) return null;

    // 1. Direct sibling button
    if (item.nextElementSibling && item.nextElementSibling.matches('button, [role="button"]')) {
      return item.nextElementSibling;
    }
    const siblingBtn = item.nextElementSibling?.querySelector('button, [role="button"]');
    if (siblingBtn) return siblingBtn;

    // 2. Search inside row
    const row = getConversationRow(item);
    if (row && row !== item) {
      const btn = row.querySelector(
        'button.conversation-actions-menu-button, .conversation-action-menu-button, button[id^="menu-"], [data-test-id*="menu"], button[aria-haspopup="menu"], button[aria-label*="option" i], button[aria-label*="opcion" i], button[aria-label*="more" i], button[aria-label*="más" i]'
      );
      if (btn) return btn;

      const rowBtns = Array.from(row.querySelectorAll('button'));
      const fallback = rowBtns.find(b => isMoreOptionsElement(b) || b.getAttribute('aria-haspopup') === 'menu' || b.querySelector('svg, mat-icon'));
      if (fallback) return fallback;
    }

    // 3. Search outward starting from item: parent, grandparent, up to 4 levels
    let cur = item.parentElement;
    for (let i = 0; i < 3 && cur && cur !== document.body; i++) {
      const btn = cur.querySelector(
        'button.conversation-actions-menu-button, .conversation-action-menu-button, button[id^="menu-"], [data-test-id*="menu"], button[aria-haspopup="menu"]'
      );
      if (btn) return btn;
      cur = cur.parentElement;
    }
    return null;
  }

  async function deleteSingleConversationSilent(item) {
    try {
      const convId = extractConversationId(item);
      const row = getConversationRow(item) || item.parentElement || item;

      // 1. Try direct RPC first
      if (convId) {
        const rpcOk = await deleteViaRPC(convId);
        if (rpcOk) {
          row.remove();
          item.remove();
          return true;
        }
      }

      // 2. UI Automation fallback
      row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      row.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

      await new Promise(r => setTimeout(r, 100));

      const menuBtn = findMenuButtonForConversation(item);
      if (!menuBtn) {
        console.warn('GSP: Menu button not found for conversation', convId);
        return false;
      }

      menuBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      menuBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      menuBtn.click();

      // Wait for CDK overlay menu to appear
      await new Promise(r => setTimeout(r, 220));

      // 3. Find Delete option in dropdown
      const menuItems = Array.from(document.querySelectorAll(
        '[data-test-id="delete-button"], .cdk-overlay-container [role="menuitem"], .cdk-overlay-pane button, [role="menu"] [role="menuitem"], [role="menu"] button, .mat-mdc-menu-item'
      ));

      const deleteOption = menuItems.find(el => {
        if (el.getAttribute('data-test-id') === 'delete-button' || el.closest('[data-test-id="delete-button"]')) return true;
        const text = (el.textContent || '').trim().toLowerCase();
        if (text.includes('delete') || text.includes('eliminar') || text.includes('borrar') || text.includes('supprimer') || text.includes('löschen')) {
          return true;
        }
        const hasTrashIcon = el.querySelector('svg path[d*="M16 9"], svg path[d*="M6 19"], svg path[d*="M15 4"]') ||
                             (el.querySelector('mat-icon, span') && (el.querySelector('mat-icon, span').textContent || '').includes('delete'));
        return !!hasTrashIcon;
      });

      if (!deleteOption) {
        document.body.click();
        console.warn('GSP: Delete option not found in menu');
        return false;
      }

      deleteOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      deleteOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      deleteOption.click();

      // Wait for confirm dialog to appear
      await new Promise(r => setTimeout(r, 220));

      // 4. Find confirm button in dialog
      const dialogButtons = Array.from(document.querySelectorAll(
        '[data-test-id="confirm-button"], message-dialog button, .cdk-overlay-container mat-dialog-actions button, .cdk-overlay-pane mat-dialog-container button, [role="dialog"] button, dialog button'
      ));

      const confirmBtn = dialogButtons.find(b => {
        if (b.getAttribute('data-test-id') === 'confirm-button') return true;
        if (b.classList.contains('mat-warn') || b.classList.contains('mat-primary') || b.getAttribute('color') === 'warn') return true;
        const t = (b.textContent || '').toLowerCase().trim();
        const isConfirm = t.includes('delete') || t.includes('eliminar') || t.includes('borrar') || t.includes('confirm') || t.includes('yes') || t.includes('sí') || t.includes('si');
        const isCancel = t.includes('cancel') || t.includes('cancelar') || t.includes('no');
        return isConfirm && !isCancel;
      }) || dialogButtons[dialogButtons.length - 1];

      if (confirmBtn) {
        confirmBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        confirmBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        confirmBtn.click();
        await new Promise(r => setTimeout(r, 250));
        row.remove();
        item.remove();
        return true;
      }

      console.warn('GSP: Confirm button not found in dialog');
      return false;
    } catch (err) {
      console.error('GSP: Error deleting conversation:', err);
      return false;
    }
  }

  let isShiftPressed = false;
  function updateShiftVisuals(pressed) {
    isShiftPressed = pressed;
  }

  async function startBulkDelete(includePinned = false) {
    if (isDeleting) return;
    const t = window.GSP?.t || ((k, p) => k);

    const allItems = getConversationLinks();
    console.log('GSP: Found conversations:', allItems.length, allItems.map(a => a.getAttribute('href')));
    if (allItems.length === 0) {
      window.alert(t('no_conversations'));
      return;
    }

    const targetItems = includePinned ? allItems : allItems.filter(item => {
      const pinned = isPinnedConversation(item);
      console.log('GSP: Conv', extractConversationId(item), 'isPinned:', pinned);
      return !pinned;
    });
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

    const attemptedIds = new Set();
    let deletedCount = 0;
    for (let i = 0; i < total; i++) {
      const remainingItems = getConversationLinks().filter(item => {
        const id = extractConversationId(item);
        if (id && attemptedIds.has(id)) return false;
        return includePinned || !isPinnedConversation(item);
      });
      if (remainingItems.length === 0) break;

      const item = remainingItems[0];
      const convId = extractConversationId(item);
      if (convId) attemptedIds.add(convId);

      if (btn) {
        btn.innerHTML = SPINNER_ICON;
        btn.title = t('deleting_progress', { current: deletedCount + 1, total });
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
      btn.title = t('delete_all_title');
      btn.innerHTML = TRASH_ICON;
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
    window.addEventListener('blur', () => {
      updateShiftVisuals(false);
    });
  }

  window.GSP = window.GSP || {};
  window.GSP.initBulkDelete = initBulkDelete;
})();
