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
        
        if (!stored || !Array.isArray(stored) || stored.length === 0 || isOldFormat) {
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

  function renderModalContent(formPrompt = null) {
    const t = window.GSP?.t || ((k, p) => k);
    let promptRowsHtml = '';
    const sortedPrompts = [...activePrompts].sort((a, b) => a.title.localeCompare(b.title));
    sortedPrompts.forEach(p => {
      const badge = p.model && p.model !== 'keep' ? `<span class="gsp-model-badge">${getModelBadgeText(p.model)}</span>` : '';
      promptRowsHtml += `
        <div class="gsp-manager-row">
          <div class="gsp-manager-info">
            <span class="gsp-manager-cmd">//${escapeHtml(p.title)}</span>
            ${badge}
            <span class="gsp-manager-desc">${escapeHtml(p.desc || '')}</span>
          </div>
          <div class="gsp-manager-actions">
            <button type="button" class="gsp-btn-sm gsp-btn-edit-item" data-id="${escapeHtml(p.id)}" title="${t('btn_edit')}">${t('btn_edit')}</button>
            <button type="button" class="gsp-btn-sm gsp-btn-del-item" data-id="${escapeHtml(p.id)}" title="${t('btn_delete')}">${t('btn_delete')}</button>
          </div>
        </div>
      `;
    });

    const isEditing = !!formPrompt;
    const targetPrompt = formPrompt || { id: '', title: '', desc: '', model: 'keep', template: '' };

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

      <div class="gsp-manager-container">
        <div class="gsp-manager-list-section">
          <div class="gsp-manager-section-header">
            <span>${t('your_commands')}</span>
            <button type="button" class="gsp-btn-pill-action" id="gsp-btn-new-prompt">${t('new_command_btn')}</button>
          </div>
          <div class="gsp-manager-list">
            ${promptRowsHtml}
          </div>
        </div>

        <div class="gsp-manager-form-section">
          <h4 class="gsp-form-title">${isEditing ? `${t('edit_command_title')}${escapeHtml(targetPrompt.title)}` : t('add_command_title')}</h4>
          <form id="gsp-prompt-editor-form">
            <input type="hidden" id="gsp-form-id" value="${escapeHtml(targetPrompt.id)}">
            
            <div class="gsp-input-group">
              <label class="gsp-input-label" for="gsp-form-title">${t('field_cmd_name')}</label>
              <input type="text" id="gsp-form-title" class="gsp-input-field" required placeholder="e.g. fix" value="${escapeHtml(targetPrompt.title)}">
            </div>

            <div class="gsp-input-group">
              <label class="gsp-input-label" for="gsp-form-desc">${t('field_short_desc')}</label>
              <input type="text" id="gsp-form-desc" class="gsp-input-field" placeholder="${t('placeholder_desc')}" value="${escapeHtml(targetPrompt.desc)}">
            </div>

            <div class="gsp-input-group">
              <label class="gsp-input-label" for="gsp-form-model">${t('field_auto_model')}</label>
              <select id="gsp-form-model" class="gsp-input-field">
                <option value="keep" ${targetPrompt.model === 'keep' ? 'selected' : ''}>${t('opt_model_keep')}</option>
                <option value="flash-lite" ${(targetPrompt.model === 'flash-lite' || targetPrompt.model === 'flash_lite') ? 'selected' : ''}>${t('opt_model_flash_lite')}</option>
                <option value="flash" ${targetPrompt.model === 'flash' ? 'selected' : ''}>${t('opt_model_flash')}</option>
                <option value="pro" ${targetPrompt.model === 'pro' ? 'selected' : ''}>${t('opt_model_pro')}</option>
              </select>
            </div>

            <div class="gsp-input-group">
              <label class="gsp-input-label" for="gsp-form-template">${t('field_prompt_text')}</label>
              <textarea id="gsp-form-template" class="gsp-input-field" rows="4" required placeholder="${t('placeholder_template')}">${escapeHtml(targetPrompt.template)}</textarea>
            </div>

            <div class="gsp-modal-actions">
              <button type="button" class="gsp-btn-secondary" id="gsp-btn-reset-defaults">${t('btn_restore_defaults')}</button>
              <button type="submit" class="gsp-btn-primary">${t('btn_save_command')}</button>
            </div>
          </form>
        </div>
      </div>
    `;

      // Event handlers
      modal.querySelector('#gsp-btn-close-modal').addEventListener('click', closeModal);

      modal.querySelector('#gsp-btn-new-prompt').addEventListener('click', () => {
        renderModalContent(null);
      });

      // Export JSON handler
      modal.querySelector('#gsp-btn-export-json').addEventListener('click', () => {
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

      // Import JSON handler
      const importInput = modal.querySelector('#gsp-import-file-input');
      modal.querySelector('#gsp-btn-import-json').addEventListener('click', () => {
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
            renderModalContent(null);

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

      modal.querySelector('#gsp-btn-reset-defaults').addEventListener('click', async () => {
        if (confirm(t('confirm_reset_defaults'))) {
          activePrompts = [...DEFAULT_PROMPTS];
          await savePrompts();
          renderModalContent(null);
        }
      });

      modal.querySelectorAll('.gsp-btn-edit-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const p = activePrompts.find(item => item.id === id);
          if (p) renderModalContent(p);
        });
      });

      modal.querySelectorAll('.gsp-btn-del-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (confirm(t('confirm_delete_prompt'))) {
            activePrompts = activePrompts.filter(item => item.id !== id);
            await savePrompts();
            renderModalContent(null);
          }
        });
      });

      const form = modal.querySelector('#gsp-prompt-editor-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = modal.querySelector('#gsp-form-id').value.trim();
        const rawTitle = modal.querySelector('#gsp-form-title').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const desc = modal.querySelector('#gsp-form-desc').value.trim();
        const model = modal.querySelector('#gsp-form-model').value;
        const template = modal.querySelector('#gsp-form-template').value.trim();

        if (!rawTitle) return;

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
        renderModalContent(null);
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
      renderModalContent(p || null);
    } else {
      renderModalContent(null);
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
