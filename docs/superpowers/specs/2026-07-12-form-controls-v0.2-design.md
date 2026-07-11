# Form Controls v0.2 Design

## Goal

Extend the design system with five complete, native-first form components: `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, and `Select`. Each component must exist as one verified vertical slice across design tokens, React, MDX documentation, the generated AI manifest, responsive browser behavior, accessibility checks, and the existing Figma library.

All five components remain `preview`, matching the existing library status. React is `preview`; Svelte and React Native remain `planned`.

## Selected approach

Implement one vertical slice at a time in this order:

```text
Checkbox → RadioGroup → Switch → Textarea → Select
```

For each slice, freeze the native semantics and public React contract first, prove the behavior with failing tests, implement the React and CSS layer, add the MDX page and interactive demo, regenerate the manifest, verify responsive and accessibility behavior, create the matching Figma component set, and then reconcile machine-readable Figma evidence before moving to the next slice.

This approach was selected over:

- implementing all React components before documentation and Figma, which would allow API and visual contracts to drift;
- designing all Figma components first, which would leave native form behavior and accessibility constraints untested while visual variants multiply;
- using headless-widget dependencies, which would add runtime and versioning surface for controls that native HTML already implements reliably.

## Shared principles

- Use native `input`, `fieldset`, `legend`, `textarea`, `select`, `option`, and `label` elements.
- Preserve browser form submission, constraint validation, autofill, keyboard behavior, and assistive-technology semantics.
- Use required visible labels. Descriptions and errors receive deterministic IDs and are connected with `aria-describedby`; errors also use `aria-errormessage` and `aria-invalid`.
- State precedence is `Disabled > Error > Focus > Default`. Checked or selected value remains an independent value axis.
- Keep every pointer target at least 44px high even when the visible indicator is 20px or 24px.
- Use semantic color tokens in product CSS. Primitive color variables remain forbidden outside foundation visualizers.
- Reuse the existing font, spacing, radius, control-height, border, focus, status, and action tokens.
- Support `forced-colors` and visible `focus-visible` treatment. Motion is not required for meaning and is removed under `prefers-reduced-motion`.
- Forward native props and refs to the actual native control, except where the component explicitly owns semantics such as `type`, `role`, `size`, `multiple`, or `children`.
- Do not add a public generic `Field` component in v0.2. Share only internal ID-merging helpers so each component retains a direct, understandable API.

## Shared internal field helper

Move the existing `mergeIds` behavior from `TextField` into an internal `packages/react/src/field/ids.ts` module. It accepts any number of optional whitespace-separated ID strings, removes empty and duplicate IDs while preserving order, and returns `undefined` when no IDs remain.

`TextField`, `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, and `Select` use this helper. The helper is not exported from `@maxxuxx/react`.

## New tokens

Add six primitive dimension tokens to support the visible selection controls without misusing icon tokens:

| Token | CSS variable | Value | Figma collection | Scope |
|---|---|---:|---|---|
| `size/selection/small` | `--ds-size-selection-small` | `20px` | Spacing | `WIDTH_HEIGHT` |
| `size/selection/medium` | `--ds-size-selection-medium` | `24px` | Spacing | `WIDTH_HEIGHT` |
| `size/switch/small-width` | `--ds-size-switch-small-width` | `36px` | Spacing | `WIDTH` |
| `size/switch/small-height` | `--ds-size-switch-small-height` | `20px` | Spacing | `HEIGHT` |
| `size/switch/medium-width` | `--ds-size-switch-medium-width` | `44px` | Spacing | `WIDTH` |
| `size/switch/medium-height` | `--ds-size-switch-medium-height` | `24px` | Spacing | `HEIGHT` |

The source token count becomes 113. Figma keeps five collections and gains six Variables, moving from 105 to 111 Variables. The eight Text Styles and two Effect Styles remain unchanged.

## Checkbox

### Purpose

Use `Checkbox` when zero, one, or several independent options may be selected. The component supports a mixed state for a parent option that summarizes child selections.

### Public React API

```ts
export type CheckboxSize = 'small' | 'medium';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type'
> {
  label: string;
  description?: string;
  errorMessage?: string;
  indeterminate?: boolean;
  size?: CheckboxSize;
}
```

`Checkbox` forwards its ref and remaining native input props to `input[type="checkbox"]`. Defaults are `size="medium"` and `indeterminate={false}`. The component sets the DOM `indeterminate` property after mount and whenever the prop changes; it does not invent a string form value for mixed state.

### Structure and behavior

```text
root
├─ label row (minimum 44px)
│  ├─ native checkbox input with custom appearance
│  └─ visible label
├─ optional description
└─ optional error (role=alert)
```

The native checkbox itself remains focusable and clickable. CSS draws the check and mixed indicator from `:checked` and `:indeterminate`; uncontrolled native changes therefore stay visually synchronized without React-owned mirror state.

The value axis is `Unchecked`, `Checked`, or `Indeterminate`. The state axis is `Default`, `Error`, or `Disabled`. `aria-invalid` and error relationships are added when `errorMessage` is present, unless disabled takes visual precedence.

### Figma representation

