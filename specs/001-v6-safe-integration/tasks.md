# Tasks: V6 Safe Integration

Tasks are ordered by gate. None are complete merely because the specification exists.

## Gate 1 — V6 compatibility

- [ ] T001 Record dated evidence for current V6 models, tier availability, Create form picker, mode controls, and field limits. (FR-001, SC-001)
- [ ] T002 Before publishing a replacement contract, disable all existing provider-backed tools, including credits, status, wait, recent songs, generation, and download; then remove `chirp-v4` defaults and retired-model claims. Make requested and actual observed model distinct. (FR-001, FR-002, SC-001, SC-003)
- [ ] T003 Define and implement separate submission, per-output provider, and listening-review states; record actual model/settings with observation source and time. (FR-005, SC-004)
- [ ] T004 Add mocked contract cases for advertised models, actual-versus-requested observations, and mismatch/unknown behavior. (FR-001, SC-001)

## Gate 2 — service access and first usable release

- [ ] T005 Record an operation-by-operation Suno service-access disposition for generation, credits, status, wait, recent-song reads, browser control, and downloads; cite current terms and any written permission. (FR-002, SC-005)
- [ ] T006 Implement pure prepared-package creation with exact fields, canonical source hash, UTF-16 style length, Variety and Max Mode intents, and stale-approval handling. (FR-003, FR-004, SC-002)
- [ ] T007 Add manual copy/export and a Suno Create checklist that records actual model, Variety, Max Mode, expected credit cost, observation sources/times, and exact input confirmation. (FR-004, SC-003)
- [ ] T008 Add manual observation of song IDs/links with association basis, per-output provider state, download-channel provenance, and independent audio review. (FR-005, SC-003)
- [ ] T009 Keep every legacy provider-backed tool disabled or removed in the first release, with explicit migration responses; no read-only internal API exception. (FR-002, SC-003)
- [ ] T010 Remove probe token preview and redact error outputs; bound tool schemas. (FR-009)
- [ ] T011 Add mocked round-trip, invalid-limit, stale-revision, model/Variety/Max Mode/cost mismatch, zero-ID, uncertain-state, independent provider/review-state, and all-disabled-legacy-tool checks. (SC-002, SC-004)

## Gate 3 — assurance

- [ ] T012 Resolve ISC/MIT mismatch and license-file/upstream-permission status. (FR-010, SC-005)
- [ ] T013 Review locked dependencies and current vulnerability findings; replace `npm test`'s missing target with a working suite. (FR-010, SC-005)
- [ ] T014 Produce a release evidence record distinguishing deterministic checks, read-only UI observation, Suno authorization, and listening review. (SC-005)

## Conditional later automation

- [ ] T015 Only after positive T005, select an authorized integration path and document its supported operations. (FR-006)
- [ ] T016 Implement exact pre-submit field/model/Variety/Max Mode readback, confirmed expected cost, explicit paid-action approval, one-shot guard, and confirmed-ID/uncertain reconciliation. (FR-006, SC-004)
- [ ] T017 If browser access is authorized, use dedicated profile, loopback CDP, exact origin, explicit target, operation timeouts, and no token logging. (FR-007)
- [ ] T018 If downloads are authorized, use the approved channel, confined path, size/type checks, atomic write, and no overwrite. (FR-008)
- [ ] T019 Record a controlled live trial with exact input, actual model, credit change, IDs, terminal state, and separate listening observations. (FR-006, SC-005)
