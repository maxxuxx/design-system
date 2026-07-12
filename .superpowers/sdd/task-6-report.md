# Task 6 report: ListRow React and documentation slice

## Status

DONE_WITH_CONCERNS

Commit subject: `feat: add ListRow component`

## Implementation summary

- Added the public `ListRow` export with the approved static `div`, native
  `button`, and native `anchor` overloads and branch-correct forwarded refs.
  Runtime dispatch checks string `href` first, function `onClick` second, and
  otherwise renders the static fallback. Buttons default to `type="button"`;
  anchors keep real `href` behavior and expose no fake `disabled` prop.
- Preserved each selected root's native props, including native anchor `type`,
  while stripping dangerous HTML, branch-invalid runtime props, and caller
  attempts to replace owned data attributes. Inline styles pass through the
  existing safe-layout whitelist.
- Added presentational left content, semantically exposed right content, and
  the owned decorative ChevronRight. Static rows may contain an interactive
  trailing Switch. In development and tests, action rows validate their
  rendered DOM and reject nested anchor, button, input, select, textarea,
  summary, and positive-tabindex descendants.
- Added token-backed flat full-width row CSS with a 56px minimum, content-driven
  height, indented divider, disabled/pressed/focus states, reduced motion,
  forced-colors handling that preserves a nested Switch's own system-color
  control, and explicit Icon color inheritance.
- Added the complete 13-heading ListRow document and deterministic examples for
  static + trailing Switch, button, link, disabled, divider, arrow, and long
  unbroken copy states.
- Appended only `ListRow/list-row` to the canonical schema, navigation,
  generated manifest, and browser routes: exactly 18 ordered component records
  and 28 static HTML routes. ListRow's Figma URL remains empty for Task 7.

## TDD evidence

### Initial React RED

After creating `packages/react/src/list-row/ListRow.test.tsx` and before adding
production files:

```bash
pnpm --filter @maxxuxx/react exec vitest run src/list-row/ListRow.test.tsx
```

Exited 1 with:

```text
FAIL  src/list-row/ListRow.test.tsx
Error: Failed to resolve import "./ListRow"
Test Files  1 failed (1)
Tests       no tests
```

The implemented file then passed its 20 branch, native-prop, validation,
presentation, responsive-CSS, and axe tests.

### Controller regression RED/GREEN

The forced-colors ownership assertion first failed because the row applied
`forced-color-adjust: none` to the whole subtree. The production-guard source
assertion also rejected the non-replaceable `globalThis.process` access. The
root opt-out was removed, a conventional build-replaceable
`process.env.NODE_ENV === 'production'` guard was installed, and runtime
production-mode coverage now proves validation is skipped there.

### Independent review regression RED/GREEN

The three Important findings were reproduced independently:

```text
anchor native type:
Expected type="text/html"
Received null

owned Icon color:
Expected ListRow left/arrow .ds-icon color: inherit selector
Received no matching selector

200% computed text size:
Expected title font-size >= 32
Received 16
```

The anchor branch now forwards `type`, left/arrow Icons inherit their wrapper
colors through normal, disabled, and forced-colors states, and the 320px browser
test explicitly doubles title/description text, asserts computed sizes are at
least twice baseline, then checks row and page containment. Focused React
regressions passed 2/2 and the corrected mobile browser regression passed 1/1.

## Final GREEN evidence

Fresh focused React verification after review fixes:

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/list-row/ListRow.test.tsx \
  src/board-row/BoardRow.test.tsx \
  src/switch/Switch.test.tsx
pnpm --filter @maxxuxx/react check
```

Result:

```text
Test Files  3 passed (3)
Tests       46 passed (46)
tsc --noEmit: exit 0
```

Fresh docs and generated-artifact verification:

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs test:unit
pnpm --filter @maxxuxx/docs build
git diff --check
```

Result:

```text
Test Files  3 passed (3)
Tests       34 passed (34)
Astro check: 0 errors, 0 warnings, 1 pre-existing hint
Static build: 28 pages, exit 0
git diff --check: exit 0
```

Fresh required browser verification after all review fixes:

```bash
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/components.spec.ts \
  tests/e2e/demo-contracts.spec.ts \
  tests/e2e/accessibility.spec.ts
```

Result:

```text
341 passed
94 intentionally skipped by project ownership
0 failed
```

Manifest readback:

```text
components: 18
last record: ListRow / list-row
figmaUrl: ""
canonical static routes: 28
```

## Review conclusion

- The independent read-only review initially reported zero Critical and three
  Important findings: anchor `type` preservation, owned Icon color inheritance,
  and a false-positive 200% text-zoom test.
- All three findings received failing regressions, focused fixes, and fresh
  verification.
- Independent re-review explicitly approved the current diff and found no
  remaining Critical or Important issue. `git diff --check` was clean.

## Self-review

- Re-read Task 6 and the approved ListRow API, semantics, documentation, and
  artifact requirements against every changed file.
- Confirmed exact root/ref overloads, href-first dispatch, button default type,
  real-anchor behavior, safe style filtering, owned data precedence, and
  runtime branch-prop sanitization.
- Confirmed left and arrow are decorative, right remains exposed, static Switch
  operation is covered, action branches reject every specified descendant, and
  production builds skip the development validator.
- Confirmed long unbroken content, 320px containment, computed 200% text growth,
  forced-colors focus/divider/Switch ownership, and axe coverage in browsers.
- Confirmed the generated JSON has exactly 18 ordered records with ListRow last
  and an empty Figma URL, the static build has exactly 28 routes, and Task 12
  verifier/visual aggregate files were not touched.

## Concerns

- Existing axe/jsdom runs emit the repository's informational canvas
  `getContext()` message; all assertions pass.
- Astro check retains the pre-existing `z.string().url()` deprecation hint and
  reports zero errors and zero warnings.
- Live Figma creation and all final v0.4 aggregate verifier/visual totals remain
  intentionally deferred to Tasks 7 and 12.