Create page `04.6 Checkbox` and a `Checkbox` component set with 18 variants:

- `Size`: `Small`, `Medium`
- `Value`: `Unchecked`, `Checked`, `Indeterminate`
- `State`: `Default`, `Error`, `Disabled`

Properties: `Label`, `Description`, and `Error` as TEXT properties. Visible indicator size, row spacing, radius, fill, stroke, focus documentation, and text use variables or styles.

## RadioGroup

### Purpose

Use `RadioGroup` when exactly one value is chosen from a small visible set. Options remain native same-name radio inputs inside a named fieldset.

### Public React API

```ts
export type RadioGroupSize = 'small' | 'medium';

export interface RadioGroupOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'children' | 'onChange'
> {
  legend: string;
  name: string;
  options: readonly RadioGroupOption[];
  description?: string;
  errorMessage?: string;
  size?: RadioGroupSize;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}
```

`RadioGroup` forwards its ref and fieldset props to the native `fieldset`. It supports either controlled `value` or uncontrolled `defaultValue`; it does not maintain a second selected-value state. Each option receives the same required `name`. `required` is applied to the first enabled option, which invokes native group constraint validation without duplicating the attribute on every option.

### Structure and behavior

```text
fieldset root
├─ legend
├─ optional group description
├─ option list
│  └─ label row (minimum 44px)
│     ├─ native radio input with custom appearance
│     └─ label and optional option description
└─ optional group error (role=alert)
```

Native radio keyboard behavior, form submission, and same-name grouping remain browser-owned. A disabled fieldset disables every option; an option may also be independently disabled. The group and inputs expose invalid and descriptive relationships when an error exists.

### Figma representation

Create page `04.7 RadioGroup` and a `RadioGroup` component set with 18 variants:

- `Size`: `Small`, `Medium`
- `Selection`: `None`, `First`, `Second`
- `State`: `Default`, `Error`, `Disabled`

The specimen contains three visible options. Properties: `Legend`, `Option 1`, `Option 2`, `Option 3`, `Description`, and `Error` as TEXT properties. Runtime `name`, values, form submission, and option count remain React concerns rather than Figma properties.

## Switch

### Purpose

Use `Switch` for an immediate binary on/off setting. Use Checkbox instead for agreement, multi-selection, or a value that is committed only when a containing form is submitted.

### Public React API

```ts
export type SwitchSize = 'small' | 'medium';

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'role' | 'size' | 'type'
> {
  label: string;
  description?: string;
  errorMessage?: string;
  size?: SwitchSize;
}
```

`Switch` forwards its ref and native checkbox props to `input[type="checkbox"][role="switch"]`. The visible label is stable across on and off states. Defaults are `size="medium"` and the native unchecked value.

### Structure and behavior

```text
root
├─ label row (minimum 44px)
│  ├─ native checkbox input rendered as track and thumb
│  └─ visible label
├─ optional description
└─ optional error (role=alert)
```

CSS derives on/off visuals from `:checked`. The native input owns Space activation, checked state, form submission, and focus. The track and thumb may transition briefly, but reduced-motion removes the transition.

### Figma representation

Create page `04.8 Switch` and a `Switch` component set with 12 variants:

- `Size`: `Small`, `Medium`
- `Value`: `Off`, `On`
- `State`: `Default`, `Error`, `Disabled`

Properties: `Label`, `Description`, and `Error` as TEXT properties. Track width and height bind to the new switch size variables; thumb, spacing, colors, and text remain token-bound.

## Textarea

### Purpose

Use `Textarea` for multi-line freeform input. Use `TextField` for single-line values and structured input types.

### Public React API

```ts
export type TextareaSize = 'medium' | 'large';
export type TextareaResize = 'vertical' | 'none';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'children'
> {
  label: string;
  description?: string;
  errorMessage?: string;
  size?: TextareaSize;
  resize?: TextareaResize;
}
```

`Textarea` forwards its ref and remaining native props to the `textarea`. Defaults are `size="medium"`, `resize="vertical"`, and `rows={4}`. Explicit `rows`, `value`, `defaultValue`, `maxLength`, `required`, and form attributes remain native.

### Structure and behavior

The structure matches `TextField`: root, visible label, native textarea, optional description, and optional alert error. The minimum control height follows the selected control-size token while `rows` determines the normal content height. Vertical resize is the only resizable direction; the component never permits horizontal overflow.

The component does not provide auto-grow or a character counter. Consumers can use native `maxLength`; a future counter must be a separately specified, localized feature.

### Figma representation

Create page `04.9 Textarea` and a `Textarea` component set with eight variants:

- `Size`: `Medium`, `Large`
- `State`: `Default`, `Focus`, `Error`, `Disabled`

Properties: `Label`, `Value`, `Description`, and `Error` as TEXT properties. The default specimen is 320px wide and visually four rows tall. Width and row count are layout guidance, not variant axes.

## Select

### Purpose

Use `Select` for one value from a longer closed list where showing all options at once would be wasteful. Use `RadioGroup` for a small set that benefits from immediate comparison.

### Public React API

