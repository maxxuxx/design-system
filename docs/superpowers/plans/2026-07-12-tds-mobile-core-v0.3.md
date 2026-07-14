# TDS-Inspired Mobile Core v0.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver TextButton, IconButton, BoardRow, Tab, and BottomSheet as complete React, docs, browser, token, Figma, and machine-readable design-system slices.

**Architecture:** Extend the existing native-first monorepo from the completed form-controls v0.2 branch. Add only the shared motion and scrim foundations required by BottomSheet, then implement each component in dependency order with focused TDD and an immediately reconciled Figma page. Finish by expanding the component catalog and exact artifact verifier from 10 to 15 components and from 18 to 25 static routes.

**Tech Stack:** pnpm 11, TypeScript 6, React 19.2, CSS custom properties, Vitest, Testing Library, axe-core, Astro 7/MDX, Playwright Chromium, Figma Variables/components through `use_figma`.

## Global Constraints

- Start from commit `a54de1c`, which contains the approved design spec and all v0.2 implementation commits.
- Use branch `codex/tds-mobile-core-v0-3` in an isolated linked worktree.
- Add no runtime dependency to `@maxxuxx/react`.
- Keep all 15 components `preview`; React is `preview`, Svelte and React Native are `planned`.
- Use `apply_patch` for repository file edits.
- Use TDD: every behavior starts with a focused failing test, then the minimum implementation, then a focused green run.
- Every component slice includes React, MDX/demo, generated manifest, browser coverage, Figma library asset, live readback, and exact artifact checks before the next slice.
- All public component values use semantic or primitive design tokens; primitive color values may appear only in token/foundation sources.
- The Windows component-slice images are generated and approved only on Windows. Do not approve them from macOS.

---

### Task 1: Create the isolated execution worktree and prove the baseline

**Files:**
- Read: `package.json`
- Read: `docs/superpowers/specs/2026-07-12-tds-mobile-core-v0.3-design.md`
- Track progress outside git: `.superpowers/sdd/progress.md`

**Interfaces:**
- Consumes: commit `a54de1c` on `codex/form-controls-v0-2`.
- Produces: isolated branch `codex/tds-mobile-core-v0-3` with a green inherited baseline.

- [ ] **Step 1: Create the worktree**

```bash
git worktree add .worktrees/tds-mobile-core-v0-3 -b codex/tds-mobile-core-v0-3 a54de1c
```

Expected: a linked worktree on the new branch.

- [ ] **Step 2: Reuse the repository dependencies and pnpm shim**

```bash
ln -s ../../node_modules node_modules
mkdir -p .codex/bin
ln -s "$(command -v pnpm)" .codex/bin/pnpm
```

Expected: `PATH="$PWD/.codex/bin:$PATH" pnpm --version` prints `11.11.0`.

- [ ] **Step 3: Run the inherited verification gate**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm verify
```

Expected: tokens 15, React 124, docs 22, guardrails 35, 18 static pages, and all current-platform browser assertions pass.

### Task 2: Add motion and scrim foundations

**Files:**
- Modify: `packages/tokens/src/types.ts`
- Modify: `packages/tokens/src/validate.ts`
- Modify: `packages/tokens/src/generate.ts`
- Modify: `packages/tokens/src/primitives.tokens.json`
- Modify: `packages/tokens/src/semantic.tokens.json`
- Modify: `packages/tokens/tests/validate.test.ts`
- Modify: `packages/tokens/tests/generate.test.ts`
- Generate: `packages/tokens/dist/tokens.css`
- Generate: `packages/tokens/dist/tokens.json`
- Create: `apps/docs/src/components/foundations/MotionScale.astro`
- Create: `apps/docs/src/content/foundations/motion.mdx`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`

**Interfaces:**
- Produces token types `duration` and `cubicBezier`.
- Produces CSS variables `--ds-motion-duration-fast`, `--ds-motion-duration-medium`, `--ds-motion-easing-standard`, and `--ds-color-bg-scrim`.
- Produces static route `/foundations/motion/`.

