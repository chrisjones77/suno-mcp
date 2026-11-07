# PR #3 review and fixes

Reviewed head: d8cb06c3851102ac3e1a2c9872c5a05be4c24c56. UWH inspection/verification, lead self-review; no independent reviewer or human acceptance claimed. Scope: runtime, input contracts, tests and dependency metadata; no Suno access. GitHub discussion was empty at review time.

## Findings fixed

- P2: public + unknown observations collapsed to public and proposed a move without catalogue release evidence. Reproduced with a synthetic duplicate row. Aggregate status now stays unknown, observations remain intact, and both observation orders are tested. Catalogue evidence remains an independent positive signal.
- P2: exportedAt accepted arbitrary text and invalid calendar dates as provenance. Supplied values now require the console's canonical UTC timestamp format and calendar roundtrip; absence remains unknown. Blank inventory provenance/workspace identifiers also now fail validation.
- P2: package.json allowed SDK versions as old as 1.0.0 despite the reviewed 1.32.2 lock. Raised the declared compatible minimum to 1.32.2 without changing installed dependency versions. Existing license/access gates remain unresolved.
- P2: plan identity depended only on input bytes. Changed decision semantics could return different proposals under an identical prior plan ID. Added reconciliationVersion offline-reconcile-v2 and bound it with inputSha256 into planId; future semantic revisions must bump it.

Validation: 67 tests pass including real MCP stdio and new regressions. git diff --check passes. Dependency metadata only changed; no fresh vulnerability-audit claim is made. No live collection, generation, downloads, moves, publication or account changes. All legacy operations remain disabled.

Remaining limitations: supplied metadata is not a verified live inventory, no apply tool exists, full Spec001 handoff is incomplete, and release/service/licensing gates remain open. Review fixes do not constitute merge or release approval.
