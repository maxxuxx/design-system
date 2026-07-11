# ScrollArea Implementation Plan

> Execute this plan test-first in `/home/ubuntu/.codex/worktrees/design-system-icon`. Keep the public repository, generated artifacts, live Figma file, and verification evidence in sync.

**Goal:** Ship a vertical ScrollArea whose native scrollbar is visually hidden while wheel, touch, keyboard, and navigation-button scrolling remain available, with direction-aware blur cues in React, docs, AI artifacts, tests, and Figma.

**Architecture:** A native scroll viewport receives the public ref and HTML props. An internal relative wrapper owns two absolute edge overlays. Scroll geometry and two ResizeObserver targets drive four runtime states. Existing tokens and ChevronRight are reused; one primitive blur token is added.

**Stack:** React 19, TypeScript, CSS custom properties, Vitest/Testing Library/axe, Astro, Playwright, Node artifact verification, Figma Plugin API.

---

## Task 1: Add the primitive blur token

**Files:**

- Modify: `packages/tokens/src/primitives.tokens.json`
- Modify generated: `packages/tokens/dist/tokens.css`
- Modify generated: `packages/tokens/dist/tokens.json`
- Modify generated: `apps/docs/public/design-system/tokens.json`
- Test: `packages/tokens/tests/generate.test.ts`

1. Add a failing token-generation assertion that `blur/subtle` resolves to `8`, emits `--ds-blur-subtle`, and keeps deterministic ordering.
2. Run `pnpm --filter @maxxuxx/tokens test` and confirm the new assertion fails.
3. Add the primitive dimension token:

```json
"blur": {
  "subtle": {
    "$type": "dimension",
    "$value": 8,
    "$description": "Direction cue background blur radius."
  }
}
```

4. Run the repository token generator and regenerate docs token JSON.
5. Re-run token tests and `pnpm --filter @maxxuxx/tokens check`.
6. Commit the token source, tests, and generated outputs.

## Task 2: Define ScrollArea behavior with failing React tests

**Files:**

- Create: `packages/react/src/scroll-area/ScrollArea.test.tsx`
- Create: `packages/react/src/scroll-area/ScrollArea.tsx`
- Create: `packages/react/src/scroll-area/index.ts`

1. Create the minimal export surface so the test file can import `ScrollArea` and its public types.
2. In tests, install a controllable ResizeObserver double and define mutable `clientHeight`, `scrollHeight`, and `scrollTop` properties on the viewport.
3. Add failing tests for:

- `no-overflow`, `start`, `middle`, and `end` state contracts;
- one-pixel fractional epsilon and negative/positive browser bounce values;
- recomputation on scroll and on viewport/content observer callbacks;
- down and up `scrollBy` calls at `clientHeight * 0.8`;
- root `id`, `className`, native data attributes, forwarded root ref, `viewportRef`, and `onViewportScroll`;
- owned region name, tab index, button labels, `aria-controls`, native disabled state, and decorative icons;
- observer disconnect and axe.

4. Run `pnpm --filter @maxxuxx/react test -- ScrollArea.test.tsx` and confirm failures reflect missing behavior.

## Task 3: Implement ScrollArea state and DOM

**Files:**

- Modify: `packages/react/src/scroll-area/ScrollArea.tsx`
- Modify: `packages/react/src/scroll-area/index.ts`
- Modify: `packages/react/src/index.ts`

1. Implement `ScrollAreaProps` by omitting `children` and the root `onScroll`; require the three localized labels and expose optional `viewportRef` and `onViewportScroll`.
2. Add `getScrollState()` using a one-pixel epsilon.
3. Forward the component ref and native props to the outer sizing root; merge `viewportRef` onto the actual scroll viewport and keep an internal content ref.
4. Synchronize geometry on mount, scroll, and both ResizeObserver targets, with an undefined-ResizeObserver guard.
5. Preserve caller `onViewportScroll` and make viewport-owned attributes authoritative.
6. Implement 80%-viewport `scrollBy` controls with existing decorative ChevronRight icons.
7. Re-run the focused test until green, then run all React tests and TypeScript checks.

## Task 4: Style hidden native scrolling and edge navigation

**Files:**

- Create: `packages/react/src/scroll-area/ScrollArea.css`
- Modify: `packages/react/src/styles.css`
- Test: `packages/react/src/scroll-area/ScrollArea.test.tsx`

1. Add a CSS-token contract assertion for the new blur token and required component class hooks.
2. Implement a relative sizing root, native `overflow-y:auto` viewport, focus-safe scroll padding, and all-engine visual scrollbar hiding.
3. Add absolute top/bottom layers with pointer passthrough, direction-specific gradients, and `backdrop-filter: blur(var(--ds-blur-subtle))` only when active.
4. Add 44px circular button visuals, hover, focus-visible, disabled transparency, icon rotation, forced-colors, and reduced-motion behavior.
5. Run React tests/checks and the root `pnpm check` command; this repository does not define a lint script.

## Task 5: Add canonical docs metadata and interactive demo

**Files:**

