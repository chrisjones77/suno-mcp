# Browser evidence, recovery ledger and destination verification

This slice maintains the read-only browser inventory and offline organization evidence workflow. It does **not** connect to Suno, start a browser, call its APIs, select clips, create workspaces, move, publish, unpublish, or delete anything. None of its entrypoints are registered as MCP tools. Live MCP operations remain disabled; all existing release gates remain open.

## Scope and components

- `src/browser-evidence.js`: host-supplied CUA tab adapter that reads the current rendered DOM and URL, strict capture validation, deduplication and conversion to the existing offline reconciliation inventory schema.
- `src/capture-store.js`: durable capture checkpoints. Restart loads the last capture ID rather than assuming a page finished. Exact replay of a capture is idempotent; changed content under the same ID is rejected.
- `src/move-ledger.js`: immutable plan binding, event recording and recovery inspection. It records **reported intent/submission and supplied observation evidence**, not permission or an actual executed move.
- `src/evidence-files.js`: exclusive sequence-file creation, file/directory fsync, restrictive permissions and replay checks on POSIX.
- `src/browser-workflow.js`: standalone offline CLI. It reads supplied JSON; it has no live adapter launcher or apply command.

The earlier local organizer/report work is preserved. No private workspace inventory, titles, lyrics, account URLs, authentication material or move history is shipped as a fixture. Examples and tests use synthetic IDs and text.

## Capture contract and host integration

`captureVisible(tab, {captureId, previousCaptureId, observedAt})` accepts an already authorized host CUA tab. It uses **only** `tab.url()` and a read-only `tab.playwright.evaluate()` over rendered groups, song links, button labels, search, filters, sort, page number and Next. It checks the URL again afterward. There is no browser/CDP dependency, cookie/token access, request interception, hidden framework state, fetch or endpoint guessing.

Use it from the host's permitted browser runtime, not a terminal browser automation script. This change tests the adapter against a synthetic DOM; it does not demonstrate compatibility with a current live Suno session. A host ESM runtime may load the CommonJS module through its supported module-import mechanism. Missing/changed controls reject the capture rather than treating the page as empty. The current selector contract is documented and exercised in `test/browser-evidence.test.js`.

Capture JSON has exactly these fields (see `examples/browser-capture.synthetic.json`):

- `schemaVersion: 1`; unique UUID `captureId`; `previousCaptureId` null for the first window or the prior committed capture UUID.
- `observedAt`: canonical UTC timestamp, supplied by the host; not a server attestation.
- `workspaceId`: `default` or a UUID, and exactly matching `https://suno.com/create?wid=...` URL. Extra URL parameters are rejected to avoid retaining callbacks/tokens.
- `page`: positive displayed page number; `search`; `hiddenFilterCount`; `sort` (`New` or `Old`); boolean `nextEnabled`.
- `rows`: exact recording UUID, title (nullable), captured display text and button labels. Virtualized placeholders without a song link are excluded.

A new scroll window is a new capture even when the displayed page number is unchanged. Persist it immediately, before continuing navigation. After host interruption, inspect `capture-status`, re-establish workspace/search/filter/sort in the UI, and capture a fresh window linked to the last committed ID. Never use the last displayed page or a repeated/empty viewport as proof that collection finished. A failed capture produces no successful checkpoint; do not skip the failed window silently.

The collector retains overlapping observations and detects conflicting capture IDs, workspace drift, page gaps, filtered views, sort changes, clock reversal, missing/mismatched totals and ambiguous terminal Next. It always retains `rendered_windows_only` and reports **incomplete coverage**, even with matching counts and disabled Next. The converted inventory deliberately ends with an unresolved cursor, so existing reconciliation continues to hold automatic proposals. `Unpublish clip` is evidence of public visibility; `Publish clip` does not prove private/unreleased status. Contradictory controls remain unknown. No title-based release match or listening verdict is inferred.

## Offline commands

Node 22.13+ on POSIX; no new dependencies. Read-only commands write only stdout; initialization/recording commands create private evidence files at the explicit destination. Supply a canonical absolute path (on macOS resolve `/tmp` aliases first), an existing parent, and a **new** journal directory outside the checkout. Directory mode is 0700, file mode 0600. Do not put real exports in Git. Redirect outputs only to private new files; ordinary shell redirection can overwrite an existing file.

