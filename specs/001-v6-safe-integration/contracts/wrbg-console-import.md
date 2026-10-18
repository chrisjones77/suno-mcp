# WRBG console JSON import contract

**First-release source:** the existing WRBG console's exported `finishedSong` JSON. This contract maps a user-provided export into a prepared Suno MCP package; it does not invoke Suno or imply that the export was submitted.

## Accepted input and validation

Accept a UTF-8 JSON object with `schemaVersion: 1`, `purpose: "finishedSong"`, `status: "preparedForManualHandoff"`, `ready: true`, `fields.title`, `fields.style`, `fields.lyrics`, and `draft`. Reject `blockedDraft`, nonempty `errors`, absent/empty required fields, inconsistent `fields.title` and `draft.title`, malformed JSON, unsupported schema versions, and an export exceeding the console's 10 MiB local package bound. Reject atomically: an invalid import creates no package or partial run record.

Revalidate exact field strings and UTF-16 lengths at import; never truncate or normalize lyrics, style, or line endings. Treat the exported `ready` flag as a claim of local compilation readiness, not proof of approved content, current Suno limits, actual model selection, or submission. The importer must not execute embedded content or trust links/paths in the export as actions.

## Mapping and provenance

| Console export | Prepared package |
|---|---|
| `fields.title`, `fields.style`, `fields.lyrics` | Exact title, style, lyrics for `intentType: finished-lyrics`, `mode: custom` |
| Raw UTF-8 export bytes | `exportSha256`, identifying the imported snapshot |
| Exact reviewed input fields and control intents | `sourceSha256` under the package's documented canonical serialization |
| `draft.id`, optional `draft.revisionId`, `exportedAt` | Upstream provenance fields, with missing values shown as unknown |
| `canonicalVoice`, `canonicalStyle`, `draft` | Optional source context; never silently replace `fields.style` or `fields.lyrics` |

Use the export digest as this package's source revision identity. A `draft.revisionId` is an optional upstream saved-revision reference, not proof that the exported fields equal that saved snapshot: the console may export an edited or unsaved draft. Preserve `savedRevisionEquivalence: unverified` unless an independently verified snapshot comparison exists. Any changed export bytes or compiled fields require a new package and renewed handoff approval.

The console export does not specify Suno V6 model or every Create control. The operator chooses those in the MCP package against the dated control inventory and verifies the actual form state before clicking Create. No browser credential, Suno session token, or automatic submission is imported from the file.

## First-release acceptance

Import a real ready console export and preserve exact title/style/lyrics. Reject blocked and malformed exports. Import an unsaved but ready export while clearly identifying it by digest and leaving saved-revision equivalence unverified. A round trip must preserve exact fields and retain provenance without claiming Suno input verification or audio review.