- [ ] **Step 1: Write failing token validation and generation tests**

Add fixtures that assert:

```ts
expect(resolveToken('motion/duration/fast')).toBe('120ms');
expect(resolveToken('motion/duration/medium')).toBe('200ms');
expect(resolveToken('motion/easing/standard')).toBe('cubic-bezier(0.2, 0, 0, 1)');
expect(resolveToken('color/bg/scrim')).toBe('rgba(15, 23, 42, 0.56)');
```

Add rejection cases for `12s`, `0ms`, negative milliseconds, malformed cubic-bezier expressions, non-finite values, and x coordinates outside zero through one.

- [ ] **Step 2: Run focused tests and prove RED**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/tokens test
```

Expected: failures report unsupported token types and missing token names.

- [ ] **Step 3: Extend the token type and validators**

Add:

```ts
export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'shadow'
  | 'duration'
  | 'cubicBezier';
```

Validate duration with `/^[1-9]\d*ms$/`. Parse cubic-bezier into four finite
numbers and require both x coordinates to be within `[0, 1]`.

- [ ] **Step 4: Add the five exact source tokens and generate artifacts**

Append the four primitives and one semantic alias defined by the spec, then run:

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/tokens tokens:generate
```

Expected: generated CSS and JSON contain exactly 118 tokens.

- [ ] **Step 5: Add the Motion foundation route and tests**

The MDX explains fast/medium duration, standard easing, reduced motion, and
scrim use. `MotionScale.astro` renders token names and live motion specimens
without autoplay loops.

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs test:unit
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs build
```

Expected: unit tests pass and 19 pages build.

- [ ] **Step 6: Commit**

```bash
git add packages/tokens apps/docs/src/components/foundations apps/docs/src/content/foundations/motion.mdx apps/docs/src/navigation.ts apps/docs/tests/unit/content.test.ts
git commit -m "feat: add motion and scrim foundations"
```

### Task 3: Implement TextButton in React and docs

**Files:**
- Create: `packages/react/src/text-button/TextButton.tsx`
- Create: `packages/react/src/text-button/TextButton.css`
- Create: `packages/react/src/text-button/TextButton.test.tsx`
- Create: `packages/react/src/text-button/index.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/TextButtonExample.tsx`
- Create: `apps/docs/src/content/components/text-button.mdx`
- Modify: `apps/docs/src/components/examples/examples.css`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/e2e/components.spec.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts`
- Modify: `apps/docs/tests/e2e/demo-contracts.spec.ts`
- Generate: `apps/docs/public/design-system/components.json`

**Interfaces:**
- Produces `TextButton`, `TextButtonProps`, `TextButtonSize`, `TextButtonTone`, and `TextButtonVariant`.
- Produces route `/components/text-button/` and stable selector `[data-component-demo="text-button"]`.

- [ ] **Step 1: Write failing React tests**

Cover native button and anchor branches, default `type="button"`, forwarded
refs/props, disabled button, no fake disabled anchor, arrow-owned decorative
ChevronRight, size/variant/tone attributes, long labels, and axe.

- [ ] **Step 2: Run the focused test and prove RED**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/react exec vitest run src/text-button/TextButton.test.tsx
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement the discriminated native API**

Render `<a>` only when `href` is a string; otherwise render `<button>`. Apply
`data-size`, `data-variant`, and `data-tone`. Append the owned decorative Icon
only for `variant="arrow"`.

- [ ] **Step 4: Implement token-only CSS**

Use a 44px minimum target, three typography tiers, visible underline variant,
semantic primary/neutral tones, ordered hover/active/focus/disabled states,
forced-colors focus, reduced motion, and `overflow-wrap:anywhere`.

- [ ] **Step 5: Run React checks GREEN**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/react check
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/react exec vitest run src/text-button/TextButton.test.tsx
```

- [ ] **Step 6: Add MDX, demo, manifest, and browser tests**

The demo switches native element, size, variant, tone, and disabled state. Add
the full documentation template and TDS reference. Browser tests assert anchor
navigation semantics, button disabled behavior, arrow decoration, focus,
responsive layout, long copy, and zero axe/console errors.

- [ ] **Step 7: Generate and verify docs**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs manifest:write
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs build
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs test:unit
```

