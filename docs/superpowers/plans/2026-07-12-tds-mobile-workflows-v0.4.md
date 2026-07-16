# TDS-Inspired Mobile Workflows v0.4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Dialog, SearchField, ListRow, Toast, and BottomCTA as five complete React, documentation, Figma, accessibility, and verification vertical slices.

**Architecture:** Reuse all 118 existing tokens and five owned Icons. Extract the proven BottomSheet modal lifecycle into private shared internals for Dialog; keep Toast on a non-modal portal and FIFO provider; compose SearchField from native search input and owned Icons, ListRow from native div/anchor/button branches, and BottomCTA from owned Button instances. Append one canonical component at a time, then reconcile exact 20-component/30-route/27-page/19-set evidence in the aggregate task.

**Tech Stack:** React 19.2, TypeScript, CSS custom properties, Vitest, Testing Library, axe-core, Astro 6 static output, Playwright Chromium, Figma Variables/components through the Figma MCP workflow, pnpm 11.

## Global Constraints

- Start from `fa0ed09` on `codex/tds-mobile-core-v0-4` in `/Users/haru/Documents/GitHub/design-system/.worktrees/tds-mobile-core-v0-4`.
- No new runtime dependencies and no new source tokens or owned Icon masters.
- Native HTML semantics and browser behavior take precedence over recreated ARIA behavior.
- Every interactive target is at least 44 by 44 CSS pixels.
- Caller inline styles cannot replace owned geometry, color, state, positioning, or motion; owned children ignore `dangerouslySetInnerHTML`.
- Public copy and accessible names are consumer supplied and trimmed non-empty where required.
- Every behavior task follows TDD: add the focused failing test, run and record the expected failure, implement minimally, then run focused and adjacent regressions.
- Each code task ends with React typecheck, docs unit tests for touched metadata, `git diff --check`, a commit, and an independent task review.
- Figma tasks use existing Variables, create exactly the specified variant matrix, perform live readback and screenshot review, update repository evidence, commit, and receive independent review.
- Full artifact verification is intentionally deferred until Task 12 because incremental component slices temporarily exceed the v0.3 exact-count contract.
- Code Connect stays `skipped-v0.1`; Svelte and React Native stay `planned`; every new component stays `preview`.
- Windows baselines are platform-owned: declare 40 targets, never approve macOS output as Windows evidence.

---

### Task 1: Extract and prove the private modal lifecycle

**Files:**
- Create: `packages/react/src/internal/modal-dialog.ts`
- Create: `packages/react/src/internal/ModalDialog.tsx`
- Create: `packages/react/src/internal/portal.ts`
- Modify: `packages/react/src/bottom-sheet/BottomSheet.tsx`
- Delete: `packages/react/src/bottom-sheet/dialog.ts`
- Test: `packages/react/src/bottom-sheet/BottomSheet.test.tsx`

**Interfaces:**
- Consumes: existing `BottomSheetProps`, native `<dialog>`, `motion/duration/medium`.
- Produces: private `ModalDialog` with `open`, `dismissible`, `portalContainer`, `initialFocusRef`, `fallbackFocusRef`, `onEscape`, `onBackdrop`, `role`, ARIA IDs, class, and render children; pure DOM helpers remain private.

- [ ] **Step 1: Add failing regression coverage before moving behavior**

Add focused tests proving that reopening during exit cancels the stale close,
Strict Mode cleanup restores the exact previous inline body overflow once, and
two simultaneous modal consumers retain the reference-counted lock until the
last closes. The key assertions are:

```tsx
expect(dialog).toHaveAttribute('data-state', 'open');
expect(document.body.style.overflow).toBe('hidden');
expect(trigger).toHaveFocus();
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/bottom-sheet/BottomSheet.test.tsx
```

Expected: the new interrupted-close/Strict Mode assertions fail against the
current component, while all pre-existing BottomSheet cases remain green.

- [ ] **Step 3: Extract pure DOM and portal helpers**

Move `acquireBodyScrollLock`, `closeDialog`, `getExitDurationMs`,
`isValidInitialFocusTarget`, `showModal`, and `trapDialogTabKey` without
weakening their current details/radio/hidden/tabindex behavior. Add:

```ts
export function resolvePortalContainer(
  requested: HTMLElement | null | undefined,
): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return requested ?? document.body;
}
```

- [ ] **Step 4: Implement `ModalDialog` and migrate BottomSheet**

