# TDS-Inspired Mobile Workflows v0.4 Design

Date: 2026-07-12

## 1. Goal

Extend the design system with five complete mobile workflow components inspired
by the public Toss Design System Mobile catalog:

1. `Dialog` (`AlertDialog` and `ConfirmDialog` exports)
2. `SearchField`
3. `ListRow`
4. `Toast` (`ToastProvider` and `useToast` exports)
5. `BottomCTA`

Each component is complete only when its React implementation, native
semantics, unit and browser tests, static documentation, generated AI manifest,
Figma component set, live Figma evidence, exact artifact checks, and visual
slice target are present.

TDS Mobile is the product-pattern reference. This repository keeps its own
native-first API, semantic token ownership, accessibility requirements, and
zero-runtime-dependency architecture.

## 2. Approved approach

Three approaches were considered:

1. **Fast feedback primitives first:** SearchField, loading indicators, and
   progress components would be quick, but would leave page actions and modal
   decisions fragmented.
2. **Screen-composition workflows:** Dialog, SearchField, ListRow, Toast, and
   BottomCTA create a complete search/list/action/feedback flow while reusing
   the current Button, TextField, Icon, BottomSheet, and motion foundations.
3. **Full TDS API parity:** this would include legacy compound APIs, arbitrary
   asset slots, Lottie, swipe dismissal, loaders, shine effects, and overlay
   extensions. It is too broad and would conflict with this repository's
   native web contracts.

Approach 2 was recommended and explicitly approved. The user requested
continuous execution without routine confirmation questions, so this written
spec records that approved direction and execution proceeds after self-review.

## 3. Baseline and exact v0.4 totals

The implementation starts from `codex/tds-mobile-core-v0-3` at `fa0ed09`.

| Contract | v0.3 | v0.4 target |
|---|---:|---:|
| Source tokens | 118 | 118 |
| Primitive / semantic tokens | 91 / 27 | unchanged |
| React component records | 15 | 20 |
| Canonical static HTML routes | 25 | 30 |
| Figma collections / Variables | 6 / 116 | unchanged |
| Figma Text / Effect Styles | 8 / 2 | unchanged |
| Managed Figma pages | 22 | 27 |
| Owned Icon components | 5 | 5 |
| Figma component sets | 14 | 19 |
| Manifest / distinct Figma targets | 15 / 20 | 20 / 25 |
| Windows component-slice targets | 30 | 40 |

The five new Figma pages are inserted before `90 Native Differences` in this
order: `04.16 Dialog`, `04.17 SearchField`, `04.18 ListRow`, `04.19 Toast`, and
`04.20 BottomCTA`.

No source token or owned Icon is added. Existing scrim, status, action,
surface, border, focus, elevation, spacing, radius, typography, motion,
Search, Close, Check, Info, and ChevronRight contracts cover this milestone.

## 4. Global constraints

- React 19.2 remains the only implemented component framework.
- No new runtime dependency is added to `@maxxuxx/react` or the docs app.
- Native elements are used for dialog, search input, link, button, and form
  behavior; ARIA never replaces suitable native behavior.
- All visible product values come from the existing semantic design tokens.
- Every interactive target is at least 44 by 44 CSS pixels.
- Components work at 320px, tablet, desktop, 200% text zoom, forced colors,
  reduced motion, keyboard, pointer, and touch.
- Public copy and accessible names are supplied by the consumer. The library
  ships no hidden-language fallback labels.
- Caller classes may extend external layout. Inline styles are filtered through
  the existing safe-layout contract and cannot replace owned geometry, color,
  state, positioning, or motion.
- Arbitrary `dangerouslySetInnerHTML` cannot replace owned children.
- React source, docs metadata, generated JSON, Figma variants, and verifier
  contracts use the canonical order Dialog, SearchField, ListRow, Toast,
  BottomCTA.
- All five components remain `preview`; Svelte and React Native remain
  `planned`; Code Connect remains the recorded skipped milestone.
- Each component document links its official TDS Mobile reference and explains
  deliberate API differences.

## 5. Shared architecture

### 5.1 Modal lifecycle

The second modal consumer justifies a private shared primitive. Move the pure
DOM helpers from `bottom-sheet/dialog.ts` to `internal/modal-dialog.ts` and add
a private modal lifecycle unit used by BottomSheet, AlertDialog, and
ConfirmDialog. It owns:

- SSR-safe portal-container resolution;
- `closed | open | closing` mount phases;
- native `showModal()` and `close()` calls;
- initial focus validation and fallback focus;
- Tab and Shift+Tab containment including positive tabindex, radio groups,
  hidden/inert ancestors, and nested closed `details`;