Expected: 11 manifest components and 20 static pages.

- [ ] **Step 8: Commit**

```bash
git add packages/react/src apps/docs
git commit -m "feat: add TextButton"
```

### Task 4: Build and verify TextButton in Figma

**Files:**
- Modify: `figma/README.md`
- Modify: `figma/token-map.json`
- Modify: `figma/verification.json`
- Modify: `apps/docs/src/content/components/text-button.mdx`

**Interfaces:**
- Produces page `04.11 TextButton`, 27 variants, one TEXT property, and a real component-set URL.

- [ ] **Step 1: Read live pages, collections, variables, and existing Button conventions**

Use read-only `use_figma` calls. Return page IDs, variable IDs, Button set
properties, child hierarchy, and owned ChevronRight ID.

- [ ] **Step 2: Add Motion and scrim Variables**

Create the `Motion` collection and five new Variables/bindings. Regenerate the
live token projection and require source/live parity before component creation.

- [ ] **Step 3: Create page skeleton and 27 variants incrementally**

Build no more than 10 logical operations per call. Bind every product value and
combine exact `Size`, `Variant`, and `State` axes.

- [ ] **Step 4: Validate structure and screenshot**

Read back 27 masters, exact axes, `Label` property, arrow instance swaps, token
bindings, 44px targets, and zero unnamed/overlapping nodes. Capture the whole
page and inspect clipping and contrast.

- [ ] **Step 5: Reconcile repository evidence and commit**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm artifacts:check
git add figma apps/docs/src/content/components/text-button.mdx
git commit -m "feat: add TextButton to Figma library"
```

### Task 5: Implement IconButton in React and docs

**Files:**
- Create: `packages/react/src/icon-button/IconButton.tsx`
- Create: `packages/react/src/icon-button/IconButton.css`
- Create: `packages/react/src/icon-button/IconButton.test.tsx`
- Create: `packages/react/src/icon-button/index.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/IconButtonExample.tsx`
- Create: `apps/docs/src/content/components/icon-button.mdx`
- Modify: component schema, navigation, example CSS, unit tests, and browser tests
- Generate: `apps/docs/public/design-system/components.json`

**Interfaces:**
- Produces `IconButton`, `IconButtonProps`, `IconButtonSize`, and `IconButtonVariant`.
- Produces route `/components/icon-button/` and demo selector `[data-component-demo="icon-button"]`.

- [ ] **Step 1: Write RED tests**

Require non-empty `label`, owned `aria-label`, decorative Icon, all five names,
44/48/56 boxes, 20/24/24 icons, three variants, native disabled/form behavior,
ref forwarding, prop filtering, and axe.

- [ ] **Step 2: Run RED, implement, and run GREEN**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/react exec vitest run src/icon-button/IconButton.test.tsx
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/react check
```

The component owns children, `aria-label`, Icon size, type default, and visual
state attributes. CSS follows Button's state precedence and token vocabulary.

- [ ] **Step 3: Add complete docs and browser coverage**

Demo all names, sizes, variants, disabled, forced colors, pointer targets, and
form safety. Generate the 12-component manifest and build 21 pages.

- [ ] **Step 4: Commit**

```bash
git add packages/react/src apps/docs
git commit -m "feat: add IconButton"
```

### Task 6: Build and verify IconButton in Figma

**Files:**
- Modify: `figma/README.md`
- Modify: `figma/verification.json`
- Modify: `apps/docs/src/content/components/icon-button.mdx`

- [ ] **Step 1: Create page `04.12 IconButton` and 27 bound variants**

Use `Size`, `Variant`, and `State` axes and an `Icon` INSTANCE_SWAP property
limited to the five owned Icon components.

- [ ] **Step 2: Read back, screenshot, reconcile, and commit**

