# Design System v0.1 Figma workspace

## Target file

- Location: private team Drafts
- File: [Design System v0.1](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- Phase 0 approved: 2026-07-10

This file is the approved target for the Figma implementation. Phase 0 resolved
the source-of-truth decisions. Phase 1 created and validated the five token
collections, 104 Variables, eight Text Styles, and two Effect Styles. Phase 2
created the ordered page structure and the first five documentation roots.
Foundations visual approval was recorded at `2026-07-10T23:08:13+09:00`, and
Phase 3 component construction is now in progress.

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
10. `90 Native Differences`
11. `99 Deprecated`

The required 11-page prefix is validated in this exact order. The original
empty `Page 1` remains after this managed prefix and is not used by the library.

## Phase 2 Foundations catalog

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

## Foundations approval

- `approved`: `true`
- `approvedAt`: `2026-07-10T23:08:13+09:00`
- `tokenParity`: `true`

The approved readback preserves all 104 Variables, eight Text Styles, two Effect
Styles, explicit scopes, WEB syntax, aliases, and the full generated CSS font
stack without missing or duplicate source items.

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

Status: Foundations, Icon, and Badge are validated. `Button` and `TextField`
pages exist but do not contain components yet.

Code Connect is excluded from v0.1.
