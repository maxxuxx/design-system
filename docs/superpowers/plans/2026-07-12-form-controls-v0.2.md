# Form Controls v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, and native single-value `Select` as complete React, documentation, browser, AI-artifact, and Figma design-system slices.

**Architecture:** `packages/tokens` remains the design-value source, while `packages/react` exposes native-first controls that consume semantic tokens. Each MDX file is the human-readable source for its generated manifest entry, and Figma is a separately verified implementation of the same names, axes, states, properties, and token bindings.

**Tech Stack:** Node.js 24, pnpm 11, TypeScript 6, React 19, Vitest, Testing Library, axe-core, Astro 7, Playwright, Figma Variables/Styles/Components.

## Global Constraints

- Preserve the three private workspaces and add no runtime dependency.
- Keep all ten components and React implementations at `preview`; Svelte and React Native remain `planned`.
- Use native HTML form elements and preserve form submission, constraint validation, keyboard behavior, and refs.
- Keep visible form target rows at least 44px high.
- Product CSS may consume semantic color variables but never primitive color variables.
- Use test-first RED/GREEN cycles for every React behavior and verification-tool change.
- Generated token CSS/JSON and the component manifest are updated only through their generators.
- Figma IDs, URLs, token mappings, and screenshot evidence come from live readback.
- Do not weaken existing artifact, accessibility, responsive, or Windows visual-baseline gates.

---

### Task 1: Form-control token foundation and internal ID helper

**Files:**
- Modify: `packages/tokens/src/primitives.tokens.json`
- Modify: `packages/tokens/tests/generate.test.ts`
- Create: `packages/react/src/field/ids.ts`
- Create: `packages/react/src/field/ids.test.ts`
- Modify: `packages/react/src/text-field/TextField.tsx`
- Generate: `packages/tokens/dist/tokens.css`
- Generate: `packages/tokens/dist/tokens.json`
- Generate: `apps/docs/public/design-system/tokens.json`

**Interfaces:**
- Produces: `mergeIds(...values: Array<string | undefined>): string | undefined`
- Produces six dimension tokens: `size/selection/small`, `size/selection/medium`, `size/switch/small-width`, `size/switch/small-height`, `size/switch/medium-width`, `size/switch/medium-height`.

- [ ] **Step 1: Add failing token and helper tests**

```ts
it('generates the six form-control size tokens', async () => {
  const artifact = JSON.parse(await readFile(distJsonUrl, 'utf8'));
  expect(artifact.tokens).toHaveLength(113);
  expect(Object.fromEntries(artifact.tokens.map((token) => [token.name, token.resolvedValue])))
    .toMatchObject({
      'size/selection/small': 20,
      'size/selection/medium': 24,
      'size/switch/small-width': 36,
      'size/switch/small-height': 20,
      'size/switch/medium-width': 44,
      'size/switch/medium-height': 24,
    });
});

it('merges whitespace separated IDs once in input order', () => {
  expect(mergeIds('description error', 'error external external')).toBe(
    'description error external',
  );
  expect(mergeIds(undefined, '  ')).toBeUndefined();
});
```

- [ ] **Step 2: Run RED tests**

Run: `pnpm --filter @maxxuxx/tokens test && pnpm --filter @maxxuxx/react test -- src/field/ids.test.ts`

Expected: token count/value assertions fail and the helper import is missing.

- [ ] **Step 3: Add tokens and helper, then refactor TextField to import it**

```ts
export function mergeIds(
  ...values: Array<string | undefined>
): string | undefined {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter((value, index, all) =>
      value.length > 0 && all.indexOf(value) === index);
  return ids.length > 0 ? ids.join(' ') : undefined;
}
```

Append the six exact token definitions from the design spec as primitive `dimension` entries, remove the local `mergeIds` function from `TextField.tsx`, and import the internal helper from `../field/ids`.

- [ ] **Step 4: Generate artifacts and run GREEN tests**

