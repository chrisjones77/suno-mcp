# Validation — 2026-11-07

- `npm test`: **102 passed, 0 failed, 0 skipped** after final source changes.
- Documented synthetic `collect` and `verify` CLI examples: passed; collection retained incomplete coverage and verification retained one intentionally missing ID.
- `git diff --check`: passed.
- No dependencies added. Active MCP registry and transport implementation unchanged.
- No live browser, Suno API, move, publication, deletion, account request, provider dispatch or release action performed.

The tests include 30 new cases across browser capture, ledger, storage, CLI and MCP boundaries; all remaining existing tests also pass. The source review tightened contradictory-publication handling, pre-creation path validation and replay state shape. PR #4 review additionally fixed pre-write aggregate validation, collector/consumer limits and blank titles, cross-batch capture identity, and blocking nonregular-file reads; see `pr4-review.md`. Live Suno DOM compatibility and independent human review remain open. Hashes below identify reviewed local bytes, not approval or deployment.

| File | SHA-256 |
|---|---|
| `src/browser-evidence.js` | `d90dd314666529ff0bb83024d56a912334022c91ff64961f4398f3550fa0a91d` |
| `src/capture-store.js` | `c6ceeb96765b7430128649429b74ffeab1dd963b31419cd6680144a06907374c` |
| `src/evidence-files.js` | `5dd0a32e4c79e8e51af70714ab34ef3b00d3a019e7e8b7bdbda908917e3f4fad` |
| `src/move-ledger.js` | `d9e2f74ea05bfa929e0817b2ec554c6fed87efc8f17bb393f22f39057fdb12c0` |
| `src/browser-workflow.js` | `aee0386eb1f3132dfa57807a8ad8b4708f50652fa767d579620ac1f90eaac224` |
| `test/browser-evidence.test.js` | `5f3fede4725a2a067cc7e925dfd01979242ac502e7e20881f04720cb3e860784` |
| `test/move-ledger.test.js` | `e207a09004517f773e1f4f7ac785b3aed9982964f463f677a3c8c5ca68ec27ef` |
| `test/browser-workflow.test.js` | `a3e549a5af523573cda3c1bdb0ee321e945e7a17c3ef882e1979bef32270caef` |
| `test/fixtures/browser-workflow.js` | `2ff6e5ca25e0831cb79c7f3eb4f61123110c67439dc9dd92ccbc372be7f4f0ee` |