Verify exact axes, target sizes, properties, bindings, screenshot digest, and
real URL before updating evidence.

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm artifacts:check
git add figma apps/docs/src/content/components/icon-button.mdx
git commit -m "feat: add IconButton to Figma library"
```

### Task 7: Implement BoardRow in React and docs

**Files:**
- Create: `packages/react/src/board-row/BoardRow.tsx`
- Create: `packages/react/src/board-row/BoardRow.css`
- Create: `packages/react/src/board-row/BoardRow.test.tsx`
- Create: `packages/react/src/board-row/index.ts`
- Modify: React exports/styles
- Create: `apps/docs/src/components/examples/BoardRowExample.tsx`
- Create: `apps/docs/src/content/components/board-row.mdx`
- Modify: schema/navigation/example CSS/unit/browser tests/manifest

**Interfaces:**
- Produces native-details `BoardRow` with controlled/uncontrolled open state.
- Produces route `/components/board-row/` and demo selector `[data-component-demo="board-row"]`.

- [ ] **Step 1: Write RED native-disclosure tests**

Cover details/summary roles, click/Enter/Space, open/defaultOpen,
`onOpenChange`, controlled reconciliation, prefix, description, content,
decorative arrow, no nested interactive demo content, long copy, and axe.

- [ ] **Step 2: Implement and prove GREEN**

Use native `details` and `summary`; synchronize controlled `open` through the
DOM property without replacing native toggle behavior. Do not animate content
height. Use a 56px summary and token-only state CSS.

- [ ] **Step 3: Add docs/browser slice and commit**

Build the 13-component manifest and 22 pages. Verify native keyboard toggle,
controlled demo, focus, long copy, forced colors, and responsive layout.

```bash
git add packages/react/src apps/docs
git commit -m "feat: add BoardRow"
```

### Task 8: Build and verify BoardRow in Figma

**Files:**
- Modify: `figma/README.md`
- Modify: `figma/verification.json`
- Modify: `apps/docs/src/content/components/board-row.mdx`

- [ ] **Step 1: Create four variants and properties**

Create page `04.13 BoardRow`, axes `Value=Closed|Open` and
`State=Default|Pressed`, TEXT properties Title/Description/Prefix, BOOLEAN
properties Show description/Show prefix, and an owned ChevronRight instance.

- [ ] **Step 2: Validate content-driven layout, screenshot, evidence, and commit**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm artifacts:check
git add figma apps/docs/src/content/components/board-row.mdx
git commit -m "feat: add BoardRow to Figma library"
```

### Task 9: Implement Tab in React and docs

**Files:**
- Create: `packages/react/src/tab/Tab.tsx`
- Create: `packages/react/src/tab/Tab.css`
- Create: `packages/react/src/tab/Tab.test.tsx`
- Create: `packages/react/src/tab/index.ts`
- Modify: React exports/styles
- Create: `apps/docs/src/components/examples/TabExample.tsx`
- Create: `apps/docs/src/content/components/tab.mdx`
- Modify: schema/navigation/example CSS/unit/browser tests/manifest

**Interfaces:**
- Produces `Tab`, `TabItem`, `TabSize`, and `TabLayout`.
- Produces route `/components/tab/` and demo selector `[data-component-demo="tab"]`.

- [ ] **Step 1: Write RED data and keyboard tests**

Test empty items, duplicate/empty values, all-disabled input, first-enabled
default, controlled/uncontrolled state, click, Arrow wrap, Home/End, disabled
skip, roving tabIndex, IDs, tab/panel relationships, equal/scroll layouts,
re-render stability, long copy, and axe.

- [ ] **Step 2: Implement automatic activation and prove GREEN**

Use stable IDs derived from `useId`, button tabs, and associated panels. Keep
selection helpers local to the module. No runtime dependency or generic roving
focus export is introduced.

- [ ] **Step 3: Add docs/browser slice and commit**

Build the 14-component manifest and 23 pages. Verify Arrow/Home/End behavior,
disabled skip, tab/panel visibility, mobile scroll, desktop equal layout,
forced colors, and axe.

```bash
git add packages/react/src apps/docs
git commit -m "feat: add Tab"
```

