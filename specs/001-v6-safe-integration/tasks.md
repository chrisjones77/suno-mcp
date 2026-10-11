# Tasks: V6 Safe Integration

Tasks are ordered by gate. None are complete merely because the specification exists.

## Gate 1 — V6 compatibility

- [ ] T001 Populate a dated V6 Create-control inventory conforming to `contracts/create-control-inventory.md`: models, tiers, picker, mode semantics, limits, all applicable controls, retained attachments, and refresh evidence. (FR-001, SC-001)
- [ ] T002 Before publishing a replacement contract, disable all existing provider-backed tools, including credits, status, wait, recent songs, generation, and download; then remove `chirp-v4` defaults and retired-model claims. Make requested and actual observed model distinct. (FR-001, FR-002, SC-001, SC-003)
- [ ] T003 Define and implement separate submission, per-output provider, and listening-review states; record actual model and every applicable control with observation source and time. (FR-005, SC-004)
- [ ] T004 Add mocked contract cases for advertised models, control-inventory changes, actual-versus-requested observations, unknown or retained controls/attachments, and mismatch behavior. (FR-001, SC-001)

## Gate 2 — service access and first usable release

- [ ] T005 Record an operation-by-operation Suno service-access disposition for generation, credits, status, wait, recent-song reads, browser control, and downloads; cite current terms and any written permission. (FR-002, SC-005)
- [ ] T006 Implement atomic import of the existing WRBG console `finishedSong` JSON per `contracts/wrbg-console-import.md`, rejecting blocked/malformed exports; create a pure package with exact fields, export/field hashes, optional saved revision, UTF-16 style length, Custom Mode enforcement, versioned control intents, no-attachment intent, and stale-approval handling. (FR-003, FR-004, SC-002)
- [ ] T007 Add manual copy/export and a Suno Create checklist that records actual model, every applicable control, retained-attachment absence, expected credit cost, observation sources/times, and an immutable pre-submit snapshot bound to the operator-reported click time. (FR-004, SC-003)
- [ ] T008 Add manual observation of song IDs/links with association basis, per-output provider-state source/time/history, download-channel provenance, and independent audio review. (FR-005, SC-003)
- [ ] T009 Keep every legacy provider-backed tool disabled or removed in the first release, with explicit migration responses; no read-only internal API exception. (FR-002, SC-003)
- [ ] T010 Remove probe token preview and redact error outputs; bound tool schemas. (FR-009)
- [ ] T011 Add mocked console-export import/round-trip, blocked-draft and unknown-saved-revision provenance, finished-lyric Simple Mode rejection, invalid-limit, stale-export/inventory, model/control/attachment/cost mismatch, pre-click snapshot, zero-ID, uncertain-state, provider-state provenance/history, and all-disabled-legacy-tool checks. (SC-002, SC-004)

## Gate 3 — assurance

- [ ] T012 Resolve ISC/MIT mismatch and license-file/upstream-permission status. (FR-010, SC-005)
- [ ] T013 Review locked dependencies and current vulnerability findings; replace `npm test`'s missing target with a working suite. (FR-010, SC-005)
- [ ] T014 Produce a release evidence record distinguishing deterministic checks, read-only UI observation, Suno authorization, and listening review; approve Release 1 only after T001–T013 and all applicable gates have passed. (SC-005)

## Conditional later automation

- [ ] T015 Only after positive T005, select an authorized integration path and document its supported operations. (FR-006)
- [ ] T016 Implement exact pre-submit field/model/applicable-control readback, unsupported-attachment absence, confirmed expected cost, explicit paid-action approval, one-shot guard, and confirmed-ID/uncertain reconciliation. (FR-006, SC-004)
- [ ] T017 If browser access is authorized, use dedicated profile, loopback CDP, exact origin, explicit target, operation timeouts, and no token logging. (FR-007)
- [ ] T018 If downloads are authorized, use the approved channel, confined path, size/type checks, atomic write, and no overwrite. (FR-008)
- [ ] T019 Record a controlled live trial with exact input, actual model, credit change, IDs, terminal state, and separate listening observations. (FR-006, SC-005)
