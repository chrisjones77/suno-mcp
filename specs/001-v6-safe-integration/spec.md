# Feature Specification: Suno V6 Integration Readiness

**Repository:** `chrisjones77/suno-mcp`  
**Baseline:** `108ef3f902b490ec00ace077266a4ade852426e6` (2026-04-13)  
**Status:** Proposed; no live-use approval  
**Created:** 2026-10-11

## Purpose

Make the fork useful for preparing and tracking Suno V6 song runs without claiming that an obsolete model, an unverified browser state, or an uncertain generation succeeded. The first usable release prepares a reviewed handoff for Suno's own Create and download interfaces. Programmatic submission and download require a separately documented, authorized path.

## Release gates, in order

1. **V6 compatibility:** Identify the current Suno Create form, supported V6 family, model-picker behavior, limits, and result states. Remove the advertised `chirp-v4` default and other retired-model claims. Until a model can be observed and confirmed, the MCP must describe it as unknown and must not claim to select it.
2. **Service access:** Document the permitted interaction and download channels against current Suno terms or written authorization. Browser-session token extraction, internal API calls (including credits, status, and recent-song reads), anti-bot workarounds, and direct CDN downloads are excluded from the first release. No provider-backed tool is enabled without a positive disposition.
3. **Paid-action correctness:** A requested run must have exact reviewed inputs, one explicit operator action, and an unambiguous result or `uncertain` state. An uncertain result must not be retried automatically.
4. **Security and distribution:** Constrain browser/file access, eliminate token disclosure, resolve the fork's license mismatch, and review dependencies before release.

## User stories and acceptance scenarios

### US1 — Prepare a V6 run (P1)

As a creator, I can prepare exact title, lyrics, style, instrumental intent, requested V6-family model, Variety setting, and Max Mode intent for a handoff to Suno.

1. Given the current V6 model list, when I choose `v6`, `v6-wild`, or `v6-mini`, then the package records my choice and its source; no older model is presented as the default. Unsupported or unavailable choices remain unresolved.
2. Given a finished-lyric package, when I prepare a run, then the exact line breaks and Unicode characters are preserved, the style is counted in UTF-16 code units, and over-limit text is blocked rather than truncated.
3. Given no verified model picker or a changed Create form, when I prepare a run, then copy/export remains available, while model selection and automatic Generate are not claimed to work.
4. Given a changed source revision, when I reopen a package, then the previous approval is stale and cannot be reused silently.
5. Given Variety or Max Mode is unavailable or its effect is unknown, when I prepare a run, then the setting is marked unresolved; the package does not claim exact style control or a known credit cost.

### US2 — Perform a supervised handoff (P1)

As a creator, I can copy reviewed fields into Suno, use its own controls to select a model and submit, and record the resulting song links without the MCP spending credits.

1. Given a prepared package, when I start handoff, then I see its exact fields, requested model, Variety and Max Mode intents, source revision/hash, and a checklist of values and expected credit cost to confirm in Suno before clicking Create.
2. Given the Suno Create form, when I confirm the handoff, then the actual selected model, Variety setting, Max Mode state, time, and observation source are recorded separately from the requested values; missing observations remain unknown.
3. Given an observed song ID/link, when I record it, then it is associated with the exact prepared package with its observation source; provider completion and musical review remain separate per output.
4. Given no ID or a failed/ambiguous submission, when I record the outcome, then the submission is `submitted_unconfirmed`, `uncertain`, or `failed`, never successful with an empty ID list.
5. Given a download, when I record it, then I record whether it came through a Suno-provided download channel; the MCP does not fetch a CDN URL.

### US3 — Conditional authorized automation (P2; blocked by gate 2)

As a creator, if Suno provides an authorized integration path, I can request one controlled submission and receive a trustworthy status.

1. Given documented authorization and a reviewed package, when submission is invoked, then the chosen model, mode, title, lyrics, style, instrumental value, Variety, Max Mode, and expected credit cost are read back or confirmed before the paid action. Any mismatch or unresolved cost stops the run.
2. Given a submission response loss, when status is reconciled, then only proven IDs can be linked; duplicate paid submissions are prevented while the outcome is uncertain.
3. Given `streaming`, `complete`, `failed`, or another provider state, when status is returned, then only terminal success is represented as complete.
4. Given authorization is absent, expired, or inapplicable, when automatic generation is requested, then the tool rejects it with a clear reason and offers supervised handoff.

## Functional requirements

- **FR-001:** The MCP MUST have a current, evidenced V6 model catalogue and MUST distinguish requested, observed, and unknown models.
- **FR-002:** The first release MUST NOT expose any working legacy provider-backed tool, including generation, credits, status, recent-song reads, waiting, or direct download. Legacy tool names MUST fail safely or be removed with migration guidance until an operation-specific positive service-access disposition exists.
- **FR-003:** A package MUST preserve exact title, lyrics, style, instrumental intent, requested model, Variety and Max Mode intents, source revision/hash, and creation time; credentials MUST NOT be stored in it.
- **FR-004:** The handoff MUST show exact fields and expected credit cost, validate known limits, record actual selected model and paid-control observations separately, and require fresh review after any field or source revision changes.
- **FR-005:** A run record MUST separate submission state, per-output provider state and ID provenance, and per-output listening review. It MUST NOT infer completion or audio review from a prepared package or metadata alone.
- **FR-006:** Any later paid action MUST require positive service-access disposition, exact input/model/Variety/Max Mode readback, confirmed expected credit cost, single-action protection, confirmed IDs or an uncertain state, and no automatic retry.
- **FR-007:** Any later browser integration MUST use a dedicated profile, loopback-only CDP, exact Suno origin and tab checks, bounded operations, and no token logging.
- **FR-008:** Any later authorized file download MUST use the authorized channel and a confined destination with size/type checks and no silent overwrite.
- **FR-009:** Tool inputs and outputs MUST have bounded schemas and avoid leaking raw provider errors, tokens, or untrusted titles into unsafe Markdown.
- **FR-010:** Distribution MUST have a reconciled license, a locked dependency set, a working test command, and recorded vulnerability review.

## Out of scope for the first release

- V6's multimodal editing, Voices, Custom Models, My Taste, Studio, remastering, and commercial-rights determinations.
- Automated generation or downloading by replaying the current fork's Clerk token or using its hCaptcha/CDP click path.
- A claim that prepared inputs produced a particular sound without listening evidence.

## Success criteria

- **SC-001:** Every advertised model maps to the current Suno model list; no generation request defaults to a retired model.
- **SC-002:** Exact reviewed fields and paid-control intents survive prepare/export/import with no silent truncation; an altered revision invalidates approval.
- **SC-003:** The first release can complete a manual handoff and record an observed ID without any MCP provider-backed request, paid action, or direct CDN request.
- **SC-004:** No path reports generation success with zero confirmed IDs, treats `streaming` as complete, loses provider state after listening review, or automatically retries an uncertain paid action.
- **SC-005:** A release record shows disposition of licensing, dependency findings, service access, and all required checks. Missing evidence leaves its gate open.

## Open decisions

- Which Suno-provided channel, if any, authorizes programmatic generation and download for this account? Current terms and the fork do not establish one.
- Whether a later automation release is needed after supervised handoff is in use.
- Which WRBG console export format should be accepted first; preserve the current console's exact revision and style limit when integrating.
