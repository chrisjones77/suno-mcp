# Implementation Plan: V6 Safe Integration

**Status:** Proposed  
**Primary constraint:** V6 compatibility is gate 1. No live generation/download until gate 2 is positively resolved.  
**Baseline:** Node CommonJS MCP over stdio (`src/index.js`, `src/suno-client.js`, `src/cdp.js`).

## Design

Keep the MCP as a preparation and evidence adapter first. Separate a pure `prepare` layer from any provider adapter. The first input is the WRBG console's existing `finishedSong` JSON export, mapped by `contracts/wrbg-console-import.md`; a prepared package contains exact fields and source/export digests, not a browser token. A manual handoff can copy/export it and later attach Suno song IDs and observations. An automation adapter remains absent or disabled until authorized. Do not let a renamed legacy tool reach the current `generateSong` implementation.

```text
WRBG console `finishedSong` JSON
          | exact fields + export digest; saved revision if present
          v
validate -> prepared package -> manual Suno handoff -> observed ID -> audio review
          |
          +-- authorized automation adapter (future, gated)
```

## Phase 0 — V6 discovery and contract repair

1. Record Suno's current V6 model family, Create form picker, tier availability, mode semantics, field limits, every applicable input-affecting control, and retained-attachment behavior in the versioned inventory defined by `contracts/create-control-inventory.md`, with dated sources or read-only UI evidence. Include controls such as Vocal Gender, Exclude, creative sliders, Variety, and Max Mode only where the current form actually presents them.
2. Before publishing a changed model contract, disable every legacy provider-backed tool, including credits, status, wait, recent songs, generation, and download. Remove the `chirp-v4` defaults and retired-model descriptions. Make requested model explicit and record Suno's actual selected model separately, with time and source of observation.
3. Replace ambiguous generation status text with separate submission, per-output provider, and listening-review states. Define inputs and outputs in `contracts/run-record.md`.
4. Treat a changed UI or unverified model as a blocked automation state, not a best-effort success.

**Exit:** A reviewer can identify every supported model and applicable Create control, see how unknown/retained state is handled, and see why the fork's old model parameter never selected V6. No retired default remains in the MCP contract.

## Phase 1 — supervised workflow implementation

1. Implement the `contracts/wrbg-console-import.md` mapping and validation for the existing export; then implement exact-field package validation, source/export hash and optional saved revision, UTF-16 style counting, intent-to-mode rule (`finished-lyrics` requires Custom), applicable control intents, control-inventory versioning, stale-approval detection, and copy/export. Reject blocked drafts atomically and exclude multimodal attachments from the first release.
2. Provide a manual handoff checklist for actual model, mode, title, lyrics, style, instrumental, every applicable control, retained-attachment absence, and expected credit cost against Suno's account credit display. Capture the verified form state immediately before the operator clicks Create; a form change invalidates that snapshot. An unresolved control or attachment prevents an input-verified claim.
3. Record observed song IDs/URLs, each output's provider-state evidence and time, and later listening reviews separately. Keep all legacy provider-backed tools disabled with a migration message.
4. Redact raw provider errors and token previews; validate all exposed tool inputs and outputs.

**Exit:** The supervised workflow is implemented but is not released until Phase 2 assurance and the release gate pass. It can import an existing ready WRBG console export, complete a finished-lyric Custom Mode handoff, and attach an observed result without the MCP clicking Generate, using an internal API for reads or writes, or fetching CDN media. Requested and actual form state, submission, provider status, and listening review are visibly distinct.

## Phase 2 — service access and security disposition

1. Document Suno's current terms and any account-specific written authorization for each future operation. Resolve license metadata and upstream permission for the fork.
2. Review lockfile dependencies and vulnerability data; replace the broken test command with a working suite covering the first release.
3. Specify dedicated browser profile, loopback CDP, exact origin, bounded calls, secret handling, destination confinement, and output validation for any later authorized adapter.

**Exit and Release 1 gate:** Written gate record with owner, date, evidence, and a positive/negative disposition. Release the supervised workflow only after Phase 1 acceptance and licensing, dependency review, working checks, and all applicable first-release gates are complete. An unresolved item blocks its dependent capability and never silently passes.

## Phase 3 — conditional automation

Begin only after phase 2 positively authorizes the chosen path. Implement the official/authorized interface; do not rehabilitate the existing hCaptcha workaround by default. Require exact readback of model, fields, and every applicable control, prove the absence of unsupported retained attachments, confirm expected credit cost, and obtain explicit one-time operator approval for a paid action. Require confirmed IDs, uncertain-result reconciliation, and no automatic resubmit. Use only an authorized download channel. Record a controlled live trial, credit change, and listened-to output before declaring this phase ready.

## Verification strategy

Plan and implement deterministic checks for model/control inventory, actual-versus-requested observations, unknown or retained controls/attachments, finished-lyric Custom Mode enforcement, cost mismatch, exact-field round trips, stale approval, Unicode/limit boundaries, malformed IDs, independent submission/provider/review states, uncertain response, repeat invocation, error redaction, and every disabled legacy tool. Read-only UI discovery and dependency/license reviews are separate evidence. A mocked pass does not establish current UI compatibility, authorization, or musical quality. No tests or live submissions were run while drafting this plan.
