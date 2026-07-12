# Task 4 report: SearchField React and documentation slice

## Status

DONE_WITH_CONCERNS

Commit: `feat: add SearchField component` (this task commit)

## Implementation summary

- Added the public `SearchField` export with the approved native
  `input type="search"` API, forwarded input ref, trimmed non-empty input and
  clear labels, and owned decorative Search/actionable Close icons.
- Implemented controlled mode using `value !== undefined` and uncontrolled
  mode using `defaultValue ?? ''`, typing callbacks, clear ordering
  (`onValueChange('')`, `onClear()`, focus), native form participation, normal
  reset reconciliation, and canceled-reset preservation.
- Added fixed positioning without a portal, `takeSpace=true` measured spacing,
  ResizeObserver cleanup, and an exact token-based no-JavaScript spacer
  fallback. Caller inline styles are filtered through the safe root-layout
  contract.
- Added responsive token-backed CSS for 320px, 200% text zoom, reduced motion,
  forced colors, disabled/readonly presentation, 44px clear action geometry,
  and WebKit native cancel suppression.
- Added the complete 13-heading SearchField document and deterministic
  controlled, filled, readonly, disabled, and contained-fixed examples. The
  contained scroller is keyboard focusable and the fixed bar is proven to
  remain within its specimen bounds.
- Appended only `SearchField/search-field` to the canonical schema,
  navigation, generated manifest, and browser routes: 17 ordered component
  records and 27 static HTML routes. The SearchField Figma URL remains empty.

## TDD evidence

### React RED

After creating `packages/react/src/search-field/SearchField.test.tsx` and
before adding production files:

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/search-field/SearchField.test.tsx
```

Exited 1 with:

```text
FAIL  src/search-field/SearchField.test.tsx
Error: Failed to resolve import "./SearchField"
Test Files  1 failed (1)
Tests       no tests
```

### Docs RED

After locking the 17th metadata record and 27th route in tests, before adding
the schema/navigation/example/MDX implementation:

```bash
pnpm --filter @maxxuxx/docs test:unit -- \
  tests/unit/content.test.ts \
  tests/unit/manifest.test.ts \
  tests/unit/catalog.test.ts
```

Exited 1 with:

```text
Test Files  3 failed (3)
Tests       6 failed | 27 passed (33)
```

The failures were the missing SearchField schema and navigation entries, the
missing `search-field.mdx`, and manifest rejection of the unknown name/slug.

### Review regression RED/GREEN

The canceled-reset regression first exited 1:

```text
Expected value: 유지
Received value: 기본
Tests  1 failed | 13 skipped (14)
```

Reset reconciliation now waits until native reset dispatch completes and
checks `event.defaultPrevented`; the full SearchField file then passed 14/14.

The fixed-specimen containment regression first exited 1:

```text
Expected bar x >= 469.5
Received bar x: 0
1 failed
```

A higher-specificity docs selector now constrains the bar to the specimen, and
the focused browser regression passed 1/1 with before/after bounds assertions.

## GREEN evidence

Fresh focused React command:

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/search-field/SearchField.test.tsx \
  src/text-field/TextField.test.tsx \
  src/icon-button/IconButton.test.tsx
pnpm --filter @maxxuxx/react check
```

Result:

```text
Test Files  3 passed (3)
Tests       36 passed (36)
tsc --noEmit: exit 0
```

Fresh docs commands:

```bash
pnpm --filter @maxxuxx/docs test:unit
pnpm --filter @maxxuxx/docs build
```

Result:

```text
Test Files  3 passed (3)
Tests       33 passed (33)
Astro check: 0 errors, 0 warnings, 1 pre-existing hint
Static build: 27 pages, exit 0
```

Fresh required browser command after both review fixes:

```bash
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/search-field.spec.ts \
  tests/e2e/accessibility.spec.ts
```

Result:

```text
133 passed
2 skipped (forced-colors coverage is owned by desktop-chromium)
0 failed
```

Additional SearchField docs checks passed on mobile (3/3) and desktop (2/2,
with the mobile-only compact API check skipped on desktop).

Manifest readback:

```text
components: 17
last record: SearchField / search-field
figmaUrl: ""
canonical static routes: 27
```

## Self-review

- Re-read Task 4 and SearchField design requirements against every changed
  React, docs, manifest, route, and test file.
- Confirmed controlled empty strings are never treated as uncontrolled and a
  canceled native form reset does not mutate the current value.
- Confirmed disabled and readonly values never expose a clear action; clear
  ordering and restored input focus are asserted directly.
- Confirmed the measured spacer disconnects its observer, no-ResizeObserver
  mode retains the exact CSS fallback, and `takeSpace=false` omits the spacer.
- Confirmed the contained fixed specimen overrides package fixed positioning
  and stays inside its local viewport before and after scroll.
- Confirmed generated JSON has exactly 17 records, SearchField is last with an
  empty Figma URL, the static build has exactly 27 pages, and Task 12 aggregate
  verifier/visual totals were not touched.
- Independent review reported no Critical issues; both Important findings were
  reproduced RED, fixed independently, and reverified in the full matrix.

## Concerns

- Existing axe/jsdom runs emit the repository's informational canvas
  `getContext()` message; all assertions pass.
- Astro check retains the pre-existing `z.string().url()` deprecation hint and
  reports zero errors and zero warnings.
- Aggregate v0.4 totals beyond this incremental 17-component/27-route slice
  remain intentionally deferred to Task 12.