- Create: `apps/docs/src/content/components/scroll-area.mdx`
- Create: `apps/docs/src/components/examples/ScrollAreaExample.tsx`
- Modify: `apps/docs/src/components/examples/examples.css`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/src/pages/index.astro`
- Test: `apps/docs/tests/unit/content.test.ts`
- Test: `apps/docs/tests/unit/manifest.test.ts`

1. First extend unit expectations to the five-component canonical order and `scroll-area` slug; run docs unit tests and confirm they fail.
2. Add the schema/navigation/home entries.
3. Add MDX frontmatter with exact props, `states: [no-overflow, start, middle, end]`, exact CSS token coverage, all required H2 sections, and a pending Figma URL.
4. Build a demo with an overflow mode and a short-content mode. Include stable test IDs for viewport, content, edges, and buttons without changing the public component API.
5. Add demo-only content card styles and a fixed 320px viewport height responsive down to mobile.
6. Run docs unit tests and the component template validator.

## Task 6: Add real-browser behavior coverage

**Files:**

- Modify: `apps/docs/tests/e2e/support/routes.ts`
- Modify: `apps/docs/tests/e2e/demo-contracts.spec.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts` only if route-driven coverage needs a wait condition

1. Add ScrollArea to `COMPONENT_HTML_ROUTES` and confirm navigation/component/accessibility suites discover it.
2. Add failing demo-contract tests for:

- hidden computed scrollbar with native `overflow-y:auto`;
- wheel-driven `scrollTop` changes;
- start, middle, end, and no-overflow state/disabled/blur agreement;
- button scrolling in both directions;
- at least 44px active targets and keyboard-visible focus.

3. Run the ScrollArea page E2E tests, fix only observable behavior mismatches, and re-run to green.

## Task 7: Extend generated AI artifacts and strict guardrails

**Files:**

- Modify generated: `apps/docs/public/design-system/components.json`
- Modify: `apps/docs/tests/e2e/ai-artifacts.spec.ts`
- Modify: `tooling/verification/artifacts.mjs`
- Modify: `tooling/verification/artifacts.test.mjs`

1. Extend tests first for 107 tokens, 81 primitives, five components, the ScrollArea prop contract, 12 Figma pages, five manifest targets, and ten total Figma targets including icon masters.
2. Run `pnpm artifacts:test` and confirm expected count/contract failures.
3. Update the verifier's route, page, component, prop, Figma evidence, and exact-count contracts.
4. Generate `components.json` with `pnpm --filter @maxxuxx/docs manifest:write`.
5. Run artifact unit tests, docs unit tests, build, and artifact checks.

## Task 8: Build ScrollArea in Figma

**Files:**

- Modify ignored ledger: `figma/.state/design-system-v0.1.json`
- Modify later evidence: `figma/token-map.json`
- Modify later evidence: `figma/verification.json`
- Modify: `figma/README.md`

1. Re-read the Figma state ledger immediately before every `use_figma` call.
2. Search design libraries for ScrollArea immediately before creation and reuse only a fully compatible result.
3. Phase 1: create and code-bind `blur/subtle` in `Primitives`; read it back and verify value, scope, and code syntax.
4. Phase 2: create page `04.5 ScrollArea` before `90 Native Differences`; add title, anatomy, behavior, accessibility, and four-state specimen documentation using existing typography and variables.
5. Phase 3: create four 320×240 ComponentNodes named by `State`, bind all supported dimensions/colors/blur radius, use instances of `Icon/ChevronRight`, combine as `ScrollArea`, manually lay out variants, and describe the set.
6. Update the `04 Components` overview to show all five components.
7. After each mutation call, return and ledger every created/mutated node ID; run structural and variable-binding readbacks before proceeding.

## Task 9: Reconcile live Figma evidence

**Files:**

- Modify: `figma/token-map.json`
- Modify: `figma/verification.json`
- Modify: `figma/README.md`
- Modify ignored: `figma/.state/design-system-v0.1.json`

1. Read back all collections/variables and add `blur/subtle` with its live IDs to token-map.
2. Audit ScrollArea variant count, State values, no component properties, variable bindings, icon instances, active/inactive effects, and descriptions.
3. Screenshot and visually inspect `04.5 ScrollArea` and the updated `04 Components` page.
4. Re-screenshot every managed Figma page because evidence requires exact unique hashes; update all 12 node IDs/hashes.
5. Add ScrollArea Figma evidence, update timestamps/digests/counts, and run the artifact verifier.

## Task 10: Refresh and inspect visual baselines

**Files:**

- Modify: `apps/docs/tests/e2e/component-slices.visual.spec.ts`
- Modify: `apps/docs/tests/e2e/visual.spec.ts`
- Add/update: `apps/docs/tests/e2e/__snapshots__/**/*.png`
- Temporarily create then delete: `.github/workflows/update-windows-baselines.yml`

1. Add ScrollArea desktop/mobile slice cases and desktop/tablet/mobile page cases.
2. Refresh local Chromium baselines and inspect every changed image for scrollbar hiding, edge blur, button alignment, clipping, and responsive overflow.
3. Use the temporary Windows baseline workflow to generate Windows reference images, retrieve and inspect every image, then commit them.
4. Delete the temporary workflow before the final commit.

## Task 11: Complete verification, review, and publish

**Files:** all changed files above.

1. Run formatting, lint, typecheck, unit tests, docs build, E2E behavior/accessibility, visual tests, artifact verification, and `pnpm verify` from a clean build state.
2. Invoke the verification-before-completion skill and record fresh command evidence.
3. Invoke requesting-code-review; assign independent reviewers to React behavior/accessibility and repository/Figma evidence. Resolve every Important or Critical issue and re-run affected checks.
4. Confirm no temporary workflow, debug artifact, unrelated workspace edit, or untracked file remains.
5. Commit intentionally, push `codex/design-system-icon` to the public GitHub repository, update PR #1, and monitor permanent Ubuntu and Windows Verify jobs to success.