### Task 10: Build and verify Tab in Figma

**Files:**
- Modify: `figma/README.md`
- Modify: `figma/verification.json`
- Modify: `apps/docs/src/content/components/tab.mdx`

- [ ] **Step 1: Create 12 exact variants**

Create page `04.14 Tab` with Size 2, Layout 2, Selection 3 and three label TEXT
properties. Bind indicator, typography, dimensions, borders, and scrolling edge
presentation.

- [ ] **Step 2: Validate, screenshot, reconcile, and commit**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm artifacts:check
git add figma apps/docs/src/content/components/tab.mdx
git commit -m "feat: add Tab to Figma library"
```

### Task 11: Implement BottomSheet in React and docs

**Files:**
- Create: `packages/react/src/bottom-sheet/BottomSheet.tsx`
- Create: `packages/react/src/bottom-sheet/BottomSheet.css`
- Create: `packages/react/src/bottom-sheet/BottomSheet.test.tsx`
- Create: `packages/react/src/bottom-sheet/index.ts`
- Create: `packages/react/src/bottom-sheet/dialog.ts`
- Modify: `packages/react/src/test/setup.ts`
- Modify: React exports/styles
- Create: `apps/docs/src/components/examples/BottomSheetExample.tsx`
- Create: `apps/docs/src/content/components/bottom-sheet.mdx`
- Modify: schema/navigation/example CSS/unit/browser tests/manifest

**Interfaces:**
- Produces `BottomSheet`, `BottomSheetProps`, and `BottomSheetCloseReason`.
- Produces private dialog lifecycle helpers only within `bottom-sheet/`.
- Produces route `/components/bottom-sheet/` and selector `[data-component-demo="bottom-sheet"]`.

- [ ] **Step 1: Add dialog test support and RED lifecycle tests**

Provide spec-shaped jsdom `showModal()` and `close()` shims only when missing.
Test SSR-safe no-container render, portal placement, show/close, all reasons,
nondismissible behavior, initial focus, restore, scroll lock/restoration, Strict
Mode, reduced motion, timers, unmount, ARIA, footer, long content, and axe.

- [ ] **Step 2: Implement portal and native dialog lifecycle**

Use `createPortal`, `showModal`, `cancel`, pointer-down/up backdrop ownership,
stable generated IDs, close-button fallback focus, exact prior overflow capture,
and one owned exit timer. Cleanup is idempotent.

- [ ] **Step 3: Implement visual and reduced-motion CSS**

Use the scrim, medium duration, standard easing, 640px max width, 100dvh
maximum height, top radius, elevation, scrollable body, sticky footer, forced
colors, and immediate reduced-motion exit.

- [ ] **Step 4: Prove React GREEN**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/react check
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/react exec vitest run src/bottom-sheet/BottomSheet.test.tsx
```

- [ ] **Step 5: Add docs and real-browser modal tests**

Demo title, description, long body, footer, dismissible toggle, three close
reasons, and focus return. Playwright verifies modal focus containment, Escape,
backdrop, close button, scroll lock, viewport fit, reduced motion, axe, console,
and all three viewports.

- [ ] **Step 6: Generate the 15-component manifest, build 24 pages, and commit**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs manifest:write
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs build
git add packages/react/src apps/docs
git commit -m "feat: add BottomSheet"
```

### Task 12: Build and verify BottomSheet in Figma

**Files:**
- Modify: `figma/README.md`
- Modify: `figma/verification.json`
- Modify: `apps/docs/src/content/components/bottom-sheet.mdx`

- [ ] **Step 1: Create four open-state variants**

Create page `04.15 BottomSheet`, axes Height Content/Full and Footer
Hidden/Visible, title/description TEXT properties, Show description BOOLEAN,
owned Close and Button instances, scrim, surface, body and footer regions.

- [ ] **Step 2: Validate bindings, layout, screenshot, and evidence**

Verify 4 variants, exact properties/axes, no clipping at full height, semantic
scrim and surface, effects, responsive width guidance, and screenshot digest.

- [ ] **Step 3: Commit**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm artifacts:check
git add figma apps/docs/src/content/components/bottom-sheet.mdx
git commit -m "feat: add BottomSheet to Figma library"
```

