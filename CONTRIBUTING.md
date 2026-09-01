# 🤝 Contributing to Gemini Superpowers

Thank you for your interest in contributing to **Gemini Superpowers**! We welcome bug reports, feature requests, documentation improvements, and pull requests.

---

## 📋 Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [How to Contribute](#-how-to-contribute)
   - [Reporting Bugs](#reporting-bugs)
   - [Suggesting Enhancements](#suggesting-enhancements)
   - [Submitting a Pull Request](#submitting-a-pull-request)
3. [Development Setup](#-development-setup)
4. [Project Architecture](#-project-architecture)
5. [Coding Guidelines](#-coding-guidelines)
6. [License](#-license)

---

## 📜 Code of Conduct

Please be respectful, constructive, and collaborative in all issues, pull requests, and discussions.

---

## 💡 How to Contribute

### Reporting Bugs
If you find a bug or unexpected layout shift on Google Gemini:
1. Check existing issues or pull requests to avoid duplicates.
2. Open a new issue with:
   - A clear and descriptive title.
   - Steps to reproduce the problem.
   - Your Chrome version and operating system.
   - Screenshots or video recordings if relevant.

### Suggesting Enhancements
Feature requests are always welcome:
1. Open an issue describing the proposed superpower or enhancement.
2. Explain why it would be beneficial to Gemini users and how it should behave.

### Submitting a Pull Request
1. Fork the repository and create your branch from `dev`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Implement your changes following the [Coding Guidelines](#-coding-guidelines).
3. Test locally in Google Chrome using `chrome://extensions/`.
4. Commit your changes with descriptive commit messages following Conventional Commits format (`feat: ...`, `fix: ...`, `docs: ...`).
5. Open a Pull Request against the `dev` branch.

---

## 🛠️ Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hector6872/gemini-superpower-chrome-extension.git
   cd gemini-superpower-chrome-extension
   ```

2. **Load the Unpacked Extension in Chrome**:
   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top right).
   - Click **Load unpacked** and select this repository folder.

3. **Verify and Test**:
   - Navigate to [https://gemini.google.com/](https://gemini.google.com/).
   - Open DevTools (`F12` or `Cmd+Option+I`) to inspect console logs and DOM elements.
   - After editing files, click **Reload (↻)** on the extension card in `chrome://extensions/` and refresh the Gemini tab.

---

## 🏗️ Project Architecture

```
├── manifest.json              # Chrome Manifest V3 configuration
├── content/
│   ├── interceptor.js         # MAIN world network interceptor for official Gemini RPCs
│   ├── superpower.css         # Native Material You styling & Wide mode layout
│   ├── content.js             # Content script bootstrap and module initializer
│   └── modules/
│       ├── autoFocus.js       # Smart prompt input auto-focus & keyboard shortcuts
│       ├── bulkDelete.js      # Bulk delete conversation manager in sidebar
│       ├── navigator.js       # User prompt jumping (^ / v / ⤒) & scroll thresholding
│       ├── promptCommands.js  # // single-word prompts autocomplete & in-page editor
│       ├── toolbar.js         # Floating pill toolbar placed above the input card
│       ├── usageTracker.js    # Official usage limits extractor and countdown timers
│       └── wideMode.js        # Full-width chat layout switcher
├── icons/                     # Extension icons (16px, 48px, 128px)
├── CONTRIBUTING.md            # Contribution guidelines
├── LICENSE                    # MIT License
└── README.md                  # Project overview and documentation
```

---

## 📝 Coding Guidelines

- **Language & Style**: Use clean, modern vanilla JavaScript (ES6+) and standard CSS variables matching Gemini's Material You theme (`--gsp-*`).
- **No Third-Party Frameworks**: Content scripts run directly in the browser without external dependencies to keep the extension ultra-fast and lightweight.
- **English UI & Code**: All variable names, comments, docstrings, and user-facing UI text must be written in English.
- **Manifest V3 Compatibility**: Follow Chrome Manifest V3 best practices and avoid deprecated APIs.

---

## 📄 License

By contributing to **Gemini Superpowers**, you agree that your contributions will be licensed under the [MIT License](LICENSE).
