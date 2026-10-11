# Feature Specification: Suno V6 Integration Readiness

**Repository:** `chrisjones77/suno-mcp`  
**Baseline:** `108ef3f902b490ec00ace077266a4ade852426e6` (2026-04-13)  
**Status:** Proposed; no live-use approval  
**Created:** 2026-10-11

## Clarifications — 2026-10-11

- The first release imports the WRBG console's existing `finishedSong` JSON export. Manually entered title/style/lyrics and description-led Simple Mode are outside its acceptance path. A ready export is prepared input, not evidence of Suno submission or operator approval.
- Phase 1 is implementation, not a release. Release 1 follows the assurance and licensing gate in Phase 2.
- A manual input-verification claim requires a form-state snapshot before the operator's Create click; later observations cannot establish what was submitted.
- The Create-control inventory has a versioned contract and refresh triggers. Provider-state observations retain source, time, and history per output.

## Purpose

Make the fork useful for preparing and tracking Suno V6 song runs without claiming that an obsolete model, an unverified browser state, or an uncertain generation succeeded. The first usable release prepares a reviewed handoff for Suno's own Create and download interfaces. Programmatic submission and download require a separately documented, authorized path.

## Release gates, in order

1. **V6 compatibility:** Identify the current Suno Create form, supported V6 family, model-picker behavior, all applicable input-affecting controls and retained attachments, limits, and result states. Remove the advertised `chirp-v4` default and other retired-model claims. Until the selected model and applicable form state can be observed and confirmed, the MCP must describe them as unknown and must not claim to control them.
2. **Service access:** Document the permitted interaction and download channels against current Suno terms or written authorization. Browser-session token extraction, internal API calls (including credits, status, and recent-song reads), anti-bot workarounds, and direct CDN downloads are excluded from the first release. No provider-backed tool is enabled without a positive disposition.
3. **Paid-action correctness:** A requested run must have exact reviewed inputs, one explicit operator action, and an unambiguous result or `uncertain` state. An uncertain result must not be retried automatically.
4. **Security and distribution:** Constrain browser/file access, eliminate token disclosure, resolve the fork's license mismatch, and review dependencies before release.

## User stories and acceptance scenarios

### US1 — Prepare a V6 run (P1)

As a creator, I can prepare exact title, lyrics, style, instrumental intent, requested V6-family model, and applicable Create-control intents for a handoff to Suno.

1. Given the current V6 model list, when I choose `v6`, `v6-wild`, or `v6-mini`, then the package records my choice and its source; no older model is presented as the default. Unsupported or unavailable choices remain unresolved.
2. Given a finished-lyric package, when I prepare a run, then the exact line breaks and Unicode characters are preserved, the style is counted in UTF-16 code units, and over-limit text is blocked rather than truncated.
3. Given no verified model picker or a changed Create form, when I prepare a run, then copy/export remains available, while model selection and automatic Generate are not claimed to work.
4. Given a changed source revision, when I reopen a package, then the previous approval is stale and cannot be reused silently.
5. Given Variety or Max Mode is unavailable or its effect is unknown, when I prepare a run, then the setting is marked unresolved; the package does not claim exact style control or a known credit cost.
6. Given a finished lyric, when I prepare a run, then `mode` is `custom` and the complete text occupies the lyrics field; a `simple` mode package is rejected for that intent. Description-led Simple Mode uses a separate prompt field and intent, and is not described as preserving supplied lyrics or as verified in the first release.
7. Given a Create control or retained attachment that may affect the output but is not represented in the package, when I prepare a run, then it is recorded as unresolved and input verification remains unavailable until the control is explicitly set or cleared and unsupported attachments are absent. The first release does not hand off multimodal attachments.
8. Given the WRBG console's `schemaVersion: 1`, `purpose: finishedSong` JSON export, when I import it, then the exact `fields.title`, `fields.style`, and `fields.lyrics` become a prepared package only if `ready: true` and `status: preparedForManualHandoff`. `blockedDraft`, malformed, or inconsistent exports are rejected without changing existing records. A missing saved `draft.revisionId` is recorded as unknown, without claiming a saved revision; the export digest identifies the imported snapshot.

### US2 — Perform a supervised handoff (P1)

As a creator, I can copy reviewed fields into Suno, use its own controls to select a model and submit, and record the resulting song links without the MCP spending credits.

1. Given a prepared package, when I start handoff, then I see its exact fields, requested model, applicable control intents, source revision/hash, and a checklist of values and expected credit cost to confirm in Suno before clicking Create.
2. Given the Suno Create form, before I click Create, when I confirm the handoff, then the actual selected model and every applicable input-affecting control, including Variety and Max Mode when present, are recorded in a pre-submit snapshot with time and observation source. Unknown controls or retained attachments block an input-verified claim. A changed form after the snapshot requires fresh confirmation.
3. Given an observed song ID/link, when I record it, then it is associated with the exact prepared package with its observation source; provider completion and musical review remain separate per output.
4. Given no ID or a failed/ambiguous submission, when I record the outcome, then the submission is `submitted_unconfirmed`, `uncertain`, or `failed`, never successful with an empty ID list.
5. Given a download, when I record it, then I record whether it came through a Suno-provided download channel; the MCP does not fetch a CDN URL.

