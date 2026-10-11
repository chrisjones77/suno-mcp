# Implementation Plan: V6 Safe Integration

**Status:** Proposed  
**Primary constraint:** V6 compatibility is gate 1. No live generation/download until gate 2 is positively resolved.  
**Baseline:** Node CommonJS MCP over stdio (`src/index.js`, `src/suno-client.js`, `src/cdp.js`).

## Design

Keep the MCP as a preparation and evidence adapter first. Separate a pure `prepare` layer from any provider adapter. A prepared package contains exact fields and a source hash, not a browser token. A manual handoff can copy/export it and later attach Suno song IDs and observations. An automation adapter remains absent or disabled until authorized. Do not let a renamed legacy tool reach the current `generateSong` implementation.

```text
WRBG console / MCP caller
          | exact revision
          v
validate -> prepared package -> manual Suno handoff -> observed ID -> audio review
          |
          +-- authorized automation adapter (future, gated)
```

## Phase 0 — V6 discovery and contract repair

1. Record Suno's current V6 model family, Create form picker, tier availability, mode semantics, and field limits with dated sources or read-only UI evidence.
2. Before publishing a changed model contract, disable every legacy provider-backed tool, including credits, status, wait, recent songs, generation, and download. Remove the `chirp-v4` defaults and retired-model descriptions. Make requested model explicit and record Suno's actual selected model separately, with time and source of observation.
3. Replace ambiguous generation status text with separate submission, per-output provider, and listening-review states. Define inputs and outputs in `contracts/run-record.md`.
4. Treat a changed UI or unverified model as a blocked automation state, not a best-effort success.

**Exit:** A reviewer can identify every supported model and see why the fork's old model parameter never selected it. No retired default remains in the MCP contract.

## Phase 1 — supervised usable release

1. Implement exact-field package validation, source hash/revision, UTF-16 style counting, Variety and Max Mode intents, stale-approval detection, and copy/export.
2. Provide a manual handoff checklist for actual model, mode, title, lyrics, style, instrumental, Variety, Max Mode, and expected credit cost against Suno's account credit display. An unresolved paid control prevents an input-verified claim.
3. Record observed song IDs/URLs, each output's provider state, and later listening reviews separately. Keep all legacy provider-backed tools disabled with a migration message.
4. Redact raw provider errors and token previews; validate all exposed tool inputs and outputs.

**Exit:** A creator can complete a handoff and attach an observed result without the MCP clicking Generate, using an internal API for reads or writes, or fetching CDN media. Requested and actual model/settings, submission, provider status, and listening review are visibly distinct.

## Phase 2 — service access and security disposition

1. Document Suno's current terms and any account-specific written authorization for each future operation. Resolve license metadata and upstream permission for the fork.
2. Review lockfile dependencies and vulnerability data; replace the broken test command with a working suite covering the first release.
3. Specify dedicated browser profile, loopback CDP, exact origin, bounded calls, secret handling, destination confinement, and output validation for any later authorized adapter.

**Exit:** Written gate record with owner, date, evidence, and a positive/negative disposition. An unresolved item blocks only its dependent capability, never silently passes.

## Phase 3 — conditional automation

Begin only after phase 2 positively authorizes the chosen path. Implement the official/authorized interface; do not rehabilitate the existing hCaptcha workaround by default. Require exact readback of model, fields, Variety, and Max Mode, plus confirmed expected credit cost and explicit one-time operator approval for a paid action. Require confirmed IDs, uncertain-result reconciliation, and no automatic resubmit. Use only an authorized download channel. Record a controlled live trial, credit change, and listened-to output before declaring this phase ready.

## Verification strategy

Plan and implement deterministic checks for model catalogue, actual-versus-requested observations, Variety/Max Mode and cost mismatch, exact-field round trips, stale approval, Unicode/limit boundaries, malformed IDs, independent submission/provider/review states, uncertain response, repeat invocation, error redaction, and every disabled legacy tool. Read-only UI discovery and dependency/license reviews are separate evidence. A mocked pass does not establish current UI compatibility, authorization, or musical quality. No tests or live submissions were run while drafting this plan.
