# Host-bound read-only MCP

## Scope and authority

On 2026-11-07 Chris authorized DIY read-only MCP integration and a test against his authorized browser session. All Suno writes remain disabled; coverage discrepancy and release gates remain open. UWH primary build (0x1), companion verify (0xB), human-led coverage method; no delegated executor or independent acceptance claimed. Installed package inventory/profile resolved against reviewed digest `569bdf01ee3f36c20946e485d8c45a7a05d0e27e94ac776701153379cf860c86`. GeckIt employee lookup was unavailable (no running socket); no assigned-role guidance was inferred.

The trusted host supplies an already authorized CUA tab, exact workspace ID, workspace label and expiry (at most one hour). The server exposes only three additional tools:

- `suno_browser_capture`: capture the current rendered window, validating before updating an in-memory checkpoint.
- `suno_browser_checkpoint`: return accumulated evidence; no disk writes.
- `suno_browser_reconcile`: compare captured evidence with supplied `catalogueJson` by exact recording ID. Browser coverage warnings are retained separately from reconciler coverage. No destination or execution argument exists.

The fixed collector can read URL and rendered DOM only. MCP arguments cannot choose a tab, URL, script, selector, endpoint, file or browser command. No navigation, selection, publishing, moving, deletion, downloads, generation, cookies, credential extraction or restricted Suno API access is implemented. Unknown tools remain rejected, and every legacy tool still returns `LIVE_OPERATIONS_DISABLED`.

## Host integration

```js
const {createReadOnlySession} = require('./src/readonly-session.js');
const {createServer} = require('./src/index.js');
const session = createReadOnlySession({
  tab: authorizedTab,
  workspaceId: authorizedWorkspaceId,
  workspaceName: authorizedWorkspaceName,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
});
const server = createServer({browserSession: session});
await server.connect(hostTransport);
// On host session end or revocation:
session.close();
await server.close();
```

This is an embedded host integration, not a standalone browser connector. Default `npm start` remains offline with nine tools. The opt-in host has twelve. A separate stdio process cannot inherit a CUA tab object; do not configure CDP, remote debugging, or copy credentials to work around this boundary. The host is trusted code and must supply only its authorized transport and tab. MCP annotations are hints, not a security sandbox.

Concurrent calls fail busy. Expiry or explicit close blocks all session calls; close clears retained captures. A navigation change or malformed DOM rejects the capture without advancing the checkpoint. Errors are redacted. An outstanding browser read can remain pending until the host resolves it; close prevents its result from being retained. The host owns cancellation and must close the session on disconnect. In-memory checkpoints are lost on process exit; existing offline journals remain a separate explicit export/import workflow, not automatic persistence.

## Live smoke evidence

Using the authorized existing Chrome tab, a real SDK Client/Server pair over linked in-memory MCP transport completed initialization, tool discovery, capture, checkpoint and reconciliation. This exercised the MCP protocol against the live browser, not merely a replay of supplied JSON.

- Five visible recordings captured in one filtered workspace window; five unknown publication states preserved.
- All five compared with the saved 218-ID release catalogue (revision `sha256:89fd0f08de19f3bdc92c7c76dd55df807424f52ee2801ce2dd0101cad42c98d4`).
- Zero catalogue matches; this does not prove unreleased status. Zero proposed or applied moves.
- Capture reported filtered observation, rendered windows only, ambiguous terminal Next and unknown expected count. Reconciliation remained incomplete.
- Checkpoint digest matched capture; all seven legacy tools rejected; capture after explicit revocation returned `READONLY_SESSION_CLOSED`. Client/server then closed.

No real titles, recording IDs, browser/session credentials or private snapshots were committed. The test did not navigate, page through the account or resolve the historical coverage discrepancy. Release, licensing, service-access and independent acceptance gates remain open. Later changes to selectors, host, account/session or permissions require renewed compatibility checks. The final added `browserCoverage` response field is covered by the synthetic MCP regression, not an additional live run.

## Deterministic validation

`npm test`: 109 tests passed, zero failed or skipped. Seven new tests cover real MCP transport, exact-ID reconciliation and filter retention, forbidden arguments, expiry, revocation, concurrency, context drift, error redaction and checkpoint preservation. Existing default stdio and legacy-disablement tests remain green. `git diff --check` passed.
