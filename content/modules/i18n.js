/**
 * Internationalization (i18n) Module for Gemini Superpowers
 * Supports English (en), Spanish (es), German (de), French (fr), Italian (it), Portuguese (pt)
 */
(function () {
  'use strict';

  const TRANSLATIONS = {
    en: {
      // Toolbar
      prompts_btn: '// Prompts',
      prompts_btn_title: 'Quick Prompts & Templates (//)',
      nav_top_title: 'Scroll to top of chat',
      nav_prev_title: 'Previous prompt',
      nav_next_title: 'Next prompt',
      wide_mode_title: 'Toggle Wide Mode (Full Width)',
      delete_all_btn: 'Delete all',
      delete_all_title: 'Delete all recent conversations',

      // Prompts Menu
      quick_prompts_header: '✨ Quick Prompts (//)',
      edit_prompts_btn: 'Edit Prompts',
      edit_prompts_title: 'Edit and manage prompts',
      menu_footer: '↑↓ navigate • Enter / Tab / Space to insert',

      // Prompt Manager Modal
      manager_title: 'Prompt Library Manager',
      your_commands: 'Your Commands (//)',
      new_command_btn: '+ New Command',
      edit_command_title: 'Edit //',
      add_command_title: 'Add New Command',
      field_cmd_name: 'Command Name (single word, e.g. fix, test)',
      field_short_desc: 'Short Description',
      field_auto_model: 'Automatic Model Switch',
      field_prompt_text: 'Prompt Text (Injected at beginning)',
      placeholder_desc: 'e.g. Fix bugs and logic issues',
      placeholder_template: 'Please analyze and fix the following code:',
      opt_model_keep: 'No change (keep active model)',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Restore Defaults',
      btn_save_command: 'Save Command',
      btn_edit: 'Edit',
      btn_delete: 'Delete',
      btn_export: 'Export JSON',
      btn_import: 'Import JSON',
      export_prompts_title: 'Export your prompts library as a JSON file',
      import_prompts_title: 'Import prompts from a JSON file',
      confirm_import_prompts: 'Import {count} prompt command(s) from this file?\n\nExisting commands with matching names will be updated and new ones will be added.',
      import_result_summary: 'Import completed successfully!\n\n• {added} command(s) added: {addedList}\n• {updated} command(s) updated\n• {identical} command(s) unchanged (identical)',
      import_result_no_new: 'Import completed successfully!\n\n• 0 new commands added\n• {updated} command(s) updated\n• {identical} command(s) unchanged (identical)',
      import_error_msg: 'Failed to import prompts: {error}',
      confirm_reset_defaults: 'Reset all prompt templates back to default commands?',
      confirm_delete_prompt: 'Delete this prompt template?',

      // Usage Limits Card
      usage_card_title: 'Usage Limits',
      usage_card_info: 'Official quotas refreshed with your activity',
      usage_5h_label: '5-Hour usage',
      usage_weekly_label: 'Weekly limit',
      usage_resets_label: 'Resets',
      usage_synced_status: 'Synced with your latest prompt',

      // Bulk Delete
      confirm_delete_all: 'Are you sure you want to delete all {count} recent conversations?\n\nThis action cannot be undone.',
      no_conversations: 'No recent conversations found to delete.',
      deleting_progress: 'Deleting {current}/{total}...'
    },

    es: {
      // Toolbar
      prompts_btn: '// Prompts',
      prompts_btn_title: 'Prompts rápidos y plantillas (//)',
      nav_top_title: 'Ir al inicio del chat',
      nav_prev_title: 'Prompt anterior',
      nav_next_title: 'Prompt siguiente',
      wide_mode_title: 'Modo ancho (Pantalla completa)',
      delete_all_btn: 'Borrar todo',
      delete_all_title: 'Borrar todas las conversaciones recientes',

      // Prompts Menu
      quick_prompts_header: '✨ Prompts Rápidos (//)',
      edit_prompts_btn: 'Editar Prompts',
      edit_prompts_title: 'Editar y gestionar plantillas de prompts',
      menu_footer: '↑↓ navegar • Enter / Tab / Espacio para insertar',

      // Prompt Manager Modal
      manager_title: 'Gestor de Biblioteca de Prompts',
      your_commands: 'Tus Comandos (//)',
      new_command_btn: '+ Nuevo Comando',
      edit_command_title: 'Editar //',
      add_command_title: 'Añadir Nuevo Comando',
      field_cmd_name: 'Nombre del comando (palabra única, ej. fix, test)',
      field_short_desc: 'Descripción corta',
      field_auto_model: 'Cambio automático de modelo',
      field_prompt_text: 'Texto del prompt (inyectado al inicio)',
      placeholder_desc: 'ej. Corrige errores y problemas de lógica',
      placeholder_template: 'Por favor, analiza y corrige lo siguiente:',
      opt_model_keep: 'Sin cambios (mantener modelo activo)',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Restaurar por defecto',
      btn_save_command: 'Guardar Comando',
      btn_edit: 'Editar',
      btn_delete: 'Eliminar',
      btn_export: 'Exportar JSON',
      btn_import: 'Importar JSON',
      export_prompts_title: 'Exportar tu biblioteca de prompts a un archivo JSON',
      import_prompts_title: 'Importar prompts desde un archivo JSON',
      confirm_import_prompts: '¿Importar {count} comando(s) de prompt desde este archivo?\n\nLos comandos existentes con el mismo nombre se actualizarán y los nuevos se añadirán.',
      import_result_summary: '¡Importación completada con éxito!\n\n• {added} comando(s) añadido(s): {addedList}\n• {updated} comando(s) actualizado(s)\n• {identical} comando(s) sin cambios (idénticos)',
      import_result_no_new: '¡Importación completada con éxito!\n\n• 0 comandos nuevos añadidos\n• {updated} comando(s) actualizado(s)\n• {identical} comando(s) sin cambios (idénticos)',
      import_error_msg: 'Error al importar prompts: {error}',
      confirm_reset_defaults: '¿Restaurar todas las plantillas a los comandos por defecto?',
      confirm_delete_prompt: '¿Eliminar esta plantilla de prompt?',

      // Usage Limits Card
      usage_card_title: 'Límites de Uso',
      usage_card_info: 'Cuotas oficiales sincronizadas con tu actividad',
      usage_5h_label: 'Uso en 5 horas',
      usage_weekly_label: 'Límite semanal',
      usage_resets_label: 'Se restablece',
      usage_synced_status: 'Sincronizado con tu último prompt',

      // Bulk Delete
      confirm_delete_all: '¿Estás seguro de que quieres eliminar todas las {count} conversaciones recientes?\n\nEsta acción no se puede deshacer.',
      no_conversations: 'No se encontraron conversaciones recientes para eliminar.',
      deleting_progress: 'Borrando {current}/{total}...'
    },

    de: {
      // Toolbar
      prompts_btn: '// Prompts',
      prompts_btn_title: 'Schnell-Prompts & Vorlagen (//)',
      nav_top_title: 'Zum Chat-Anfang scrollen',
      nav_prev_title: 'Vorheriger Prompt',
      nav_next_title: 'Nächster Prompt',
      wide_mode_title: 'Breitbildmodus (Volle Breite)',
      delete_all_btn: 'Alle löschen',
      delete_all_title: 'Alle letzten Unterhaltungen löschen',

      // Prompts Menu
      quick_prompts_header: '✨ Schnell-Prompts (//)',
      edit_prompts_btn: 'Prompts bearbeiten',
      edit_prompts_title: 'Prompts verwalten und anpassen',
      menu_footer: '↑↓ navigieren • Eingabe / Tab / Leertaste zum Einfügen',

      // Prompt Manager Modal
      manager_title: 'Prompt-Bibliothek-Manager',
      your_commands: 'Deine Befehle (//)',
      new_command_btn: '+ Neuer Befehl',
      edit_command_title: 'Bearbeiten //',
      add_command_title: 'Neuen Befehl hinzufügen',
      field_cmd_name: 'Befehlsname (einzelnes Wort, z. B. fix, test)',
      field_short_desc: 'Kurze Beschreibung',
      field_auto_model: 'Automatischer Modellwechsel',
      field_prompt_text: 'Prompt-Text (am Anfang eingefügt)',
      placeholder_desc: 'z. B. Behebt Fehler und Logikprobleme',
      placeholder_template: 'Bitte analysiere und korrigiere folgendes:',
      opt_model_keep: 'Keine Änderung (aktives Modell beibehalten)',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Standard wiederherstellen',
      btn_save_command: 'Befehl speichern',
      btn_edit: 'Bearbeiten',
      btn_delete: 'Löschen',
      btn_export: 'JSON exportieren',
      btn_import: 'JSON importieren',
      export_prompts_title: 'Exportiere deine Prompt-Bibliothek als JSON-Datei',
      import_prompts_title: 'Prompts aus einer JSON-Datei importieren',
      confirm_import_prompts: '{count} Prompt-Befehl(e) aus dieser Datei importieren?\n\nBestehende Befehle mit gleichem Namen werden aktualisiert und neue hinzugefügt.',
      import_result_summary: 'Import erfolgreich abgeschlossen!\n\n• {added} Befehl(e) hinzugefügt: {addedList}\n• {updated} Befehl(e) aktualisiert\n• {identical} Befehl(e) unverändert (identisch)',
      import_result_no_new: 'Import erfolgreich abgeschlossen!\n\n• 0 neue Befehle hinzugefügt\n• {updated} Befehl(e) aktualisiert\n• {identical} Befehl(e) unverändert (identisch)',
      import_error_msg: 'Fehler beim Importieren der Prompts: {error}',
      confirm_reset_defaults: 'Alle Prompt-Vorlagen auf Standard zurücksetzen?',
      confirm_delete_prompt: 'Diese Prompt-Vorlage löschen?',

      // Usage Limits Card
      usage_card_title: 'Nutzungslimits',
      usage_card_info: 'Offizielle Kontingente synchronisiert mit Aktivität',
      usage_5h_label: '5-Stunden-Nutzung',
      usage_weekly_label: 'Wöchentliches Limit',
      usage_resets_label: 'Zurücksetzung',
      usage_synced_status: 'Mit deinem letzten Prompt synchronisiert',

      // Bulk Delete
      confirm_delete_all: 'Möchtest du wirklich alle {count} letzten Unterhaltungen löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.',
      no_conversations: 'Keine letzten Unterhaltungen zum Löschen gefunden.',
      deleting_progress: 'Lösche {current}/{total}...'
    },

    fr: {
      // Toolbar
      prompts_btn: '// Prompts',
      prompts_btn_title: 'Prompts rapides et modèles (//)',
      nav_top_title: 'Défiler en haut du chat',
      nav_prev_title: 'Prompt précédent',
      nav_next_title: 'Prompt suivant',
      wide_mode_title: 'Mode large (Plein écran)',
      delete_all_btn: 'Tout supprimer',
      delete_all_title: 'Supprimer toutes les conversations récentes',

      // Prompts Menu
      quick_prompts_header: '✨ Prompts Rapides (//)',
      edit_prompts_btn: 'Modifier les prompts',
      edit_prompts_title: 'Gérer et personnaliser les prompts',
      menu_footer: '↑↓ naviguer • Entrée / Tab / Espace pour insérer',

      // Prompt Manager Modal
      manager_title: 'Gestionnaire de bibliothèque de prompts',
      your_commands: 'Vos Commandes (//)',
      new_command_btn: '+ Nouvelle Commande',
      edit_command_title: 'Modifier //',
      add_command_title: 'Ajouter une commande',
      field_cmd_name: 'Nom de commande (un mot, ex. fix, test)',
      field_short_desc: 'Description courte',
      field_auto_model: 'Changement de modèle automatique',
      field_prompt_text: 'Texte du prompt (injecté au début)',
      placeholder_desc: 'ex. Corrige les bugs et problèmes',
      placeholder_template: 'Veuillez analyser et corriger ce qui suit :',
      opt_model_keep: 'Aucun changement (garder le modèle actif)',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Restaurer par défaut',
      btn_save_command: 'Enregistrer la commande',
      btn_edit: 'Modifier',
      btn_delete: 'Supprimer',
      btn_export: 'Exporter JSON',
      btn_import: 'Importer JSON',
      export_prompts_title: 'Exporter votre bibliothèque de prompts au format JSON',
      import_prompts_title: 'Importer des prompts depuis un fichier JSON',
      confirm_import_prompts: 'Importer {count} commande(s) de prompt depuis ce fichier ?\n\nLes commandes existantes ayant le même nom seront mises à jour et les nouvelles seront ajoutées.',
      import_result_summary: 'Importation terminée avec succès !\n\n• {added} commande(s) ajoutée(s) : {addedList}\n• {updated} commande(s) mise(s) à jour\n• {identical} commande(s) inchangée(s) (identiques)',
      import_result_no_new: 'Importation terminée avec succès !\n\n• 0 nouvelle commande ajoutée\n• {updated} commande(s) mise(s) à jour\n• {identical} commande(s) inchangée(s) (identiques)',
      import_error_msg: 'Échec de l\'importation des prompts : {error}',
      confirm_reset_defaults: 'Réinitialiser tous les modèles aux valeurs par défaut ?',
      confirm_delete_prompt: 'Supprimer ce modèle de prompt ?',

      // Usage Limits Card
      usage_card_title: 'Limites d\'utilisation',
      usage_card_info: 'Quotas officiels synchronisés avec votre activité',
      usage_5h_label: 'Utilisation sur 5 h',
      usage_weekly_label: 'Limite hebdomadaire',
      usage_resets_label: 'Réinitialisation',
      usage_synced_status: 'Synchronisé avec votre dernier prompt',

      // Bulk Delete
      confirm_delete_all: 'Voulez-vous vraiment supprimer toutes les {count} conversations récentes ?\n\nCette action est irréversible.',
      no_conversations: 'Aucune conversation récente trouvée à supprimer.',
      deleting_progress: 'Suppression de {current}/{total}...'
    }
  };

  function getLanguage() {
    const raw = (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage?.()) || navigator.language || 'en';
    const lang = raw.toLowerCase().split('-')[0];
    return TRANSLATIONS[lang] ? lang : 'en';
  }

  const currentLang = getLanguage();

  function t(key, params = {}) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let str = dict[key] || TRANSLATIONS.en[key] || key;

    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  }

  window.GSP = window.GSP || {};
  window.GSP.t = t;
  window.GSP.currentLang = currentLang;
})();
