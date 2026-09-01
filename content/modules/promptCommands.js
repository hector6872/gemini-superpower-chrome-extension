/**
 * Prompt Commands (//) Module for Gemini Superpowers
 * Handles autocomplete menu, placeholders filling modal, and auto-model switching
 */
(function () {
  'use strict';

  const DEFAULT_PROMPTS = [
    {
      id: 'code-review',
      title: 'Code Review & Refactor',
      desc: 'Deeply review code for security, clean architecture, and performance',
      template: 'Please review the following {{language}} code:\n\n```{{language}}\n{{code}}\n```\n\nAnalyze:\n1. Potential bugs and security vulnerabilities\n2. Performance optimization opportunities\n3. Best practices, readability, and maintainability\n4. Refactored code proposal with comments',
      model: 'pro'
    },
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      desc: 'Condense long text into key takeaways and actionable conclusions',
      template: 'Please summarize the following text in an executive format:\n- 3-5 core takeaways in bullet points\n- Key conclusions and recommended next steps\n- Target audience level: {{audience}}\n\nText:\n{{text}}',
      model: 'flash'
    },
    {
      id: 'deep-reasoning',
      title: 'Deep Architecture & Reasoning',
      desc: 'Step-by-step analysis of a complex engineering or logical problem',
      template: 'I need an architectural solution and in-depth analysis for the following challenge:\n\n{{problem}}\n\nPlease reason step-by-step considering trade-offs, scalability, edge cases, and a conceptual Mermaid diagram if applicable.',
      model: 'thinking'
    },
    {
      id: 'professional-translator',
      title: 'Professional Translator',
      desc: 'Translate preserving tone, nuances, and technical domain terminology',
      template: 'Translate the following text into {{target_language}} with a {{tone}} tone (preserve technical terms and domain nuance):\n\n"{{text}}"',
      model: 'keep'
    },
    {
      id: 'prompt-enhancer',
      title: 'Prompt Enhancer',
      desc: 'Transform a raw idea into a high-precision structured LLM prompt',
      template: 'Act as an expert prompt engineer. Transform and optimize the following instruction to achieve the best possible response from an advanced LLM:\n\nRaw prompt: "{{my_prompt}}"\n\nGenerate the enhanced prompt including context, role, constraints, output format, and few-shot examples.',
      model: 'keep'
    }
  ];

  let activePrompts = [...DEFAULT_PROMPTS];
  let menuElement = null;
  let selectedIndex = 0;
  let filteredPrompts = [];
  let triggerStartPos = -1;

  // Load prompts from storage if present
  async function loadPrompts() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('gsp_custom_prompts');
        if (data.gsp_custom_prompts && Array.isArray(data.gsp_custom_prompts) && data.gsp_custom_prompts.length > 0) {
          activePrompts = data.gsp_custom_prompts;
        } else {
          activePrompts = [...DEFAULT_PROMPTS];
          await chrome.storage.local.set({ gsp_custom_prompts: DEFAULT_PROMPTS });
        }
      }
    } catch (e) {
      console.debug('Prompts storage load:', e);
    }
  }

  // Model names label helper
  function getModelBadgeText(model) {
    switch (model) {
      case 'pro': return 'Gemini Pro';
      case 'thinking': return 'Thinking';
      case 'flash': return 'Flash';
      default: return 'No change';
    }
  }

  // Switch model in Gemini UI
  async function switchGeminiModel(targetModel) {
    if (!targetModel || targetModel === 'keep') return;

    try {
      // Find model selector dropdown in Gemini interface
      const modelSelectors = [
        '[data-test-id="model-selector"]',
        'button[aria-haspopup="menu"][aria-label*="model" i]',
        'button[aria-haspopup="menu"][aria-label*="Gemini" i]',
        'button[aria-haspopup="menu"]',
        '.model-select-button',
        '.model-picker-btn'
      ];

      let triggerBtn = null;
      for (const sel of modelSelectors) {
        const btns = Array.from(document.querySelectorAll(sel));
        triggerBtn = btns.find(b => {
          const text = (b.textContent || b.getAttribute('aria-label') || '').toLowerCase();
          return text.includes('flash') || text.includes('pro') || text.includes('thinking') || text.includes('gemini');
        });
        if (triggerBtn) break;
      }

      if (!triggerBtn) {
        console.debug('Model selector button not found');
        return;
      }

      // Click to open model menu
      triggerBtn.click();
      await new Promise(r => setTimeout(r, 120));

      // Look for menu items
      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"], mat-option, .mat-mdc-menu-item'));
      let desiredItem = null;

      if (targetModel === 'pro') {
        desiredItem = menuItems.find(el => el.textContent.toLowerCase().includes('pro'));
      } else if (targetModel === 'thinking') {
        desiredItem = menuItems.find(el => el.textContent.toLowerCase().includes('thinking'));
      } else if (targetModel === 'flash') {
        desiredItem = menuItems.find(el => el.textContent.toLowerCase().includes('flash'));
      }

      if (desiredItem) {
        desiredItem.click();
        showToast(`Model switched to: ${getModelBadgeText(targetModel)}`);
      } else {
        // Close menu if option not found
        document.body.click();
      }
    } catch (e) {
      console.debug('Error switching model:', e);
    }
  }

  // Extract placeholders from template e.g. {{variable}} or [variable]
  function extractPlaceholders(template) {
    const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
    const unique = [];
    for (const m of matches) {
      const name = m.replace(/[{}]/g, '').trim();
      if (!unique.includes(name)) {
        unique.push(name);
      }
    }
    return unique;
  }

  // Show placeholder modal
  function openPlaceholderModal(promptItem, onComplete) {
    const placeholders = extractPlaceholders(promptItem.template);
    if (placeholders.length === 0) {
      onComplete(promptItem.template);
      return;
    }

    const backdrop = document.createElement('div');
    backdrop.className = 'gsp-modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'gsp-modal';

    let fieldsHtml = '';
    placeholders.forEach((ph, idx) => {
      const isMultiline = ph.toLowerCase().includes('code') || ph.toLowerCase().includes('text') || ph.toLowerCase().includes('problem');
      fieldsHtml += `
        <div class="gsp-input-group">
          <label class="gsp-input-label" for="gsp-ph-${idx}">${ph.replace(/_/g, ' ')}</label>
          ${isMultiline 
            ? `<textarea class="gsp-input-field" id="gsp-ph-${idx}" data-ph="${ph}" rows="3" placeholder="Enter ${ph}..."></textarea>`
            : `<input type="text" class="gsp-input-field" id="gsp-ph-${idx}" data-ph="${ph}" placeholder="Enter ${ph}..." />`
          }
        </div>
      `;
    });

    modal.innerHTML = `
      <h3 class="gsp-modal-title">✨ ${promptItem.title}</h3>
      <p class="gsp-modal-desc">${promptItem.desc || 'Fill in the parameters to generate the prompt:'}</p>
      <form id="gsp-modal-form">
        ${fieldsHtml}
        <div class="gsp-modal-actions">
          <button type="button" class="gsp-btn-secondary" id="gsp-cancel-modal">Cancel</button>
          <button type="submit" class="gsp-btn-primary">Insert Prompt</button>
        </div>
      </form>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Focus first input
    const firstInput = modal.querySelector('.gsp-input-field');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);

    function cleanup() {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
    }

    modal.querySelector('#gsp-cancel-modal').addEventListener('click', cleanup);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) cleanup();
    });

    modal.querySelector('#gsp-modal-form').addEventListener('submit', (e) => {
      e.preventDefault();
      let resultText = promptItem.template;

      placeholders.forEach((ph, idx) => {
        const input = modal.querySelector(`#gsp-ph-${idx}`);
        const val = input ? input.value.trim() : '';
        const regex = new RegExp(`\\{\\{${ph}\\}\\}`, 'g');
        resultText = resultText.replace(regex, val || `[${ph}]`);
      });

      cleanup();
      onComplete(resultText);
    });
  }

  // Insert text into Gemini Input
  function insertPromptIntoGemini(text) {
    const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
    if (!input) return;

    input.focus();

    if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
      // Clear current content (which might have //...)
      input.innerHTML = '';
      
      // Split into paragraphs / lines
      const lines = text.split('\n');
      lines.forEach((line, idx) => {
        const p = document.createElement('p');
        p.textContent = line || '\u200B'; // zero width space for empty lines
        input.appendChild(p);
      });

      // Dispatch input events
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      // Move caret to end
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(input);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.setSelectionRange(text.length, text.length);
    }
  }

  // Render // Prompt Menu
  function renderPromptMenu(query, inputElement) {
    filteredPrompts = activePrompts.filter(p => {
      if (!query) return true;
      const q = query.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q));
    });

    if (filteredPrompts.length === 0) {
      closePromptMenu();
      return;
    }

    if (!menuElement) {
      menuElement = document.createElement('div');
      menuElement.className = 'gsp-prompt-menu';
      document.body.appendChild(menuElement);
    }

    // Position menu right above the input element
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
        <li class="gsp-prompt-item ${isSelected ? 'gsp-selected' : ''}" data-idx="${idx}">
          <div class="gsp-prompt-item-left">
            <span class="gsp-prompt-title">${p.title}</span>
            ${p.desc ? `<span class="gsp-prompt-desc">${p.desc}</span>` : ''}
          </div>
          ${modelBadge}
        </li>
      `;
    });

    menuElement.innerHTML = `
      <div class="gsp-prompt-header">
        <span>✨ Quick Prompts (<code>//</code>)</span>
        <span>↑↓ to navigate • Enter to select</span>
      </div>
      <ul class="gsp-prompt-list">
        ${itemsHtml}
      </ul>
    `;

    // Click handlers
    menuElement.querySelectorAll('.gsp-prompt-item').forEach(item => {
      item.addEventListener('click', () => {
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

  function selectPrompt(promptItem) {
    closePromptMenu();
    if (!promptItem) return;

    // Switch model if specified
    if (promptItem.model && promptItem.model !== 'keep') {
      switchGeminiModel(promptItem.model);
    }

    // Handle placeholders
    openPlaceholderModal(promptItem, (finalText) => {
      insertPromptIntoGemini(finalText);
    });
  }

  let toastTimeout = null;
  function showToast(msg) {
    let toast = document.querySelector('.gsp-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'gsp-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('gsp-toast-show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('gsp-toast-show');
    }, 2400);
  }

  // Optimize prompt feature
  function optimizeCurrentPrompt() {
    const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
    if (!input) return;

    let text = input.innerText || input.value || '';
    text = text.trim();

    if (!text) {
      showToast('Type a prompt in the chat first to optimize it');
      return;
    }

    const optimized = `Act as a world-class domain expert. Analyze and address the following request with maximum rigor and depth:

### 🎯 Primary Objective
${text}

### 📋 Response Requirements
1. **Clear Structure**: Use clean headings, bullet points, and Markdown formatting.
2. **Depth & Precision**: Provide exhaustive coverage, addressing subtle nuances and edge cases.
3. **Actionable Implementation**: Provide concrete examples, code snippets, or workflows where applicable.
4. **Executive Summary**: Conclude with the top 3 critical takeaways.`;

    insertPromptIntoGemini(optimized);
    showToast('✨ Prompt optimized successfully');
  }

  // Setup input key listeners
  function initPromptCommands() {
    loadPrompts();

    // Listen to storage changes
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes) => {
        if (changes.gsp_custom_prompts) {
          activePrompts = changes.gsp_custom_prompts.newValue || [...DEFAULT_PROMPTS];
        }
      });
    }

    // Monitor keydown & input
    document.addEventListener('input', (e) => {
      const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
      if (!input || !input.contains(e.target) && input !== e.target) return;

      const currentText = input.innerText || input.value || '';
      const match = currentText.match(/\/\/([a-zA-Z0-9_-]*)$/);

      if (match) {
        renderPromptMenu(match[1], input);
      } else {
        closePromptMenu();
      }
    }, true);

    document.addEventListener('keydown', (e) => {
      if (!menuElement) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredPrompts.length;
        renderPromptMenu('', window.GSP.getGeminiInput());
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredPrompts.length) % filteredPrompts.length;
        renderPromptMenu('', window.GSP.getGeminiInput());
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filteredPrompts[selectedIndex]) {
          e.preventDefault();
          selectPrompt(filteredPrompts[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        closePromptMenu();
      }
    }, true);
  }

  window.GSP = window.GSP || {};
  window.GSP.initPromptCommands = initPromptCommands;
  window.GSP.optimizeCurrentPrompt = optimizeCurrentPrompt;
  window.GSP.showToast = showToast;
})();
