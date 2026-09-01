# ⚡ Gemini Superpowers (Chrome Extension)

A Google Chrome extension designed specifically for the **Google Gemini** web app (`gemini.google.com`), adding superpowers seamlessly integrated with Google's native Material You design system.

---

## 🚀 Features

1. **Floating Superpowers Toolbar (Gemini Native Look & Feel)**:
   - Injected directly above the chat prompt input card, perfectly matched to its width.
   - **✨ Optimize** button to restructure and enrich your typed prompt with professional roles, constraints, and format.
   - Seamless design supporting both Light and Dark themes automatically.

2. **Official Usage Limits & Reset Timers (5-Hour & Weekly)**:
   - Interactive usage badge (`🕒 X%`) showing your current Gemini quota.
   - On-demand floating popover card showing official data synchronized directly with Gemini's *Usage limits*:
     - **5-hour usage**: Current usage percentage and exact reset time with live countdown (e.g. *1% used • Resets at 4:47 PM (in 2h 45m)*).
     - **Weekly limit**: Weekly usage percentage and exact reset date/time (e.g. *2% used • Resets Sep 3 at 5:47 PM*).
     - **Live status**: `🟢 Synced with your latest prompt` (updated automatically in the background via network interceptor).

3. **User Prompt Navigator (`^` and `v`)**:
   - Jump smoothly and instantly between your previous and next user query prompts without tedious manual scrolling, skipping long model responses.

4. **Quick Prompt Launcher (`//`) with Placeholders & Auto-Model Switching**:
   - Type `//` inside the chat box to trigger a quick-search autocomplete menu.
   - Support for dynamic placeholders (`{{placeholder}}`) with an intuitive input modal.
   - Auto-model switcher: assign specific models (*Gemini Flash*, *Gemini Pro*, *Flash Thinking*, or *No change* to keep the currently active model).

5. **Smart Auto-Focus**:
   - The chat prompt input automatically gets focused whenever you open the page or switch back to the Gemini tab/window.
   - Global shortcuts: Press `/` or `Cmd+K` (Mac) / `Ctrl+K` at any time to instantly focus the input without touching your mouse.

6. **Wide Mode (Full Width) Toggle**:
   - Toggle button in the top-right header (placed directly next to the overflow menu) to switch between standard view and full-width layout.
   - Expands the chat history, conversation turns, model response markdown, input card, and toolbar across the screen.
   - Remembers your wide mode preference in local storage.

7. **Bulk Delete Recent Conversations**:
   - Clean "Delete all" action integrated into the recent conversations sidebar header.
   - Confirmation dialog with a real-time progress bar and cancellation support.

8. **Prompt Library Manager (Popup)**:
   - Create, edit, and delete custom prompt templates.
   - Import and export prompt libraries in JSON format.

---

## 🛠️ Installation in Google Chrome (Mac)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top right corner).
3. Click **Load unpacked**.
4. Select the project directory:
   `/Users/hector.de.isidro/Developer/gemini-superpower-chrome-extension`
5. Open or refresh [https://gemini.google.com/](https://gemini.google.com/) to start using your new superpowers!
