# Chrome Web Store Listing & Project Details

## Extension Details
- **Name**: Gemini Superpowers
- **Version**: 1.0.0
- **Summary**: Supercharge your Google Gemini experience with // prompt templates, model switching, message navigation, real usage tracking, and bulk chat management.
- **Primary Category**: Productivity
- **Language**: English

## Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to store custom prompt templates created by the user, local usage tracking metrics, and user preferences locally in the browser. |

## Host Permissions Justification

| Host Pattern | Justification |
| :--- | :--- |
| `https://gemini.google.com/*` | Required to inject the superpowers toolbar, `//` prompt template launcher, automatic model selector, and sidebar conversation management tools into Gemini web interface. |

## Privacy & Data Practices
- **Data Collection**: No personal or user data is collected or transmitted to any external servers.
- **Storage**: All prompt templates, settings, and metrics are stored and processed strictly locally in the user's browser via `chrome.storage.local`.
- **Third-Party Services**: No analytics or third-party network services are contacted.
