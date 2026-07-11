# Design System v0.1 Figma workspace

## Target file

- Location: Figma team Drafts
- File: [Design System v0.1](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- Repository: [maxxuxx/design-system](https://github.com/maxxuxx/design-system) (`PUBLIC`)
- Phase 0 approved: 2026-07-10

This file is the approved target for the Figma implementation. Phase 0 resolved
the source-of-truth decisions. Phase 1 created and validated the five token
collections, now containing 111 Variables, eight Text Styles, and two Effect
Styles. Phase 2 created the ordered page structure and the first five
documentation roots.
Foundations visual approval was recorded at `2026-07-10T23:08:13+09:00`, and
Phase 3 component construction covers the five v0.1 families plus Checkbox,
RadioGroup, and Switch.

## Typography

The approved Figma font family is `IBM Plex Sans KR` with these exact styles:

- `Regular`
- `Medium`
- `SemiBold`
- `Bold`

The code token keeps the complete CSS fallback stack. Figma Text Styles use the
installed `IBM Plex Sans KR` family.

## Collections

- `Primitives`
- `Semantic Color`
- `Spacing`
- `Typography`
- `Radius`

Every collection has one `Default` mode. Primitive colors are hidden from
pickers, semantic colors alias primitive variables, every Variable has explicit
scopes and WEB syntax, and the machine-readable readback is stored in
[`token-map.json`](./token-map.json).

## Pages

1. `00 Cover`
2. `01 Principles`
3. `02 Getting Started`
4. `03 Foundations`
5. `04 Components`
6. `04.1 Icon`
7. `04.2 Badge`
8. `04.3 Button`
9. `04.4 TextField`
10. `04.5 ScrollArea`
11. `04.6 Checkbox`
12. `04.7 RadioGroup`
13. `04.8 Switch`
14. `90 Native Differences`
15. `99 Deprecated`

The required 15-page prefix is validated in this exact order. The original
empty `Page 1` remains after this managed prefix and is not used by the library.

## Original Phase 2 Foundations catalog

- Documentation roots: `00 Cover`, `01 Principles`, `02 Getting Started`,
  `03 Foundations`, and `04 Components`
- Cover frame: fixed `1440 × 900` for a stable Figma page thumbnail
- Catalog sections: 13
- Catalog items: 114
  - Variables: 104
  - Text Styles: 8
  - Effect Styles: 2
- Missing, unexpected, duplicate, or unbound items: 0
- Layout overlap or clipping failures: 0
- Foundations frame: [open in Figma](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=11-8)

All five roots use token-bound canvas, text, spacing, and padding values. The
Foundations catalog binds every applicable sample to its exact Variable or
Style. Dimension and radius geometry uses the semantic `color/action/primary`
fill so it remains visible on surface cards. The complete CSS font stack is
displayed as text because a Figma text node accepts one installed family rather
than a fallback stack.

The later `blur/subtle` Variable brings the live file to 105 Variables. Its
value, binding, and visual behavior are documented on `04.5 ScrollArea` and in
the final token readback.

## Foundations approval

- `approved`: `true`
- `approvedAt`: `2026-07-10T23:08:13+09:00`
- `tokenParity`: `true`

The original approved readback preserves all 104 Variables, eight Text Styles,
two Effect Styles, explicit scopes, WEB syntax, aliases, and the full generated
CSS font stack without missing or duplicate source items.

## Phase 3 Icon validation

- Component count: 5
- Component names: `Icon/Check`, `Icon/ChevronRight`, `Icon/Close`, `Icon/Info`,
  and `Icon/Search`
- `properties`: `[]`
- Masters: five owned `24 × 24` SVG components
- Catalog instances: 15 total, covering all five icons at `16`, `20`, and `24`
- Master size binding: `size/icon/large`
- Catalog size bindings: `size/icon/small`, `size/icon/medium`, and
  `size/icon/large`
- Vector fill/stroke binding: `color/icon/primary`
- Accessibility description: `기능 아이콘입니다. 단독으로 사용할 때는 반드시 접근 가능한 텍스트 이름을 함께 제공하세요.`
- Layout audit: no overlaps, clipping, or unnamed nodes; exactly five catalog
  instances per row
- Full-page screenshot target: `04.1 Icon` (`9:7`), rendered at `1440 × 572`
- Catalog: [open in Figma](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=31-2)
- Owned components:
  - [Icon/Check](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=30-4)
  - [Icon/ChevronRight](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=30-7)
  - [Icon/Close](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=30-11)
  - [Icon/Info](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=30-16)
  - [Icon/Search](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=30-20)

The final binding audit passed every structural, variable-binding, naming,
description, ownership, URL-distinctness, and non-overlap check. The screenshot
shows readable documentation, one aligned master row, and three unclipped
five-icon catalog rows.

## Phase 3 Badge validation

- Component set: [Badge](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=47-2)
- Variant count: 16
- Axes:
  - `Size`: `Small`, `Medium`
  - `Variant`: `Soft`, `Solid`
  - `Tone`: `Neutral`, `Primary`, `Success`, `Danger`
- Component properties: `Label` (`TEXT`, default `Badge`)
- Size bindings: `size/badge/small` (`20px`) and `size/badge/medium` (`24px`)
- Padding bindings: `space/8`; Medium adds token-bound `space/2` adjustments
- Radius binding: `radius/full`
- Typography: `Caption` or `Body/Small` plus `font/weight/semibold`
- Product fills and text use only the planned semantic status/action Variables
- WCAG AA status aliases: `color/status/success` → `color/green/700` and
  `color/status/danger` → `color/red/700`; soft contrast is `6.18:1` and
  `5.95:1`, while solid contrast is `6.55:1` and `6.54:1`
- Layout audit: 0 unnamed nodes, duplicate keys, variant overlaps, or
  documentation/component-set overlaps
- Binding audit: every applicable fill, text color, height, padding, radius,
  typography weight, and component-property reference passed
- Full-page screenshot target: `04.2 Badge` (`9:8`), rendered at `1440 × 532`

The planned variant creation script was reconciled with the existing Icon page
convention: component height is bound before restoring horizontal hug sizing,
and the full-width documentation root sits at `(0, 0)` with the component set
below it at `(64, 296)`. This preserves the compact React width model and avoids
top-level overlap.

## Phase 3 Button validation

- Component set: [Button](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=65-56)
- Variant count: 27
- Axes:
  - `Size`: `Small`, `Medium`, `Large`
  - `Variant`: `Fill`, `Weak`, `Outline`
  - `State`: `Default`, `Pressed`, `Disabled`
- Component properties, in order: `Label` (`TEXT`), `Loading` (`BOOLEAN`),
  `Show leading icon` (`BOOLEAN`), `Show trailing icon` (`BOOLEAN`),
  `Leading icon` (`INSTANCE_SWAP`), and `Trailing icon` (`INSTANCE_SWAP`)
- Control heights: `size/control/small` (`44px`),
  `size/control/medium` (`48px`), and `size/control/large` (`56px`)
- Horizontal padding: `space/16`, `space/20`, and `space/24`; gaps use
  `space/8`, `space/8`, and `space/12`
- Radius: `radius/md`; icon and spinner geometry: `size/icon/medium` (`20px`)
- Typography: `Body/Small`, `Body`, or `Body/Large` plus
  `font/weight/semibold`
- Product fills, strokes, labels, icon slots, loading overlay, and spinner use
  semantic Variables only; the 1px stroke and spinner arc are structural
  geometry
- All five Icon masters keep their original component IDs and use one named
  `glyph` layer. This preserves the Button foreground override through every
  `INSTANCE_SWAP` target: Check, ChevronRight, Close, Info, and Search.
- Loading parity: `Loading=false` shows the normal label and optional icon
  slots; `Loading=true` shows the disabled-color overlay and centered spinner
  while covering the normal content
- Property preview: [Normal and Loading](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=74-56)
- Layout audit: 0 unnamed nodes, duplicate logical keys, variant overlaps, or
  documentation/component-set/preview overlaps
- Binding and property audit: all 27 variants, all six custom properties, all
  three axes, five icon swaps, and both Loading values passed
- Full-page screenshot target: `04.3 Button` (`9:9`), rendered at
  `1440 × 1040`

## Phase 3 TextField validation

- Component set: [TextField](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=80-50)
- Variant count: 8
- Axes:
  - `Size`: `Medium`, `Large`
  - `State`: `Default`, `Focus`, `Error`, `Disabled`
- Component properties, in order: `Label` (`TEXT`), `Value` (`TEXT`),
  `Description` (`TEXT`), and `Error` (`TEXT`)
- State precedence: `Disabled > Error > Focus > Default`
- Control heights: `size/control/medium` (`48px`) and
  `size/control/large` (`56px`)
- Default resizable width: `320px`; it is documentation guidance rather than a
  variant or product token
- Padding and gap: `space/16` and `space/8`; radius: `radius/md`
- Typography: `Body/Small` plus `font/weight/semibold` for labels, `Body` for
  values, and `Caption` for description/error feedback
- Product fills, strokes, and text use semantic Variables only; the 1px stroke
  is structural geometry
- Description remains visible in every variant. Error feedback is additionally
  visible in both Error variants, matching the React description-plus-error
  contract.
- Binding and property audit: all eight variants, both axes, four editable text
  properties, heights, padding, gap, radius, typography, and state colors passed
- Layout audit: 0 clipped helper/error labels, unnamed nodes, duplicate logical
  keys, variant overlaps, or documentation/component-set overlaps
- Full-page screenshot target: `04.4 TextField` (`9:10`), rendered at
  `1440 × 704`

## Phase 3 ScrollArea validation

- Component set: [ScrollArea](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=115-6)
- Variant count: 4
- Axis: `State` with `No overflow`, `Start`, `Middle`, and `End`
- Component properties: none; runtime content and localized labels remain React
  API concerns rather than editable Figma properties
- Specimen size: `320 × 240` per state
- Direction cues: `0`, `1`, `2`, and `1` active edges respectively
- Active edge height: `space/64`; directional `color/bg/surface` tint opacity:
  `36%`; background blur radius: `blur/subtle` (`8px`)
- Navigation targets: `44 × 44`, bound to `size/control/small`; icon instances
  are `Icon/ChevronRight` at `size/icon/medium` (`20px`)
- Top controls point up and bottom controls point down; inactive directions
  contain neither a blur layer nor a navigation target
- Buttons reuse `Shadow/1`, semantic action/border Variables, and `radius/full`
- Binding audit: no unbound visible fill, stroke, or effect values; all four
  ChevronRight instances resolve to the owned master component
- Full-page screenshot target: `04.5 ScrollArea` (`111:2`), rendered at
  `1440 × 660`

## Form controls v0.2 Checkbox validation

- Component set: [Checkbox](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=139-176)
- Variant count: 18
- Axes:
  - `Size`: `Small`, `Medium`
  - `Value`: `Unchecked`, `Checked`, `Indeterminate`
  - `State`: `Default`, `Error`, `Disabled`
- Component properties: `Label`, `Description`, and `Error` (`TEXT`)
- Indicator sizes: `size/selection/small` (`20px`) and
  `size/selection/medium` (`24px`)
- Target row: `size/control/small` (`44px`); gaps use `space/4` and `space/8`
- Radius: `radius/sm`; typography: `Body/Small`, `Body`, and `Caption`
- Product fills, strokes, labels, helper text, error text, and disabled states
  use semantic Variables only
- State precedence: `Disabled > Error > Default`; checked/mixed remains an
  independent value axis
- Binding audit: all indicator dimensions and zero padding, target heights,
  gaps, radius, fills, strokes, text styles, and text-property references passed
- Layout audit: all 18 variants have content-driven heights with no clipping or
  overlap; error variants preserve description plus error feedback
- Full-page screenshot target: `04.6 Checkbox` (`138:2`), rendered at
  `1440 × 720`

## Form controls v0.2 RadioGroup validation

- Component set: [RadioGroup](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=147-272)
- Variant count: 18
- Axes:
  - `Size`: `Small`, `Medium`
  - `Selection`: `None`, `First`, `Second`
  - `State`: `Default`, `Error`, `Disabled`
- Component properties: `Legend`, `Option 1`, `Option 2`, `Option 3`,
  `Description`, and `Error` (`TEXT`)
- Specimen: three visible options; runtime option values, name, count, and form
  submission remain React concerns
- Indicator sizes: `size/selection/small` (`20px`) and
  `size/selection/medium` (`24px`)
- Option rows: `size/control/small` (`44px`); gaps use `space/4` and `space/8`
- Indicator zero padding: `space/0`; radius: `radius/full`
- Typography: `Body/Small`, `Body`, and `Caption`; legend weight uses
  `font/weight/semibold`
- Product fills, strokes, dots, labels, helper/error text, and disabled states
  use semantic Variables only
- Binding audit: all 54 indicators and 54 target rows, gaps, radius, paints,
  text styles, and 108 text-property references passed
- Layout audit: all 18 variants have content-driven heights with no clipping or
  overlap; Error preserves description plus group error
- Full-page screenshot target: `04.7 RadioGroup` (`147:2`), rendered at
  `1440 × 1180`

## Form controls v0.2 Switch validation

- Component set: [Switch](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=153-122)
- Variant count: 12
- Axes:
  - `Size`: `Small`, `Medium`
  - `Value`: `Off`, `On`
  - `State`: `Default`, `Error`, `Disabled`
- Component properties: `Label`, `Description`, and `Error` (`TEXT`)
- Track sizes: `size/switch/small-width` × `size/switch/small-height`
  (`36 × 20px`) and `size/switch/medium-width` ×
  `size/switch/medium-height` (`44 × 24px`)
- Target row: `size/control/small` (`44px`); gaps use `space/4` and `space/8`
- Track padding: `space/0`; radius: `radius/full`; thumb uses `Shadow/1`
- Typography: `Body/Small`, `Body`, and `Caption`
- Product fills, strokes, thumbs, labels, helper/error text, and disabled states
  use semantic Variables only
- State precedence: `Disabled > Error > Default`; Off/On remains an independent
  value axis
- Binding audit: all 12 tracks, thumbs, target rows, padding, gaps, radius,
  paints, text styles, elevation, and 36 text-property references passed
- Layout audit: all variants have content-driven heights with no clipping or
  overlap; thumb geometry is correct for both sizes and values
- Full-page screenshot target: `04.8 Switch` (`151:2`), rendered at
  `1440 × 800`

Status: Foundations, all five v0.1 slices, Checkbox, RadioGroup, and Switch are
validated in Figma.

## Phase 4 library verification

- Final live readback: `2026-07-12T03:48:50+09:00`
- Managed pages: all 15 current pages in the documented order
- Final token readback: five collections, 111 Variables, eight Text Styles, and
  two Effect Styles
- Token-map reconciliation: the regenerated live projection is byte-identical
  to [`token-map.json`](./token-map.json)
- Token coverage: 113 unique source mappings, including 26 Semantic Color and
  57 COLOR Variable rows
- Variable integrity: five `Default` modes, exact WEB syntax and scopes, no
  broken aliases, missing IDs, or `ALL_SCOPES`
- WCAG boundary aliases: `color/border/default` → `color/neutral/500`,
  `color/border/strong` → `color/neutral/600`, and `color/focus/ring` →
  `color/blue/600`; the default control boundary is `3.25:1` and the focus
  ring is `5.76:1` against white
- Live value parity: all 111 Variable source values/aliases and resolved values
  match code; the canonical evidence digest is
  `e55bbafaf807e873e8ab4dfb8894dc615cd117703ee892d45138169d19e3a0df`
- Effect parity: both live Effect Styles match the source shadow geometry,
  color, alpha, visibility, and blend mode; the canonical shadow evidence
  digest is `e2179886ca04a830b42b19fad263d68ed2510c3e8fb826cf3171b7cfeb370fb8`.
  The digest covers normalized live style IDs, names, descriptions, and effect
  fields; the stored readback is also parsed and compared to the source shadow
  tokens during verification.
- Accessibility: all reviewed text/background pairs meet WCAG AA, and every
  Button/TextField/ScrollArea/Checkbox/RadioGroup/Switch control target is at least
  44px with distinct focus, pressed, error, disabled, or direction-availability
  presentation
- Component parity: Icon `5`, Badge `16`, Button `27`, TextField `8`,
  ScrollArea `4`, Checkbox `18`, RadioGroup `18`, and Switch `12`; all properties, variants,
  semantic bindings, and React contracts passed
- Product-value audit: `0` visible hard-coded product paints. Inherited plugin
  keys on Instances and the intentionally invisible default fill on TextField
  component roots are excluded from owner/value counts.
- Naming audit: `0` unnamed nodes and `0` duplicate owner-level logical keys
- Empty-state documentation added and reviewed for `90 Native Differences` and
  `99 Deprecated`
- Screenshots: every managed page was captured and reviewed for legibility,
  clipping, overlap, stale copy, and visible component coverage; all 15 SHA-256
  fingerprints are stored in verification evidence for all 15 managed pages
- Machine-readable evidence: [`verification.json`](./verification.json)

Code Connect is explicitly `skipped-v0.1`.
