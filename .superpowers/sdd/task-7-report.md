# Task 7 report: ListRow Figma library slice

## Status

DONE_WITH_CONCERNS

Commit subject: `feat: add ListRow to Figma library`

## Live Figma result

- Added managed page `04.18 ListRow` (`248:6`) after `04.17 SearchField` and
  immediately before `90 Native Differences`.
- Added owned component set
  [ListRow](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=253-14)
  (`253:14`) with exactly six variants: `Divider=None/Indented` crossed with
  `State=Default/Pressed/Disabled`.
- Added exact ordered regular properties: `Title`, `Description`, and `Right`
  (`TEXT`); `Show left`, `Show description`, `Show right`, and `Show arrow`
  (`BOOLEAN`); `Left icon` (`INSTANCE_SWAP`). The live reference totals are
  exactly 18 TEXT, 24 visibility, and 6 swap references.
- `Left icon` defaults to owned `Icon/Info` master `30:16` and exposes all five
  owned Icon keys as preferred swaps. Every variant also owns a separate
  `Icon/ChevronRight` instance linked to `30:7` at zero rotation.
- Every master is `320px` wide with a token-bound `56px` minimum height.
  Normal-copy masters resolve to `320 x 62px`; the content-driven long specimen
  remains `320px` wide and grows to `174px` without text overflow.
- Default, Pressed, Disabled, and Indented behavior use existing semantic
  surface, weak-hover, disabled-foreground, border, spacing, size, and
  typography contracts. No token, Icon, Text Style, or Effect Style was added.

## Evidence and recovery

- The persisted ledger is `/tmp/dsb-state-tds-mobile-workflows-v0.4.json`; Task
  7 continues it at call 59 and records every Figma call through final call 74.
- The first comprehensive audit returned false only because its verifier read
  the runtime's `fontWeight` alias array as a scalar and expected catalog-order
  preferred swaps instead of the valid default-Info-first order. No Figma node
  changed. The corrected full audit passed with zero issues.
- The corrected audit checked 42 bound product paints and found zero
  raw-fallback mismatches and zero unbound visible product paints. This
  explicitly preserves the resolved raw fallback on every bound paint after
  the SearchField clone-rendering regression.
- Natural full-page screenshot: `/tmp/listrow-page-248-6-final.png`,
  `1440 x 742`, SHA-256
  `38f0975fdbe50d9bf1fd6982bd5d28933a79678d3c05263e31eaff0a6d57f0ff`.

## Exact live readback

```text
passed: true
page: 248:6
component set: 253:14 (COMPONENT_SET)
axes: Divider=[None,Indented], State=[Default,Pressed,Disabled]
variants: 6
regular properties: 3 TEXT, 4 BOOLEAN, 1 INSTANCE_SWAP
references: 18 TEXT / 24 visibility / 6 swap
owned instances: Info 6 -> 30:16, ChevronRight 6 -> 30:7, rotations 0
managed pages / component sets: 25 / 17
collections / Variables / Text Styles / Effect Styles: 6 / 116 / 8 / 2
bound paint fallback mismatches / unbound product paints: 0 / 0
overlaps / duplicate logical keys / unnamed nodes: 0 / 0 / 0
```

## Repository sync

- Linked the distinct live set URL from ListRow MDX and regenerated the
  18-record component manifest.
- Updated the ListRow metadata assertion to the live URL.
- Added the 25th managed page, 17th component-set evidence, exact axes and
  properties, screenshot node/hash, and validation narrative to
  `figma/verification.json` and `figma/README.md`.
- The current manifest has 18 records and no empty Figma URL. In the approved
  v0.4 scope, only the future Toast and BottomCTA slices still require live
  Figma URLs; their component records arrive in their own later tasks.

## Verification

```text
manifest:write: exit 0
manifest:check: exit 0
manifest:release-check: exit 0
docs focused unit command: 3 files passed, 34 tests passed
verification.json exact ListRow/page/hash assertions: exit 0
git diff --check: exit 0
fresh live Figma readback: passed true
```

## Concerns

- `manifest:release-check` exits zero because all 18 currently implemented
  records now have Figma URLs. Toast and BottomCTA are not yet manifest records,
  so the command cannot list them until their React/documentation tasks land.
- The aggregate artifact verifier still targets the earlier milestone. Task 12
  owns its expansion to the final v0.4 20-component, 27-page, and 19-set totals.
