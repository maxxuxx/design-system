# Design System v0.1 Figma workspace

## Target file

- Location: private team Drafts
- File: [Design System v0.1](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- Phase 0 approved: 2026-07-10

This file is the approved target for the Figma implementation. Phase 0 resolved
the source-of-truth decisions. Phase 1 created and validated the five token
collections, 104 Variables, eight Text Styles, and two Effect Styles. Page
documentation and components have not been created yet.

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

## Planned pages

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

Code Connect is excluded from v0.1.
