# TDS-Inspired Mobile Core v0.3 Design

Date: 2026-07-12

## 1. Goal

Extend the current design system with five complete vertical slices inspired by
the public Toss Design System Mobile catalog:

1. `TextButton`
2. `IconButton`
3. `BoardRow`
4. `Tab`
5. `BottomSheet`

TDS Mobile provides the product-pattern reference. This project does not copy
its implementation or public API. Each component follows this repository's
native-first React contracts, semantic tokens, accessibility rules, static
documentation structure, Figma variable bindings, and exact artifact checks.

## 2. Approved approach

Three approaches were considered:

1. **API and visual parity with TDS Mobile.** This would make comparison easy,
   but would import a broad mobile-product API, arbitrary color and spacing
   escape hatches, and behavior that does not match this repository's web and
   accessibility constraints.
2. **TDS-inspired vertical slices using this system's contracts.** This keeps
   the recognizable product patterns while preserving owned tokens, native
   elements, zero runtime dependencies, and exact documentation/Figma parity.
3. **Headless interaction primitives before visible components.** This would
   maximize future reuse, but would delay the five reviewable components the
   design and development teams want to discuss.

Approach 2 is selected. Internal helpers are introduced only where a selected
component needs them. They remain private until a second public consumer proves
that a generic primitive is warranted.

## 3. Current baseline

The implementation starts from `codex/form-controls-v0-2` at `9281837`.
The inherited contract contains:

- 113 source tokens: 87 primitive and 26 semantic;
- 10 React components and 18 static HTML routes;
- 5 Figma collections, 111 Variables, 8 Text Styles, 2 Effect Styles,
  17 managed pages, 5 owned Icon components, and 9 component sets;
- exact AI component manifests, Figma evidence, generated-artifact checks,
  real-browser accessibility checks, and platform-owned visual comparisons.

The five new components remain `preview`. React is `preview`; Svelte and React
Native remain `planned`.

## 4. Global constraints

- React 19.2 is the only implemented component framework.
- No new runtime dependency is added to `@maxxuxx/react`.
- Native HTML behavior is preferred over recreated ARIA behavior whenever a
  suitable native element exists.
- Public product colors, spacing, dimensions, radius, typography, elevation,
  and motion values come from design tokens.
- Every interactive target is at least 44 by 44 CSS pixels.
- Every component works with keyboard, pointer, touch, forced colors, reduced
  motion, 320px mobile content, tablet, and desktop layouts.
- Caller classes may extend layout, but caller inline styles cannot replace
  component-owned geometry or state presentation.
- Public copy and accessible names are localizable. The library does not ship
  hidden Korean or English labels.
- TDS Mobile is linked as a design reference in each new component document.
- Code Connect remains outside this milestone and keeps the existing explicit
  skipped evidence state.

## 5. Architecture

Each component is delivered as the same vertical slice:

```text
source tokens
  -> generated CSS and JSON
  -> React component, CSS, exports, and unit/axe tests
  -> interactive docs example and MDX contract
  -> generated components.json
  -> browser behavior, accessibility, responsive, and visual tests
  -> Figma component set with bound Variables
  -> live readback in figma/verification.json
  -> exact artifact and negative guardrail tests
```

The implementation order is dependency driven:

```text
motion and scrim foundations
  -> TextButton
  -> IconButton
  -> BoardRow
  -> Tab
  -> BottomSheet
  -> aggregate artifact and browser verification
```

`TextButton` and `IconButton` reuse `Icon` and the existing action tokens.
`BoardRow` reuses `Icon/ChevronRight`. `BottomSheet` reuses `Icon/Close`,
`Button`, the new motion tokens, and the new scrim token.

## 6. Foundation additions

### 6.1 Source tokens

Add five source tokens, raising the total from 113 to 118:

| Token | Type | Value or alias | Purpose |
|---|---|---|---|
| `color/neutral/900-alpha-56` | color primitive | `rgba(15, 23, 42, 0.56)` | modal scrim source |
| `motion/duration/fast` | duration primitive | `120ms` | direct interaction transitions |
| `motion/duration/medium` | duration primitive | `200ms` | sheet enter and exit |
| `motion/easing/standard` | cubic-bezier primitive | `cubic-bezier(0.2, 0, 0, 1)` | standard movement curve |
| `color/bg/scrim` | color semantic | `{color/neutral/900-alpha-56}` | modal backdrop |

