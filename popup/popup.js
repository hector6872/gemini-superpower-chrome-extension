/**
 * Popup Script for Gemini Superpowers
 * Manages prompt templates, importing/exporting, and custom options
 */
document.addEventListener('DOMContentLoaded', async () => {
  const promptsListEl = document.getElementById('prompts-list');
  const btnAddPrompt = document.getElementById('btn-add-prompt');
  const modal = document.getElementById('prompt-modal');
  const form = document.getElementById('prompt-form');
  const modalTitle = document.getElementById('modal-title');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnResetDefaults = document.getElementById('btn-reset-defaults');
  const btnExport = document.getElementById('btn-export');
  const importFile = document.getElementById('import-file');

  const inputId = document.getElementById('edit-prompt-id');
  const inputTitle = document.getElementById('prompt-title');
  const inputDesc = document.getElementById('prompt-desc');
  const inputModel = document.getElementById('prompt-model');
  const inputTemplate = document.getElementById('prompt-template');

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

  let prompts = [];

  async function loadPrompts() {
    const data = await chrome.storage.local.get('gsp_custom_prompts');
    if (data.gsp_custom_prompts && Array.isArray(data.gsp_custom_prompts) && data.gsp_custom_prompts.length > 0) {
      prompts = data.gsp_custom_prompts;
    } else {
      prompts = [...DEFAULT_PROMPTS];
      await savePrompts();
    }
    renderList();
  }

  async function savePrompts() {
    await chrome.storage.local.set({ gsp_custom_prompts: prompts });
  }

  function getModelLabel(model) {
    switch (model) {
      case 'pro': return 'Gemini Pro';
      case 'thinking': return 'Thinking';
      case 'flash': return 'Flash';
      default: return 'No change';
    }
  }

  function renderList() {
    promptsListEl.innerHTML = '';

    if (prompts.length === 0) {
      promptsListEl.innerHTML = '<p style="text-align:center; color: var(--text-muted); font-size: 12.5px;">No templates saved.</p>';
      return;
    }

    prompts.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'prompt-card';
      card.innerHTML = `
        <div class="prompt-card-header">
          <span class="prompt-card-title">${p.title}</span>
          <div class="prompt-card-actions">
            <button class="btn-icon btn-edit" title="Edit" data-idx="${idx}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button class="btn-icon btn-delete" title="Delete" data-idx="${idx}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
          </div>
        </div>
        ${p.desc ? `<span class="prompt-card-desc">${p.desc}</span>` : ''}
        <div class="prompt-card-meta">
          <span class="prompt-badge">Model: ${getModelLabel(p.model)}</span>
        </div>
      `;

      card.querySelector('.btn-edit').addEventListener('click', () => openEditModal(idx));
      card.querySelector('.btn-delete').addEventListener('click', () => deletePrompt(idx));

      promptsListEl.appendChild(card);
    });
  }

  function openEditModal(idx = null) {
    if (idx !== null) {
      modalTitle.textContent = 'Edit Prompt';
      const p = prompts[idx];
      inputId.value = p.id || String(idx);
      inputTitle.value = p.title || '';
      inputDesc.value = p.desc || '';
      inputModel.value = p.model || 'keep';
      inputTemplate.value = p.template || '';
    } else {
      modalTitle.textContent = 'New Prompt';
      inputId.value = '';
      inputTitle.value = '';
      inputDesc.value = '';
      inputModel.value = 'keep';
      inputTemplate.value = '';
    }
    modal.style.display = 'flex';
    inputTitle.focus();
  }

  function closeModal() {
    modal.style.display = 'none';
  }

  async function deletePrompt(idx) {
    if (confirm(`Delete template "${prompts[idx].title}"?`)) {
      prompts.splice(idx, 1);
      await savePrompts();
      renderList();
    }
  }

  btnAddPrompt.addEventListener('click', () => openEditModal(null));
  btnModalCancel.addEventListener('click', closeModal);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = inputId.value || 'prompt-' + Date.now();
    const newPrompt = {
      id,
      title: inputTitle.value.trim(),
      desc: inputDesc.value.trim(),
      model: inputModel.value,
      template: inputTemplate.value
    };

    const existingIdx = prompts.findIndex(p => p.id === id);
    if (existingIdx >= 0) {
      prompts[existingIdx] = newPrompt;
    } else {
      prompts.push(newPrompt);
    }

    await savePrompts();
    closeModal();
    renderList();
  });

  btnResetDefaults.addEventListener('click', async () => {
    if (confirm('Restore all default prompt templates?')) {
      prompts = [...DEFAULT_PROMPTS];
      await savePrompts();
      renderList();
    }
  });

  // Export prompts to JSON
  btnExport.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-prompts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import prompts from JSON
  importFile.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          prompts = imported;
          await savePrompts();
          renderList();
          alert('Prompt templates imported successfully!');
        } else {
          alert('Invalid file format.');
        }
      } catch (err) {
        alert('Error reading JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  await loadPrompts();
});