Run: `pnpm --filter @maxxuxx/tokens tokens:generate && pnpm --filter @maxxuxx/tokens test && pnpm --filter @maxxuxx/react test && pnpm generated:check`

Expected: 113 token entries, helper tests pass, and the existing TextField contract remains green.

- [ ] **Step 5: Commit the foundation**

```bash
git add packages/tokens packages/react/src/field packages/react/src/text-field/TextField.tsx apps/docs/public/design-system/tokens.json
git commit -m "feat: add form control foundations"
```

### Task 2: Checkbox React and documentation slice

**Files:**
- Create: `packages/react/src/checkbox/Checkbox.tsx`
- Create: `packages/react/src/checkbox/Checkbox.css`
- Create: `packages/react/src/checkbox/Checkbox.test.tsx`
- Create: `packages/react/src/checkbox/index.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/CheckboxExample.tsx`
- Create: `apps/docs/src/content/components/checkbox.mdx`
- Modify: `apps/docs/src/content/component-schema.ts`
- Modify: `apps/docs/src/navigation.ts`
- Modify: `apps/docs/tests/unit/content.test.ts`
- Modify: `apps/docs/tests/unit/manifest.test.ts`
- Modify: `apps/docs/tests/e2e/support/routes.ts`
- Modify: `apps/docs/tests/e2e/components.spec.ts`
- Modify: `apps/docs/tests/e2e/accessibility.spec.ts`
- Modify: `apps/docs/tests/e2e/component-slices.visual.spec.ts`

**Interfaces:**
- Produces: `Checkbox`, `CheckboxProps`, and `CheckboxSize` exactly as defined in the design spec.
- Consumes: `mergeIds`, selection-size tokens, semantic action/status/border/text/focus tokens.

- [ ] **Step 1: Write Checkbox failing tests**

Cover generated and supplied IDs, checked/uncontrolled changes, controlled checked state, `indeterminate` property updates, description/error/external ID ordering, disabled precedence, native props/ref/form value, Space activation, 44px-owned class structure, and axe.

```tsx
it('synchronizes the native indeterminate property', () => {
  const { rerender } = render(<Checkbox indeterminate label="전체 선택" />);
  const input = screen.getByRole('checkbox', { name: '전체 선택' });
  expect(input).toBePartiallyChecked();
  rerender(<Checkbox indeterminate={false} label="전체 선택" />);
  expect(input).not.toBePartiallyChecked();
});

it('keeps native form value and keyboard activation', async () => {
  const user = userEvent.setup();
  render(<form><Checkbox label="약관 동의" name="terms" value="yes" /></form>);
  const input = screen.getByRole('checkbox', { name: '약관 동의' });
  await user.tab();
  await user.keyboard(' ');
  expect(input).toBeChecked();
  expect(new FormData(input.form!).get('terms')).toBe('yes');
});
```

- [ ] **Step 2: Run Checkbox RED test**

Run: `pnpm --filter @maxxuxx/react test -- src/checkbox/Checkbox.test.tsx`

Expected: module/export missing.

- [ ] **Step 3: Implement native Checkbox and CSS**

Implement `forwardRef<HTMLInputElement, CheckboxProps>`, set `input.indeterminate` in `useLayoutEffect`, render the exact root/label/description/error structure, and derive `data-size` and `data-state`. Use `appearance: none` on the native input; draw checked and mixed marks with pseudo-elements. The label row is `min-height: var(--ds-size-control-small)` and focus/error/disabled/forced-colors rules use existing semantic tokens.

- [ ] **Step 4: Run Checkbox GREEN test and package check**

Run: `pnpm --filter @maxxuxx/react test -- src/checkbox/Checkbox.test.tsx && pnpm --filter @maxxuxx/react check`

Expected: Checkbox tests and TypeScript pass.

- [ ] **Step 5: Add the Checkbox MDX contract and demo**

