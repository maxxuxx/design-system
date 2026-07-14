# Task 5 report: SearchField Figma library slice

## Status

DONE_WITH_CONCERNS

Commit subject: `feat: add SearchField to Figma library`

## Live Figma result

- Added managed page `04.17 SearchField` (`230:29`) immediately before
  `90 Native Differences`.
- Added owned component set
  [SearchField](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=238-19)
  (`238:19`) with exactly eight variants: `Value=Empty/Filled` crossed with
  `State=Default/Focus/Disabled/ReadOnly`.
- Added exact `Placeholder#238:0` and `Value#238:9` TEXT properties. The live
  audit matches `Value` by display name plus type, so the TEXT property remains
  distinct from the `Value` VARIANT axis. Both TEXT properties have eight live
  references.
- Every master retains owned `Icon/Search` and `Icon/Close` instances linked to
  masters `30:20` and `30:11`. The icons are `20 x 20px` inside token-bound
  `48 x 48px` targets. Close is visible only for Filled + Default/Focus.
- All eight masters are `320 x 56px` and bind semantic surface, border, text,
  icon, focus-ring, size, spacing, radius, and Body Style contracts. Fixed and
  `takeSpace` remain documentation behavior rather than variant axes.

## Evidence and recovery

- The persisted ledger is `/tmp/dsb-state-tds-mobile-workflows-v0.4.json`; it
  continues the prior run at call 31 and records 58 successful calls.
- Atomic recovery handled the exact Title font face, current constraint enums,
  the runtime's URI-only documentation-link shape, and a wrapping-text width
  collapse without leaving partial nodes.
- Visual validation exposed black raw paint fallbacks on cloned semantic
  bindings. A focused audit proved that modes and Variable IDs resolved
  correctly while zero-color seed values remained stale. One-variant
  hypothesis testing passed, then all 19 raw-vs-resolved mismatches were
  normalized without removing bindings. The final audit reports zero paint
  mismatches and zero unbound visible product paints.
- Natural full-page screenshot: `/tmp/searchfield-page-230-29-final.png`,
  `1440 x 436`, SHA-256
  `e53117e1bc17ffe727c87fd42b07e13c8681e10432d781946135cc5d87b553c2`.

## Exact live readback

```text
passed: true
page: 230:29
component set: 238:19 (COMPONENT_SET)
axes: Value=[Empty,Filled], State=[Default,Focus,Disabled,ReadOnly]
variants: 8
properties: Placeholder TEXT, Value TEXT, Value VARIANT, State VARIANT
owned instances: Search 8 -> 30:20, Close 8 -> 30:11
targets: 48 x 48px
managed pages / component sets: 24 / 16
collections / Variables / Text Styles / Effect Styles: 6 / 116 / 8 / 2
duplicate logical keys: 0
```

## Repository sync

- Linked the distinct live set URL from SearchField MDX and regenerated the
  17-record component manifest.
- Updated the SearchField metadata assertion to the live URL.
- Added the 24th managed page, 16th component-set evidence, exact axes and
  properties, screenshot node/hash, and validation narrative to
  `figma/verification.json` and `figma/README.md`.

## Verification

```text
manifest:write: exit 0
manifest:check: exit 0
manifest:release-check: exit 0
docs focused unit command: 3 files passed, 33 tests passed
verification.json exact SearchField/page/hash assertions: exit 0
git diff --check: exit 0
fresh live Figma readback: passed true
```

## Concerns

- `manifest:release-check` exits zero without listing ListRow, Toast, or
  BottomCTA because those future records are not yet present in the current
  17-record incremental manifest. This matches the Task 4 incremental-slice
  behavior; their records and final aggregate totals remain owned by later
  v0.4 tasks.
- The aggregate artifact verifier still targets the earlier milestone. Task 12
  owns its expansion to the final v0.4 20-component, 27-page, and 19-set totals.
