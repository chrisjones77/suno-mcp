# Run record contract (proposed)

## Prepared package

Required fields: `schemaVersion`, `packageId`, `sourceRevision`, `sourceSha256`, `createdAt`, `title`, `lyrics`, `style`, `instrumental`, `requestedModel`, `modelCatalogSource`, `mode`, `varietyIntent`, `maxModeIntent`, and `status: prepared`. Preserve exact strings; never include browser tokens, cookies, or full raw provider responses. The source hash covers a documented canonical serialization of all reviewed input fields so a field change invalidates approval.

`requestedModel` is a currently documented V6 family choice, or `unresolved`. `modelCatalogSource` identifies the dated documentation used to offer that choice; it does not prove what was selected in Suno. `varietyIntent` and `maxModeIntent` record what the creator wants (normally zero and off for exact style control), not an assumption about the live form. An unresolved setting can be copied but cannot be described as input-verified. A source or field edit creates a new package revision and invalidates prior approval.

## Handoff observations

Store `observedModel`, `modelObservedAt`, and `modelObservationSource` separately from `requestedModel`. Similarly store actual `observedVariety`, `observedMaxMode`, their observation times/sources, and `expectedCreditCost` with its source. Use `unknown` when the operator cannot confirm a value. The actual observations must match the approved intents before marking inputs verified or before any future paid automation. Recording a manual observation does not make it an automated attestation.

## Independent state axes

| Axis | Values | Meaning |
|---|---|---|
| `submissionState` | `prepared`, `submitted_unconfirmed`, `submitted`, `uncertain`, `failed` | Whether a paid action and its job identity are known. `submitted` requires at least one confirmed provider ID or operator-observed song ID with provenance. |
| `outputs[].providerState` | `unknown`, `pending`, `streaming`, `complete`, `failed` | Status of each identified output. Only `complete` is terminal success; status is not inferred from a link or audio review. |
| `outputs[].reviewState` | `unreviewed`, `reviewed` | Whether that specific output was listened to and assessed. This never replaces provider state. |

Each output has `id`, `url`, `identityObservationSource`, `identityObservedAt`, `providerState`, `reviewState`, and optional `reviewer`, `reviewedAt`, and `observations`. A manually entered ID/link is explicitly an operator observation; it is not proof that the output came from the prepared package. Record the association basis and leave it uncertain if it cannot be established.

An authorized automation adapter may add `confirmedSubmittedModel`, `confirmedInputHash`, `creditBefore`, `creditAfter`, and `providerJobIds`. No submission with an empty confirmed ID list may be called generation success. `streaming` remains nonterminal even if playable audio exists.

## Invariants

- Never infer submission, provider completion, or listening review from a prepared package alone.
- Never infer selected model from `requestedModel`, catalogue documentation, or Suno's last-used preference.
- Never automatically retry `submitted_unconfirmed` or `uncertain`.
- Never treat a direct CDN fetch as a permitted Suno download.
