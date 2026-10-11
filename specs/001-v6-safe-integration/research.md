# Research and audit baseline

**Date:** 2026-10-11  
**Method:** source review of commit `108ef3f902b490ec00ace077266a4ade852426e6` and current Suno documentation. No live Suno submission, browser inspection, or audio review was performed.

## V6: first gate

- [Suno release notes](https://suno.com/release-notes) date the V6 family to 2026-09-09. [Current models](https://help.suno.com/en/articles/13924737) list `v6`, `v6-wild`, and `v6-mini`; [model-selection help](https://help.suno.com/en/articles/13924993) places the picker in the Create form and says the selection persists.
- `src/index.js:55-58,79-82,201-227` advertises `chirp-v4` defaults and forwards a model argument. `src/suno-client.js:356-361` discards that argument. Thus the tool contract cannot select or attest to V6. It might inherit the browser's current model if the old automation still works; this has not been tested.
- `src/suno-client.js:190-252` relies on text matching, textarea selectors, and private React fiber props. Current V6 form structure and field limits remain unverified. The older style `maxlength=1000` selector is an implementation assumption, not current provider evidence.
- Suno's [V6 FAQ](https://help.suno.com/en/articles/13924481) says older models are retired for new generations. Remove old-model options rather than translating model names speculatively.
- The same V6 FAQ says Variety adjusts style prompts and Max Mode costs additional credits. A requested model and exact field strings alone are insufficient to attest to the submitted creative inputs or paid cost; record and confirm both controls.

## Service and rights gate

- [Suno Terms of Service](https://suno.com/terms-of-service), sections on prohibited uses and permitted downloads, restrict robots/scraping and prohibit obtaining copies outside Suno-provided download channels. This is a product and contractual gate, not a finding that an officially authorized API can never exist. Confirm the applicable route before enabling automation.
- `src/suno-client.js:45-105` extracts a Clerk session token from the active browser and calls `studio-api.prod.suno.com`; this is not an OAuth grant to the MCP. `src/suno-client.js:118-329` uses CDP to click Generate, including a trusted-click workaround for hCaptcha. `src/suno-client.js:405-442` fetches a CDN MP3 directly. Exclude these paths from the first release.
- `src/index.js:23-31,89-135` also exposes credits, status, wait, and recent-song tools; `src/suno-client.js:364-402` implements them through the same internal API and browser token. Disabling only generation and download would leave the first release using that route.

## Correctness and security findings

| ID | Evidence | Consequence / disposition |
|---|---|---|
| A-01 | `src/suno-client.js:226-252` checks nonempty React props, not equality to requested values, then continues after synchronization failure. | Wrong paid submission; exact readback and fail-closed gate. |
| A-02 | `src/suno-client.js:297-326` can fall back to time-window matching or return no clips; `src/index.js:210-219` says generation started anyway. | Ambiguous or duplicate paid action; explicit uncertain state and reconciliation. |
| A-03 | `src/suno-client.js:379-402` treats `streaming` as done. | Premature completion claim; terminal-state model. |
| A-04 | `src/cdp.js:1-43` accepts configurable CDP, matches a URL substring, and may navigate the first browser target. | Wrong-tab or exposed browser session; dedicated profile and exact origin. |
| A-05 | `src/suno-client.js:405-442` accepts an arbitrary folder and loosely checked URL, buffers whole content, and may overwrite. | File/network risk; remove direct download now, constrain any future authorized route. |
| A-06 | `scripts/probe2.js:46-56` prints a token prefix. | Credential disclosure in shared logs; remove token previews. |
| A-07 | `package.json` says ISC; README says MIT; no `LICENSE` file. `npm test` refers to missing `test-api.js`. | Distribution and assurance gaps; resolve before release. |

The prior SkillSpector static scan scored 27/100 (medium caution) with partial coverage because OSV was unavailable and some JavaScript parsing was incomplete. Its CDP listing/session-persistence flags require manual interpretation. The score is not a release decision or a dependency-vulnerability clearance.

## Evidence still required

1. Dated, read-only inspection of the current Create form and V6 picker, including account-tier availability and current field limits; do not spend credits during discovery.
2. Written service-access disposition for each proposed generation, status, and download channel.
3. Dependency and license review with current lockfile and upstream provenance.
4. Mocked tool-contract and failure-path results; any later live paid trial requires an explicit operator action and a record of input, selected model, credit delta, IDs, and outcome.
