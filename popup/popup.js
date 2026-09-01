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

  let prompts = [];

  async function loadPrompts() {
    const data = await chrome.storage.local.get('gsp_custom_prompts');
    if (data.gsp_custom_prompts && Array.isArray(data.gsp_custom_prompts) && data.gsp_custom_prompts.length > 0) {
      prompts = data.gsp_custom_prompts;
    } else {
      prompts = [...DEFAULT_PROMPTS];
      await savePrompts();
    }
    prompts.sort((a, b) => a.title.localeCompare(b.title));
    renderList();
  }

  async function savePrompts() {
    prompts.sort((a, b) => a.title.localeCompare(b.title));
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
