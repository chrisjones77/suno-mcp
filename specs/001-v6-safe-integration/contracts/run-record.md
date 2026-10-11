# Run record contract (proposed)

## Prepared package

Required fields: `schemaVersion`, `packageId`, `sourceRevision`, `sourceSha256`, `createdAt`, `intentType`, `mode`, `title`, `instrumental`, `requestedModel`, `modelCatalogSource`, `controlInventoryVersion`, `controlIntents`, `attachmentIntent`, and `status: prepared`. `finished-lyrics` additionally requires exact `lyrics` and `style` fields; `description` additionally requires a nonempty `description` field. Preserve exact strings; never include browser tokens, cookies, or full raw provider responses. The source hash covers a documented canonical serialization of all reviewed input fields, control intents, and inventory version so a change invalidates approval.

`intentType` is `finished-lyrics` or `description`. `finished-lyrics` requires `mode: custom` and the complete text in `lyrics`; reject `mode: simple`. `description` requires `mode: simple` and its prompt in `description`, with no supplied `lyrics`; it does not claim lyric preservation. The first-release acceptance path is `finished-lyrics`; description-led handoff remains unverified until separately checked against the V6 form. `requestedModel` is a currently documented V6 family choice, or `unresolved`. `modelCatalogSource` identifies the dated documentation used to offer that choice; it does not prove what was selected in Suno.

`controlIntents` is keyed by the versioned inventory of applicable Create controls. Each entry records the intended value or an explicit `unresolved` disposition, including Variety and Max Mode when present. The first release uses `attachmentIntent: none`; unrepresented attachments are unsupported. An unresolved setting can be copied but cannot be described as input-verified. A source, field, or inventory edit creates a new package revision and invalidates prior approval.

## Handoff observations

Store `observedModel`, `modelObservedAt`, and `modelObservationSource` separately from `requestedModel`. `controlObservations` records each applicable control's actual value or `unknown`, observation time/source, and whether it was set, cleared, absent, or unresolved. Record `observedAttachments` and their absence/source/time, plus `expectedCreditCost` with its source. This includes Variety, Max Mode, and any currently applicable advanced controls; do not silently inherit previous form state. A newly encountered control missing from the inventory makes the package stale. The actual observations must match approved intents, and unsupported attachments must be absent, before marking inputs verified or before any future paid automation. Recording a manual observation does not make it an automated attestation.

An input-verified manual handoff stores an immutable `preSubmitSnapshotId`, `preSubmitObservedAt`, and later `createClickedAt` reported by the operator. All model/control/attachment observations in that snapshot must precede the click and refer to the same package revision and inventory version. A form or package change after observation invalidates the snapshot; a post-click observation cannot retroactively verify submitted inputs. If no trustworthy click time or snapshot exists, the run remains unverified.

## Independent state axes

| Axis | Values | Meaning |
|---|---|---|
| `submissionState` | `prepared`, `submitted_unconfirmed`, `submitted`, `uncertain`, `failed` | Whether a paid action and its job identity are known. `submitted` requires at least one confirmed provider ID or operator-observed song ID with provenance. |
| `outputs[].providerState` | `unknown`, `pending`, `streaming`, `complete`, `failed` | Status of each identified output. Only `complete` is terminal success; status is not inferred from a link or audio review. |
| `outputs[].reviewState` | `unreviewed`, `reviewed` | Whether that specific output was listened to and assessed. This never replaces provider state. |

Each output has `id`, `url`, `identityObservationSource`, `identityObservedAt`, `providerState`, `providerStateObservedAt`, `providerStateSource`, `reviewState`, and optional `reviewer`, `reviewedAt`, and `observations`. Preserve a timestamped provider-state history rather than overwriting the only observation. A manually entered ID/link is explicitly an operator observation; it is not proof that the output came from the prepared package. Record the association basis and leave it uncertain if it cannot be established.

An authorized automation adapter may add `confirmedSubmittedModel`, `confirmedInputHash`, `creditBefore`, `creditAfter`, and `providerJobIds`. No submission with an empty confirmed ID list may be called generation success. `streaming` remains nonterminal even if playable audio exists.

## Invariants

- Never infer submission, provider completion, or listening review from a prepared package alone.
- Never infer selected model from `requestedModel`, catalogue documentation, or Suno's last-used preference.
- Never treat finished lyrics in Simple Mode, unknown input-affecting controls, or retained unsupported attachments as input-verified.
- Never automatically retry `submitted_unconfirmed` or `uncertain`.
- Never treat a direct CDN fetch as a permitted Suno download.