Token validation and generation gain explicit `duration` and `cubicBezier`
types. They emit ordinary CSS custom properties and resolved JSON values.
Duration values accept positive integer milliseconds only. Cubic-bezier values
must contain four finite values; x coordinates must be within zero and one.

### 6.2 Figma projection

Add a sixth `Motion` collection. It contains two FLOAT Variables whose live
values are `120` and `200`, and one STRING Variable whose live value is the
standard cubic-bezier expression. WEB syntax points to the matching generated
CSS variables. Add the scrim primitive and semantic color Variables to the
existing color collections.

The existing `03 Foundations` page gains reviewed motion duration, easing,
scrim, and reduced-motion guidance. No additional Figma page is created for the
foundation update.

### 6.3 Motion policy

- Color, opacity, border, and small transform feedback uses `fast`.
- BottomSheet enter and exit uses `medium` and `standard` easing.
- `prefers-reduced-motion: reduce` removes non-essential transforms and makes
  close completion immediate.
- Motion never delays focus placement, Escape handling, or accessible state.

## 7. TextButton

Reference: <https://tossmini-docs.toss.im/tds-mobile/components/text-button/>

### 7.1 Public API

```ts
export type TextButtonSize = 'small' | 'medium' | 'large';
export type TextButtonVariant = 'clear' | 'underline' | 'arrow';
export type TextButtonTone = 'primary' | 'neutral';

type TextButtonBaseProps = {
  children: string;
  size?: TextButtonSize;
  variant?: TextButtonVariant;
  tone?: TextButtonTone;
};

export type TextButtonProps = TextButtonBaseProps & (
  | ({ href: string } & Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      'children' | 'href'
    >)
  | ({ href?: undefined } & Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      'children'
    >)
);
```

Defaults are `size="medium"`, `variant="clear"`, and `tone="primary"`.
When `href` is present the component renders a native anchor and forwards its
ref. Otherwise it renders a native button, defaults `type` to `button`, and
forwards its ref. Disabled behavior is available only on the button branch;
an anchor is never made into a fake disabled control.

### 7.2 Visual and behavior contract

- `clear` has no persistent decoration.
- `underline` keeps a visible underline rather than revealing meaning only on
  hover.
- `arrow` owns a decorative trailing `Icon/ChevronRight` and does not accept an
  arbitrary icon slot.
- Small, medium, and large use caption, body-small, and body typography while
  preserving a 44px minimum pointer target.
- Primary and neutral tones map only to semantic action/text tokens.
- Focus, hover, pressed, visited anchor, and disabled button states remain
  distinguishable in normal and forced colors.

### 7.3 Figma contract

Create page `04.11 TextButton` and a `TextButton` component set:

```text
Size    = Small | Medium | Large
Variant = Clear | Underline | Arrow
State   = Default | Pressed | Disabled
```

This produces 27 variants. `Label` is a TEXT property. Arrow variants use the
owned ChevronRight component instance. The page documents that anchor visited
state is browser content state and is not a variant axis.

## 8. IconButton

Reference: <https://tossmini-docs.toss.im/tds-mobile/components/icon-button/>

### 8.1 Public API

```ts
export type IconButtonSize = 'small' | 'medium' | 'large';
export type IconButtonVariant = 'clear' | 'fill' | 'outline';

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children'
> {
  label: string;
  name: IconName;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}
```

Defaults are `size="medium"`, `variant="clear"`, and native
`type="button"`. `label` is trimmed and must remain non-empty at runtime. It is
owned as the button's `aria-label`. Arbitrary URL icons, arbitrary children,
caller-owned inline icon geometry, and icon-only controls without an accessible
name are rejected by the public contract.

### 8.2 Visual and behavior contract

- Button boxes are 44, 48, and 56px. Icon sizes are 20, 24, and 24px.
- `clear`, `fill`, and `outline` use the same action hierarchy as Button.
- Hover, pressed, focus-visible, disabled, forced-colors, and reduced-motion
  behavior matches the existing Button state precedence.