The private primitive owns the `closed | open | closing` state machine,
show/close, focus entry/restore, scroll lock, Tab containment, same-pointer
backdrop detection, Escape policy, reduced-motion exit, and cleanup. BottomSheet
continues rendering its existing surface/header/body/footer markup through the
primitive and preserves every public close reason.

- [ ] **Step 5: Verify GREEN and adjacent behavior**

Run:

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/bottom-sheet/BottomSheet.test.tsx
pnpm --filter @maxxuxx/react check
git diff --check
```

Expected: all BottomSheet tests pass, TypeScript has zero errors, and the diff
has no whitespace errors.

- [ ] **Step 6: Commit**

```bash
git add packages/react/src/internal packages/react/src/bottom-sheet
git commit -m "refactor: share modal dialog lifecycle"
```

---

### Task 2: Implement the Dialog React and documentation slice

**Files:**
- Create: `packages/react/src/dialog/Dialog.tsx`
- Create: `packages/react/src/dialog/Dialog.css`
- Create: `packages/react/src/dialog/Dialog.test.tsx`
- Create: `packages/react/src/dialog/index.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/DialogExample.tsx`
- Create: `apps/docs/src/content/components/dialog.mdx`
- Modify: `apps/docs/src/components/examples/examples.css`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/unit/manifest.test.ts`
- Modify: `apps/docs/tests/unit/catalog.test.ts`
- Modify: `apps/docs/tests/e2e/support/routes.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts`
- Modify: `apps/docs/tests/e2e/components.spec.ts`
- Create: `apps/docs/tests/e2e/dialog.spec.ts`

**Interfaces:**
- Consumes: private `ModalDialog`, Button, TextButton, existing semantic tokens.
- Produces: `AlertDialog`, `ConfirmDialog`, their props and exact reason unions; canonical component record 16 named `Dialog` at `/components/dialog/` with an empty Figma URL until Task 3.

- [ ] **Step 1: Write failing React tests**

Cover native modal roles/labels, exact one/two action counts, alert-button,
cancel-button, confirm-button, Escape, backdrop, nondismissible behavior,
initial focus, Tab containment, focus restore, confirm loading/disabled, long
scrolling copy, SSR, portal container, safe inline styles, forced colors,
reduced motion, and axe. Use the public contract:

```tsx
<ConfirmDialog
  open
  title="삭제할까요?"
  description="삭제하면 되돌릴 수 없습니다."
  cancelLabel="취소"
  confirmLabel="삭제"
  onOpenChange={onOpenChange}
/>
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @maxxuxx/react exec vitest run src/dialog/Dialog.test.tsx
```

Expected: FAIL because `src/dialog` and its exports do not exist.

- [ ] **Step 3: Implement the two public components**

Implement the exact APIs from the spec. AlertDialog supplies
`role="alertdialog"` and focuses its acknowledgement control; ConfirmDialog
keeps native dialog role and focuses cancel. Both spread no dangerous HTML,
filter root layout styles, and use the shared modal primitive. Confirm order is
cancel then confirm. `dismissible=true` is the default.

- [ ] **Step 4: Verify React GREEN**

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/dialog/Dialog.test.tsx \
  src/bottom-sheet/BottomSheet.test.tsx
pnpm --filter @maxxuxx/react check
```

- [ ] **Step 5: Add the complete docs slice and its failing browser tests**

Append only `Dialog/dialog` to the current canonical arrays, raising the
incremental component count to 16 and HTML route count to 26. The MDX uses the
existing 13 required headings and exact public prop rows. The example renders
deterministic in-flow Alert/Confirm specimens plus interactive triggers. Browser
tests assert both close-reason flows, focus restore, long internal scrolling,
forced colors, reduced motion, 320px containment, and zero axe violations.

- [ ] **Step 6: Run docs checks and browser GREEN**

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs test:unit
pnpm --filter @maxxuxx/docs build
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/dialog.spec.ts \
  tests/e2e/accessibility.spec.ts \
  tests/e2e/components.spec.ts
git diff --check
```

- [ ] **Step 7: Commit**

```bash
git add packages/react apps/docs
git commit -m "feat: add Dialog workflow component"
```

---

### Task 3: Build and verify Dialog in Figma

**Files:**
- Modify: `apps/docs/src/content/components/dialog.mdx`
- Modify: `apps/docs/public/design-system/components.json`
- Modify: `figma/verification.json`
- Modify: `figma/README.md`

