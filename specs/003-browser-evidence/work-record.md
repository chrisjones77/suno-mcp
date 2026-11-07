# UWH work record — browser evidence maintenance

## Decision, scope and authority

Owner: Christopher Jones. Implementer: Codex in the current user-authorized chat. Primary purpose 0x1 build; companion lenses 0xB verify and 0x5 record. User authorized bringing the browser collector, resumable move ledger and verification workflow into this repository with tests, while keeping live MCP disabled and prohibiting live moves/publication/deletion.

Use the UWH human-led coverage method for this bounded source implementation. No separate provider, dispatched worker, accepted/resumed automated contract or human approval is invented. The candidate/provider execution lane is not invoked. Source edits and synthetic local tests derive their authority from the user's explicit implementation request, not from a profile receipt.

Installed package inventory was inspected with the bundled `package.mjs`. Reviewed package SHA-256: `569bdf01ee3f36c20946e485d8c45a7a05d0e27e94ac776701153379cf860c86`. Profile selected `coverage_review`, requested read/write, prohibited provider/dispatch/network; result `resolved_for_review`, no holds, `execution_authorized:false`. Initial profile validation rejected an unsupported effect label; it was corrected to the supported vocabulary without expanding the effect ceiling. Profile resolution is not human acceptance.

Baseline: branch `codex/suno-offline-foundation`, commit `c3178ce9b49ca5f134f1977b71f3614b0089a8f1`. Existing uncommitted README/spec and organizer/report changes were present and preserved. This work adds separate modules, tests, synthetic examples and documentation; it does not modify the active MCP registry or existing live-operation guards. No private inventory or account data was imported into the repository.

## Criteria and evidence

| Criterion | Implementation / reproducible evidence |
|---|---|
| Read only rendered browser metadata | `captureVisible`; synthetic DOM execution checks only URL/evaluate calls, placeholders and missing controls. No host connection or live invocation. |
| Resumable capture history | Capture journal, previous capture IDs, duplicate identity checks, exclusive sequence files and torn-tail rejection. |
| Preserve identity and unknowns | Exact recording IDs; same-title fixtures stay distinct; Publish alone remains unknown; normalized inventory keeps reconciliation coverage incomplete. |
| No blind retry after ambiguous submission | Intent/submitted remain uncertain after replay; fresh destination evidence resolves an interrupted batch; reused IDs/batches reject. No apply callback. |
| Prevent stale batch bookkeeping | Defensive copies, whole-plan digest and immutable event files; mutation regression tests. |
| Verification distinguishes evidence from completion | Wrong destination, missing/unexpected IDs, filtered evidence and stale times reject verified transitions. Coverage issues survive successful verification. |
| Crash/concurrency handling | Concurrent-process test, corruption/hash/sequence/permission/link tests; no reset/delete/overwrite recovery command. |
| Live MCP remains disabled | Existing offline/transport tests plus new registry and import boundary tests. |
| Private artifacts stay private | Synthetic examples only; new journals 0700/0600; fixed CLI errors, no private input reflection. |

Validation command: `npm test`. Final results are recorded in `validation.md`. Synthetic tests establish the covered behavior only; current live Suno DOM compatibility, independent review and user acceptance remain unverified. No publish, delete, move, account request, commit, push, merge or deployment was performed in this implementation task.

## Limits, ownership and follow-up

Pause dependent live work if selectors drift, journal integrity fails, capture context changes, or a batch lacks trustworthy destination evidence. Preserve uncertain batches and original records; never clear claims to retry. User remains the decision owner for any later live session and acceptance. The original account coverage discrepancy and all release gates remain open. A code review can use the contract, synthetic examples and tests without accessing private track data.