- previous-focus restoration;
- reference-counted body scroll locking;
- same-pointer backdrop detection;
- Escape cancellation policy;
- token-derived exit duration and immediate reduced-motion close;
- Strict Mode and interrupted-close cleanup.

BottomSheet behavior and public API remain byte-for-byte compatible from a
consumer perspective and all existing BottomSheet tests stay green.

Toast uses a small SSR-safe portal-container helper only. It must not consume
modal focus, inertness, Escape, or scroll-lock behavior.

### 5.2 Vertical slice

Every component follows this path:

```text
React source + CSS + export
  -> unit behavior and axe tests
  -> interactive docs example + MDX contract
  -> generated components.json
  -> browser accessibility, responsive, forced-colors, and motion tests
  -> deterministic in-flow visual specimen
  -> Figma component set with existing Variable bindings
  -> live screenshot/readback evidence
  -> exact artifact and negative guardrail checks
```

## 6. Dialog

References:

- <https://tossmini-docs.toss.im/tds-mobile/components/Dialog/dialog/>
- <https://tossmini-docs.toss.im/tds-mobile/components/Dialog/alert-dialog/>
- <https://tossmini-docs.toss.im/tds-mobile/components/Dialog/confirm-dialog/>

### 6.1 Public API

```ts
export type AlertDialogCloseReason =
  | 'alert-button'
  | 'backdrop'
  | 'escape';

export type ConfirmDialogCloseReason =
  | 'cancel-button'
  | 'confirm-button'
  | 'backdrop'
  | 'escape';

interface DialogCommonProps {
  open: boolean;
  title: string;
  description?: string;
  dismissible?: boolean;
  portalContainer?: HTMLElement | null;
}

export interface AlertDialogProps extends DialogCommonProps {
  alertLabel: string;
  onOpenChange: (
    open: boolean,
    reason: AlertDialogCloseReason,
  ) => void;
}

export interface ConfirmDialogProps extends DialogCommonProps {
  cancelLabel: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onOpenChange: (
    open: boolean,
    reason: ConfirmDialogCloseReason,
  ) => void;
}
```

`dismissible` defaults to `true` and controls only Escape and backdrop. The
owned alert, cancel, and confirm buttons always report their exact reasons.
The owner decides whether and when the controlled `open` value changes and can
perform actions by branching on the reason.

### 6.2 Semantics and presentation

- Both variants portal a native modal `dialog` with stable labelled-by and
  optional described-by relationships.
- AlertDialog uses `role="alertdialog"`; ConfirmDialog keeps native dialog
  semantics.
- AlertDialog initially focuses its acknowledgement button.
- ConfirmDialog initially focuses cancel, the least destructive action.
- AlertDialog renders one owned action. ConfirmDialog renders cancel then
  confirm in DOM and visual order.
- There is no close icon. At least one visible action is always available.
- Long descriptions scroll inside the surface while actions remain visible.
- Reopening during exit cancels stale timers without losing the active modal
  cycle or focus-restoration target.
- A danger confirm tone is excluded until Button owns a system danger variant.

### 6.3 Figma contract

Page `04.16 Dialog`, component set `Dialog`:

```text
Type        = Alert | Confirm
Description = Hidden | Visible
```

This produces 4 variants. Properties are `Title`, `Description`,
`Alert label`, `Cancel label`, `Confirm label` (TEXT) and `Show description`
(BOOLEAN). Button instances are owned Button components with Variable-bound
surface, text, radius, elevation, scrim, spacing, and motion values.

## 7. SearchField

Reference: <https://tossmini-docs.toss.im/tds-mobile/components/search-field/>

### 7.1 Public API

```ts
export interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'children'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'type'
  | 'value'
> {
  label: string;
  clearLabel: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  fixed?: boolean;
  takeSpace?: boolean;
}
```

Defaults are `fixed=false` and `takeSpace=true`. The component supports the
ordinary controlled/uncontrolled string contract; switching modes after mount
is unsupported. `takeSpace` has no effect unless fixed. The forwarded ref points
to the native search input.

### 7.2 Semantics and presentation

- Render native `input type="search"` with a visually hidden associated label.
- Trimmed `label` and `clearLabel` must be non-empty at runtime.
- An owned decorative Search icon is always visible.
- A Close IconButton appears only for a non-empty, enabled, writable value.
- Clear updates the value to an empty string, calls `onValueChange('')`, then
  `onClear()`, and restores input focus. Controlled owners must accept the
  update.
- Suppress the browser's duplicate WebKit search-cancel decoration.
- Disabled and readonly states never expose an actionable clear control.
- Fixed mode reserves the measured rendered height when `takeSpace=true`,
  avoids content jumps, and does not portal.
- Validation, help text, and error states remain TextField responsibilities.

### 7.3 Figma contract

Page `04.17 SearchField`, component set `SearchField`:

```text
Value = Empty | Filled
State = Default | Focus | Disabled | ReadOnly
```

This produces 8 variants. `Placeholder` and `Value` are TEXT properties. Search
and Close are owned instances; the Close visibility follows filled writable
variants. Fixed positioning is documented behavior, not a variant axis.

## 8. ListRow

References:

- <https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/>
- <https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/>

### 8.1 Public API

```ts
type ListRowBaseProps = {
  title: string;
  description?: string;
  left?: ReactNode;
  right?: ReactNode;
  divider?: 'none' | 'indented';
  withArrow?: boolean;
};

type ListRowStaticProps = ListRowBaseProps & {
  href?: never;
  onClick?: never;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onClick'>;

type ListRowButtonProps = ListRowBaseProps & {
  href?: never;
  onClick: MouseEventHandler<HTMLButtonElement>;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClick'
>;

type ListRowAnchorProps = ListRowBaseProps & {
  href: string;
} & Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'children' | 'href'
>;

export type ListRowProps =
  | ListRowStaticProps
  | ListRowButtonProps
  | ListRowAnchorProps;
```

Defaults are `divider="none"`, `withArrow=false`, and `type="button"` for the
button branch. Overloads forward the correct div, button, or anchor ref.

### 8.2 Semantics and presentation

- No href or onClick renders a static div.
- `href` renders a native anchor and is never converted into a fake-disabled
  link.
- `onClick` renders a native button with native Enter, Space, form, and disabled
  behavior.
- The row is at least 56px high and owns left, copy, right, and arrow regions.
- Left content is presentational and wrapped as hidden from assistive
  technology; meaningful copy belongs in title or description.
- Right content stays semantically exposed. An interactive right child is
  allowed only in the static branch.
- Whole-row link and button branches forbid nested interactive descendants.
- The optional ChevronRight is decorative and never rotates.
- Long localized and unbroken copy wraps without page overflow at 320px and
  200% text zoom.
- ListRow is a flat information/action/navigation row. BoardRow remains the
  native details/summary disclosure pattern.
- Asset subcomponents, loaders, shine/blink, and arbitrary padding matrices are
  excluded from v0.4.

### 8.3 Figma contract

Page `04.18 ListRow`, component set `ListRow`:

```text
Divider = None | Indented
State   = Default | Pressed | Disabled
```

This produces 6 variants. Properties are `Title`, `Description`, and `Right`
(TEXT), `Show left`, `Show description`, `Show right`, and `Show arrow`
(BOOLEAN), and `Left icon` (INSTANCE_SWAP). Static/button/link semantics are
documented code behavior because they share visual geometry.

## 9. Toast

References:

- <https://tossmini-docs.toss.im/tds-mobile/components/toast/>
- <https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-toast/>

### 9.1 Public API

```ts
export type ToastPosition = 'top' | 'bottom';
export type ToastTone = 'neutral' | 'success' | 'danger';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastBaseOptions {
  message: string;
  tone?: ToastTone;
  icon?: IconName;
  duration?: number;
}

export type ToastOptions =
  | (ToastBaseOptions & {
      position?: 'bottom';
      action?: ToastAction;
    })
  | (ToastBaseOptions & {
      position: 'top';
      action?: never;
    });

export interface ToastApi {
  show: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export interface ToastProviderProps {
  children: ReactNode;
  portalContainer?: HTMLElement | null;
}

export function ToastProvider(props: ToastProviderProps): ReactNode;
export function useToast(): ToastApi;
```

`tone` defaults to neutral, `position` to bottom, and duration to 3000ms or
5000ms when an action exists. `duration=0` is persistent. `show` returns a
stable ID. One Toast is visible at a time and additional calls form a FIFO
queue. `useToast` throws a descriptive error outside ToastProvider.

### 9.2 Semantics and behavior

- Toast never moves or traps focus and never locks document scrolling.
- Neutral and success messages use a polite atomic status region. Danger uses
  an assertive atomic alert region.
- Owned icons are decorative. Action labels must trim to non-empty strings and
  render a native 44px TextButton.
- Action invocation runs `onPress`, dismisses the current item, and advances
  the queue.
- Timers pause while pointer-hovered, focus is within the Toast, or the document
  is hidden; they resume with remaining time.
- Programmatic dismissal works for visible and queued IDs. `clear` removes all
  queued and visible items without invoking actions.
- Top Toasts cannot contain actions by type or runtime contract.
- Reduced motion removes transforms and completes exit immediately.
- Essential recovery actions must also exist elsewhere or use a persistent
  duration.
- Lottie, swipe dismissal, arbitrary addon nodes, and modal action use are
  excluded.

### 9.3 Figma contract

Page `04.19 Toast`, component set `Toast`:

```text
Tone   = Neutral | Success | Danger
Action = Hidden | Visible
```

This produces 6 variants. Properties are `Message` and `Action label` (TEXT),
`Show icon` (BOOLEAN), and `Icon` (INSTANCE_SWAP). Position and queue state are
documented behaviors rather than visual axes.

## 10. BottomCTA

References:

- <https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/check-first/>
- <https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Single/>
- <https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Double/>
- <https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/fixed-bottom-cta/>

### 10.1 Public API

```ts
export type BottomCTAAction = ReactElement<ButtonProps, typeof Button>;

export interface BottomCTAProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  primaryAction: BottomCTAAction;
  secondaryAction?: BottomCTAAction;
  fixed?: boolean;
  takeSpace?: boolean;
  hasSafeAreaPadding?: boolean;
  background?: 'default' | 'none';
}
```

Defaults are `fixed=false`, `takeSpace=true`, `hasSafeAreaPadding=true`, and
`background="default"`. The forwarded ref points to the outer root.

### 10.2 Semantics and presentation

- One primary action derives Single; secondary plus primary derives Double.
- Only owned Button elements are accepted. Invalid action elements are rejected
  at runtime.
- Owned Buttons are cloned with `size="large"` and `width="full"`. Variant,
  disabled, loading, form attributes, accessible copy, handlers, and refs are
  preserved.
- Double layout uses secondary then primary in DOM, tab, and visual order.
- The root is a neutral div and does not force a landmark or group role.
- Fixed mode stays at its source DOM position and is not portaled. When
  `takeSpace=true`, a measured spacer prevents content obstruction and follows
  dynamic height changes.
- Safe-area padding uses the maximum of the system inset, the public
  `--ds-safe-area-bottom` override, and the existing spacing fallback.
- `background="none"` removes the persistent surface while preserving focus
  and pointer geometry.
- Fixed BottomCTA is not supported inside BottomSheet; consumers use the
  BottomSheet footer slot there.
- Accessories, delayed show, hide-on-scroll, and keyboard-following behavior
  are excluded.

### 10.3 Figma contract

Page `04.20 BottomCTA`, component set `BottomCTA`:

```text
Layout     = Single | Double
Background = Default | None
```

This produces 4 variants. `Primary label` and `Secondary label` are TEXT
properties. Button instances are owned and bound to existing action, spacing,
radius, and typography Variables. Fixed and safe-area behavior are page notes.

## 11. Documentation and artifacts

- Append the five canonical names/slugs to the component schema and navigation.
- Add five MDX documents using the existing complete template and five
  deterministic interactive examples.
- The catalog and generated `components.json` contain exactly 20 ordered
  records.
- The static build contains exactly 30 canonical HTML routes.
- Browser support lists and same-origin navigation checks include all routes.
- Dialog receives axe, initial/trapped/restored focus, Escape/backdrop,
  internal-scroll, forced-colors, reduced-motion, and long-copy coverage.
- SearchField receives axe, label/clear focus, fixed-space, forced-colors,
  320px long-value, and 200% text-zoom coverage.
- ListRow receives axe, native branch, nested-control prohibition,
  forced-colors, 320px unbroken-copy, and 200% text-zoom coverage.
- Toast receives axe, live-region, FIFO queue, timer-pause, action,
  forced-colors, and reduced-motion coverage.
- BottomCTA receives axe, Single/Double tab order, fixed-space, safe-area,
  forced-colors, long-label, 320px reflow, and 200% text-zoom coverage.
- Component-slice visual configuration contains exactly 20 ordered components
  and 40 Windows mobile/desktop targets.
- The verifier records 27 managed Figma pages, 19 component sets, 20 manifest
  component targets, and 25 distinct targets including the five owned Icons.
- `figma/token-map.json` and all token/Variable/style totals remain unchanged.
- Every Figma page receives a reviewed screenshot hash and node ID; all five
  component-set URLs are distinct, same-file, and live-read back.

## 12. Verification and completion gates

Each code slice follows test-first red/green/refactor and receives an independent
spec-compliance and code-quality review before the next slice. Each Figma slice
receives a live screenshot/readback review.

The final gate is:

```bash
pnpm verify
git diff --check fa0ed09...HEAD
git status --short
```

Completion also requires:

- generated artifacts current;
- exact release manifest with non-empty Figma URLs;
- zero primitive product-color leaks;
- zero unreviewed Critical or Important findings;
- independent whole-branch `PASS / APPROVED`;
- clean worktree and committed progress record.

Windows Chromium baselines remain platform-owned. The repository currently has
10 v0.1 images; v0.2, v0.3, and v0.4 require 30 additional reviewed images to
reach the declared 40-target matrix. macOS output is never represented as a
Windows approval.