- The Icon is decorative because the button owns the accessible name.

### 8.3 Figma contract

Create page `04.12 IconButton` and an `IconButton` component set:

```text
Size    = Small | Medium | Large
Variant = Clear | Fill | Outline
State   = Default | Pressed | Disabled
```

This produces 27 variants. `Icon` is an INSTANCE_SWAP property limited to the
five owned Icon components. The default instance is Close. Every variant has a
44px or larger frame.

## 9. BoardRow

Reference: <https://tossmini-docs.toss.im/tds-mobile/components/board-row/>

### 9.1 Public API

```ts
export interface BoardRowProps extends Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  'children' | 'onToggle' | 'open'
> {
  title: string;
  description?: string;
  prefix?: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

`BoardRow` renders a native `details` with a native `summary`. It supports
controlled `open` and uncontrolled `defaultOpen`, never both as independent
sources of truth. `onOpenChange` receives the final native state. `prefix` is
presentational content; nested buttons, anchors, form controls, or other
interactive descendants are forbidden in the summary contract.

### 9.2 Visual and behavior contract

- The summary row has a 56px minimum height and full-width pointer target.
- Title, optional description, optional prefix, and owned ChevronRight arrow
  remain readable under long unbroken content and text zoom.
- The arrow rotates when open; reduced motion removes rotation animation.
- Native Enter, Space, click, and disclosure semantics are preserved.
- Content has an owned border and spacing relationship to the header without
  animating an unknown content height.

### 9.3 Figma contract

Create page `04.13 BoardRow` and a `BoardRow` component set:

```text
Value = Closed | Open
State = Default | Pressed
```

This produces 4 variants. `Title`, `Description`, and `Prefix` are TEXT
properties. `Show description` and `Show prefix` are BOOLEAN properties. The
open variants show a representative content region and a rotated owned
ChevronRight instance.

## 10. Tab

Reference: <https://tossmini-docs.toss.im/tds-mobile/components/tab/>

### 10.1 Public API

```ts
export type TabSize = 'small' | 'large';
export type TabLayout = 'equal' | 'scroll';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange'
> {
  ariaLabel: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: TabSize;
  layout?: TabLayout;
}
```

Defaults are `size="large"`, `layout="equal"`, and the first enabled item.
Values must be non-empty and unique. At least one enabled item is required.
Controlled and uncontrolled use follows the existing RadioGroup conventions.

### 10.2 Accessibility and keyboard contract

- The root renders a named `tablist`, native buttons with `role="tab"`, and
  associated `tabpanel` elements.
- Stable IDs connect each tab and panel through `aria-controls` and
  `aria-labelledby`.
- Left and Right Arrow wrap through enabled tabs and automatically select the
  focused tab. Home and End select the first and last enabled tabs.
- Disabled tabs are skipped and cannot be activated by pointer or keyboard.
- Only the active tab has `tabIndex=0`; inactive tabs have `tabIndex=-1`.
- Only the selected panel is displayed. Panel focus is not forced when the tab
  changes.

### 10.3 Layout contract

- `equal` distributes two through four tabs evenly. More than four items is a
  documented misuse.
- `scroll` uses content width, native horizontal scrolling, and visible edge
  affordance without custom drag behavior.
- Small and large heights are 44 and 52px.
- The selected indicator remains visible in forced colors and at text zoom.

### 10.4 Figma contract

Create page `04.14 Tab` and a `Tab` component set:

```text
Size      = Small | Large
Layout    = Equal | Scroll
Selection = First | Second | Third
```

This produces 12 variants. `First label`, `Second label`, and `Third label` are
TEXT properties. The component shows a three-item specimen; the documentation
page separately shows disabled and overflow behavior.

## 11. BottomSheet

Reference: <https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/>

### 11.1 Public API

```ts
export type BottomSheetCloseReason =
  | 'backdrop'
  | 'close-button'
  | 'escape';

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (
    open: boolean,
    reason: BottomSheetCloseReason,
  ) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
  dismissible?: boolean;
  portalContainer?: HTMLElement | null;
  initialFocusRef?: RefObject<HTMLElement | null>;
}
```

`dismissible` defaults to `true`. It controls backdrop and Escape dismissal.
The owned close button remains available in every sheet so the modal never
creates an inaccessible dead end. `portalContainer` defaults to
`document.body` after hydration. The component is SSR-safe and renders no
portal until a DOM container exists.

### 11.2 Modal behavior

- A native `dialog` is rendered through `createPortal` and opened with
  `showModal()`.
- Internal stable IDs own `aria-labelledby` and optional `aria-describedby`.
- The active element before opening is captured. Focus moves to
  `initialFocusRef` when valid, otherwise to the owned close button. Focus is
  restored after close when the original element is still connected.
- Native modal inertness and focus containment are preserved.
- Escape emits `onOpenChange(false, 'escape')` when dismissible. Otherwise the
  cancel event is prevented.
- A pointer release on the dialog backdrop emits
  `onOpenChange(false, 'backdrop')` only when the pointer started and ended on
  the backdrop itself.
- The close button emits `onOpenChange(false, 'close-button')`.
- The previous inline `document.body.style.overflow` value is saved, body
  scrolling is locked while open, and the exact prior value is restored after
  exit or unmount.
- Repeated open/close requests, Strict Mode effects, portal-container changes,
  and component unmount do not leak timers, scroll locks, or focus state.

### 11.3 Visual and motion contract

- The scrim uses `color/bg/scrim`.
- The surface is bottom aligned, full width on mobile, and capped at 640px on
  wider screens. Its maximum height is `calc(100dvh - 24px)`.
- Top corners use `radius/xl`; the surface uses `elevation/2`.
- Header, optional description, scrollable body, and optional footer remain
  separate layout regions. The footer stays visible while body content scrolls.
- Enter and exit use the medium duration and standard easing tokens. Reduced
  motion makes completion immediate and removes the translate transform.
- Closing state remains mounted until exit completes, then calls native
  `close()` and restores scroll/focus.

### 11.4 Deliberate v0.3 exclusions

Drag-to-dismiss, snap points, dynamic full-screen expansion, nested sheets,
keyboard-height measurement, unsafe focus-lock opt-outs, and bundled selection
subcomponents are not part of this contract. They require separate product and
input-method evidence.

### 11.5 Figma contract

Create page `04.15 BottomSheet` and a `BottomSheet` component set:

```text
Height = Content | Full
Footer = Hidden | Visible
```

This produces 4 open-state variants. `Title` and `Description` are TEXT
properties. `Show description` is a BOOLEAN property. Footer variants use an
owned Button instance and every variant uses an owned Close instance. Scrim,
surface, typography, spacing, radius, elevation, and dimensions are bound to
Variables or Styles. Closed state is documented as behavior rather than an
invisible library variant.

## 12. Documentation site

Add five component pages, one Motion foundation route, and one component
catalog route. Static HTML routes increase from 18 to 25. Component manifest
entries increase from 10 to 15 in this exact order:

```text
Icon
Badge
Button
TextField
ScrollArea
Checkbox
RadioGroup
Switch
Textarea
Select
TextButton
IconButton
BoardRow
Tab
BottomSheet
```

Each new MDX page includes:

- interactive example;
- when to use and when not to use;
- anatomy;
- sizes, variants, states, and responsive behavior;
- accessibility and keyboard behavior;
- React example and exact public API table;
- token list;
- Figma component-set link and variant formula;
- framework support table;
- the relevant TDS Mobile reference link.

The homepage and navigation are updated from `v0.1 · Local preview` to the v0.3
preview and expose a real `/components/` catalog rather than linking directly
to Button. The catalog provides searchable-by-browser text cards for all 15
components without adding client-side search infrastructure.

## 13. Figma totals and evidence

After the five component pages are created, exact live totals become:

- 6 collections;
- 116 Variables;
- 8 Text Styles;
- 2 Effect Styles;
- 22 managed pages;
- 5 owned Icon components;
- 14 component sets.

The five new page names are appended before the native-differences page:

```text
04.11 TextButton
04.12 IconButton
04.13 BoardRow
04.14 Tab
04.15 BottomSheet
```

Live readback records exact component URLs, master IDs, variant counts, ordered
axis values, component-property definitions, token bindings, hard-coded product
value audits, screenshot node IDs, and unique SHA-256 screenshot digests.
All existing component and page evidence remains valid.

## 14. Testing

### 14.1 Tokens

- reject malformed duration and cubic-bezier values;
- generate stable CSS and resolved JSON for all 118 tokens;
- reject stale generated files;
- verify the scrim alias and Motion collection projection.

### 14.2 React unit and accessibility tests

`TextButton` tests native button/anchor selection, forwarded refs and props,
owned arrow geometry, default button type, disabled behavior, axe, and long
labels.

`IconButton` tests required non-empty label, decorative owned Icon, all names,
size/variant state attributes, native disabled/form behavior, ref forwarding,
and axe.

`BoardRow` tests native details/summary semantics, Enter/Space/click toggle,
controlled and uncontrolled state, `onOpenChange`, prefix/description/content,
long copy, and axe.

`Tab` tests value validation, controlled and uncontrolled selection, duplicate
and disabled values, Arrow/Home/End wrap behavior, roving tab index, stable
tab/panel relationships, pointer activation, ref-safe re-render, and axe.

`BottomSheet` tests SSR-safe portal creation, showModal/close lifecycle, all
three close reasons, nondismissible Escape/backdrop, initial focus, focus
restore, body scroll restoration, Strict Mode cleanup, reduced motion, unmount,
stable ARIA relationships, and axe while open.

### 14.3 Browser tests

Across mobile, tablet, and desktop Chromium:

- all five routes render with zero console errors and zero automatic axe
  violations;
- keyboard and pointer interactions match the unit contracts;
- focus is visible in forced colors;
- mobile demos use a single column without horizontal overflow;
- desktop specimens use documented multi-column layouts where applicable;
- long unbroken Latin copy remains inside every component and page;
- BottomSheet traps focus, closes by Escape/backdrop/close button, restores
  focus and body scrolling, and remains within the viewport;
- reduced motion removes the sheet transition delay.

Windows Chromium owns two reviewed component-slice baselines per component:
mobile and desktop. This adds 10 new PNGs. They must be generated and visually
approved on Windows; macOS output cannot approve that platform gate.

## 15. Artifact guardrails

Exact verification changes from the v0.2 counts to the v0.3 counts and rejects:

- any missing, extra, reordered, or malformed one of 118 tokens;
- any missing, extra, reordered, or contract-drifted one of 15 components;
- any missing or extra one of 25 static HTML routes;
- stale components JSON or tokens JSON;
- missing or duplicate Figma component/page URLs;
- incorrect Variable, Style, page, Icon, component-set, variant, axis, property,
  binding, or screenshot totals;
- primitive colors in product CSS;
- public package dependency or workspace-policy drift outside the selected
  scope.

Negative tests mutate every new token, component manifest record, route, Figma
record, variant axis, and property contract so the verifier proves each exact
requirement is enforced.

## 16. Completion gate

A component is complete only when all of these are true:

1. React focused tests and package type check pass.
2. MDX, demo, manifest, static route, and AI JSON are current.
3. Real-browser behavior, accessibility, forced-colors, responsive, long-copy,
   and reduced-motion assertions pass.
4. Figma component set, Variables, properties, bindings, and page screenshot are
   created and independently read back.
5. Artifact and negative guardrail tests enforce the exact contract.
6. The component's changed files contain no unrelated edits or generated drift.

After all five slices, root `pnpm verify` must pass on the current platform.
Windows component-slice baseline approval remains a separate platform-owned
release gate until its 10 PNGs are generated, reviewed, committed, and compared
on Windows.

## 17. Out of scope

- copying TDS source code, package names, or arbitrary token escape hatches;
- new public generic Portal, FocusScope, DismissableLayer, Motion, Text, or Field
  components;
- TextButton loading state or arbitrary icon slots;
- IconButton remote image URLs or caller-provided children;
- BoardRow nested interactive summary content or animated auto-height;
- Tab routing integration, vertical orientation, notification dots, or manual
  activation mode;
- BottomSheet drag gestures, snap points, nested sheets, device keyboard-height
  APIs, or unsafe accessibility opt-outs;
- Svelte, React Native, npm publication, docs hosting, Code Connect, dark mode,
  or multiple brands.