### US3 — Conditional authorized automation (P2; blocked by gate 2)

As a creator, if Suno provides an authorized integration path, I can request one controlled submission and receive a trustworthy status.

1. Given documented authorization and a reviewed package, when submission is invoked, then the chosen model, mode, title, lyrics, style, instrumental value, all applicable Create controls, absence of unsupported attachments, and expected credit cost are read back or confirmed before the paid action. Any mismatch or unresolved input/cost stops the run.
2. Given a submission response loss, when status is reconciled, then only proven IDs can be linked; duplicate paid submissions are prevented while the outcome is uncertain.
3. Given `streaming`, `complete`, `failed`, or another provider state, when status is returned, then only terminal success is represented as complete.
4. Given authorization is absent, expired, or inapplicable, when automatic generation is requested, then the tool rejects it with a clear reason and offers supervised handoff.

## Functional requirements

- **FR-001:** The MCP MUST have a current, evidenced V6 model catalogue and Create-control inventory, and MUST distinguish requested, observed, and unknown models and control values.
- **FR-002:** The first release MUST NOT expose any working legacy provider-backed tool, including generation, credits, status, recent-song reads, waiting, or direct download. Legacy tool names MUST fail safely or be removed with migration guidance until an operation-specific positive service-access disposition exists.
- **FR-003:** The first release MUST import the existing WRBG console `finishedSong` JSON using `contracts/wrbg-console-import.md`, preserving its exact title, lyrics, style, draft identity, optional saved revision, and export digest. A prepared package MUST preserve exact applicable text fields, instrumental intent, requested model, intent type, mode, applicable Create-control intents, source revision/hash, control-inventory version, and creation time; credentials MUST NOT be stored in it. Finished-lyric intent MUST use Custom Mode, while description-led Simple Mode MUST NOT claim lyric preservation.
- **FR-004:** The handoff MUST show exact fields, applicable control intents, and expected credit cost; validate known limits; capture actual selected model, every applicable input-affecting control, and retained-attachment disposition in a pre-submit snapshot; and require fresh review after any field, form, control inventory, or source revision changes. Unknown controls or unsupported attachments prevent input verification.
- **FR-005:** A run record MUST separate submission state, per-output provider state and ID provenance, and per-output listening review. Each provider-state observation MUST carry source and time. It MUST NOT infer completion or audio review from a prepared package or metadata alone.
- **FR-006:** Any later paid action MUST require positive service-access disposition, exact input/model/applicable-control readback, no unsupported retained attachments, confirmed expected credit cost, single-action protection, confirmed IDs or an uncertain state, and no automatic retry.
- **FR-007:** Any later browser integration MUST use a dedicated profile, loopback-only CDP, exact Suno origin and tab checks, bounded operations, and no token logging.
- **FR-008:** Any later authorized file download MUST use the authorized channel and a confined destination with size/type checks and no silent overwrite.
- **FR-009:** Tool inputs and outputs MUST have bounded schemas and avoid leaking raw provider errors, tokens, or untrusted titles into unsafe Markdown.
- **FR-010:** Distribution MUST have a reconciled license, a locked dependency set, a working test command, and recorded vulnerability review.

## Out of scope for the first release

- V6's multimodal editing, Voices, Custom Models, My Taste, Studio, remastering, and commercial-rights determinations.
- Description-led Simple Mode handoff until its V6 form behavior is separately observed and accepted.
- Standalone manual entry of title, style, and lyrics; the first release imports the console's existing JSON export.
- Automated generation or downloading by replaying the current fork's Clerk token or using its hCaptcha/CDP click path.
- A claim that prepared inputs produced a particular sound without listening evidence.

## Success criteria

- **SC-001:** Every advertised model maps to the current Suno model list, and every applicable Create control has an evidenced disposition; no generation request defaults to a retired model or silently inherits an unreviewed control.
- **SC-002:** The existing WRBG console `finishedSong` JSON imports with exact title/style/lyrics and provenance, and reviewed fields/control intents survive prepare/export/import with no silent truncation. An altered export, revision, or control inventory invalidates approval. Blocked drafts and finished lyrics in Simple Mode cannot be packaged as ready.
- **SC-003:** The first release can complete a manual handoff and record an observed ID without any MCP provider-backed request, paid action, or direct CDN request.
- **SC-004:** No path reports generation success with zero confirmed IDs, treats `streaming` as complete, loses provider state after listening review, or automatically retries an uncertain paid action.
- **SC-005:** Before the first release, a release record shows disposition of licensing, dependency findings, service access, and all required checks. Missing evidence leaves its gate open.

## Open decisions

- Which Suno-provided channel, if any, authorizes programmatic generation and download for this account? Current terms and the fork do not establish one.
- Whether a later automation release is needed after supervised handoff is in use.
- Whether standalone manual entry or description-led Simple Mode should be added after the console JSON import is accepted.