Use empty `figmaUrl` until Task 3 live readback. Frontmatter locks `variants: [unchecked, checked, indeterminate]`, `sizes: [small, medium]`, states `[default, error, disabled]`, exact public props, and only tokens referenced by CSS. The demo exposes value, size, indeterminate, disabled, and error controls plus static state specimens.

- [ ] **Step 6: Expand schema, routes, manifest tests, and browser assertions to six components**

Add `Checkbox` and `checkbox` after `ScrollArea`, add `/components/checkbox/`, and add page/demo/a11y/44px/label-click checks.

- [ ] **Step 7: Generate manifest and verify the slice**

Run: `pnpm --filter @maxxuxx/docs manifest:write && pnpm --filter @maxxuxx/docs test && pnpm --filter @maxxuxx/docs build && pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/accessibility.spec.ts tests/e2e/components.spec.ts --project=mobile-chromium`

Expected: six component contracts, 14 HTML routes, and Checkbox browser assertions pass.

- [ ] **Step 8: Commit Checkbox code and docs**

```bash
git add packages/react apps/docs
git commit -m "feat: add Checkbox component"
```

### Task 3: Checkbox Figma slice

**Files:**
- Modify from live readback: `figma/token-map.json`
- Modify from live readback: `figma/verification.json`
- Modify: `figma/README.md`
- Modify: `apps/docs/src/content/components/checkbox.mdx`
- Generate: `apps/docs/public/design-system/components.json`

**Interfaces:**
- Produces Figma page `04.6 Checkbox`, 18-variant `Checkbox` set, and its real node URL.

- [ ] **Step 1: Create and bind six new Figma Variables**

Use the existing `Spacing` collection and `Default` mode. Apply exact values, scopes, descriptions, and WEB syntax from the spec, then read all six back.

- [ ] **Step 2: Build the Checkbox page and component set**

Create axes `Size`, `Value`, and `State`, TEXT properties `Label`, `Description`, and `Error`, and all 18 combinations. Bind indicator dimensions, padding, gaps, radius, fills, strokes, and text styles. Add documentation showing native semantics, mixed state, 44px target, and error behavior.

- [ ] **Step 3: Audit structure, bindings, overlap, and screenshot**

Read component properties and variant keys, scan visible product values for unbound paint or geometry, verify page order, and capture the full page.

- [ ] **Step 4: Reconcile live IDs and run release checks**

Write only returned IDs/URLs/digests, set the MDX `figmaUrl`, regenerate the manifest, and run `pnpm --filter @maxxuxx/docs manifest:release-check` plus focused artifact tests updated in Task 12.

- [ ] **Step 5: Commit Checkbox Figma evidence**

```bash
git add figma apps/docs/src/content/components/checkbox.mdx apps/docs/public/design-system/components.json
git commit -m "feat: add Checkbox to Figma library"
```

### Task 4: RadioGroup React and documentation slice