**Interfaces:**
- Produces page `04.16 Dialog`, a 4-variant `Dialog` set, a live component-set URL, and reviewed page screenshot evidence.

- [ ] **Step 1: Load the Figma library workflow and inspect live baseline**

Use `figma-generate-library` and `figma-use`; confirm file key
`hNlju4j556mzi0G515UDwE`, 6 collections, 116 Variables, 8 Text Styles,
2 Effect Styles, 22 managed pages, 14 sets, and the five owned Icons.

- [ ] **Step 2: Create the page and exact variant set**

Create `04.16 Dialog` before native-differences pages. Build:

```text
Type        = Alert | Confirm
Description = Hidden | Visible
```

Create all 4 variants, bind existing surface/scrim/text/action/radius/elevation/
spacing/motion Variables, use owned Button instances, and add TEXT properties
for Title, Description, Alert label, Cancel label, Confirm label plus BOOLEAN
Show description.

- [ ] **Step 3: Review live evidence**

Read back node type, axes, ordered values, properties, bindings, and variant
count. Screenshot the full page and inspect at original detail. Correct clipping,
hard-coded product values, touch targets, and property/variant mismatches before
continuing.

- [ ] **Step 4: Reconcile repository evidence and commit**

Write the distinct live URL into MDX, append the exact Dialog/page/screenshot
record to `figma/verification.json`, update the current-state README without
rewriting historical sections, regenerate the manifest, and run:

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs manifest:release-check || true
git diff --check
git add apps/docs figma
git commit -m "feat: add Dialog to Figma library"
```

The release check is expected to list only the four not-yet-created v0.4 Figma
URLs after this task.

---

### Task 4: Implement the SearchField React and documentation slice

**Files:**
- Create: `packages/react/src/search-field/SearchField.tsx`
- Create: `packages/react/src/search-field/SearchField.css`
- Create: `packages/react/src/search-field/SearchField.test.tsx`
- Create: `packages/react/src/search-field/index.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/SearchFieldExample.tsx`
- Create: `apps/docs/src/content/components/search-field.mdx`
- Modify: `apps/docs/src/components/examples/examples.css`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/unit/manifest.test.ts`
- Modify: `apps/docs/tests/unit/catalog.test.ts`
- Modify: `apps/docs/tests/e2e/support/routes.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts`
- Modify: `apps/docs/tests/e2e/components.spec.ts`
- Create: `apps/docs/tests/e2e/search-field.spec.ts`

**Interfaces:**
- Produces controlled/uncontrolled `SearchFieldProps`, input ref forwarding, fixed/takeSpace behavior, component record 17 and route 27.

- [ ] **Step 1: Write failing React tests**

Test required non-empty labels, native `type="search"`, controlled and
uncontrolled typing, callback order on clear, focus restoration, form value and
reset, disabled/readonly clear suppression, duplicate WebKit cancel suppression,
ref/native prop forwarding, fixed measured spacer, safe layout style, SSR, and
axe.

- [ ] **Step 2: Verify RED**

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/search-field/SearchField.test.tsx
```

Expected: FAIL because SearchField is not exported.

- [ ] **Step 3: Implement SearchField**

Use the exact spec API. Keep `value !== undefined` as the controlled test,
initialize uncontrolled state from `defaultValue ?? ''`, call
`onValueChange(next)` for typing and clear, then `onClear`, and focus the input.
Use a ResizeObserver-backed fixed spacer with cleanup and a CSS no-JS fallback.
Own Search and Close icons and never show clear when disabled or readonly.

- [ ] **Step 4: Verify React GREEN**

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/search-field/SearchField.test.tsx \
  src/text-field/TextField.test.tsx \
  src/icon-button/IconButton.test.tsx
pnpm --filter @maxxuxx/react check
```

- [ ] **Step 5: Add docs and browser coverage**

Append SearchField/search-field to canonical arrays, 17 records and 27 routes.
Document fixed/takeSpace, label requirements, controlled/uncontrolled mode,
clear sequence, and deliberate omission of validation. Add interactive default,
filled, readonly, disabled, and contained fixed specimens. Browser tests cover
fixed-space equality after scroll, clear focus, form value, 320px long text,
200% zoom, forced colors, and axe.