### Task 13: Add the component catalog and exact aggregate guardrails

**Files:**
- Create: `apps/docs/src/pages/components/index.astro`
- Modify: `apps/docs/src/pages/index.astro`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/src/styles/docs.css`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/e2e/navigation.spec.ts`
- Modify: `apps/docs/tests/e2e/ai-artifacts.spec.ts`
- Modify: `apps/docs/tests/e2e/component-slices.visual.spec.ts`
- Modify: `tooling/verification/artifacts.mjs`
- Modify: `tooling/verification/artifacts.test.mjs`
- Modify: `tooling/verification/guardrails.mjs`
- Modify: `tooling/verification/guardrails.test.mjs`
- Modify: `docs/PROGRESS.md`

**Interfaces:**
- Produces `/components/` and exact 25-route contract.
- Produces exact 118-token, 15-component, 6-collection, 116-Variable, 22-page, and 14-component-set verification.

- [ ] **Step 1: Write aggregate RED tests**

Change fixture expectations first. Add negative mutations for each new token,
component record, route, Figma page/component, ordered axis, property, URL, and
screenshot. Require 10 new Windows component-slice targets.

- [ ] **Step 2: Run guardrails and prove RED**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm test:guardrails
```

Expected: old 113/10/18/5/111/17/9 contracts fail against the new fixtures.

- [ ] **Step 3: Implement exact verifier changes**

Update all ordered arrays and exact totals. Preserve existing v0.1/v0.2
negative coverage and reject both missing and extra values.

- [ ] **Step 4: Build the catalog and update homepage copy**

Render all 15 manifest entries as semantic cards with name, description,
preview state, framework states, and docs link. Update hero to v0.3 preview and
link Components to `/components/`.

- [ ] **Step 5: Run focused aggregate verification**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm test:guardrails
PATH="$PWD/.codex/bin:$PATH" pnpm generated:check
PATH="$PWD/.codex/bin:$PATH" pnpm guardrails:check
PATH="$PWD/.codex/bin:$PATH" pnpm build
PATH="$PWD/.codex/bin:$PATH" pnpm artifacts:check
```

Expected: all commands pass and exactly 25 static pages exist.

- [ ] **Step 6: Commit**

```bash
git add apps/docs tooling docs/PROGRESS.md
git commit -m "test: verify TDS-inspired mobile core v0.3"
```

### Task 14: Final browser verification and audit

**Files:**
- Modify only files implicated by a demonstrated failure.
- Update ignored progress ledger: `.superpowers/sdd/progress.md`.

- [ ] **Step 1: Run focused new-component browser coverage**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/components.spec.ts tests/e2e/demo-contracts.spec.ts tests/e2e/accessibility.spec.ts
```

Expected: all current-platform assertions pass with only explicit platform or
viewport ownership skips.

- [ ] **Step 2: Run the complete verification gate**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm verify
```

Expected: exit 0 with no generated drift, type errors, unit failures,
guardrail failures, build failures, artifact failures, or current-platform
browser failures.

- [ ] **Step 3: Audit the complete branch diff**

```bash
git diff --check
git status --short
git diff a54de1c...HEAD --name-only
```

Inspect every changed file for scope, stale copy, empty Figma URLs, primitive
product colors, unconditional test skips, leaked timers/scroll locks, and
unrelated changes.

- [ ] **Step 4: Apply audit-only corrections through a fresh RED/GREEN cycle**

For every demonstrated correction, add or strengthen the failing test first,
run it RED, patch the minimum code, and rerun the focused test GREEN.

- [ ] **Step 5: Run a final fresh verification after all corrections**

```bash
PATH="$PWD/.codex/bin:$PATH" pnpm verify
git diff --check
git status --short
```

Expected: verification passes and the tracked worktree is clean. Report the 10
Windows-owned PNG approvals separately if they cannot be produced in the
current environment.