**Files:**
- Create: `packages/react/src/radio-group/RadioGroup.tsx`
- Create: `packages/react/src/radio-group/RadioGroup.css`
- Create: `packages/react/src/radio-group/RadioGroup.test.tsx`
- Create: `packages/react/src/radio-group/index.ts`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/RadioGroupExample.tsx`
- Create: `apps/docs/src/content/components/radio-group.mdx`
- Modify the schema, navigation, unit, route, component, accessibility, demo, and visual test files listed in Task 2.

**Interfaces:**
- Produces: `RadioGroup`, `RadioGroupProps`, `RadioGroupOption`, and `RadioGroupSize` exactly as defined in the design spec.

- [ ] **Step 1: Write RadioGroup failing tests**

```tsx
it('supports native controlled and uncontrolled same-name radios', async () => {
  const user = userEvent.setup();
  render(
    <form>
      <RadioGroup legend="배송" name="delivery" options={options} defaultValue="standard" />
    </form>,
  );
  expect(screen.getByRole('radio', { name: '일반' })).toBeChecked();
  await user.click(screen.getByRole('radio', { name: '빠른' }));
  expect(new FormData(screen.getByRole('group').closest('form')!).get('delivery')).toBe('express');
});
```

Also cover fieldset ref/props, legend, option descriptions, generated IDs, group/error relationships, one required enabled radio, fieldset and option disabled behavior, arrow-key native behavior, `onChange`, and axe.

- [ ] **Step 2: Run RED, implement, then run GREEN**

Run RED: `pnpm --filter @maxxuxx/react test -- src/radio-group/RadioGroup.test.tsx`

Implement a native fieldset and same-name inputs without mirror state. Use `appearance: none`, a token-bound circle, and a `:checked::after` dot. Run GREEN and package check.

- [ ] **Step 3: Add RadioGroup MDX, demo, schema, routes, and browser checks**

Lock metadata to `sizes: [small, medium]`, variants `[none, first, second]`, and states `[default, error, disabled]`. Demonstrate controlled/uncontrolled values, option-disabled behavior, required state, and group errors.

- [ ] **Step 4: Generate and verify seven components**

Run docs unit/build and mobile/desktop Playwright assertions for fieldset naming, label clicks, arrow selection, form value, 44px rows, and axe.

- [ ] **Step 5: Commit RadioGroup code and docs**

```bash
git add packages/react apps/docs
git commit -m "feat: add RadioGroup component"
```

### Task 5: RadioGroup Figma slice

Create `04.7 RadioGroup`, the 18 variants and six TEXT properties specified in the design document, bind every visible value, audit page order/component properties/layout, capture and review the page, reconcile the real URL/evidence, regenerate the manifest, run release checks, and commit with `feat: add RadioGroup to Figma library`.

### Task 6: Switch React and documentation slice

**Files:**
- Create: `packages/react/src/switch/Switch.tsx`, `Switch.css`, `Switch.test.tsx`, `index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/SwitchExample.tsx`
- Create: `apps/docs/src/content/components/switch.mdx`
- Modify the schema, navigation, unit, route, component, accessibility, demo, and visual test files.

**Interfaces:**
- Produces `Switch`, `SwitchProps`, and `SwitchSize` exactly as defined in the design spec.

- [ ] **Step 1: Write RED tests for owned role, native checked behavior, form value, stable visible label, IDs, error/disabled precedence, ref/props, Space activation, and axe**

```tsx
render(<Switch label="주문 알림" name="alerts" value="on" />);
const control = screen.getByRole('switch', { name: '주문 알림' });
expect(control).toHaveAttribute('type', 'checkbox');
await user.click(screen.getByText('주문 알림'));
expect(control).toBeChecked();
```

- [ ] **Step 2: Implement native switch and CSS, then run GREEN/package checks**

Use one native checkbox with owned `role="switch"`; render track/thumb with the input and `::after`, bind new switch dimensions, and remove transitions under reduced motion.

- [ ] **Step 3: Add MDX/demo/schema/routes/browser contracts, generate manifest, verify eight components, and commit**

Metadata uses variants `[off, on]`, sizes `[small, medium]`, states `[default, error, disabled]`. Browser checks prove label click, Space activation, role, 44px row, forced-colors focus, and stable label.

### Task 7: Switch Figma slice

Create `04.8 Switch`, the 12 variants and three TEXT properties from the spec, bind track dimensions and every visible value, audit and screenshot, reconcile live evidence and URL, run release checks, and commit with `feat: add Switch to Figma library`.

### Task 8: Textarea React and documentation slice

**Files:**
- Create: `packages/react/src/textarea/Textarea.tsx`, `Textarea.css`, `Textarea.test.tsx`, `index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/TextareaExample.tsx`
- Create: `apps/docs/src/content/components/textarea.mdx`
- Modify the schema, navigation, unit, route, component, accessibility, demo, and visual test files.

**Interfaces:**
- Produces `Textarea`, `TextareaProps`, `TextareaSize`, and `TextareaResize` exactly as defined in the design spec.

- [ ] **Step 1: Write RED tests**

Cover default `rows=4`, explicit rows, medium/large size, vertical/none resize data, controlled/uncontrolled values, maxLength/required/form value, IDs, error/disabled precedence, ref/native props, keyboard focus, and axe.

```tsx
render(<Textarea label="요청사항" />);
const textarea = screen.getByRole('textbox', { name: '요청사항' });
expect(textarea).toHaveAttribute('rows', '4');
expect(textarea).toHaveAttribute('data-resize', 'vertical');
```

- [ ] **Step 2: Implement the native textarea/CSS and run GREEN/package checks**

Use the TextField-compatible label/description/error contract, `min-height` from size tokens, `resize: vertical|none`, and `max-inline-size: 100%`.

- [ ] **Step 3: Add MDX/demo/schema/routes/browser contracts, generate manifest, verify nine components, and commit**

Metadata sizes are `[medium, large]`; states are `[default, focus, error, disabled]`. Browser checks prove 48/56 minimum heights, no horizontal resize overflow, focus/error visuals, native typing, and form value.

### Task 9: Textarea Figma slice

Create `04.9 Textarea`, the eight variants and four TEXT properties from the spec, bind values, audit and screenshot, reconcile live evidence and URL, run release checks, and commit with `feat: add Textarea to Figma library`.

### Task 10: Select React and documentation slice

**Files:**
- Create: `packages/react/src/select/Select.tsx`, `Select.css`, `Select.test.tsx`, `index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/src/styles.css`
- Create: `apps/docs/src/components/examples/SelectExample.tsx`
- Create: `apps/docs/src/content/components/select.mdx`
- Modify the schema, navigation, unit, route, component, accessibility, demo, and visual test files.

**Interfaces:**
- Produces `Select`, `SelectProps`, and `SelectSize` exactly as defined in the design spec.
- Consumes decorative `Icon/ChevronRight` without exposing an accessible icon name.

- [ ] **Step 1: Write RED tests**

Cover required children, native option/optgroup composition, optional disabled empty-value placeholder, controlled/uncontrolled selection, onChange, form value, required validation semantics, single-select type restriction, IDs, error/disabled precedence, ref/native props, keyboard focus, decorative owned icon, and axe.

```tsx
render(
  <Select defaultValue="" label="국가" placeholder="선택하세요">
    <option value="kr">대한민국</option>
  </Select>,
);
expect(screen.getByRole('option', { name: '선택하세요' })).toBeDisabled();
expect(screen.getByRole('combobox', { name: '국가' })).toHaveValue('');
```

- [ ] **Step 2: Implement native select/CSS and run GREEN/package checks**

Render a native single-value select inside a control wrapper and a pointer-inert decorative chevron. Keep the OS popup and browser keyboard behavior; use `appearance: none` only for the closed-field arrow.

- [ ] **Step 3: Add MDX/demo/schema/routes/browser contracts, generate manifest, verify ten components, and commit**

Metadata sizes are `[medium, large]`; states are `[default, focus, error, disabled]`. Browser checks prove option selection, form value, 48/56px controls, native single-select semantics, forced-colors focus, and no overflow.

### Task 11: Select Figma slice

Create `04.10 Select`, the eight variants and four TEXT properties from the spec, reuse the owned ChevronRight icon instance, bind every visible value, document that the OS popup is not recreated, audit and screenshot, reconcile live evidence and URL, run release checks, and commit with `feat: add Select to Figma library`.

### Task 12: Exact integration guardrails and final verification

**Files:**
- Modify: `tooling/verification/artifacts.mjs`
- Modify: `tooling/verification/artifacts.test.mjs`
- Modify: `apps/docs/tests/e2e/ai-artifacts.spec.ts`
- Modify: `apps/docs/tests/e2e/demo-contracts.spec.ts`
- Modify: `apps/docs/tests/e2e/component-slices.visual.spec.ts`
- Modify: `apps/docs/tests/e2e/visual.spec.ts`
- Add on Windows: five mobile and five desktop component-slice PNG baselines
- Modify: `figma/README.md`
- Modify: `docs/PROGRESS.md`

**Interfaces:**
- Locks 113 tokens, ten exact component contracts, 18 static HTML routes, 17 Figma managed pages, 111 Variables, eight Text Styles, two Effect Styles, and nine component sets.

- [ ] **Step 1: Write failing artifact tests for all new exact totals and contracts**

Update fixtures to 113 tokens and ten components. Add distinct component node IDs, properties, variant counts, page screenshots, tokens, and exact public prop contracts. Verify that deleting or mutating each new route/component/Figma record produces a targeted violation.

- [ ] **Step 2: Run artifact RED test**

Run: `pnpm test:guardrails`

Expected: old five-component and 107-token constants reject the new build/evidence.

- [ ] **Step 3: Update production artifact verifier to the new exact contract**

Set canonical order to the ten components; add the five routes and pages; use variant counts `18`, `18`, `12`, `8`, and `8`; add exact Figma TEXT property arrays and public props from the spec; change token count to 113, Variable count to 111, and the Spacing collection count to the live reconciled value.

- [ ] **Step 4: Run guardrail GREEN tests and generated checks**

Run: `pnpm test:guardrails && pnpm generated:check && pnpm guardrails:check`

Expected: all exact fixture mutations are rejected and production artifacts are current.

- [ ] **Step 5: Run focused React, docs, browser, and release checks**

Run:

```bash
pnpm --filter @maxxuxx/react check
pnpm --filter @maxxuxx/react test
pnpm --filter @maxxuxx/docs test
pnpm --filter @maxxuxx/docs manifest:release-check
pnpm --filter @maxxuxx/docs build
pnpm artifacts:check
pnpm --filter @maxxuxx/docs test:e2e
```

Expected: all ten component routes and contracts pass on the current platform. Visual tests remain skipped outside their approved Windows Chromium owner.

- [ ] **Step 6: Capture and review Windows visual baselines without changing tolerance**

On Windows Chromium run:

```powershell
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts --update-snapshots
pnpm --filter @maxxuxx/docs exec playwright test tests/e2e/component-slices.visual.spec.ts
```

Review every new image before committing. Keep `maxDiffPixels: 100` unchanged.

- [ ] **Step 7: Run the full completion gate**

Run: `pnpm verify`

Expected: type checks, all unit/guardrail/artifact tests, generated checks, static build, all supported browser assertions, and platform-owned visual checks pass with zero failures.

- [ ] **Step 8: Inspect scope and commit integration**

Run: `git diff --check && git status --short && git diff --stat && git log --oneline --decorate -15`

Commit only intentional integration/evidence/progress changes:

```bash
git add tooling apps/docs/tests figma docs/PROGRESS.md
git commit -m "test: verify form controls v0.2"
```

### Task 13: Final requirements audit

**Files:**
- Read: `docs/superpowers/specs/2026-07-12-form-controls-v0.2-design.md`
- Read: `docs/superpowers/plans/2026-07-12-form-controls-v0.2.md`
- Read: all changed files from `git diff main...HEAD --name-only`

- [ ] **Step 1: Map every design requirement to code, docs, Figma evidence, or a verification command**

- [ ] **Step 2: Search for placeholders, empty Figma URLs, stale five-component counts, primitive color leaks, ignored failures, and unrelated edits**

Run:

```bash
rg -n "figmaUrl: \"\"|all five|five-component|107-token" packages apps tooling figma docs
pnpm guardrails:check
pnpm generated:check
git diff --check
```

- [ ] **Step 3: Run a fresh `pnpm verify`, read the entire result, and only then report completion or exact remaining blockers**

- [ ] **Step 4: Commit any audit-only documentation correction after rerunning its proving command**