- [ ] **Step 6: Verify docs and commit**

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs test:unit
pnpm --filter @maxxuxx/docs build
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/search-field.spec.ts \
  tests/e2e/accessibility.spec.ts
git diff --check
git add packages/react apps/docs
git commit -m "feat: add SearchField component"
```

---

### Task 5: Build and verify SearchField in Figma

**Files:**
- Modify: `apps/docs/src/content/components/search-field.mdx`
- Modify: `apps/docs/public/design-system/components.json`
- Modify: `figma/verification.json`
- Modify: `figma/README.md`

- [ ] **Step 1: Create page `04.17 SearchField` and exact set**

```text
Value = Empty | Filled
State = Default | Focus | Disabled | ReadOnly
```

Create 8 variants with Placeholder and Value TEXT properties, owned Search and
Close instances, Variable bindings, and Close visible only in filled writable
variants. Fixed behavior is a documentation note, not an axis.

- [ ] **Step 2: Live-read, screenshot, inspect, reconcile, and commit**

Read back the component-set node type, axes, ordered values, property types,
Variable bindings, and eight variants. Screenshot the full page at original
detail and correct clipping, hard-coded product values, touch geometry, or
property drift. Add the distinct URL and screenshot hash/node ID, regenerate
the manifest, confirm release-check now lists only ListRow, Toast, and
BottomCTA, then commit:

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs manifest:release-check || true
git diff --check
git add apps/docs figma
git commit -m "feat: add SearchField to Figma library"
```

---

### Task 6: Implement the ListRow React and documentation slice

**Files:**
- Create: `packages/react/src/list-row/{ListRow.tsx,ListRow.css,ListRow.test.tsx,index.ts}`
- Modify: React root exports/styles
- Create: `apps/docs/src/components/examples/ListRowExample.tsx`
- Create: `apps/docs/src/content/components/list-row.mdx`
- Modify: `apps/docs/src/components/examples/examples.css`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/unit/manifest.test.ts`
- Modify: `apps/docs/tests/unit/catalog.test.ts`
- Modify: `apps/docs/tests/e2e/support/routes.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts`
- Modify: `apps/docs/tests/e2e/components.spec.ts`
- Modify: `apps/docs/tests/e2e/demo-contracts.spec.ts`

**Interfaces:**
- Produces static div, native anchor, and native button overloads with correct refs; component record 18 and route 28.

- [ ] **Step 1: Write and run failing branch tests**

Test all three native roots, refs and native props, default button type,
Enter/Space/click, disabled button, real href, absence of fake-disabled anchor,
static trailing Switch, nested-interactive rejection on action branches,
decorative left/arrow, divider, long copy, safe style filtering, and axe.

```bash
pnpm --filter @maxxuxx/react exec vitest run src/list-row/ListRow.test.tsx
```

Expected: FAIL because ListRow does not exist.

- [ ] **Step 2: Implement the discriminated native branches**

Use the exact union from the spec. Detect `href` before `onClick`; static is the
fallback. Strip dangerous HTML and owned data attributes, apply safe layout
styles, hide left content from assistive technology, keep right content exposed,
and render the owned decorative ChevronRight only when requested. In development
and tests, reject nested `a`, `button`, `input`, `select`, `textarea`, `summary`,
or positive-tabindex descendants on whole-row link/button branches.

- [ ] **Step 3: Verify React GREEN**

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/list-row/ListRow.test.tsx \
  src/board-row/BoardRow.test.tsx \
  src/switch/Switch.test.tsx
pnpm --filter @maxxuxx/react check
```

- [ ] **Step 4: Add docs/browser coverage and commit**

Append ListRow/list-row to 18 records and 28 routes. Show static row with a
trailing Switch, button row, link row, arrows, dividers, long copy, and disabled
button. Browser tests assert native keyboard behavior, no nested action controls,
forced-colors focus/divider, 320px unbroken content, 200% zoom, and axe.

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs test:unit
pnpm --filter @maxxuxx/docs build
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/components.spec.ts \
  tests/e2e/demo-contracts.spec.ts \
  tests/e2e/accessibility.spec.ts