```ts
export type SelectSize = 'medium' | 'large';

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'children' | 'multiple' | 'size'
> {
  children: ReactNode;
  label: string;
  description?: string;
  errorMessage?: string;
  placeholder?: string;
  size?: SelectSize;
}
```

`Select` forwards its ref and remaining native props to a single-select `select`. `children` accepts native `option` and `optgroup` content. When `placeholder` is provided, the component prepends `<option value="" disabled>`; the consumer selects it with `defaultValue=""` or `value=""`. Defaults are `size="medium"` and no placeholder.

The component owns the single-select contract and therefore does not expose `multiple` or the native listbox `size` attribute. Search, async loading, virtualization, custom popup positioning, and freeform values belong to a later `Combobox` component.

### Structure and behavior

The structure matches `TextField`, with a native select inside a relative control wrapper and a decorative owned `Icon/ChevronRight` rotated downward. The select keeps its native popup, keyboard behavior, constraint validation, autofill, and form value. The icon never receives pointer events or an accessible label.

### Figma representation

Create page `04.10 Select` and a `Select` component set with eight variants:

- `Size`: `Medium`, `Large`
- `State`: `Default`, `Focus`, `Error`, `Disabled`

Properties: `Label`, `Value`, `Description`, and `Error` as TEXT properties. The closed field is represented in Figma; the operating-system popup menu is documented but not recreated as a library variant.

## Documentation and AI artifacts

Each component receives:

- one MDX page using the existing component template;
- one interactive React demo with controlled and static state examples;
- navigation and route entries;
- purpose, usage, non-usage, anatomy, sizes, states, responsive behavior, accessibility, React example, API, tokens, Figma URL, and framework status;
- one generated entry in `/design-system/components.json` derived from validated MDX frontmatter.

The canonical component order becomes:

```text
Icon, Badge, Button, TextField, ScrollArea,
Checkbox, RadioGroup, Switch, Textarea, Select
```

The static HTML route count becomes 18. The two AI JSON routes remain unchanged in location. Exact route, component, prop, token, CSS, Figma-page, and distinct-node guardrails expand from five to ten components.

## Browser and accessibility verification

React tests must prove:

- default props, native prop forwarding, and ref targets;
- controlled and uncontrolled native value behavior;
- deterministic label, description, and error relationships;
- disabled and error precedence;
- keyboard activation or native selection behavior with Testing Library user events;
- form submission values and native constraint behavior where jsdom supports it;
- axe smoke checks;
- Checkbox mixed-state synchronization;
- RadioGroup required and option-disabled behavior;
- Switch-owned role and stable label;
- Textarea rows and resize contract;
- Select placeholder, option, and optgroup composition.

Browser tests must prove at mobile, tablet, and desktop sizes:

- all five routes render with no horizontal overflow, broken links, console errors, or automatic axe violations;
- every visible form target reaches the 44px minimum interaction area;
- focus-visible and forced-colors treatments remain visible;
- label clicks activate Checkbox, RadioGroup options, and Switch;
- Textarea and Select use the expected 48px and 56px size tiers;
- Select remains native single-select and submits its chosen value;
- mobile demo layouts use one column while desktop demos use multiple columns where appropriate.

Windows Chromium owns approved component-slice screenshots for all five demos. Local non-Windows review uses captured screenshots and browser assertions without claiming Windows baseline approval.

## Figma integration and machine-readable evidence

Insert the five new pages after `04.5 ScrollArea` and before `90 Native Differences`. Update `04 Components` to list all ten component families.

Figma requirements:

- all visible product fills, strokes, text colors, spacing, sizing, radii, and typography bind to the matching Variables or Styles;
- the six new size Variables have exact code values, scopes, and WEB syntax;
- component set names, axes, values, properties, variant counts, and node URLs match the MDX and artifact verifier;
- no duplicate logical keys, unnamed managed nodes, clipping, component-set overlap, or detached icon copies;
- every page receives a reviewed screenshot and machine-readable digest;
- `figma/token-map.json`, `figma/verification.json`, MDX Figma URLs, and generated `components.json` are reconciled from live readback, not invented IDs.

Final Figma totals are five collections, 111 Variables, eight Text Styles, two Effect Styles, 17 managed pages, five owned Icon components, and nine component sets covering Badge, Button, TextField, ScrollArea, and the five new form controls.

## Completion gate

A component is complete only after its React tests, package check, manifest check, Astro build, real-browser accessibility and responsive assertions, Figma structural and binding audit, and machine-readable artifact checks pass. After all five slices, run the root `pnpm verify`, inspect every changed file, and confirm the worktree contains no generated drift or unrelated edits.

## Out of scope

- custom combobox, autocomplete, async option loading, or virtualized menus;
- multi-select or tags input;
- standalone public `Radio` without `RadioGroup`;
- checkbox cards, radio cards, segmented controls, or toggle buttons;
- Textarea auto-grow, markdown editing, rich text, or character counting;
- form validation libraries or schema adapters;
- public generic `Field`, `Form`, `Label`, or `ErrorMessage` components;
- Svelte, React Native, npm publication, Code Connect publication, dark mode, or multiple brands.
