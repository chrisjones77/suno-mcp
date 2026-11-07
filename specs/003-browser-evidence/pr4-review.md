# PR #4 review and remediation — 2026-11-07

Reviewed base implementation: `c6176c63bd6c5d233b6295b282c82217a711947b` against main `9e2faed33ae054a3ec5a1860817e6aed3ad8334d`.

User authorized review, fixes and merge conditional on passing checks. UWH primary inspect (0xC), companions maintain (0x2) and verify (0xB); human-led coverage method, no dispatched provider or invented independent review. Installed package digest remains `569bdf01ee3f36c20946e485d8c45a7a05d0e27e94ac776701153379cf860c86`; package inventory/profile inspection succeeded. Allowed effects for this task include local source/tests and GitHub branch/PR/merge operations; Suno operations and release-gate closure remain excluded. The reviewer's self-review is not independent human acceptance.

## Findings fixed

1. **P1 — Aggregate validation occurred after durable capture append.** An eleventh 1,000-row window could cross the collection limit, be saved, then cause both the append and every subsequent load to fail. The new regression reproduced the extra sequence file before the fix. `recordCapture` now validates the entire prospective collection before exclusive file creation; rejected input leaves the prior checkpoint unchanged and readable.
2. **P2 — Collector and reconciler contracts disagreed.** The collector allowed over 500 windows, over 10,000 repeated observations, and blank titles that the consumer rejected. Collection now bounds distinct windows and total observations to the reconciler limits and normalizes blank titles to null. It still preserves incomplete coverage and exact recording identity.
3. **P2 — Capture identities were checked only within a verification event.** A later batch could reuse an earlier capture UUID with different recording evidence. The ledger now checks validated capture content against earlier verified batches during both append and replay. A genuinely new capture UUID remains valid.
4. **P2 — Nonregular files could block recovery.** Opening a FIFO for reading blocked before the regular-file check could run. The regression timed out on the old implementation. Evidence reads now use nonblocking open and reject nonregular files before reading.

All five new regression cases failed against the original implementation and pass after the fixes. No findings remain unaddressed within the documented offline scope.

## Validation and disposition

- Full local suite: **102 passed, 0 failed, 0 skipped**.
- Diff whitespace check: passed.
- Existing MCP registry, client/CDP disablement and transport tests continue to pass; no live adapters or account actions added.
- GitHub CI is the merge condition for the exact updated PR head, covering Node 22/24 on Linux/macOS. The PR/check records hold the final head and merge disposition; local test success alone is not that evidence.

Source and test hashes are updated in `validation.md`. The original inventory discrepancy, live DOM compatibility, external acceptance and all outstanding release gates stay open. No real track data or journals were used for regressions. No Suno recording was moved, published or deleted during this review.
