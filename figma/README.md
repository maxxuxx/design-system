# Design System v0.1 Figma workspace

## Target file

- Location: private team Drafts
- File: [Design System v0.1](https://www.figma.com/design/hNlju4j556mzi0G515UDwE)
- Phase 0 approved: 2026-07-10

This file is the approved target for the Figma implementation. Phase 0 resolved
the source-of-truth decisions. Phase 1 created and validated the five token
collections, 104 Variables, eight Text Styles, and two Effect Styles. Phase 2
created the ordered page structure and the first five documentation roots.
Component construction starts after the pending Foundations visual approval.

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

Status: Foundations visual approval is pending. `Icon`, `Badge`, `Button`, and
`TextField` pages exist but do not contain components yet.

Code Connect is excluded from v0.1.
