/**
 * Internationalization (i18n) Module for Gemini Superpowers
 * Supports English (en), Spanish (es), German (de), French (fr), Italian (it), Portuguese (pt), Japanese (ja)
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
      edit_prompts_btn: 'Library',
      edit_prompts_title: 'Open prompt library and manager',
      menu_footer: '↑↓ navigate • Enter / Tab / Space to insert',

      // Prompt Manager Modal
      manager_title: 'Prompt Library Manager',
      your_commands: 'Prompts (//)',
      new_command_btn: 'New Prompt',
      edit_command_title: 'Edit //',
      add_command_title: 'New Prompt',
      field_cmd_name: 'Shortcut name',
      field_short_desc: 'Description (optional)',
      field_auto_model: 'Change model automatically',
      field_prompt_text: 'Prompt content',
      placeholder_desc: 'e.g. Fix bugs and logic issues',
      placeholder_template: 'Please analyze and fix the following code:',
      opt_model_keep: 'Keep current',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Restore Defaults',
      btn_save_command: 'Save',
      btn_update_command: 'Update',
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
      confirm_reset_defaults: 'Restore default prompts?\n\nThis will remove all your current prompt templates and restore the initial default list.',
      confirm_delete_prompt: 'Delete this prompt template?',
      btn_delete_all_prompts: 'Delete All',
      delete_all_prompts_title: 'Delete all prompt commands',
      confirm_delete_all_prompts: 'Are you sure you want to delete all prompt commands?\n\nThis will remove all your quick prompts.',
      empty_prompts_title: 'No quick prompts yet',
      empty_prompts_desc: 'You don\'t have any quick prompts. Create your first prompt using the form, import from JSON, or restore defaults.',
      btn_cancel: 'Cancel',
      back_to_library: 'Back to library',
      search_prompts_placeholder: 'Search prompts...',
      clear_filter_btn: 'Clear filter',
      no_prompts_found: 'No prompts found matching "{query}"',
      cmd_name_exists: 'A prompt with the name "//{name}" already exists. Please choose a different name.',

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
      edit_prompts_btn: 'Biblioteca',
      edit_prompts_title: 'Abrir biblioteca y gestor de prompts',
      menu_footer: '↑↓ navegar • Enter / Tab / Espacio para insertar',

      // Prompt Manager Modal
      manager_title: 'Gestor de Biblioteca de Prompts',
      your_commands: 'Prompts (//)',
      new_command_btn: 'Nuevo prompt',
      edit_command_title: 'Editar //',
      add_command_title: 'Nuevo prompt',
      field_cmd_name: 'Nombre del atajo',
      field_short_desc: 'Descripción (opcional)',
      field_auto_model: 'Cambiar modelo automáticamente',
      field_prompt_text: 'Contenido del prompt',
      placeholder_desc: 'ej. Corrige errores y problemas de lógica',
      placeholder_template: 'Por favor, analiza y corrige lo siguiente:',
      opt_model_keep: 'Mantener actual',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Restaurar por defecto',
      btn_save_command: 'Guardar',
      btn_update_command: 'Actualizar',
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
      confirm_reset_defaults: '¿Restaurar los prompts predeterminados?\n\nEsta acción borrará todos tus prompts actuales y restablecerá la lista inicial.',
      confirm_delete_prompt: '¿Eliminar esta plantilla de prompt?',
      btn_delete_all_prompts: 'Borrar todos',
      delete_all_prompts_title: 'Borrar todos los comandos de prompt',
      confirm_delete_all_prompts: '¿Estás seguro de que quieres borrar todos los comandos de prompt?\n\nEsta acción eliminará todos tus accesos rápidos.',
      empty_prompts_title: 'No hay accesos de prompt todavía',
      empty_prompts_desc: 'No tienes prompts de acceso rápido. Crea el primero con el formulario, importa desde un JSON o restaura los predeterminados.',
      btn_cancel: 'Cancelar',
      back_to_library: 'Volver a la biblioteca',
      search_prompts_placeholder: 'Buscar prompts...',
      clear_filter_btn: 'Limpiar filtro',
      no_prompts_found: 'No se encontraron prompts que coincidan con "{query}"',
      cmd_name_exists: 'Ya existe un prompt con el nombre "//{name}". Por favor, elige un nombre diferente.',

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
      edit_prompts_btn: 'Bibliothek',
      edit_prompts_title: 'Prompt-Bibliothek öffnen',
      menu_footer: '↑↓ navigieren • Eingabe / Tab / Leertaste zum Einfügen',

      // Prompt Manager Modal
      manager_title: 'Prompt-Bibliothek-Manager',
      your_commands: 'Prompts (//)',
      new_command_btn: 'Neuer Prompt',
      edit_command_title: 'Bearbeiten //',
      add_command_title: 'Neuer Prompt',
      field_cmd_name: 'Kürzel-Name',
      field_short_desc: 'Beschreibung (optional)',
      field_auto_model: 'Modell automatisch wechseln',
      field_prompt_text: 'Prompt-Inhalt',
      placeholder_desc: 'z. B. Behebt Fehler und Logikprobleme',
      placeholder_template: 'Bitte analysiere und korrigiere folgendes:',
      opt_model_keep: 'Aktuelles Modell',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Standard wiederherstellen',
      btn_save_command: 'Speichern',
      btn_update_command: 'Aktualisieren',
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
      confirm_reset_defaults: 'Standard-Prompts wiederherstellen?\n\nDadurch werden alle Ihre aktuellen Prompts gelöscht und die Standardliste wiederhergestellt.',
      confirm_delete_prompt: 'Diese Prompt-Vorlage löschen?',
      btn_delete_all_prompts: 'Alle löschen',
      delete_all_prompts_title: 'Alle Prompt-Befehle löschen',
      confirm_delete_all_prompts: 'Möchten Sie wirklich alle Prompt-Befehle löschen?\n\nDadurch werden alle Ihre Schnell-Prompts entfernt.',
      empty_prompts_title: 'Noch keine Schnell-Prompts',
      empty_prompts_desc: 'Sie haben keine Schnell-Prompts. Erstellen Sie Ihren ersten Prompt, importieren Sie aus einer JSON-Datei oder stellen Sie die Standardwerte wieder her.',
      btn_cancel: 'Abbrechen',
      back_to_library: 'Zurück zur Bibliothek',
      search_prompts_placeholder: 'Prompts suchen...',
      clear_filter_btn: 'Filter löschen',
      no_prompts_found: 'Keine Prompts gefunden für "{query}"',
      cmd_name_exists: 'Ein Prompt mit dem Namen "//{name}" existiert bereits. Bitte wählen Sie einen anderen Namen.',

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
      edit_prompts_btn: 'Bibliothèque',
      edit_prompts_title: 'Ouvrir la bibliothèque de prompts',
      menu_footer: '↑↓ naviguer • Entrée / Tab / Espace pour insérer',

      // Prompt Manager Modal
      manager_title: 'Gestionnaire de bibliothèque de prompts',
      your_commands: 'Prompts (//)',
      new_command_btn: 'Nouveau prompt',
      edit_command_title: 'Modifier //',
      add_command_title: 'Nouveau prompt',
      field_cmd_name: 'Nom du raccourci',
      field_short_desc: 'Description (optionnel)',
      field_auto_model: 'Changer de modèle automatiquement',
      field_prompt_text: 'Contenu du prompt',
      placeholder_desc: 'ex. Corrige les bugs et problèmes',
      placeholder_template: 'Veuillez analyser et corriger ce qui suit :',
      opt_model_keep: 'Garder actuel',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Restaurar par défaut',
      btn_save_command: 'Enregistrer',
      btn_update_command: 'Mettre à jour',
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
      confirm_reset_defaults: 'Restaurer les prompts par défaut ?\n\nTous vos prompts actuels seront supprimés et la liste initiale sera rétablie.',
      confirm_delete_prompt: 'Supprimer ce modèle de prompt ?',
      btn_delete_all_prompts: 'Tout supprimer',
      delete_all_prompts_title: 'Supprimer toutes les commandes de prompt',
      confirm_delete_all_prompts: 'Voulez-vous vraiment supprimer toutes les commandes de prompt ?\n\nTous vos prompts rapides seront supprimés.',
      empty_prompts_title: 'Aucun prompt rapide pour le moment',
      empty_prompts_desc: 'Vous n\'avez aucun prompt d\'accès rapide. Créez votre premier prompt, importez depuis un fichier JSON ou restaurez les valeurs par défaut.',
      btn_cancel: 'Annuler',
      back_to_library: 'Retour à la bibliothèque',
      search_prompts_placeholder: 'Rechercher des prompts...',
      clear_filter_btn: 'Effacer le filtre',
      no_prompts_found: 'Aucun prompt trouvé pour "{query}"',
      cmd_name_exists: 'Un prompt nommé "//{name}" existe déjà. Veuillez choisir un autre nom.',

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
    },

    it: {
      // Toolbar
      prompts_btn: '// Prompts',
      prompts_btn_title: 'Prompt rapidi e modelli (//)',
      nav_top_title: 'Torna all\'inizio della chat',
      nav_prev_title: 'Prompt precedente',
      nav_next_title: 'Prompt successivo',
      wide_mode_title: 'Modalità ampia (Schermo intero)',
      delete_all_btn: 'Elimina tutto',
      delete_all_title: 'Elimina tutte le conversazioni recenti',

      // Prompts Menu
      quick_prompts_header: '✨ Prompt Rapidi (//)',
      edit_prompts_btn: 'Libreria',
      edit_prompts_title: 'Apri la libreria di prompt',
      menu_footer: '↑↓ per navigare • Invio / Tab / Spazio per inserire',

      // Prompt Manager Modal
      manager_title: 'Gestore della libreria di prompt',
      your_commands: 'Prompts (//)',
      new_command_btn: 'Nuovo prompt',
      edit_command_title: 'Modifica //',
      add_command_title: 'Nuovo prompt',
      field_cmd_name: 'Nome della scorciatoia',
      field_short_desc: 'Descrizione (opzionale)',
      field_auto_model: 'Cambia modello automaticamente',
      field_prompt_text: 'Contenuto del prompt',
      placeholder_desc: 'es. Correggi bug ed errori',
      placeholder_template: 'Per favore analizza e correggi il codice o testo seguente:',
      opt_model_keep: 'Mantieni attuale',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Ripristina predefiniti',
      btn_save_command: 'Salva',
      btn_update_command: 'Aggiorna',
      btn_edit: 'Modifica',
      btn_delete: 'Elimina',
      btn_export: 'Esporta JSON',
      btn_import: 'Importa JSON',
      export_prompts_title: 'Esporta la libreria di prompt in un file JSON',
      import_prompts_title: 'Importa prompt da un file JSON',
      confirm_import_prompts: 'Importare {count} comando/i di prompt da questo file?\n\nI comandi esistenti con lo stesso nome verranno aggiornati e quelli nuovi aggiunti.',
      import_result_summary: 'Importazione completata con successo!\n\n• {added} comando/i aggiunto/i: {addedList}\n• {updated} comando/i aggiornato/i\n• {identical} comando/i invariato/i (identico)',
      import_result_no_new: 'Importazione completata con successo!\n\n• 0 nuovi comandi aggiunti\n• {updated} comando/i aggiornato/i\n• {identical} comando/i invariato/i (identico)',
      import_error_msg: 'Impossibile importare i prompt: {error}',
      confirm_reset_defaults: 'Ripristinare i prompt predefiniti?\n\nTutti i tuoi prompt attuali verranno eliminati e verrà ripristinato l\'elenco iniziale.',
      confirm_delete_prompt: 'Eliminare questo modello di prompt?',
      btn_delete_all_prompts: 'Elimina tutti',
      delete_all_prompts_title: 'Elimina tutti i comandi di prompt',
      confirm_delete_all_prompts: 'Sei sicuro di voler eliminare tutti i comandi di prompt?\n\nVerranno rimossi tutti i tuoi prompt rapidi.',
      empty_prompts_title: 'Nessun prompt rapido salvato',
      empty_prompts_desc: 'Non hai prompt di accesso rapido. Crea il tuo primo prompt usando il modulo, importa da un file JSON o ripristina i predefiniti.',
      btn_cancel: 'Annulla',
      back_to_library: 'Torna alla libreria',
      search_prompts_placeholder: 'Cerca prompt...',
      clear_filter_btn: 'Cancella filtro',
      no_prompts_found: 'Nessun prompt trovato per "{query}"',
      cmd_name_exists: 'Un prompt con il nome "//{name}" esiste già. Scegli un nome diverso.',

      // Usage Limits Card
      usage_card_title: 'Limiti di utilizzo',
      usage_card_info: 'Quote ufficiali sincronizzate con la tua attività',
      usage_5h_label: 'Utilizzo 5 ore',
      usage_weekly_label: 'Limite settimanale',
      usage_resets_label: 'Ripristino',
      usage_synced_status: 'Sincronizzato con il tuo ultimo prompt',

      // Bulk Delete
      confirm_delete_all: 'Sei sicuro di voler eliminare tutte le {count} conversazioni recenti?\n\nQuesta azione non può essere annullata.',
      no_conversations: 'Nessuna conversazione recente trovata da eliminare.',
      deleting_progress: 'Eliminazione {current}/{total}...'
    },

    pt: {
      // Toolbar
      prompts_btn: '// Prompts',
      prompts_btn_title: 'Prompts rápidos e modelos (//)',
      nav_top_title: 'Rolar até o topo do chat',
      nav_prev_title: 'Prompt anterior',
      nav_next_title: 'Próximo prompt',
      wide_mode_title: 'Modo amplo (Tela cheia)',
      delete_all_btn: 'Excluir tudo',
      delete_all_title: 'Excluir todas as conversas recentes',

      // Prompts Menu
      quick_prompts_header: '✨ Prompts Rápidos (//)',
      edit_prompts_btn: 'Biblioteca',
      edit_prompts_title: 'Abrir biblioteca de prompts',
      menu_footer: '↑↓ para navegar • Enter / Tab / Espaço para inserir',

      // Prompt Manager Modal
      manager_title: 'Gerenciador da biblioteca de prompts',
      your_commands: 'Prompts (//)',
      new_command_btn: 'Novo prompt',
      edit_command_title: 'Editar //',
      add_command_title: 'Novo prompt',
      field_cmd_name: 'Nome do atalho',
      field_short_desc: 'Descrição (opcional)',
      field_auto_model: 'Trocar modelo automaticamente',
      field_prompt_text: 'Conteúdo do prompt',
      placeholder_desc: 'ex: Corrigir erros e problemas',
      placeholder_template: 'Por favor, analise e corrija o seguinte:',
      opt_model_keep: 'Manter atual',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: 'Restaurar padrões',
      btn_save_command: 'Salvar',
      btn_update_command: 'Atualizar',
      btn_edit: 'Editar',
      btn_delete: 'Excluir',
      btn_export: 'Exportar JSON',
      btn_import: 'Importar JSON',
      export_prompts_title: 'Exportar sua biblioteca de prompts como arquivo JSON',
      import_prompts_title: 'Importar prompts de um arquivo JSON',
      confirm_import_prompts: 'Importar {count} comando(s) de prompt deste arquivo?\n\nComandos existentes com o mesmo nome serão atualizados e novos serão adicionados.',
      import_result_summary: 'Importação concluída com sucesso!\n\n• {added} comando(s) adicionado(s): {addedList}\n• {updated} comando(s) atualizado(s)\n• {identical} comando(s) inalterado(s) (idênticos)',
      import_result_no_new: 'Importação concluída com sucesso!\n\n• 0 novos comandos adicionados\n• {updated} comando(s) atualizado(s)\n• {identical} comando(s) inalterado(s) (idênticos)',
      import_error_msg: 'Falha ao importar prompts: {error}',
      confirm_reset_defaults: 'Restaurar prompts padrão?\n\nIsso excluirá todos os seus prompts atuais e restaurará a lista inicial.',
      confirm_delete_prompt: 'Excluir este modelo de prompt?',
      btn_delete_all_prompts: 'Excluir todos',
      delete_all_prompts_title: 'Excluir todos os comandos de prompt',
      confirm_delete_all_prompts: 'Tem certeza de que deseja excluir todos os comandos de prompt?\n\nIsso removerá todos os seus atalhos rápidos.',
      empty_prompts_title: 'Nenhum prompt rápido salvo',
      empty_prompts_desc: 'Você não tem prompts de acesso rápido. Crie seu primeiro prompt no formulário, importe de um arquivo JSON ou restaure os padrões.',
      btn_cancel: 'Cancelar',
      back_to_library: 'Voltar à biblioteca',
      search_prompts_placeholder: 'Buscar prompts...',
      clear_filter_btn: 'Limpar filtro',
      no_prompts_found: 'Nenhum prompt encontrado para "{query}"',
      cmd_name_exists: 'Já existe um prompt com o nome "//{name}". Escolha um nome diferente.',

      // Usage Limits Card
      usage_card_title: 'Limites de uso',
      usage_card_info: 'Cotas oficiais sincronizadas com sua atividade',
      usage_5h_label: 'Uso em 5 horas',
      usage_weekly_label: 'Limite semanal',
      usage_resets_label: 'Redefinição',
      usage_synced_status: 'Sincronizado com seu último prompt',

      // Bulk Delete
      confirm_delete_all: 'Tem certeza de que deseja excluir todas as {count} conversas recentes?\n\nEsta ação não pode ser desfeita.',
      no_conversations: 'Nenhuma conversa recente encontrada para excluir.',
      deleting_progress: 'Excluindo {current}/{total}...'
    },

    ja: {
      // Toolbar
      prompts_btn: '// Prompts',
      prompts_btn_title: 'クイックプロンプトとテンプレート (//)',
      nav_top_title: 'チャットの先頭へスクロール',
      nav_prev_title: '前のプロンプト',
      nav_next_title: '次のプロンプト',
      wide_mode_title: 'ワイドモード（全幅表示）',
      delete_all_btn: 'すべて削除',
      delete_all_title: '最近の会話をすべて削除',

      // Prompts Menu
      quick_prompts_header: '✨ クイックプロンプト (//)',
      edit_prompts_btn: 'ライブラリ',
      edit_prompts_title: 'プロンプトライブラリを開く',
      menu_footer: '↑↓ で選択 • Enter / Tab / Space で挿入',

      // Prompt Manager Modal
      manager_title: 'プロンプトライブラリマネージャー',
      your_commands: 'プロンプト (//)',
      new_command_btn: '新規プロンプト',
      edit_command_title: '編集 //',
      add_command_title: '新規プロンプト',
      field_cmd_name: 'ショートカット名',
      field_short_desc: '説明（任意）',
      field_auto_model: 'モデルを自動で切り替える',
      field_prompt_text: 'プロンプトの内容',
      placeholder_desc: '例: バグやロジックの問題を修正',
      placeholder_template: '以下の内容を分析して修正してください：',
      opt_model_keep: '現在のモデル',
      opt_model_flash_lite: 'Gemini Flash Lite',
      opt_model_flash: 'Gemini Flash',
      opt_model_pro: 'Gemini Pro',
      btn_restore_defaults: '初期設定に戻す',
      btn_save_command: '保存',
      btn_update_command: '更新',
      btn_edit: '編集',
      btn_delete: '削除',
      btn_export: 'JSON エクスポート',
      btn_import: 'JSON インポート',
      export_prompts_title: 'プロンプトライブラリを JSON ファイルとして書き出し',
      import_prompts_title: 'JSON ファイルからプロンプトを読み込み',
      confirm_import_prompts: 'このファイルから {count} 件のプロンプトコマンドをインポートしますか？\n\n同名の既存コマンドは更新され、新しいコマンドが追加されます。',
      import_result_summary: 'インポートが正常に完了しました！\n\n• {added} 件追加: {addedList}\n• {updated} 件更新\n• {identical} 件変更なし（同一）',
      import_result_no_new: 'インポートが正常に完了しました！\n\n• 0 件の新規追加\n• {updated} 件更新\n• {identical} 件変更なし（同一）',
      import_error_msg: 'プロンプトのインポートに失敗しました: {error}',
      confirm_reset_defaults: '初期設定のプロンプトに戻しますか？\n\n現在のすべてのプロンプトが削除され、初期のデフォルト一覧が復元されます。',
      confirm_delete_prompt: 'このプロンプトテンプレートを削除しますか？',
      btn_delete_all_prompts: 'すべて削除',
      delete_all_prompts_title: 'すべてのプロンプトコマンドを削除',
      confirm_delete_all_prompts: 'すべてのプロンプトコマンドを削除してもよろしいですか？\n\n登録されたすべてのクイックプロンプトが削除されます。',
      empty_prompts_title: '登録されたプロンプトはありません',
      empty_prompts_desc: 'クイックプロンプトが登録されていません。フォームから作成、JSON からインポート、または初期設定に戻してください。',
      btn_cancel: 'キャンセル',
      back_to_library: 'ライブラリに戻る',
      search_prompts_placeholder: 'プロンプトを検索...',
      clear_filter_btn: 'フィルターを解除',
      no_prompts_found: '"{query}" に一致するプロンプトは見つかりませんでした',
      cmd_name_exists: '//{name} という名前のプロンプトは既に存在します。別の名前を指定してください。',

      // Usage Limits Card
      usage_card_title: '利用制限',
      usage_card_info: '利用状況に合わせて更新される公式クォータ',
      usage_5h_label: '5時間の利用枠',
      usage_weekly_label: '週間制限',
      usage_resets_label: 'リセット',
      usage_synced_status: '最新のプロンプトと同期中',

      // Bulk Delete
      confirm_delete_all: '最近の会話 {count} 件をすべて削除してもよろしいですか？\n\nこの操作は取り消せません。',
      no_conversations: '削除可能な最近の会話は見つかりませんでした。',
      deleting_progress: '{current}/{total} 件目を削除中...'
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
