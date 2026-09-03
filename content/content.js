/**
 * Main Content Script for Gemini Superpowers
 * Coordinates initialization of all modules
 */
(function () {
  'use strict';

  console.log('⚡ [Gemini Superpowers] Extension initialized');

  function initAll() {
    if (window.GSP) {
      if (window.GSP.initThemeSync) window.GSP.initThemeSync();
      if (window.GSP.initAutoFocus) window.GSP.initAutoFocus();
      if (window.GSP.initWideMode) window.GSP.initWideMode();
      if (window.GSP.initPromptCommands) window.GSP.initPromptCommands();
      if (window.GSP.initToolbar) window.GSP.initToolbar();
      if (window.GSP.initBulkDelete) window.GSP.initBulkDelete();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
