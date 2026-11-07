# Suno MCP development

Read README.md and specs/001-v6-safe-integration before editing. This is an offline-only development build. Never restore or execute legacy provider/browser/token paths without separately resolving the documented access gates.

Runtime: src/index.js connects stdio; src/offline.js defines and dispatches tools; src/prepare.js validates console exports; src/inventory.js reconciles supplied metadata and proposes moves without applying them. Read specs/002-offline-inventory/README.md for that contract. src/suno-client.js, src/cdp.js and scripts/*.js are disabled compatibility entry points. All tests use synthetic data. Run npm ci --ignore-scripts and npm test. Keep private exports, lyrics, tokens, browser state and output packages out of this public repository.

Unresolved requirements stay unchecked. A passing test does not establish current Suno compatibility, release approval, provider completion or listening review.