git diff --check
git add packages/react apps/docs
git commit -m "feat: add ListRow component"
```

---

### Task 7: Build and verify ListRow in Figma

**Files:**
- Modify: `apps/docs/src/content/components/list-row.mdx`
- Modify: `apps/docs/public/design-system/components.json`
- Modify: `figma/verification.json`
- Modify: `figma/README.md`

- [ ] **Step 1: Create page `04.18 ListRow` and exact set**

```text
Divider = None | Indented
State   = Default | Pressed | Disabled
```

Create 6 variants with Title/Description/Right TEXT, four visibility BOOLEAN
properties, Left icon INSTANCE_SWAP, owned ChevronRight, minimum 56px geometry,
and existing Variable bindings.

- [ ] **Step 2: Live-review, reconcile, and commit**

Verify exact axes/property order and six variants, inspect normal/long specimens,
write URL/screenshot evidence, regenerate manifest, confirm only Toast and
BottomCTA remain without Figma URLs, and commit:

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs manifest:release-check || true
git diff --check
git add apps/docs figma
git commit -m "feat: add ListRow to Figma library"
```

---

### Task 8: Implement the Toast provider and documentation slice

**Files:**
- Create: `packages/react/src/toast/{Toast.tsx,Toast.css,Toast.test.tsx,timer.ts,timer.test.ts,index.ts}`
- Modify: React root exports/styles
- Create: `apps/docs/src/components/examples/ToastExample.tsx`
- Create: `apps/docs/src/content/components/toast.mdx`
- Modify: `apps/docs/src/components/examples/examples.css`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/unit/manifest.test.ts`
- Modify: `apps/docs/tests/unit/catalog.test.ts`
- Modify: `apps/docs/tests/e2e/support/routes.ts`
- Create: `apps/docs/tests/e2e/toast.spec.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts`
- Modify: `apps/docs/tests/e2e/components.spec.ts`
- Modify: `apps/docs/tests/e2e/demo-contracts.spec.ts`

**Interfaces:**
- Produces `ToastProvider`, `useToast`, ToastOptions union, FIFO one-visible queue, component record 19 and route 29.

- [ ] **Step 1: Write timer and provider RED tests**

Test default 3000ms, action 5000ms, duration zero, FIFO IDs/order, visible and
queued dismiss, clear, action invocation/order advancement, hover/focus/document
visibility pause with remaining time, timer cleanup, top-action type/runtime
rejection, outside-provider error, portal migration, decorative icon, status vs
alert roles, no focus movement or scroll lock, reduced motion, safe styles, and
axe.

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/toast/timer.test.ts \
  src/toast/Toast.test.tsx
```

Expected: FAIL because the Toast module does not exist.

- [ ] **Step 2: Implement a deterministic pausable timer and queue**

The timer stores `remaining`, `startedAt`, and one timeout. `pause()` subtracts
elapsed time once; `resume()` schedules only when remaining is positive; zero
duration never schedules. Provider state keeps `{ visible, queue }`, generated
monotonic IDs, and stable memoized `show/dismiss/clear` functions.

- [ ] **Step 3: Implement accessible portal presentation**

Use polite atomic status for neutral/success and assertive atomic alert for
danger. Render one visible Toast, decorate with an owned Icon, render a native
44px TextButton only for bottom actions, pause on pointer/focus/document hidden,
and advance after action/timeout/programmatic dismissal. Never focus, trap,
inert, or lock scroll.

- [ ] **Step 4: Verify React GREEN**

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/toast/timer.test.ts \
  src/toast/Toast.test.tsx \
  src/text-button/TextButton.test.tsx
pnpm --filter @maxxuxx/react check
```

- [ ] **Step 5: Add docs/browser coverage and commit**

Append Toast/toast to 19 records and 29 routes. The interactive example shows
neutral/success/danger, FIFO ordering, bottom action, top message, pause, and a
deterministic persistent in-flow visual specimen. Browser tests use fake or
controlled duration where possible and assert live roles, queue order, action,
focus preservation, 320px containment, forced colors, reduced motion, and axe.

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs test:unit
pnpm --filter @maxxuxx/docs build
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/toast.spec.ts \
  tests/e2e/accessibility.spec.ts
git diff --check
git add packages/react apps/docs
git commit -m "feat: add queued Toast feedback"
```

---

### Task 9: Build and verify Toast in Figma

**Files:**
- Modify: `apps/docs/src/content/components/toast.mdx`
- Modify: `apps/docs/public/design-system/components.json`
- Modify: `figma/verification.json`
- Modify: `figma/README.md`

- [ ] **Step 1: Create page `04.19 Toast` and exact set**

```text
Tone   = Neutral | Success | Danger
Action = Hidden | Visible
```

