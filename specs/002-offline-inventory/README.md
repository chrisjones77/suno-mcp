# Offline inventory and release reconciliation

## Scope and authority

Owner requested offline implementation: exact recording-ID matching, preserve unknowns, proposed moves only, live Suno disabled. UWH primary 0x1 build with 0xB verification; implemented by the lead without delegated execution. This contract supplements the generation-focused Spec001; it does not close its live-access or release gates.

`suno_reconcile_inventory` accepts `{ "inputJson": "<JSON text>" }` and returns JSON in the MCP text result. It is pure: no files, network, browser, provider requests, account changes or move execution. Caller retains private inputs/results outside this public repository. No apply tool exists.

## Version 1 input

See `examples/inventory.synthetic.json`. All fields shown are required; additional properties are rejected. This normalized input is not a raw Suno API response. No raw credential or browser-state export should be supplied.

- schemaVersion: 1.
- inventory.source: attribution for the supplied snapshot, not an executable URL.
- inventory.observedAt: canonical UTC timestamp, e.g. `2026-11-06T12:00:00.000Z`. Applies to every page/row in this snapshot. Do not combine independently timed snapshots under one invented time.
- inventory.workspaces: unique `{id, name}` records. Workspace IDs are opaque exact strings, including `default`; the selected destination must already appear in this supplied list. This is not proof it exists live.
- inventory.expectedCount: expected unique recording count for the supplied inventory scope, or null. This is owner/source-supplied evidence, not independently verified.
- inventory.pages: ordered `{cursor, nextCursor, status, records}`. First cursor is null; each nextCursor matches the following cursor; final nextCursor is null. status is `ok` or `failed`; a failed page has no records. An unfinished prefix may be submitted for partial classification.
- Each record: `{id, title, workspaceId, publication}`. title and workspaceId may be null. publication is `public`, `private` or `unknown`.
- Recording IDs must be canonical lowercase UUID strings. No title, URL, whitespace, alias, case or fuzzy normalization is performed. A caller converting a source export must preserve the identity and record that conversion's provenance.
- catalogue: `{source, revision, recordingIds}`. The supplied ID list must represent the selected **released-recording catalogue**; an arbitrary draft catalogue is not release evidence. revision binds the comparison to a stated revision; it is not automatically fetched or authenticated.
- destinationWorkspaceId: an explicitly selected known workspace ID for released/public recordings, or null to classify only. No destination is silently created or inferred.

Bounds: 10 MiB UTF-8 JSON input, 10,000 supplied recording rows, 10,000 catalogue IDs, 500 pages, 1,000 workspaces; metadata strings at most 1,024 UTF-16 code units. Malformed input fails atomically with a fixed error code. Source text is not reflected in errors.

## Classification and unknowns

| Exact-ID evidence | Classification |
|---|---|
| Catalogue match and public | catalogued_and_public |
| Catalogue match, other/unknown publication | catalogued_release |
| Public, no catalogue match | public_on_suno |
| Neither positive signal | unclassified |

Private is not synonymous with unreleased or experimental. Missing catalogue membership does not prove absence from other releases. Catalogue IDs absent from the supplied inventory are reported separately, never declared missing from the account or proposed for moves. Listening verdict is always unassessed.

Duplicate IDs consolidate into one row while retaining every observation and all title variants. Public/private conflict yields unknown aggregate publication and an explicit conflict; disagreement is not settled by order. Any unknown publication observation keeps aggregate publication unknown; all supplied known and unknown observations remain available. A catalogue match can still independently establish catalogue release evidence, but a public-plus-unknown mixture without a catalogue match stays unclassified and receives no proposal. Distinct workspace observations (including a known location plus null) are unresolved. A title variant never merges distinct IDs.

## Coverage and proposed moves

Coverage is `declared_complete` only when the supplied chain starts/ends correctly, has no repeated cursor or failed page, and its unique-ID count agrees with the supplied non-null expectedCount. Otherwise it is `incomplete`. Neither state proves live completeness; `liveVerified` is always false. Duplicate counts are separate from unique counts.

Incomplete coverage holds **all** move proposals. In a declared-complete snapshot, only positively classified released/public records with one known workspace, no workspace/publication conflict, and a selected different destination receive a proposal. Others retain explicit moveHoldReasons. No proposal sends unclassified material to an experiments folder.

Each proposal includes exact recording/source/destination IDs, reason, input digest, catalogue revision, observation time, expected source workspace/publication and `requireFreshLiveVerification: true`. It is a review candidate only. No command, approval token, executable action or permission to mutate is produced. Human review and a separately authorized future executor would have to recheck live state, resolve drift, and record individual results. appliedMoves is always empty.

inputSha256 hashes the exact inputJson UTF-8 bytes; reconciliationVersion is `offline-reconcile-v2`; planId is `sha256:` followed by SHA-256 of UTF-8 JSON.stringify(`[reconciliationVersion, inputSha256]`). This supersedes the initial input-only plan identity, so the conservative unknown-status fix cannot silently reuse an old plan ID. Any future change to classification or move semantics must bump reconciliationVersion. A destination, source, catalogue or whitespace change changes identity. Repeating identical input returns the same plan. Hashes identify content, not authenticity or permission.

## Verification and limits

67 tests passed after the PR review fixes, including synthetic exact-ID/alternate-title cases, duplicate/conflicting observations, page/count failures, bounds/errors, unchanged inputs, legacy disablement, and real MCP stdio invocation. `git diff --check` passed. Tests use invented IDs and lyrics; no private catalogue or browser inventory was copied into this repository.

Owner: Chris for interpretation of catalogue release evidence and any later live authorization; lead for implementation correctness. Interim protection: no apply function and disabled legacy adapters. Revisit on input contract changes, before adding collection/execution, or when an actual source snapshot reveals new pagination semantics. The earlier partial browser scan is not this feature's dataset or acceptance evidence.

Live collection, real library reconciliation, musical discovery/listening, move execution, and full Spec001 handoff remain outside this completed offline slice.
