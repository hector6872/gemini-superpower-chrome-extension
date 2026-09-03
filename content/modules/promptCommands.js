/**
 * Prompt Commands (//) Module for Gemini Superpowers
 * Handles single-word autocomplete commands (//fix, //test, //review, etc.),
 * in-page Prompt Editor Modal, and keyboard navigation.
 */
(function () {
  'use strict';

  const DEFAULT_PROMPTS = [
    {
      id: 'doc',
      title: 'doc',
      desc: 'Generate clear documentation and usage guides',
      template: 'Please write clear, comprehensive documentation for the following, including an overview, parameter details, expected outputs, and usage examples:',
      model: 'keep'
    },
    {
      id: 'explain',
      title: 'explain',
      desc: 'Explain step-by-step in clear, simple terms',
      template: 'Please explain the following step-by-step in clear, structured, and easy-to-understand terms with practical examples:',
      model: 'flash'
    },
    {
      id: 'fix',
      title: 'fix',
      desc: 'Fix bugs, errors, and issues in the content',
      template: 'Please analyze and fix the following. Explain what caused the issue, provide the corrected version, and ensure edge cases and best practices are handled:',
      model: 'pro'
    },
    {
      id: 'optimize',
      title: 'optimize',
      desc: 'Optimize performance, efficiency, and clarity',
      template: 'Please analyze and optimize the following for maximum efficiency, speed, and clarity. Explain the key improvements made:',
      model: 'pro'
    },
    {
      id: 'review',
      title: 'review',
      desc: 'Review for quality, security, and improvements',
      template: 'Please review the following for potential issues, security, performance, and best practices. Provide an improved version with explanations:',
      model: 'pro'
    },
    {
      id: 'summary',
      title: 'summary',
      desc: 'Condense into key takeaways and conclusions',
      template: 'Please provide a concise summary of the following content, highlighting core takeaways, key conclusions, and recommended next steps:',
      model: 'flash-lite'
    },
    {
      id: 'test',
      title: 'test',
      desc: 'Generate comprehensive tests and validation cases',
      template: 'Please write comprehensive tests and validation scenarios for the following, including expected behavior, edge cases, and error handling:',
      model: 'pro'
    },
    {
      id: 'translate',
      title: 'translate',
      desc: 'Translate accurately preserving tone and nuance',
      template: 'Translate the following text accurately, preserving its natural tone, terminology, and contextual nuance:',
      model: 'keep'
    }
  ];

  let activePrompts = [...DEFAULT_PROMPTS];
  let menuElement = null;
  let selectedIndex = 0;
  let filteredPrompts = [];
  let currentQuery = '';

  async function loadPrompts() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('gsp_custom_prompts');
        const stored = data.gsp_custom_prompts;
        const isOldFormat = Array.isArray(stored) && stored.some(p => p.id === 'code-review' || p.desc?.includes('JSDoc') || p.title.includes(' ') || p.model === 'thinking');
        const isFirstRun = stored === undefined || stored === null;
        
        if (isFirstRun || isOldFormat || !Array.isArray(stored)) {
          activePrompts = [...DEFAULT_PROMPTS];
          await chrome.storage.local.set({ gsp_custom_prompts: activePrompts });
        } else {
          activePrompts = stored;
        }
      }
    } catch (e) {
      console.debug('Error loading prompts:', e);
    }
  }

  async function savePrompts() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ gsp_custom_prompts: activePrompts });
      }
    } catch (e) {
      console.debug('Error saving prompts:', e);
    }
  }

  function getModelBadgeText(modelKey) {
    switch (modelKey) {
      case 'flash-lite':
      case 'flash_lite': return '⚡ Flash Lite';
      case 'flash': return 'Flash';
      case 'pro': return '💎 Pro';
      default: return '';
    }
  }

  function triggerClick(el) {
    if (!el) return;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click();
  }

  function findGeminiModelPickerButton() {
    const selectors = [
      '[data-test-id="bard-mode-menu-button"]',
      '[data-test-id="model-selector"]',
      '[data-test-id*="model-picker"]',
      'model-selector button',
      '.model-picker-btn',
      '.model-selector-btn',
      'button.input-area-model-picker',
      'button[aria-label*="model" i]',
      'button[aria-label*="modelo" i]',
      'button[aria-label*="Flash" i]',
      'button[aria-label*="Pro" i]',
      'header button[aria-haspopup="menu"]',
      'mat-toolbar button[aria-haspopup="menu"]',
      '.top-bar-container button[aria-haspopup="menu"]'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.offsetHeight > 0 && !el.closest('user-query, model-response, #gsp-floating-toolbar')) {
        return el;
      }
    }

    const allButtons = Array.from(document.querySelectorAll('button[aria-haspopup="menu"], button[aria-expanded], button'));
    for (const btn of allButtons) {
      if (btn.id?.startsWith('gsp-') || btn.closest('user-query, model-response, #gsp-floating-toolbar')) continue;
      const text = (btn.innerText || btn.textContent || '').toLowerCase().trim();
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      
      if (text.includes('flash') || text.includes('pro') || text.includes('lite') ||
          aria.includes('flash') || aria.includes('pro') || aria.includes('lite') ||
          aria.includes('model') || aria.includes('modelo')) {
        if (btn.offsetHeight > 0 && btn.offsetWidth > 0) {
          return btn;
        }
      }
    }

    return null;
  }

  function findActiveChipsWithDismissButton() {
    const dismissButtons = [];
    const inputArea = document.querySelector('rich-textarea, [class*="input-area"], [class*="prompt"], form, main') || document.body;
    const buttons = Array.from(inputArea.querySelectorAll('button, [role="button"]'));

    for (const btn of buttons) {
      if (btn.id?.startsWith('gsp-') || btn.closest('#gsp-floating-toolbar')) continue;
      
      const svg = btn.querySelector('svg, mat-icon');
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      const hasCloseSvg = svg && (
        svg.innerHTML.includes('19 6.41') ||
        svg.innerHTML.includes('close') ||
        svg.innerHTML.includes('18 6') ||
        svg.innerHTML.includes('M19 6') ||
        svg.innerHTML.includes('M18.3 5.71')
      );
      
      if (hasCloseSvg || aria.includes('close') || aria.includes('remove') || aria.includes('quitar') || aria.includes('entfern') || aria.includes('supprim') || aria.includes('schließen')) {
        if (btn.offsetHeight > 0 && btn.offsetWidth > 0) {
          dismissButtons.push(btn);
        }
      }
    }

    return dismissButtons;
  }

  function getActiveSwitches() {
    const switches = Array.from(document.querySelectorAll('mat-slide-toggle, .mat-mdc-slide-toggle, [role="switch"], [role="checkbox"]'));
    return switches.filter(s => {
      if (s.closest('#gsp-floating-toolbar')) return false;
      const isChecked = s.getAttribute('aria-checked') === 'true' || s.classList.contains('mdc-switch--checked') || !!s.querySelector('input:checked');
      return isChecked && s.offsetHeight > 0;
    });
  }

  async function disableExtendedThinking() {
    const dismissBtns = findActiveChipsWithDismissButton();
    for (const btn of dismissBtns) {
      triggerClick(btn);
      await new Promise(r => setTimeout(r, 80));
    }

    const activeSwitches = getActiveSwitches();
    for (const sw of activeSwitches) {
      triggerClick(sw);
      await new Promise(r => setTimeout(r, 80));
    }
  }

  async function selectModelFromDropdown(targetModel) {
    const rawOptions = Array.from(document.querySelectorAll('.cdk-overlay-container [role="menuitem"], [role="menu"] [role="menuitem"], .cdk-overlay-pane button, [role="option"], mat-option, .mat-mdc-menu-item'));
    
    const options = rawOptions.filter(el => {
      return el.offsetHeight > 0 && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'menuitem' || el.getAttribute('role') === 'option' || el.classList.contains('mat-mdc-menu-item'));
    });

    if (options.length === 0) return false;

    let chosen = null;

    if (targetModel === 'flash-lite' || targetModel === 'flash_lite') {
      chosen = options.find(opt => {
        const text = (opt.innerText || opt.textContent || '').toLowerCase();
        return text.includes('lite');
      }) || options[0];
    } else if (targetModel === 'flash') {
      chosen = options.find(opt => {
        const text = (opt.innerText || opt.textContent || '').toLowerCase();
        const hasFlash = text.includes('flash') || text.includes('2.0');
        const hasLite = text.includes('lite');
        const hasThinking = text.includes('thinking') || text.includes('pens') || text.includes('denk') || text.includes('thought');
        return hasFlash && !hasLite && !hasThinking;
      }) || options[0];
    } else if (targetModel === 'pro') {
      chosen = options.find(opt => {
        const text = (opt.innerText || opt.textContent || '').toLowerCase();
        return text.includes('pro') || text.includes('1.5');
      }) || options[options.length - 1];
    }

    if (chosen) {
      triggerClick(chosen);
      await new Promise(r => setTimeout(r, 120));
      return true;
    }

    return false;
  }

  function focusChatInputAtEnd() {
    const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
    if (!input) return;

    input.focus();

    if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(input);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (typeof input.setSelectionRange === 'function') {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }

  async function switchGeminiModel(targetModel) {
    if (!targetModel || targetModel === 'keep') return;

    await disableExtendedThinking();

    const pickerBtn = findGeminiModelPickerButton();
    if (pickerBtn) {
      triggerClick(pickerBtn);
      await new Promise(r => setTimeout(r, 220));

      const success = await selectModelFromDropdown(targetModel);
      if (!success) {
        document.body.click();
      }
    }

    await disableExtendedThinking();
    setTimeout(disableExtendedThinking, 150);

    focusChatInputAtEnd();
    setTimeout(focusChatInputAtEnd, 120);
  }

  function insertPromptIntoGemini(templateText) {
    const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
    if (!input) return;

    input.focus();

    let currentRawText = (input.innerText || input.value || '').trim();
    let cleanedExistingText = currentRawText.replace(/\/\/[a-zA-Z0-9_-]*/g, '').trim();

    let finalText = templateText;
    if (cleanedExistingText.length > 0) {
      finalText = `${templateText}\n\n${cleanedExistingText}`;
    }

    if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
      input.innerHTML = '';
      const lines = finalText.split('\n');
      lines.forEach((line) => {
        const p = document.createElement('p');
        p.textContent = line || '\u200B';
        input.appendChild(p);
      });

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(input);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      input.value = finalText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.setSelectionRange(finalText.length, finalText.length);
    }
  }

  function updateSelectedMenuItem() {
    if (!menuElement) return;
    const items = menuElement.querySelectorAll('.gsp-prompt-item');
    items.forEach((item, idx) => {
      const isSelected = idx === selectedIndex;
      item.classList.toggle('gsp-selected', isSelected);
      item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      if (isSelected) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  let previousQuery = null;

  function renderPromptMenu(query, inputElement) {
    const trimmedQuery = (query || '').toLowerCase().trim();
    const queryChanged = (trimmedQuery !== previousQuery);
    previousQuery = trimmedQuery;
    currentQuery = trimmedQuery;

    if (queryChanged) {
      selectedIndex = 0;
    }

    filteredPrompts = activePrompts.filter(p => {
      if (!currentQuery) return true;
      return p.title.toLowerCase().startsWith(currentQuery) ||
             p.title.toLowerCase().includes(currentQuery) ||
             (p.desc && p.desc.toLowerCase().includes(currentQuery));
    });

    filteredPrompts.sort((a, b) => {
      if (currentQuery) {
        const aStarts = a.title.toLowerCase().startsWith(currentQuery);
        const bStarts = b.title.toLowerCase().startsWith(currentQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }
      return a.title.localeCompare(b.title);
    });

    if (filteredPrompts.length === 0) {
      closePromptMenu();
      return;
    }

    if (!menuElement) {
      menuElement = document.createElement('div');
      menuElement.id = 'gsp-prompt-menu-root';
      menuElement.className = 'gsp-prompt-menu';
      document.body.appendChild(menuElement);
    }

    const rect = inputElement.getBoundingClientRect();
    menuElement.style.left = `${Math.max(16, rect.left)}px`;
    menuElement.style.bottom = `${window.innerHeight - rect.top + 8}px`;

    selectedIndex = Math.min(selectedIndex, filteredPrompts.length - 1);
    if (selectedIndex < 0) selectedIndex = 0;

    let itemsHtml = '';
    filteredPrompts.forEach((p, idx) => {
      const isSelected = idx === selectedIndex;
      const modelBadge = p.model && p.model !== 'keep' 
        ? `<span class="gsp-model-badge">${getModelBadgeText(p.model)}</span>` 
        : '';

      itemsHtml += `
        <div class="gsp-prompt-item ${isSelected ? 'gsp-selected' : ''}" data-idx="${idx}" aria-selected="${isSelected ? 'true' : 'false'}">
          <div class="gsp-prompt-item-left">
            <span class="gsp-prompt-title">//${p.title}</span>
            ${p.desc ? `<span class="gsp-prompt-desc">${p.desc}</span>` : ''}
          </div>
          ${modelBadge}
        </div>
      `;
    });

    const t = window.GSP?.t || ((k) => k);

    menuElement.innerHTML = `
      <div class="gsp-prompt-header">
        <div class="gsp-prompt-header-left">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
          </svg>
          <span>// Prompts</span>
        </div>
        <div class="gsp-prompt-header-right">
          <button type="button" class="gsp-prompt-edit-btn" id="gsp-btn-open-editor" title="${t('edit_prompts_title')}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <span>${t('edit_prompts_btn')}</span>
          </button>
        </div>
      </div>
      <div class="gsp-prompt-list">
        ${itemsHtml}
      </div>
      <div class="gsp-prompt-footer">
        <span>${t('menu_footer')}</span>
      </div>
    `;

    // Ensure selected item is in view
    updateSelectedMenuItem();

    // Bind Edit Prompts button
    const editBtn = menuElement.querySelector('#gsp-btn-open-editor');
    if (editBtn) {
      editBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closePromptMenu();
        openPromptEditorModal();
      });
    }

    // Hover and Click handlers for items
    menuElement.querySelectorAll('.gsp-prompt-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        if (!isNaN(idx)) {
          selectedIndex = idx;
          updateSelectedMenuItem();
        }
      });

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        selectPrompt(filteredPrompts[idx]);
      });
    });
  }

  function closePromptMenu() {
    if (menuElement && menuElement.parentNode) {
      menuElement.parentNode.removeChild(menuElement);
      menuElement = null;
    }
    previousQuery = null;
    selectedIndex = 0;
  }

  function togglePromptMenu() {
    if (menuElement) {
      closePromptMenu();
    } else {
      if (!activePrompts || activePrompts.length === 0) {
        openPromptEditorModal();
        return;
      }
      const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
      if (input) {
        input.focus();
        renderPromptMenu('', input);
      }
    }
  }

  async function selectPrompt(promptItem) {
    closePromptMenu();
    if (!promptItem) return;

    if (promptItem.model && promptItem.model !== 'keep') {
      await switchGeminiModel(promptItem.model);
    }

    insertPromptIntoGemini(promptItem.template);
    focusChatInputAtEnd();
  }

  // In-Page Prompt Library Editor Modal
  function openPromptEditorModal(editingPromptId = null) {
    let backdrop = document.getElementById('gsp-prompt-editor-backdrop');
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.id = 'gsp-prompt-editor-backdrop';
    backdrop.className = 'gsp-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'gsp-modal gsp-prompt-manager-modal';

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function validateAndSanitizePromptsJSON(jsonStringOrObject) {
    let parsed;
    if (typeof jsonStringOrObject === 'string') {
      if (jsonStringOrObject.length > 1024 * 1024) {
        throw new Error('File size exceeds the 1MB limit.');
      }
      try {
        parsed = JSON.parse(jsonStringOrObject);
      } catch (e) {
        throw new Error('Invalid JSON syntax.');
      }
    } else if (typeof jsonStringOrObject === 'object' && jsonStringOrObject !== null) {
      parsed = jsonStringOrObject;
    } else {
      throw new Error('Invalid data type.');
    }

    let rawList = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && Array.isArray(parsed.prompts)) {
      rawList = parsed.prompts;
    } else {
      throw new Error('JSON must contain an array of prompts.');
    }

    if (rawList.length === 0) {
      throw new Error('No prompts found in the imported file.');
    }

    if (rawList.length > 200) {
      throw new Error('Too many prompts in file (maximum 200 allowed).');
    }

    const sanitizedPrompts = [];
    const allowedModels = new Set(['keep', 'flash-lite', 'flash', 'pro']);

    for (let i = 0; i < rawList.length; i++) {
      const item = rawList[i];
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;

      let rawTitle = String(item.title || '').trim();
      rawTitle = rawTitle.replace(/^\/+/, '');
      const cleanTitle = rawTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);

      if (!cleanTitle) continue;

      let cleanDesc = '';
      if (item.desc !== undefined && item.desc !== null) {
        cleanDesc = String(item.desc).trim().slice(0, 200);
      }

      let rawModel = String(item.model || 'keep').toLowerCase().trim();
      if (rawModel === 'flash_lite') rawModel = 'flash-lite';
      const cleanModel = allowedModels.has(rawModel) ? rawModel : 'keep';

      let rawTemplate = '';
      if (item.template !== undefined && item.template !== null) {
        rawTemplate = String(item.template).trim().slice(0, 20000);
      }

      if (!rawTemplate) continue;

      const cleanId = typeof item.id === 'string' && /^[a-zA-Z0-9_-]{1,60}$/.test(item.id)
        ? item.id
        : `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      sanitizedPrompts.push({
        id: cleanId,
        title: cleanTitle,
        desc: cleanDesc,
        model: cleanModel,
        template: rawTemplate
      });
    }

    if (sanitizedPrompts.length === 0) {
      throw new Error('No valid prompt commands found to import.');
    }

    return sanitizedPrompts;
  }

  let currentSearchQuery = '';

  function renderLibraryView(searchQuery = '') {
    currentSearchQuery = searchQuery;
    const t = window.GSP?.t || ((k, p) => k);
    const sortedPrompts = [...activePrompts].sort((a, b) => a.title.localeCompare(b.title));
    const hasPrompts = sortedPrompts.length > 0;
    const q = searchQuery.toLowerCase().trim();
    const filteredPrompts = sortedPrompts.filter(p => {
      if (!q) return true;
      return p.title.toLowerCase().includes(q) ||
             (p.desc && p.desc.toLowerCase().includes(q)) ||
             (p.template && p.template.toLowerCase().includes(q));
    });

    let mainContentHtml = '';

    if (!hasPrompts) {
      mainContentHtml = `
        <div class="gsp-library-empty-wrap">
          <div class="gsp-manager-empty-state">
            <div class="gsp-manager-empty-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h4 class="gsp-manager-empty-title">${t('empty_prompts_title')}</h4>
            <p class="gsp-manager-empty-desc">${t('empty_prompts_desc')}</p>
            <div class="gsp-empty-actions">
              <button type="button" class="gsp-btn-secondary" id="gsp-btn-empty-restore">${t('btn_restore_defaults')}</button>
              <button type="button" class="gsp-btn-primary" id="gsp-btn-empty-new">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                <span>${t('new_command_btn')}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      let cardsHtml = '';
      if (filteredPrompts.length === 0) {
        cardsHtml = `
          <div class="gsp-no-results">
            <p>${t('no_prompts_found', { query: escapeHtml(searchQuery) })}</p>
            <button type="button" class="gsp-btn-secondary gsp-btn-clear-filter" id="gsp-btn-reset-search">${t('clear_filter_btn')}</button>
          </div>
        `;
      } else {
        filteredPrompts.forEach(p => {
          const badge = p.model && p.model !== 'keep' ? `<span class="gsp-model-badge">${getModelBadgeText(p.model)}</span>` : '';
          cardsHtml += `
            <div class="gsp-prompt-card" data-id="${escapeHtml(p.id)}">
              <div class="gsp-card-body">
                <div class="gsp-card-header">
                  <div class="gsp-card-title-group">
                    <span class="gsp-card-cmd">//${escapeHtml(p.title)}</span>
                    ${badge}
                  </div>
                  <div class="gsp-card-actions">
                    <button type="button" class="gsp-btn-card-action gsp-btn-edit-item" data-id="${escapeHtml(p.id)}" title="${t('btn_edit')}">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                      <span>${t('btn_edit')}</span>
                    </button>
                    <button type="button" class="gsp-btn-card-action gsp-btn-del-action gsp-btn-del-item" data-id="${escapeHtml(p.id)}" title="${t('btn_delete')}">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                ${p.desc ? `<p class="gsp-card-desc">${escapeHtml(p.desc)}</p>` : ''}
                <div class="gsp-card-preview">${escapeHtml(p.template)}</div>
              </div>
            </div>
          `;
        });
      }

      mainContentHtml = `
        <div class="gsp-library-toolbar">
          <div class="gsp-search-wrapper">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="gsp-search-icon">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input type="text" id="gsp-library-search" class="gsp-search-field" placeholder="${t('search_prompts_placeholder')}" value="${escapeHtml(searchQuery)}" autocomplete="off" spellcheck="false">
            ${searchQuery ? `<button type="button" class="gsp-search-clear" id="gsp-btn-clear-search">✕</button>` : ''}
          </div>
          <button type="button" class="gsp-btn-primary gsp-btn-toolbar-add" id="gsp-btn-new-prompt">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            <span>${t('new_command_btn')}</span>
          </button>
        </div>

        <div class="gsp-library-cards-list">
          ${cardsHtml}
        </div>

        <div class="gsp-library-footer">
          <div class="gsp-library-footer-actions">
            <button type="button" class="gsp-btn-footer-link" id="gsp-btn-reset-defaults">${t('btn_restore_defaults')}</button>
            <button type="button" class="gsp-btn-footer-link gsp-btn-footer-danger" id="gsp-btn-delete-all-prompts" title="${t('delete_all_prompts_title')}">${t('btn_delete_all_prompts')}</button>
          </div>
          <span class="gsp-library-counter">${sortedPrompts.length} ${sortedPrompts.length === 1 ? 'command' : 'commands'}</span>
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="gsp-modal-header">
        <div class="gsp-modal-header-left">
          <h3 class="gsp-modal-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
            <span>// ${t('manager_title')}</span>
          </h3>
        </div>
        <div class="gsp-modal-header-actions">
          <button type="button" class="gsp-btn-header-action" id="gsp-btn-export-json" title="${t('export_prompts_title')}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            <span>${t('btn_export')}</span>
          </button>
          <button type="button" class="gsp-btn-header-action" id="gsp-btn-import-json" title="${t('import_prompts_title')}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/>
            </svg>
            <span>${t('btn_import')}</span>
          </button>
          <input type="file" id="gsp-import-file-input" accept=".json,application/json" style="display: none;" />
          <button type="button" class="gsp-modal-close-btn" id="gsp-btn-close-modal">✕</button>
        </div>
      </div>

      <div class="gsp-library-view-container">
        ${mainContentHtml}
      </div>
    `;

    // Bind common header events
    modal.querySelector('#gsp-btn-close-modal').addEventListener('click', closeModal);

    const btnExportJson = modal.querySelector('#gsp-btn-export-json');
    if (btnExportJson) {
      btnExportJson.addEventListener('click', () => {
        const exportData = {
          version: 1,
          exportedAt: new Date().toISOString(),
          prompts: activePrompts
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gemini-prompts-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const importInput = modal.querySelector('#gsp-import-file-input');
    const btnImportJson = modal.querySelector('#gsp-btn-import-json');
    if (btnImportJson && importInput) {
      btnImportJson.addEventListener('click', () => {
        importInput.value = '';
        importInput.click();
      });

      importInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
          alert(t('import_error_msg', { error: 'File size exceeds 1MB limit.' }));
          return;
        }

        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const sanitized = validateAndSanitizePromptsJSON(evt.target.result);

            if (!confirm(t('confirm_import_prompts', { count: sanitized.length }))) {
              return;
            }

            const existingMap = new Map(activePrompts.map(p => [p.title.toLowerCase(), p]));
            let updatedCount = 0;
            let identicalCount = 0;
            const addedPrompts = [];

            sanitized.forEach(p => {
              const key = p.title.toLowerCase();
              const existing = existingMap.get(key);
              if (existing) {
                const isIdentical = (existing.desc || '') === (p.desc || '') &&
                                    (existing.model || 'keep') === (p.model || 'keep') &&
                                    (existing.template || '') === (p.template || '');
                if (isIdentical) {
                  identicalCount++;
                } else {
                  updatedCount++;
                  existingMap.set(key, { ...p, id: existing.id || p.id });
                }
              } else {
                addedPrompts.push('//' + p.title);
                existingMap.set(key, p);
              }
            });

            activePrompts = Array.from(existingMap.values());
            await savePrompts();
            renderLibraryView('');

            if (addedPrompts.length > 0) {
              alert(t('import_result_summary', {
                added: addedPrompts.length,
                addedList: addedPrompts.join(', '),
                updated: updatedCount,
                identical: identicalCount
              }));
            } else {
              alert(t('import_result_no_new', {
                updated: updatedCount,
                identical: identicalCount
              }));
            }
          } catch (err) {
            alert(t('import_error_msg', { error: err.message || 'Invalid format' }));
          }
        };
        reader.readAsText(file);
      });
    }

    // New command button
    const btnNewPrompt = modal.querySelector('#gsp-btn-new-prompt') || modal.querySelector('#gsp-btn-empty-new');
    if (btnNewPrompt) {
      btnNewPrompt.addEventListener('click', () => {
        renderEditorView(null);
      });
    }

    // Reset defaults button
    const btnResetDefaults = modal.querySelector('#gsp-btn-reset-defaults') || modal.querySelector('#gsp-btn-empty-restore');
    if (btnResetDefaults) {
      btnResetDefaults.addEventListener('click', async () => {
        if (confirm(t('confirm_reset_defaults'))) {
          activePrompts = [...DEFAULT_PROMPTS];
          await savePrompts();
          renderLibraryView('');
        }
      });
    }

    // Delete all button
    const btnDeleteAll = modal.querySelector('#gsp-btn-delete-all-prompts');
    if (btnDeleteAll) {
      btnDeleteAll.addEventListener('click', async () => {
        if (confirm(t('confirm_delete_all_prompts'))) {
          activePrompts = [];
          await savePrompts();
          renderLibraryView('');
        }
      });
    }

    // Search input
    const searchInput = modal.querySelector('#gsp-library-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderLibraryView(e.target.value);
        const nextInput = modal.querySelector('#gsp-library-search');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
        }
      });
    }

    const btnClearSearch = modal.querySelector('#gsp-btn-clear-search');
    if (btnClearSearch) {
      btnClearSearch.addEventListener('click', () => {
        renderLibraryView('');
      });
    }

    const btnResetSearch = modal.querySelector('#gsp-btn-reset-search');
    if (btnResetSearch) {
      btnResetSearch.addEventListener('click', () => {
        renderLibraryView('');
      });
    }

    // Edit and Delete buttons on cards
    modal.querySelectorAll('.gsp-btn-edit-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const p = activePrompts.find(item => item.id === id);
        if (p) renderEditorView(p);
      });
    });

    modal.querySelectorAll('.gsp-btn-del-item').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm(t('confirm_delete_prompt'))) {
          activePrompts = activePrompts.filter(item => item.id !== id);
          await savePrompts();
          renderLibraryView(currentSearchQuery);
        }
      });
    });

    // Clicking card opens edit
    modal.querySelectorAll('.gsp-prompt-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.gsp-card-actions')) return;
        const id = card.getAttribute('data-id');
        const p = activePrompts.find(item => item.id === id);
        if (p) renderEditorView(p);
      });
    });
  }

  function renderEditorView(formPrompt = null) {
    const t = window.GSP?.t || ((k, p) => k);
    const isEditing = !!(formPrompt && formPrompt.id);
    const targetPrompt = formPrompt || { id: '', title: '', desc: '', model: 'keep', template: '' };

    modal.innerHTML = `
      <div class="gsp-modal-header">
        <div class="gsp-modal-header-left">
          <button type="button" class="gsp-btn-header-back" id="gsp-btn-back-to-library" title="${t('back_to_library')}">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span>${t('back_to_library')}</span>
          </button>
        </div>
        <div class="gsp-editor-header-title">
          <span class="gsp-editor-badge">${isEditing ? t('btn_edit') : t('new_command_btn')}</span>
          <h3 class="gsp-modal-title">
            <span>${isEditing ? `//${escapeHtml(targetPrompt.title)}` : t('add_command_title')}</span>
          </h3>
        </div>
        <div class="gsp-modal-header-actions">
          <button type="button" class="gsp-modal-close-btn" id="gsp-btn-close-modal">✕</button>
        </div>
      </div>

      <div class="gsp-editor-container">
        <form id="gsp-prompt-editor-form" class="gsp-editor-form">
          <input type="hidden" id="gsp-form-id" value="${escapeHtml(targetPrompt.id)}">

          <div class="gsp-editor-fields-row">
            <div class="gsp-input-group gsp-group-cmd-name">
              <label class="gsp-input-label" for="gsp-form-title">${t('field_cmd_name')}</label>
              <div class="gsp-cmd-input-container">
                <span class="gsp-cmd-prefix">//</span>
                <input type="text" id="gsp-form-title" class="gsp-input-field gsp-cmd-input" required placeholder="fix" value="${escapeHtml(targetPrompt.title)}" autocomplete="off" spellcheck="false" autofocus>
              </div>
            </div>

            <div class="gsp-input-group gsp-group-cmd-desc">
              <label class="gsp-input-label" for="gsp-form-desc">${t('field_short_desc')}</label>
              <input type="text" id="gsp-form-desc" class="gsp-input-field" placeholder="${t('placeholder_desc')}" value="${escapeHtml(targetPrompt.desc)}">
            </div>
          </div>

          <div class="gsp-input-group">
            <label class="gsp-input-label">${t('field_auto_model')}</label>
            <div class="gsp-model-chips-group">
              <button type="button" class="gsp-model-chip ${targetPrompt.model === 'keep' ? 'gsp-chip-selected' : ''}" data-model="keep">
                <span class="gsp-chip-dot"></span>
                <span>${t('opt_model_keep')}</span>
              </button>
              <button type="button" class="gsp-model-chip ${(targetPrompt.model === 'flash-lite' || targetPrompt.model === 'flash_lite') ? 'gsp-chip-selected' : ''}" data-model="flash-lite">
                <span class="gsp-chip-dot"></span>
                <span>⚡ Flash Lite</span>
              </button>
              <button type="button" class="gsp-model-chip ${targetPrompt.model === 'flash' ? 'gsp-chip-selected' : ''}" data-model="flash">
                <span class="gsp-chip-dot"></span>
                <span>Flash</span>
              </button>
              <button type="button" class="gsp-model-chip ${targetPrompt.model === 'pro' ? 'gsp-chip-selected' : ''}" data-model="pro">
                <span class="gsp-chip-dot"></span>
                <span>💎 Pro</span>
              </button>
            </div>
            <input type="hidden" id="gsp-form-model" value="${targetPrompt.model || 'keep'}">
          </div>

          <div class="gsp-input-group">
            <label class="gsp-input-label" for="gsp-form-template">${t('field_prompt_text')}</label>
            <textarea id="gsp-form-template" class="gsp-input-field gsp-textarea-template" rows="7" required placeholder="${t('placeholder_template')}">${escapeHtml(targetPrompt.template)}</textarea>
          </div>

          <div class="gsp-editor-actions-bar">
            <button type="button" class="gsp-btn-secondary" id="gsp-btn-cancel-edit">${t('btn_cancel')}</button>
            <button type="submit" class="gsp-btn-primary">${t('btn_save_command')}</button>
          </div>
        </form>
      </div>
    `;

    // Bind back and close
    modal.querySelector('#gsp-btn-close-modal').addEventListener('click', closeModal);
    modal.querySelector('#gsp-btn-back-to-library').addEventListener('click', () => {
      renderLibraryView(currentSearchQuery);
    });
    modal.querySelector('#gsp-btn-cancel-edit').addEventListener('click', () => {
      renderLibraryView(currentSearchQuery);
    });

    // Model chips interaction
    modal.querySelectorAll('.gsp-model-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        modal.querySelectorAll('.gsp-model-chip').forEach(c => c.classList.remove('gsp-chip-selected'));
        chip.classList.add('gsp-chip-selected');
        modal.querySelector('#gsp-form-model').value = chip.getAttribute('data-model');
      });
    });

    // Form submit
    const form = modal.querySelector('#gsp-prompt-editor-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = modal.querySelector('#gsp-form-id').value.trim();
      const rawTitle = modal.querySelector('#gsp-form-title').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const desc = modal.querySelector('#gsp-form-desc').value.trim();
      const model = modal.querySelector('#gsp-form-model').value;
      const template = modal.querySelector('#gsp-form-template').value.trim();

      if (!rawTitle) return;

      // Check if prompt shortcut name already exists
      const isDuplicate = activePrompts.some(p => {
        if (id && p.id === id) return false;
        return p.title.toLowerCase() === rawTitle.toLowerCase();
      });

      if (isDuplicate) {
        alert(t('cmd_name_exists', { name: rawTitle }));
        const titleInput = modal.querySelector('#gsp-form-title');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
        return;
      }

      if (id) {
        const idx = activePrompts.findIndex(p => p.id === id);
        if (idx !== -1) {
          activePrompts[idx] = { id, title: rawTitle, desc, model, template };
        }
      } else {
        activePrompts.push({
          id: rawTitle + '-' + Date.now(),
          title: rawTitle,
          desc,
          model,
          template
        });
      }

      await savePrompts();
      renderLibraryView(currentSearchQuery);
    });
  }

    function closeModal() {
      window.removeEventListener('keydown', handleModalKeydown, true);
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    }

    function handleModalKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closeModal();
      }
    }

    window.addEventListener('keydown', handleModalKeydown, true);

    modal.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    modal.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    if (editingPromptId) {
      const p = activePrompts.find(item => item.id === editingPromptId);
      renderEditorView(p || null);
    } else {
      renderLibraryView('');
    }

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    let isMouseDownOnBackdrop = false;
    backdrop.addEventListener('mousedown', (e) => {
      isMouseDownOnBackdrop = (e.target === backdrop);
    });
    backdrop.addEventListener('mouseup', (e) => {
      if (isMouseDownOnBackdrop && e.target === backdrop) {
        closeModal();
      }
      isMouseDownOnBackdrop = false;
    });
  }

  function handleKeydown(e) {
    if (!menuElement || filteredPrompts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      selectedIndex = (selectedIndex + 1) % filteredPrompts.length;
      updateSelectedMenuItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      selectedIndex = (selectedIndex - 1 + filteredPrompts.length) % filteredPrompts.length;
      updateSelectedMenuItem();
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredPrompts[selectedIndex]) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        selectPrompt(filteredPrompts[selectedIndex]);
      }
    } else if (e.key === ' ' || e.code === 'Space') {
      if (filteredPrompts[selectedIndex]) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        selectPrompt(filteredPrompts[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      closePromptMenu();
    }
  }

  function setupPromptCommandListener() {
    document.addEventListener('input', (e) => {
      const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
      if (!input || (!input.contains(e.target) && input !== e.target)) return;

      const text = input.innerText || input.value || '';

      const autoMatch = text.match(/\/\/([a-zA-Z0-9_-]+)\s+/);
      if (autoMatch) {
        const cmd = autoMatch[1].toLowerCase();
        const matched = activePrompts.find(p => p.title.toLowerCase() === cmd);
        if (matched) {
          closePromptMenu();
          selectPrompt(matched);
          return;
        }
      }

      const triggerIndex = text.lastIndexOf('//');
      if (triggerIndex !== -1) {
        const query = text.substring(triggerIndex + 2);
        if (!query.includes(' ') && !query.includes('\n')) {
          renderPromptMenu(query, input);
          return;
        }
      }

      closePromptMenu();
    }, true);

    window.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('keydown', handleKeydown, true);

    document.addEventListener('click', (e) => {
      if (menuElement && !menuElement.contains(e.target)) {
        closePromptMenu();
      }
    }, true);
  }

  function initPromptCommands() {
    loadPrompts();
    setupPromptCommandListener();

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.gsp_custom_prompts) {
          activePrompts = changes.gsp_custom_prompts.newValue || [...DEFAULT_PROMPTS];
        }
      });
    }
  }

  window.GSP = window.GSP || {};
  window.GSP.initPromptCommands = initPromptCommands;
  window.GSP.togglePromptMenu = togglePromptMenu;
  window.GSP.openPromptEditorModal = openPromptEditorModal;
  window.GSP.insertPromptIntoGemini = insertPromptIntoGemini;
})();