Create 6 variants with Message/Action label TEXT, Show icon BOOLEAN, Icon
INSTANCE_SWAP, owned Icon/Button instances, 44px action target, and existing
status/on-status/radius/elevation/spacing/motion bindings.

- [ ] **Step 2: Live-review, reconcile, and commit**

Verify six variants and bindings, screenshot all tones/action states, write
URL/evidence, regenerate manifest, confirm BottomCTA is the only missing Figma
URL, and commit:

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs manifest:release-check || true
git diff --check
git add apps/docs figma
git commit -m "feat: add Toast to Figma library"
```

---

### Task 10: Implement the BottomCTA React and documentation slice

**Files:**
- Create: `packages/react/src/bottom-cta/{BottomCTA.tsx,BottomCTA.css,BottomCTA.test.tsx,index.ts}`
- Modify: React root exports/styles
- Create: `apps/docs/src/components/examples/BottomCTAExample.tsx`
- Create: `apps/docs/src/content/components/bottom-cta.mdx`
- Modify: `apps/docs/src/components/examples/examples.css`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/unit/manifest.test.ts`
- Modify: `apps/docs/tests/unit/catalog.test.ts`
- Modify: `apps/docs/tests/e2e/support/routes.ts`
- Create: `apps/docs/tests/e2e/bottom-cta.spec.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts`
- Modify: `apps/docs/tests/e2e/components.spec.ts`
- Modify: `apps/docs/tests/e2e/demo-contracts.spec.ts`

**Interfaces:**
- Produces the exact owned Button action API, Single/Double/Fixed behavior, component record 20 and route 30.

- [ ] **Step 1: Write BottomCTA RED tests**

Test one/two action derivation, secondary-primary DOM/tab order, exact Button
validation, forced large/full geometry, preserved variant/loading/disabled/form/
ref behavior, fixed scroll position, measured takeSpace equality, takeSpace
false, dynamic ResizeObserver height, safe-area custom property, background none,
safe root styles, long labels, 320px reflow, forced colors, and axe.

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/bottom-cta/BottomCTA.test.tsx
```

Expected: FAIL because BottomCTA does not exist.

- [ ] **Step 2: Implement owned Button composition**

Validate each action with `isValidElement` and exact Button type, merge refs when
cloning, force `size="large"` and `width="full"`, preserve all other public
Button props, render secondary before primary, and filter root style. Use a
ResizeObserver-backed spacer in fixed/takeSpace mode with cleanup and a CSS
fallback. Safe-area padding uses system env, `--ds-safe-area-bottom`, and the
existing spacing fallback without a new token.

- [ ] **Step 3: Verify React GREEN**

```bash
pnpm --filter @maxxuxx/react exec vitest run \
  src/bottom-cta/BottomCTA.test.tsx \
  src/button/Button.test.tsx
pnpm --filter @maxxuxx/react check
```

- [ ] **Step 4: Add docs/browser coverage and commit**

Append BottomCTA/bottom-cta to the final 20 records and 30 routes. Document
Single/Double/Fixed/takeSpace/safe-area/background-none and the BottomSheet
footer restriction. Use contained static specimens so visual slices do not
escape the demo. Browser tests assert order, fixed bounds/spacer, safe area,
no obstruction, long labels, 320px/200% reflow, forced colors, and axe.

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs test:unit
pnpm --filter @maxxuxx/docs build
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/bottom-cta.spec.ts \
  tests/e2e/accessibility.spec.ts
git diff --check
git add packages/react apps/docs
git commit -m "feat: add BottomCTA component"
```

---

### Task 11: Build and verify BottomCTA in Figma

**Files:**
- Modify: `apps/docs/src/content/components/bottom-cta.mdx`
- Modify: `apps/docs/public/design-system/components.json`
- Modify: `figma/verification.json`
- Modify: `figma/README.md`

- [ ] **Step 1: Create page `04.20 BottomCTA` and exact set**

```text
Layout     = Single | Double
Background = Default | None
```

Create 4 variants with Primary label and Secondary label TEXT properties,
owned Button instances, and existing action/spacing/radius/typography bindings.
Document fixed/takeSpace/safe-area behavior on the page rather than as axes.

- [ ] **Step 2: Live-review and complete Figma evidence**

Verify 27 managed pages, 19 component sets, five owned Icons, unchanged
6/116/8/2 token-style totals, all new axes/property order/counts, zero hard-coded
product values, and five unique component URLs. Screenshot/review the page and
write its hash/node ID.