```sh
node src/browser-workflow.js collect < examples/browser-collection.synthetic.json
node src/browser-workflow.js verify < examples/destination-verification.synthetic.json

node src/browser-workflow.js capture-init /private/path/new-capture-journal < examples/capture-config.synthetic.json
node src/browser-workflow.js capture-record /private/path/new-capture-journal < examples/browser-capture.synthetic.json
node src/browser-workflow.js capture-status /private/path/new-capture-journal

node src/browser-workflow.js ledger-init /private/path/new-move-journal < examples/move-plan.synthetic.json
node src/browser-workflow.js ledger-status /private/path/new-move-journal
node src/browser-workflow.js ledger-record /private/path/new-move-journal < /private/path/event.json
```

The collect result's `inventory` field can be placed into the existing `{schemaVersion:1, inventory, catalogue, destinationWorkspaceId:null}` reconciliation input. It preserves public/unknown observations and produces no executable movement authority. CLI input is limited to 10 MiB with strict UTF-8 decoding. Invalid commands/data emit a fixed error with no reflected input or partial stdout. APIs return data for the caller to retain privately.

## Plan and event contract

Plan fields: `schemaVersion:1`, `inventorySha256` (64 lowercase hex characters), nonempty `catalogueRevision`, `coverageIssues` (retained strings), and nonempty `moves`. Each move has `recordingId`, `fromWorkspaceId`, `toWorkspaceId`. Recording IDs must be unique, locations valid and distinct. `planSha256` binds the JSON representation of the entire validated plan. This ledger format is separate from the old one-off private execution log: **no silent migration or fabricated authorization**. Legacy import remains a separately reviewed task.

Every event contains `kind`, unique batch UUID `batchId`, canonical UTC `at`, and the exact `planSha256` returned by initialization:

| Kind | Additional field | Transition |
|---|---|---|
| `intent` | nonempty `ids` array | IDs must belong to the plan, share one source/destination and have no previous intent. Copied by value. |
| `submitted` | none | Existing intent only. Records a reported submission, never success. |
| `verified` | nonempty `captures` array | Existing intent or submitted batch; all exact IDs must be observed at the planned destination, with no observed IDs outside that destination's planned set. |

A verifier rejects wrong destinations, conflicting capture identities, filtered/search windows, observations preceding the latest batch event, and observations after the verification event's declared timestamp. Evidence timestamps and authenticity still require host/operator review. The standalone `verify` command reports missing and unexpected IDs; the ledger refuses a verified transition with either. Other planned IDs in that destination are allowed when verifying one batch.

`verified` means **these IDs were observed in that destination**. It is not proof of source absence, exclusive membership, permissions, unchanged public status, complete destination/account coverage, musical quality, human acceptance or release readiness. Verification does not clear `coverageIssues`. Targeted title search is useful for investigation, but this version requires unfiltered evidence windows for recorded verification; return to an unfiltered view and observe exact IDs before recording it.

## Interrupted work and persistence

`ledger-status` returns verified IDs, not-attempted IDs, and `reconcileBeforeAnyRetry` batches. Both intent-only and submitted batches are uncertain after restart. A timeout can follow a successful remote action; never resend it automatically. Fresh exact-ID destination observations can resolve either state. A selected clip with no submitted move is not completion. This implementation cannot issue a retry even if a caller asks; `mayApply` and `liveOperationsEnabled` remain false.

Do not remove failed claims, rewrite old records, or give the same IDs a new batch identity to bypass uncertainty. Missing/broken sequence files, invalid JSON, altered hash chains, links, nonprivate files and unexpected directory contents hold loading/recording. Preserve the original evidence and arrange explicit owner reconciliation before any future separately authorized execution. An uncertain batch that cannot be verified has no automated clear/retry transition in this version.

Each event is an exclusively created, fsynced sequence file referencing the preceding hash. Concurrent writers contend for the same sequence; at most one can create it. A crash after creating but before completing the file leaves a torn tail that **blocks replay**, not a false success. This is an append-only application convention on a trusted local POSIX filesystem, not an authenticated or tamper-proof audit service: the same OS user can alter files and recalculate hashes or remove a terminal suffix. Preserve independent backups/receipts when stronger integrity is needed. The directory itself is trusted; hostile concurrent filesystem replacement is outside this prototype's guarantees. Journal replay limits are 1,000 captures or 30,000 ledger events, with 32 MiB per stored file.

## Validation and release boundary

Run `npm test`. Synthetic tests cover DOM-only reads, placeholder exclusion, duplicate windows, same-title different IDs, uncertainty propagation into reconciliation, interrupted intent/submission recovery, wrong/stale evidence, copied batch identities, concurrent writers, torn files, altered plans, links and permissions, CLI workflows and continued MCP rejection of live operations. No live browser action or Suno request is required or performed by the test suite.

Outstanding provider/control, licensing, independent acceptance and release gates are unchanged. A future live host smoke test and any executor for moves require their own scope; these tests do not authorize them.
