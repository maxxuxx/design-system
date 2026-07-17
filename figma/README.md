# Haru Design System (HDS) v0.1.0 Figma workspace

## Target file

- Location: Figma team Drafts
- File: [Haru Design System](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- Repository: [maxxuxx/design-system](https://github.com/maxxuxx/design-system) (`PUBLIC`)
- Phase 0 approved: 2026-07-10

This file is the approved HDS library target. Its file key and every managed
Variable, Style, Component, and Component Set ID are preserved through the
v0.1.0 rebrand. The current file has six token collections, 116 Variables,
eight Text Styles, two Effect Styles, and 27 ordered pages.
Foundations visual approval was refreshed at `2026-07-12T12:53:48+09:00`, and
The component library covers Icon, Badge, Button, TextField, ScrollArea,
Checkbox, RadioGroup, Switch, Textarea, Select, TextButton, IconButton,
BoardRow, Tab, BottomSheet, Dialog, SearchField, ListRow, Toast, and BottomCTA.

## Typography

The approved Figma font family is `Pretendard` and the eight Text Styles use
the matching regular, medium, semibold, and bold weights required by the token
scale:

- `Regular`
- `Medium`
- `SemiBold`
- `Bold`

The code token keeps the complete Pretendard CSS fallback stack. Figma Text
Styles use the installed Pretendard family while code serves Pretendard
Variable subsets locally.

## Collections

- `Primitives`
- `Semantic Color`
- `Spacing`
- `Typography`
- `Radius`
- `Motion`

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
14. `04.9 Textarea`
15. `04.10 Select`
16. `04.11 TextButton`
17. `04.12 IconButton`
18. `04.13 BoardRow`
19. `04.14 Tab`
20. `04.15 BottomSheet`
21. `04.16 Dialog`
22. `04.17 SearchField`
23. `04.18 ListRow`
24. `04.19 Toast`
25. `04.20 BottomCTA`
26. `90 Native Differences`
27. `99 Deprecated`

The current 27-page library is validated in this exact order.

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

HDS mobile foundation work adds `color/neutral/900-alpha-56`,
`color/bg/scrim`, `motion/duration/fast`, `motion/duration/medium`, and
`motion/easing/standard`. The live file now has 116 Variables across six
collections. The new Motion section in `03 Foundations` documents both
durations, the standard easing curve, reduced-motion intent, and the semantic
scrim binding.

## Foundations approval

- `approved`: `true`
- `approvedAt`: `2026-07-12T12:53:48+09:00`
- `tokenParity`: `true`

The current approved readback preserves all 116 Variables, eight Text Styles,
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

## HDS component TextButton validation

- Component set: [TextButton](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=182-121)
- Variant count: 27
- Axes:
  - `Size`: `Small`, `Medium`, `Large`
  - `Variant`: `Clear`, `Underline`, `Arrow`
  - `State`: `Default`, `Pressed`, `Disabled`
- Component property: `Label` (`TEXT`, default `Text Button`)
- Control heights: `size/control/small` (`44px`),
  `size/control/medium` (`48px`), and `size/control/large` (`56px`)
- Horizontal padding: `space/8`, `space/12`, and `space/16`; gap: `space/4`;
  radius: `radius/sm`
- Typography: `Caption`, `Body/Small`, and `Body` plus
  `font/weight/semibold`
- Default, pressed, and disabled product colors use only semantic Variables;
  all 27 height, fill, padding, gap, radius, label-color, and weight bindings
  passed
- Underline variants use one token-bound structural underline layer. This
  preserves a visible underline while avoiding Figma's synchronization of a
  shared TEXT property's text decoration across every variant master.
- Arrow variants contain exactly one owned `Icon/ChevronRight` instance at
  `size/icon/small`; Clear and Underline contain no icon instance
- Anchor visited state is documented as browser content state and is not a
  Figma variant axis
- Layout audit: zero overlaps, clipping failures, unnamed nodes, or targets
  below `44px`
- Full-page screenshot target: `04.11 TextButton` (`182:2`), rendered at
  `1440 × 1124`

## HDS component IconButton validation

- Component set: [IconButton](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=190-134)
- Variant count: 27
- Axes:
  - `Size`: `Small`, `Medium`, `Large`
  - `Variant`: `Clear`, `Fill`, `Outline`
  - `State`: `Default`, `Pressed`, `Disabled`
- Component property: `Icon` (`INSTANCE_SWAP`, default owned `Icon/Close`)
- Preferred swap values are limited to the five owned Icon component keys:
  Check, ChevronRight, Close, Info, and Search
- Control frames: exactly `44 × 44`, `48 × 48`, and `56 × 56`; icon geometry:
  `20 × 20`, `24 × 24`, and `24 × 24`
- Radius: `radius/full`; padding and gap: `space/0`
- Clear, Fill, Outline, pressed, and disabled paints use semantic action,
  surface, text, and border Variables only
- Binding audit: all 27 root dimensions, fills, strokes, radii, icon sizes,
  icon-paint overrides, and INSTANCE_SWAP references passed
- Layout audit: zero overlaps, clipping failures, unnamed nodes, or targets
  below `44px`
- The documentation requires an accessible label at every use site; the icon
  remains decorative in the React control
- Full-page screenshot target: `04.12 IconButton` (`189:17`), rendered at
  `1440 × 1124`

## HDS component BoardRow validation

- Component set: [BoardRow](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=197-38)
- Variant count: 4
- Axes:
  - `Value`: `Closed`, `Open`
  - `State`: `Default`, `Pressed`
- Component properties: `Title`, `Description`, and `Prefix` (`TEXT`), plus
  `Show description` and `Show prefix` (`BOOLEAN`)
- Summary minimum: token-bound `size/control/large` (`56px`); the default
  two-line specimen resolves to a content-driven `62px` header
- Open-only content resolves to `56px`, producing a `118px` open master without
  clipping; no unknown-height motion is represented
- Every arrow is an owned `Icon/ChevronRight` instance bound to
  `size/icon/medium`; Open uses the reviewed `+90°` collapse affordance
- Surface, border, pressed, text, icon, padding, gap, radius, minimum-height,
  and divider geometry bindings passed for all four variants
- Property-reference audit passed all 20 text and visibility references
- Layout audit: zero overlaps, clipping failures, out-of-bounds children,
  unnamed nodes, or unbound visible product paints
- Full-page screenshot target: `04.13 BoardRow` (`195:2`), rendered at
  `1440 × 720`; SHA-256
  `dc767d45ae6861b9a94ed53514979dadc761a46ddcf74f5dee5af2addd0d17d8`

## HDS component Tab validation

- Component set: [Tab](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=202-59)
- Variant count: 12
- Axes:
  - `Size`: `Small`, `Large`
  - `Layout`: `Equal`, `Scroll`
  - `Selection`: `First`, `Second`, `Third`
- Component properties: `First label`, `Second label`, and `Third label`
  (`TEXT`)
- Small masters are exactly `44px` and bind `size/control/small`; Large masters
  are the code-parity structural `52px` with each target retaining the
  token-bound `44px` minimum
- Equal masters use a `360px` three-way grid; Scroll masters clip `360px`
  content inside a `320px` viewport and expose a token-bound `space/24` edge
  affordance
- Every variant has exactly one selected indicator bound to
  `color/action/primary` and `space/2`; labels use `Body/Small` or `Body` plus
  `font/weight/semibold`
- Property-reference audit passed all 36 label references; all 12 selection
  mappings and indicator positions match their variant values
- A separate documentation section uses component instances to demonstrate a
  `color/text/disabled` item and long-label Scroll overflow without expanding
  the public variant axes
- Paint audit: 122 visible solid product paints, all Variable-bound; unbound
  visible product paints: 0
- Layout audit: zero unintended overlaps, clipping failures, out-of-bounds
  variants, or unnamed nodes
- Full-page screenshot target: `04.14 Tab` (`200:2`), rendered at
  `1440 × 1148`; SHA-256
  `eafc4a14e547ff3fdc8d3c13d0f6d7451b64e298479ecb547e8fa73df89cf539`

## HDS component BottomSheet validation

- Component set: [BottomSheet](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=209-66)
- Variant count: 4 open-state specimens
- Axes:
  - `Height`: `Content`, `Full`
  - `Footer`: `Hidden`, `Visible`
- Component properties: `Title` and `Description` (`TEXT`), plus
  `Show description` (`BOOLEAN`)
- All four masters are `390 × 844px` mobile viewports with a semantic
  `color/bg/scrim`; Content surfaces are `360px` or `448px` high and Full
  surfaces preserve the token-guided `24px` top gap at `820px` high
- Every surface is bottom aligned, uses `color/bg/surface`, token-bound
  `radius/xl` top corners, and the `Shadow/2` Effect Style
- Every variant owns one `Icon/Close` instance in a token-bound `44 × 44px`
  target; Footer Visible variants own one Large Fill Button instance
- Header, body scroll region, and optional footer remain separate layout
  regions; no Full variant clips or extends beyond the viewport
- `26` visible solid product paints are Variable-bound and unbound visible
  product paints are `0`; typography, spacing, radius, target dimensions,
  surface, scrim, and elevation bindings passed
- Closed state is documented as lifecycle behavior rather than an invisible
  variant. Mobile full-width and wider-screen `640px` maximum guidance are
  recorded in the page documentation and React page
- Full-page screenshot target: `04.15 BottomSheet` (`208:19`), rendered at
  `1440 × 2148`; SHA-256
  `740a7f33c4d14b2f1a3915579b42396dfa0c74197fe8f846e66e5153786572d1`

## HDS component Dialog validation

- Component set: [Dialog](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=219-48)
- Variant count: 4
- Axes:
  - `Type`: `Alert`, `Confirm`
  - `Description`: `Hidden`, `Visible`
- Component properties, in order: `Title`, `Description`, `Alert label`,
  `Cancel label`, and `Confirm label` (`TEXT`), plus `Show description`
  (`BOOLEAN`)
- All four masters are `390 × 844px` open-state mobile viewports with a
  semantic `color/bg/scrim`; centered surfaces are `342 × 156px` or
  `342 × 188px` according to description visibility
- Alert owns one `294 × 56px` Large Fill Button. Confirm owns a
  `143 × 56px` Large Weak cancel Button followed by a `143 × 56px` Large Fill
  confirm Button. All six instances remain linked to the owned Button masters
- Direct overlay text layers bridge the Dialog-specific label properties across
  Figma's nested-instance property boundary without detaching or restyling the
  owned Button instances
- Surface, scrim, border, text, action, spacing, radius, typography, and
  `Shadow/2` bindings passed. The documentation specimen binds
  `motion/duration/medium` to width and `motion/easing/standard` to text
- Property-reference audit passed all 14 Dialog-owned references; Hidden
  variants retain hidden descriptions while Visible variants expose
  `Show description`
- Layout audit: zero clipping, out-of-bounds surfaces, unintended action
  offsets, unbound visible product paints, unnamed nodes, or duplicate logical
  keys. Every action target is at least `44 × 44px`
- Dismissal, focus lifecycle, internal long-copy scrolling, and reduced-motion
  behavior remain documented React behavior rather than extra variant axes
- Full-page screenshot target: `04.16 Dialog` (`213:2`), rendered at
  `1440 × 2120`; SHA-256
  `c861063fbeb4ac51a97797eec1e1b9ca6905d81e24c2833e08fe9ce4fd5113eb`

## HDS component SearchField validation

- Component set: [SearchField](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=238-19)
- Variant count: 8
- Axes:
  - `Value`: `Empty`, `Filled`
  - `State`: `Default`, `Focus`, `Disabled`, `ReadOnly`
- Component properties, in order: `Placeholder` and `Value` (`TEXT`). The
  `Value` TEXT property is distinct from the `Value` variant axis by name plus
  property type, with eight live references for each TEXT property
- Every master is `320 × 56px`, binds height to `size/control/large`, uses
  `space/4` padding and gap, and binds all four corners to `radius/md`
- Every variant owns a `20 × 20px` `Icon/Search` instance linked to master
  `30:20` and a `20 × 20px` `Icon/Close` instance linked to master `30:11`.
  Both sit in `48 × 48px` targets bound to `size/control/medium`
- Search is always visible. Close is visible only for Filled + Default/Focus;
  Filled + Disabled/ReadOnly and all Empty variants retain the owned instance
  but hide its target
- Default, Focus, Disabled, and ReadOnly surface, border, text, icon, focus-ring,
  spacing, size, radius, and Body Style bindings passed. Raw SOLID fallbacks
  were reconciled to their resolved Variable colors without removing bindings
- Layout audit: zero clipping, overlap, out-of-bounds targets, duplicate logical
  keys, paint-resolution mismatches, or unbound visible product paints. Every
  Search and Close target exceeds the `44 × 44px` minimum
- Fixed positioning and `takeSpace` remain documented React behavior rather than
  extra variant axes
- Full-page screenshot target: `04.17 SearchField` (`230:29`), rendered at
  `1440 × 436`; SHA-256
  `e53117e1bc17ffe727c87fd42b07e13c8681e10432d781946135cc5d87b553c2`

## HDS component ListRow validation

- Component set: [ListRow](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=253-14)
- Variant count: 6
- Axes:
  - `Divider`: `None`, `Indented`
  - `State`: `Default`, `Pressed`, `Disabled`
- Component properties, in order: `Title`, `Description`, and `Right` (`TEXT`);
  `Show left`, `Show description`, `Show right`, and `Show arrow` (`BOOLEAN`);
  `Left icon` (`INSTANCE_SWAP`). Live reference totals are exactly 18 TEXT,
  24 visibility, and 6 swap references
- Every master is `320px` wide, has a token-bound `56px` minimum height, and
  uses BoardRow-aligned `space/16`, `space/12`, `space/8`, and `space/2`
  spacing. Title uses Body plus `font/weight/semibold`; Description and Right
  use Body/Small with fixed-width, height-growing wrapping geometry
- `Left icon` defaults to owned `Icon/Info` master `30:16` and exposes all five
  owned Icon keys as preferred swaps. A separate owned `Icon/ChevronRight`
  instance remains linked to `30:7` at zero rotation in all six masters
- Default uses `color/bg/surface`, Pressed uses
  `color/action/weak-hover`, and Disabled uses semantic disabled foregrounds.
  Indented variants alone expose a token-bound absolute divider from `x=48`
  to the trailing edge
- All 42 bound product paints preserve their resolved raw fallback and Variable
  binding. The audit found zero fallback mismatches, unbound visible product
  paints, clipping, overlaps, duplicate logical keys, or unnamed nodes
- The property specimens include a `320 × 62px` normal instance and a
  `320 × 174px` long localized/unbroken-copy instance. All 18 title,
  description, and right text nodes across the six masters use height-growing
  wrapping and remain contained
- Static div, native button, and native anchor dispatch remain documented code
  behavior because they share one visual geometry
- Full-page screenshot target: `04.18 ListRow` (`248:6`), rendered at
  `1440 × 742`; SHA-256
  `38f0975fdbe50d9bf1fd6982bd5d28933a79678d3c05263e31eaff0a6d57f0ff`

## HDS component Toast validation

- Component set: [Toast](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=319-274)
- Variant count: 6
- Axes:
  - `Tone`: `Neutral`, `Success`, `Danger`
  - `Action`: `Hidden`, `Visible`
- Component properties, in order: `Message` and `Action label` (`TEXT`),
  `Show icon` (`BOOLEAN`), and `Icon` (`INSTANCE_SWAP`)
- Every master is `320px` wide, uses a token-bound `48px` minimum height,
  `space/8` and `space/12` spacing, `radius/md`, `Shadow/2`, and the
  corresponding neutral, success, or danger status surface with on-status
  foreground
- All six variants own a `20 × 20px` `Icon/Info` instance linked to master
  `30:16`; the swap property limits preferred values to the five owned Icon
  masters. `Show icon` controls visibility without changing the variant axes
- Action Visible variants retain the owned medium clear TextButton master
  `182:73` as a `97 × 48px` action target. Action Hidden variants omit it from
  layout while preserving the same message geometry
- Message and action copy use the Pretendard-backed Body/Small Text Style.
  The live file reports no missing fonts after the style application audit
- Position, FIFO queue, duration, timer pause, and live-region behavior remain
  documented React behavior rather than extra visual variants
- Full-page screenshot target: `04.19 Toast` (`316:2`), rendered at
  `1440 × 576`; SHA-256
  `5018b9a4f38e76e31c4cda142f0263a5feaf9d18dabd6fa1bf848c971d206cc5`

## HDS component BottomCTA validation

- Component set: [BottomCTA](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=331-55)
- Variant count: 4
- Axes:
  - `Layout`: `Single`, `Double`
  - `Background`: `Default`, `None`
- Component properties, in order: `Primary label` and `Secondary label`
  (`TEXT`), with `Continue` and `Back` defaults
- Every master is `320 × 88px`, uses token-bound `space/16` four-side
  padding and `space/12` action gap, and keeps the Pretendard-backed
  Body/Large typography with `font/weight/semibold`
- Single variants expose one `288 × 56px` primary action. Double variants use
  equal `138 × 56px` secondary and primary actions in secondary-first order
- All four masters own the large Fill Button master `64:38` and the large Weak
  Button master `64:62`; Single keeps its secondary instance hidden so both
  TEXT properties and owned-instance links remain stable across the set
- Default binds the root surface to `color/bg/surface`; None has no root fill.
  The audit found zero visible hard-coded product paints and zero unnamed nodes
- Both label properties have four live references, semantic foreground Variable
  bindings, and no missing Pretendard fonts. The final design-context readback
  reproduced the exact four-variant React structure
- Fixed positioning, measured `takeSpace`, safe-area padding, and the
  BottomSheet footer restriction remain documented code behaviors rather than
  additional visual axes
- Full-page screenshot target: `04.20 BottomCTA` (`329:2`), rendered at
  `1440 × 521`; SHA-256
  `e0daa225ea23a82abf38a92735e92fd8b1818125cf4e64dc4e62eda2ba59addb`

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
  `18%` → `6%` → transparent; progressive background blur strengthens toward
  the active edge and resolves to `blur/subtle` (`4px`)
- Navigation targets: `44 × 44`, bound to `size/control/small`; icon instances
  are `Icon/ChevronRight` at `size/icon/medium` (`20px`)
- Top controls point up and bottom controls point down; inactive directions
  contain neither a blur layer nor a navigation target
- Buttons keep a `44 × 44` hit area around a lighter `36 × 36` translucent
  surface, reusing `Shadow/1`, semantic surface/border Variables, and `radius/full`
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

## Form controls v0.2 Textarea validation

- Component set: [Textarea](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=158-56)
- Variant count: 8
- Axes:
  - `Size`: `Medium`, `Large`
  - `State`: `Default`, `Focus`, `Error`, `Disabled`
- Component properties: `Label`, `Value`, `Description`, and `Error` (`TEXT`)
- Specimen width and field heights: `320px`, with visually four-row fields at
  `120px` (Medium) and `128px` (Large); these are layout guidance
- Minimum tiers: `size/control/medium` (`48px`) and
  `size/control/large` (`56px`) are bound to field `minHeight`
- Padding: Medium `space/12` × `space/16`; Large `space/16` × `space/20`;
  root gap uses `space/8`
- Radius: `radius/md`; typography: `Body/Small`, `Body`, and `Caption`; label
  weight uses `font/weight/semibold`
- Product fills, strokes, values, labels, helper/error text, and disabled states
  use semantic Variables only
- Binding audit: all eight fields, min-height tiers, four-side padding, radius,
  state paints, text styles, and 32 text-property references passed
- Layout audit: content-driven variant roots preserve description plus Error
  without clipping; no page, set, or variant overlap was found
- Full-page screenshot target: `04.9 Textarea` (`158:2`), rendered at
  `1440 × 900`

## Form controls v0.2 Select validation

- Component set: [Select](https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=168-72)
- Variant count: 8
- Axes:
  - `Size`: `Medium`, `Large`
  - `State`: `Default`, `Focus`, `Error`, `Disabled`
- Component properties: `Label`, `Value`, `Description`, and `Error` (`TEXT`)
- Closed-field width: `320px`; control heights use `size/control/medium`
  (`48px`) and `size/control/large` (`56px`)
- Padding: vertical `space/0`; horizontal Medium `space/16` or Large
  `space/20`; content gap and root gap use `space/8`
- Radius: `radius/md`; typography: `Body/Small`, `Body`, and `Caption`; label
  weight uses `font/weight/semibold`
- Eight 20px icons are owned `Icon/ChevronRight` instances bound to
  `size/icon/medium`, rotated downward; disabled icon strokes use
  `color/text/disabled`
- Product fills, strokes, values, labels, helper/error text, and icon overrides
  use semantic Variables only
- Binding audit: all fields, heights, four-side padding, gaps, radius, state
  paints, text styles, 32 text-property references, and icon links passed
- Layout audit: content-driven roots preserve description plus Error without
  clipping or overlap; no popup/menu/listbox node exists
- Full-page screenshot target: `04.10 Select` (`168:2`), rendered at
  `1440 × 760`

Status: Foundations, all five v0.1 slices, Checkbox, RadioGroup, Switch,
Textarea, Select, TextButton, IconButton, BoardRow, Tab, BottomSheet, Dialog,
SearchField, and ListRow are validated in Figma.

## Phase 4 library verification

- Current live readback: `2026-07-12T23:09:56+09:00`
- Managed pages: all 25 current pages in the documented order
- Current token readback: six collections, 116 Variables, eight Text Styles, and
  two Effect Styles
- Token-map reconciliation: the regenerated live projection is byte-identical
  to [`token-map.json`](./token-map.json)
- Token coverage: 118 unique source mappings, including 27 Semantic Color and
  59 COLOR Variable rows
- Variable integrity: six `Default` modes, exact WEB syntax and scopes, no
  broken aliases, missing IDs, or `ALL_SCOPES`
- WCAG boundary aliases: `color/border/default` → `color/neutral/500`,
  `color/border/strong` → `color/neutral/600`, and `color/focus/ring` →
  `color/blue/600`; the default control boundary is `3.25:1` and the focus
  ring is `5.76:1` against white
- Live value parity: all 116 Variable source values/aliases and resolved values
  match code; the canonical evidence digest is
  `6552796c323819093677b58af217f94bedf69dfce9ea63c2c3bc15953bfc7018`
- Effect parity: both live Effect Styles match the source shadow geometry,
  color, alpha, visibility, and blend mode; the canonical shadow evidence
  digest is `e2179886ca04a830b42b19fad263d68ed2510c3e8fb826cf3171b7cfeb370fb8`.
  The digest covers normalized live style IDs, names, descriptions, and effect
  fields; the stored readback is also parsed and compared to the source shadow
  tokens during verification.
- Accessibility: all reviewed text/background pairs meet WCAG AA, and every
  Button/TextButton/IconButton/TextField/ScrollArea/Checkbox/RadioGroup/
  Switch/Textarea/Select/BoardRow/Tab/BottomSheet/Dialog/SearchField/ListRow control
  target is at least 44px with distinct focus, pressed, error, disabled, or
  direction-availability presentation
- Component parity: Icon `5`, Badge `16`, Button `27`, TextField `8`,
  ScrollArea `4`, Checkbox `18`, RadioGroup `18`, Switch `12`, Textarea `8`,
  Select `8`, TextButton `27`, IconButton `27`, BoardRow `4`, Tab `12`,
  BottomSheet `4`, Dialog `4`, SearchField `8`, and ListRow `6`; all properties,
  variants, semantic bindings, and React contracts passed
- Variant-axis parity: the exact axis names and ordered values for all seventeen
  component sets are stored in [`verification.json`](./verification.json).
  The aggregate verifier owns the final HDS v0.1.0 totals
- Product-value audit: `0` visible hard-coded product paints. Inherited plugin
  keys on Instances and the intentionally invisible default fill on TextField
  component roots are excluded from owner/value counts.
- Naming audit: `0` unnamed nodes and `0` duplicate owner-level logical keys
- Empty-state documentation added and reviewed for `90 Native Differences` and
  `99 Deprecated`
- Screenshots: every managed page was captured and reviewed for legibility,
  clipping, overlap, stale copy, and visible component coverage; all 25 SHA-256
  fingerprints are stored in verification evidence for all 25 managed pages
- Machine-readable evidence: [`verification.json`](./verification.json)

Code Connect is explicitly `skipped-v0.1`.
