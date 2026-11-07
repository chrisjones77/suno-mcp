# Validation — 2026-11-07

- `npm test`: **97 passed, 0 failed, 0 skipped** after final source changes.
- Documented synthetic `collect` and `verify` CLI examples: passed; collection retained incomplete coverage and verification retained one intentionally missing ID.
- `git diff --check`: passed.
- No dependencies added. Active MCP registry and transport implementation unchanged.
- No live browser, Suno API, move, publication, deletion, account request, provider dispatch or release action performed.

The tests include 25 new cases across browser capture, ledger, storage, CLI and MCP boundaries; all remaining existing tests also pass. The source review tightened contradictory-publication handling, pre-creation path validation and replay state shape. Live Suno DOM compatibility and independent human review remain open. Hashes below identify reviewed local bytes, not approval or deployment.

| File | SHA-256 |
|---|---|
| `src/browser-evidence.js` | `83fb4d9249d1354007889037bd2c7403563fcaaa00cdf2fb86f21f96c80707b2` |
| `src/capture-store.js` | `e6143b9294256c11f69acc4ba6d9c68823015743b61c954456d2e25b1f5023fd` |
| `src/evidence-files.js` | `0edd14118622c74331bacad937bbc5c9e1eaa71471ad4a563a484bd45e5477d9` |
| `src/move-ledger.js` | `50af28187605cae73c7d6da66d38f26258ae7d29d6531ab19ae522c81f8a2561` |
| `src/browser-workflow.js` | `aee0386eb1f3132dfa57807a8ad8b4708f50652fa767d579620ac1f90eaac224` |
| `test/browser-evidence.test.js` | `1fd8b5ad3c14dfb53862ee7170391eb89bf57a24a09a4047547dbd94d686f833` |
| `test/move-ledger.test.js` | `582e560e3e5c6f3d2c501c3df533b86a4ca2a0bf3774ae28e112af8c71f348f7` |
| `test/browser-workflow.test.js` | `a3e549a5af523573cda3c1bdb0ee321e945e7a17c3ef882e1979bef32270caef` |
| `test/fixtures/browser-workflow.js` | `2ff6e5ca25e0831cb79c7f3eb4f61123110c67439dc9dd92ccbc372be7f4f0ee` |
