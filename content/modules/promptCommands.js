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
      model: 'thinking'
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
      model: 'flash'
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
        const isOldFormat = Array.isArray(stored) && stored.some(p => p.id === 'code-review' || p.desc?.includes('JSDoc') || p.title.includes(' '));
        
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
      case 'flash': return '⚡ Flash';
      case 'pro': return '🌟 Pro';
      case 'thinking': return '🧠 Thinking';
      default: return '';
    }
  }

  function switchGeminiModel(targetModel) {
    if (!targetModel || targetModel === 'keep') return;

    const pickerBtn = document.querySelector('button[aria-label*="model" i], button[aria-label*="modelo" i], .model-picker-button, [data-test-id="model-selector"]');
    if (!pickerBtn) return;

    pickerBtn.click();

    setTimeout(() => {
      const options = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], mat-option, .mat-mdc-menu-item, button'));
      const targetOption = options.find(opt => {
        const text = (opt.innerText || opt.textContent || '').toLowerCase();
        if (targetModel === 'thinking' && (text.includes('thinking') || text.includes('pensamiento'))) return true;
        if (targetModel === 'pro' && text.includes('pro') && !text.includes('thinking')) return true;
        if (targetModel === 'flash' && text.includes('flash') && !text.includes('thinking')) return true;
        return false;
      });

      if (targetOption) {
        targetOption.click();
      } else {
        document.body.click();
      }
    }, 120);
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

  function renderPromptMenu(query, inputElement) {
    currentQuery = (query || '').toLowerCase().trim();

    filteredPrompts = activePrompts.filter(p => {
      if (!currentQuery) return true;
      return p.title.toLowerCase().startsWith(currentQuery) ||
             p.title.toLowerCase().includes(currentQuery) ||
             (p.desc && p.desc.toLowerCase().includes(currentQuery));
    });

    filteredPrompts.sort((a, b) => a.title.localeCompare(b.title));

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
        <li class="gsp-prompt-item ${isSelected ? 'gsp-selected' : ''}" data-idx="${idx}" aria-selected="${isSelected ? 'true' : 'false'}">
          <div class="gsp-prompt-item-left">
            <span class="gsp-prompt-title">/${p.title}</span>
            ${p.desc ? `<span class="gsp-prompt-desc">${p.desc}</span>` : ''}
          </div>
          ${modelBadge}
        </li>
      `;
    });

    menuElement.innerHTML = `
      <div class="gsp-prompt-header">
        <div class="gsp-prompt-header-left">
          <span>✨ Quick Prompts (<code>//</code>)</span>
        </div>
        <div class="gsp-prompt-header-right">
          <button type="button" class="gsp-prompt-edit-btn" id="gsp-btn-open-editor" title="Edit and manage prompts">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <span>Edit Prompts</span>
          </button>
        </div>
      </div>
      <ul class="gsp-prompt-list">
        ${itemsHtml}
      </ul>
      <div class="gsp-prompt-footer">
        <span>↑↓ navigate • Enter / Tab / Space to insert</span>
      </div>
    `;

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

    // Click handlers for items
    menuElement.querySelectorAll('.gsp-prompt-item').forEach(item => {
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

  function selectPrompt(promptItem) {
    closePromptMenu();
    if (!promptItem) return;

    if (promptItem.model && promptItem.model !== 'keep') {
      switchGeminiModel(promptItem.model);
    }

    insertPromptIntoGemini(promptItem.template);
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

    function renderModalContent(formPrompt = null) {
      let promptRowsHtml = '';
      const sortedPrompts = [...activePrompts].sort((a, b) => a.title.localeCompare(b.title));
      sortedPrompts.forEach(p => {
        const badge = p.model && p.model !== 'keep' ? `<span class="gsp-model-badge">${getModelBadgeText(p.model)}</span>` : '';
        promptRowsHtml += `
          <div class="gsp-manager-row">
            <div class="gsp-manager-info">
              <span class="gsp-manager-cmd">/${p.title}</span>
              ${badge}
              <span class="gsp-manager-desc">${p.desc || ''}</span>
            </div>
            <div class="gsp-manager-actions">
              <button type="button" class="gsp-btn-sm gsp-btn-edit-item" data-id="${p.id}" title="Edit prompt">Edit</button>
              <button type="button" class="gsp-btn-sm gsp-btn-del-item" data-id="${p.id}" title="Delete prompt">Delete</button>
            </div>
          </div>
        `;
      });

      const isEditing = !!formPrompt;
      const targetPrompt = formPrompt || { id: '', title: '', desc: '', model: 'keep', template: '' };

      modal.innerHTML = `
        <div class="gsp-modal-header">
          <h3 class="gsp-modal-title">✨ Prompt Library Manager</h3>
          <button type="button" class="gsp-modal-close-btn" id="gsp-btn-close-modal">✕</button>
        </div>

        <div class="gsp-manager-container">
          <div class="gsp-manager-list-section">
            <div class="gsp-manager-section-header">
              <span>Your Commands (<code>//</code>)</span>
              <button type="button" class="gsp-btn-pill-action" id="gsp-btn-new-prompt">+ New Command</button>
            </div>
            <div class="gsp-manager-list">
              ${promptRowsHtml}
            </div>
          </div>

          <div class="gsp-manager-form-section">
            <h4 class="gsp-form-title">${isEditing ? `Edit /${targetPrompt.title}` : 'Add New Command'}</h4>
            <form id="gsp-prompt-editor-form">
              <input type="hidden" id="gsp-form-id" value="${targetPrompt.id}">
              
              <div class="gsp-input-group">
                <label class="gsp-input-label" for="gsp-form-title">Command Name (single word, e.g. fix, test)</label>
                <input type="text" id="gsp-form-title" class="gsp-input-field" required placeholder="e.g. fix" value="${targetPrompt.title}">
              </div>

              <div class="gsp-input-group">
                <label class="gsp-input-label" for="gsp-form-desc">Short Description</label>
                <input type="text" id="gsp-form-desc" class="gsp-input-field" placeholder="e.g. Fix bugs and logic issues" value="${targetPrompt.desc}">
              </div>

              <div class="gsp-input-group">
                <label class="gsp-input-label" for="gsp-form-model">Automatic Model Switch</label>
                <select id="gsp-form-model" class="gsp-input-field">
                  <option value="keep" ${targetPrompt.model === 'keep' ? 'selected' : ''}>No change (keep active model)</option>
                  <option value="flash" ${targetPrompt.model === 'flash' ? 'selected' : ''}>Gemini Flash</option>
                  <option value="pro" ${targetPrompt.model === 'pro' ? 'selected' : ''}>Gemini Pro</option>
                  <option value="thinking" ${targetPrompt.model === 'thinking' ? 'selected' : ''}>Flash Thinking</option>
                </select>
              </div>

              <div class="gsp-input-group">
                <label class="gsp-input-label" for="gsp-form-template">Prompt Text (Injected at beginning)</label>
                <textarea id="gsp-form-template" class="gsp-input-field" rows="4" required placeholder="Please analyze and fix the following code:">${targetPrompt.template}</textarea>
              </div>

              <div class="gsp-modal-actions">
                <button type="button" class="gsp-btn-secondary" id="gsp-btn-reset-defaults">Restore Defaults</button>
                <button type="submit" class="gsp-btn-primary">Save Command</button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Event handlers
      modal.querySelector('#gsp-btn-close-modal').addEventListener('click', () => backdrop.remove());

      modal.querySelector('#gsp-btn-new-prompt').addEventListener('click', () => {
        renderModalContent(null);
      });

      modal.querySelector('#gsp-btn-reset-defaults').addEventListener('click', async () => {
        if (confirm('Reset all prompt templates back to default commands?')) {
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
          if (confirm('Delete this prompt template?')) {
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

    if (editingPromptId) {
      const p = activePrompts.find(item => item.id === editingPromptId);
      renderModalContent(p || null);
    } else {
      renderModalContent(null);
    }

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.remove();
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
