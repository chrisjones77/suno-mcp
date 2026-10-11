# Run record contract (proposed)

## Prepared package

Required fields: `schemaVersion`, `packageId`, `sourceRevision`, `sourceSha256`, `createdAt`, `title`, `lyrics`, `style`, `instrumental`, `requestedModel`, `modelEvidence`, `mode`, and `status: prepared`. Preserve exact strings; never include browser tokens, cookies, or full raw provider responses. `modelEvidence` is one of `current-docs`, `observed-in-suno`, or `unverified` and does not imply that the picker was actually set.

`requestedModel` is a currently documented V6 family choice, or `unresolved`. A package with `unresolved` can be copied but cannot be represented as model-verified. A source or field edit creates a new package revision and invalidates prior approval.

## Outcome states

| State | Meaning | Evidence needed |
|---|---|---|
| `prepared` | Exact package exists; no Suno action claimed. | Package hash and validation result. |
| `submitted_unconfirmed` | Operator reports clicking Create, but no trustworthy ID yet. | Operator timestamp; no success claim. |
| `observed` | Specific Suno ID/link is associated with the package. | ID/link and observation source. |
| `complete` | Suno reports a terminal successful result. | Provider state or operator observation; no audio-quality claim. |
| `failed` | A terminal failure is observed. | Failure evidence, safely redacted. |
| `uncertain` | Action may have happened; result cannot be reconciled. | Trigger window and reason; no automatic retry. |
| `reviewed` | Creator listened and recorded an assessment. | Reviewer, date, identified output, observations. |

An authorized automation adapter may add `confirmedSubmittedModel`, `confirmedInputHash`, `creditBefore`, `creditAfter`, and `providerJobIds`. No status with an empty confirmed ID list may be called generation success. `streaming` remains a provider substate under an incomplete outcome.

## Invariants

- Never infer `submitted`, `complete`, or `reviewed` from a prepared package alone.
- Never infer selected model from the MCP's requested model or Suno's last-used preference.
- Never automatically retry `submitted_unconfirmed` or `uncertain`.
- Never treat a direct CDN fetch as a permitted Suno download.
