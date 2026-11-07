# Suno MCP — offline foundation

This development build prepares **unverified offline drafts** from the WRBG console's existing finishedSong JSON export. All Suno write operations and legacy API operations are disabled. It also reconciles supplied offline inventory with a released-recording catalogue and proposes moves. The default stdio server remains offline and is not Release 1. An opt-in, host-bound read-only MCP integration can capture the authorized browser’s current rendered window; it never applies changes.

## Run

Node.js 22.13+ is required. Run `npm ci --ignore-scripts`, `npm test`, then `npm start` for MCP over stdio. No browser or Suno login is required. No persistent records are written by the server; callers retain returned packages privately.

## Offline tool

`suno_prepare_console_export` accepts `{ "exportJson": "<exact exported JSON text>" }`. The export must have schemaVersion 1, purpose finishedSong, status preparedForManualHandoff, ready true, matching draft/field titles, and nonempty title/style/lyrics. Blocked, malformed, oversized (>10 MiB UTF-8), erroneous and inconsistent exports are rejected atomically. Raw parser errors and supplied arguments are not echoed in failures.

The result preserves exact text, line endings and Unicode, provides UTF-16 counts, export/source digests and optional saved revision, and begins with submissionState prepared and no outputs. Saved-revision equivalence remains unverified. A supplied exportedAt must be a real calendar timestamp in the console’s canonical UTC format (YYYY-MM-DDTHH:mm:ss.sssZ); absent/null remains unknown. Additional source context is not copied or executed. Keep inputs and outputs private; the export may contain unreleased lyrics.

**Evidence limits:** Current provider field limits are not validated. Model and control inventory remain unresolved; empty controlIntents is an explicit incomplete draft, not complete control coverage. The importer assumes a vocal finished-lyric handoff (instrumental false). It does not accept additional model, control, instrumental or approval arguments. It cannot mark inputs verified, record a verified pre-submit snapshot, submit, observe outputs, or establish listening review. Oversized provider fields are retained for review rather than silently truncated or claimed valid.

### Identity

exportSha256 is SHA-256 of the exact UTF-8 exportJson string. sourceRevision is `sha256:<exportSha256>`. sourceSha256 hashes UTF-8 JSON.stringify of this fixed-order tuple:

`["suno-prepared-v1", exportSha256, title, style, lyrics, "finished-lyrics", "custom", false, "unresolved", null, "unresolved", {}, "none"]`

packageId is `sha256:<sourceSha256>`. createdAt is creation metadata outside the digest. Any export-byte change changes identity. These hashes identify content; they do not establish approval or authenticity. This subset accepts no approval and cannot reuse a verified handoff.

## Offline inventory tool

`suno_reconcile_inventory` accepts `{ "inputJson": "<normalized snapshot JSON>" }`. It matches exact recording IDs, preserves observation conflicts and unknowns, and produces a dry-run move manifest only. Incomplete pagination or inconsistent totals hold all proposed moves. Private tracks are never automatically called experiments.

Read the [input contract and evidence boundaries](specs/002-offline-inventory/README.md) and [synthetic example](examples/inventory.synthetic.json). Supply an explicit released-recording catalogue revision and destination workspace, or null destination for classification only. This offline tool performs no live collection or application.

## Local organizer report

Use the organizer directly without starting MCP or connecting to Suno. It accepts the same normalized inventory JSON as the reconciliation tool through standard input and emits a standalone HTML report or the complete JSON plan:

```sh
node src/organize.js --html < /private/path/input.json > /private/path/review.html
node src/organize.js --json < /private/path/input.json > /private/path/plan.json
```

Choose new output filenames: shell redirection can overwrite existing files. Keep input and output outside this repository. Open review.html in a browser to read or print it; it contains no scripts, external resources, forms or live actions. Use browser Find to locate an exact ID or title. The report includes classification totals, every observation, conflicts, coverage issues, proposed moves and catalogue IDs absent from the supplied snapshot. It does not collect metadata or save review decisions.

Input is bounded to 10 MiB and must be valid UTF-8 and valid normalized inventory JSON. Failures emit a fixed error to stderr and no report to stdout. A shell may still create an empty redirected output on failure. The JSON plan preserves the exact supplied input-byte identity. HTML safely escapes all supplied metadata. Set destinationWorkspaceId to null for classification only; proposals require an explicitly selected destination in the input.

## Browser evidence and resumable verification

The standalone [browser evidence workflow](specs/003-browser-evidence/README.md) maintains rendered-DOM capture checkpoints, an offline move-evidence ledger, and exact-ID destination verification. It includes synthetic fixtures and tests for interrupted work, stale/wrong-batch evidence, pagination uncertainty, concurrent writers and damaged journals.

```sh
node src/browser-workflow.js collect < examples/browser-collection.synthetic.json
node src/browser-workflow.js verify < examples/destination-verification.synthetic.json
```

The read-only adapter accepts an already authorized CUA tab; it does not connect to a browser itself. The CLI operates on supplied JSON and private local journal directories. The CLI is not registered with MCP. The optional [host-bound read-only MCP integration](specs/003-browser-evidence/readonly-mcp.md) exposes capture, in-memory checkpoint and reconciliation tools. There is no move, publish, delete or automatic-retry executor. Intent/submission stays uncertain until destination IDs are observed; account-coverage and release gates remain open. See the linked contract for schemas, journal recovery and host integration limits.

The GitHub Actions offline-test workflow runs the synthetic suite and CLI examples on Node 22/24, on Linux and macOS. It uses no Suno credentials or live workspace data.

## Legacy migration

The seven old tool names remain discoverable only to return `LIVE_OPERATIONS_DISABLED`: credits, custom generation, description generation, status, waiting, recent songs and download. Retired model defaults have been removed from the advertised contract. Direct SunoClient construction, CDP import, and every legacy probe/smoke script also fail closed. Prior implementations remain in Git history, not active runtime code. Do not run old revisions to bypass the open gates.

## Remaining work

See [tasks](specs/001-v6-safe-integration/tasks.md) and [implementation evidence](specs/001-v6-safe-integration/validation/offline-foundation.md). Complete control inventory, provider limits, model/control intent configuration, manual handoff, independent output observations/reviews, service-access disposition and licensing remain open. Offline inventory/release reconciliation is implemented separately; live collection still needs a separately authorized host session and compatibility check; default stdio live collection remains disabled. The optional host integration has passed a bounded live smoke test; this is not full-account coverage or release acceptance.

## License status

Unresolved: inherited package metadata says ISC while the prior README said MIT and no license file was supplied. This change does not select a license or resolve upstream permission. Distribution/release remains gated.
