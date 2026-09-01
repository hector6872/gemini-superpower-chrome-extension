/**
 * Prompt Commands (//) Module for Gemini Superpowers
 * Handles single-word autocomplete commands (//fix, //test, //review, etc.),
 * robust keyboard navigation (↑/↓, Enter, Tab, Space), and auto-model switching.
 */
(function () {
  'use strict';

  const DEFAULT_PROMPTS = [
    {
      id: 'fix',
      title: 'fix',
      desc: 'Fix bugs, errors, and logic issues in the code or text',
      template: 'Please analyze and fix the following code or text. Explain what caused the issue, provide the corrected version, and ensure best practices and edge cases are handled:',
      model: 'pro'
    },
    {
      id: 'test',
      title: 'test',
      desc: 'Generate comprehensive unit tests and mock cases',
      template: 'Please write comprehensive unit tests for the following code, including happy paths, edge cases, error handling, and mock assertions:',
      model: 'pro'
    },
    {
      id: 'review',
      title: 'review',
      desc: 'Review code for security, architecture, and performance',
      template: 'Please review the following code for potential bugs, security vulnerabilities, performance optimization, and best practices. Provide a refactored proposal with explanations:',
      model: 'pro'
    },
    {
      id: 'explain',
      title: 'explain',
      desc: 'Explain concepts or code step-by-step in clear terms',
      template: 'Please explain the following code or concept in clear, structured, and easy-to-understand terms with step-by-step examples:',
      model: 'flash'
    },
    {
      id: 'optimize',
      title: 'optimize',
      desc: 'Optimize performance, algorithms, and complexity',
      template: 'Please analyze and optimize the performance and time/space complexity of the following code. Provide the improved version and benchmark rationale:',
      model: 'thinking'
    },
    {
      id: 'doc',
      title: 'doc',
      desc: 'Generate clear technical documentation and JSDoc/docstrings',
      template: 'Please write clear, comprehensive documentation for the following code, including overview, parameter types, return values, and usage examples:',
      model: 'keep'
    },
    {
      id: 'summary',
      title: 'summary',
      desc: 'Condense into 3-5 core takeaways and key conclusions',
      template: 'Please provide an executive summary of the following content, highlighting 3-5 key takeaways, actionable conclusions, and recommended next steps:',
      model: 'flash'
    },
    {
      id: 'translate',
      title: 'translate',
      desc: 'Translate with high precision, natural tone, and domain nuance',
      template: 'Translate the following text accurately, preserving its natural tone, technical terminology, and contextual nuance:',
      model: 'keep'
    }
  ];

  let activePrompts = [...DEFAULT_PROMPTS];
  let menuElement = null;
  let selectedIndex = 0;
  let filteredPrompts = [];
  let currentQuery = '';

  // Load prompts from storage and migrate old prompts if present
  async function loadPrompts() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const data = await chrome.storage.local.get('gsp_custom_prompts');
        const stored = data.gsp_custom_prompts;
        const isOldFormat = Array.isArray(stored) && stored.some(p => p.id === 'code-review' || p.title.includes(' '));
        
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

  function getModelBadgeText(modelKey) {
    switch (modelKey) {
      case 'flash': return '⚡ Flash';
      case 'pro': return '🌟 Pro';
      case 'thinking': return '🧠 Thinking';
      default: return '';
    }
  }

  // Model switching
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

  // Insert text into Gemini Input
  function insertPromptIntoGemini(templateText) {
    const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
    if (!input) return;

    input.focus();

    // Read current text and strip out the //command
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

      // Move caret to the end
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

  // Render // Prompt Menu
  function renderPromptMenu(query, inputElement) {
    currentQuery = (query || '').toLowerCase().trim();

    filteredPrompts = activePrompts.filter(p => {
      if (!currentQuery) return true;
      return p.title.toLowerCase().startsWith(currentQuery) ||
             p.title.toLowerCase().includes(currentQuery) ||
             (p.desc && p.desc.toLowerCase().includes(currentQuery));
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
        <span>✨ Quick Prompts (<code>//</code>)</span>
        <span>↑↓ navigate • Enter / Tab / Space to insert</span>
      </div>
      <ul class="gsp-prompt-list">
        ${itemsHtml}
      </ul>
    `;

    // Click handlers
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

  function selectPrompt(promptItem) {
    closePromptMenu();
    if (!promptItem) return;

    if (promptItem.model && promptItem.model !== 'keep') {
      switchGeminiModel(promptItem.model);
    }

    insertPromptIntoGemini(promptItem.template);
  }

  // Optimize prompt feature
  function optimizeCurrentPrompt() {
    const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
    if (!input) return;

    let text = input.innerText || input.value || '';
    text = text.trim();

    if (!text) return;

    const optimized = `Act as an expert in the topic. Analyze, execute, and format the response with clear structure, precision, and depth:\n\n${text}\n\nConstraints:\n- Be clear, direct, and well-structured with markdown headings and code blocks where applicable.\n- Avoid unnecessary filler text.`;

    if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
      input.innerHTML = '';
      optimized.split('\n').forEach(line => {
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
      input.value = optimized;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
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

  // Monitor input for // command
  function setupPromptCommandListener() {
    document.addEventListener('input', (e) => {
      const input = window.GSP?.getGeminiInput ? window.GSP.getGeminiInput() : null;
      if (!input || (!input.contains(e.target) && input !== e.target)) return;

      const text = input.innerText || input.value || '';

      // Check if user typed //command followed by space (e.g. //fix )
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

    // Register on window & document with capture: true
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
  window.GSP.optimizeCurrentPrompt = optimizeCurrentPrompt;
  window.GSP.insertPromptIntoGemini = insertPromptIntoGemini;
})();