- [ ] **Step 3: Reconcile and commit**

Regenerate the manifest and require the release check to pass without `|| true`:

```bash
pnpm --filter @maxxuxx/docs manifest:write
pnpm --filter @maxxuxx/docs manifest:release-check
git diff --check
git add apps/docs figma
git commit -m "feat: add BottomCTA to Figma library"
```

---

### Task 12: Enforce v0.4 parity and close the branch

**Files:**
- Modify: `tooling/verification/artifacts.mjs`
- Modify: `tooling/verification/artifacts.test.mjs`
- Modify: `tooling/verification/guardrails.mjs`
- Modify: `tooling/verification/guardrails.test.mjs`
- Modify: `apps/docs/tests/e2e/component-slices.visual.spec.ts`
- Modify: `apps/docs/tests/e2e/ai-artifacts.spec.ts`
- Modify: `apps/docs/tests/e2e/navigation.spec.ts`
- Modify: `apps/docs/src/pages/index.astro`
- Modify: `apps/docs/src/pages/components/index.astro`
- Modify: `apps/docs/src/layouts/BaseLayout.astro`
- Modify: `docs/PROGRESS.md`
- Modify: `.superpowers/sdd/progress.md` (ignored durable ledger)

**Interfaces:**
- Produces exact 118-token, 20-component, 30-route, 27-managed-page, 19-set, 20-manifest-target, 25-distinct-target, and 40-Windows-target verification.

- [ ] **Step 1: Write exact-count and negative RED tests**

Update test fixtures first. Add every new route, component metadata/props/tokens,
Figma axes/properties/counts, page/screenshot record, target count, and ordered
slice. Add negative mutations for removing each new record, changing each axis
or prop, reusing a Figma URL, adding an undeclared token, and reordering slices.

- [ ] **Step 2: Verify RED**

```bash
pnpm test:guardrails
```

Expected: failures report v0.3 exact totals and missing v0.4 verifier records.

- [ ] **Step 3: Implement exact verifier and guardrail parity**

Update production verification to the exact target totals. Preserve 118 token
counts and byte-stable token-map equality. Append five component slices to make
20 ordered components and 40 Windows targets. Keep the platform skip policy and
do not generate macOS replacement baselines.

- [ ] **Step 4: Reconcile catalog/home/version copy and generated artifacts**

Update all visible counts/version labels to v0.4, regenerate components.json,
and verify all 20 cards, exact active sidebar state, and all 30 routes.

- [ ] **Step 5: Run focused aggregate verification**

```bash
pnpm test:guardrails
pnpm generated:check
pnpm guardrails:check
pnpm build
pnpm --filter @maxxuxx/docs manifest:release-check
pnpm artifacts:check
pnpm --filter @maxxuxx/docs exec playwright test \
  tests/e2e/components.spec.ts \
  tests/e2e/dialog.spec.ts \
  tests/e2e/search-field.spec.ts \
  tests/e2e/toast.spec.ts \
  tests/e2e/bottom-cta.spec.ts \
  tests/e2e/demo-contracts.spec.ts \
  tests/e2e/accessibility.spec.ts \
  tests/e2e/navigation.spec.ts \
  tests/e2e/ai-artifacts.spec.ts
```

- [ ] **Step 6: Run full fresh verification**

```bash
pnpm verify
git diff --check fa0ed09...HEAD
git status --short
```

Read the full output and record exact token, React, docs, guardrail, static-page,
browser pass, and intentional skip counts in `docs/PROGRESS.md`.

- [ ] **Step 7: Request independent whole-branch review and fix all findings**

Generate a review package for `fa0ed09...HEAD`. The reviewer checks the written
spec, public contracts, behavior, accessibility, docs, Figma evidence, exact
artifacts, and test quality. One fixer receives the complete Critical/Important
list, runs covering tests, and the reviewer re-reviews until both
`Spec PASS` and `Quality APPROVED` are explicit.

- [ ] **Step 8: Commit final verification and audit**

```bash
git add apps/docs docs figma packages tooling
git commit -m "test: verify TDS-inspired mobile workflows v0.4"
pnpm generated:check
pnpm guardrails:check
pnpm artifacts:check
git status --short --branch
```

The final status is clean. The ignored SDD ledger records every reviewed task
range and the external Windows baseline requirement of 30 missing images.
