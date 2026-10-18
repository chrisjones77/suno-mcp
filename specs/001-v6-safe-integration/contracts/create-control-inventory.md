# V6 Create-control inventory contract

**Purpose:** Define the evidence needed before a prepared package or paid action can claim that Suno's Create form matched the reviewed input. This file defines the inventory format; it does not assert that the current form has been inspected.

## Inventory record

A dated inventory version contains `inventoryVersion`, `observedAt`, `observer`, `accountTier` (or `unknown`), `formOrigin`, `formRoute`, `modelChoices`, `fieldLimits`, `controls`, `attachmentSlots`, and `evidence`. Evidence identifies official documentation or read-only UI observations; it must not contain cookies, tokens, account identifiers, or unreleased lyrics.

Each control entry contains:

- `controlId` and user-visible label;
- applicability by mode, V6 model, and account tier, including `unknown` where not established;
- allowed values and the observed initial or persisted value, without assuming a default from prior sessions;
- effect category (`input`, `cost`, `both`, or `unknown`);
- how the operator can set, clear, or confirm it;
- observation source and date; and
- disposition for the first release (`required`, `clear`, `unsupported`, or `unresolved`).

The inventory includes model selection, mode, instrumental intent, Variety, Max Mode, and all other applicable input-affecting controls actually found in the current V6 Create form. Documented possibilities such as Vocal Gender, Exclude, and creative sliders are discovery prompts, not presumed-current controls. Record attachment slots and whether prior uploads or references persist. A missing or unknown control remains unresolved; do not silently omit it from a package.

## Versioning and refresh

Use a stable digest of the normalized inventory as `inventoryVersion`. A changed Create layout, newly encountered control, model/tier change, altered field limit or price display, changed persistence behavior, or new Suno documentation triggers read-only reinspection and a new version. Packages made with an older version become stale for input verification until the new inventory is reconciled. A mere date change with identical evidence does not claim compatibility.

The first release requires a dated inventory artifact conforming to this contract before its handoff checklist can claim complete coverage. Current UI behavior remains unverified until that artifact exists.
