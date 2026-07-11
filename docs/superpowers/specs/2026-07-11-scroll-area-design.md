# ScrollArea Design

## Goal

Add a vertical `ScrollArea` to the public design system. It keeps native wheel, trackpad, touch, and keyboard scrolling, hides the browser's visual scrollbar, and exposes fixed top/bottom navigation buttons with matching blur cues only when content exists in that direction.

## Selected approach

Use a native `overflow-y: auto` viewport inside a non-scrolling wrapper. The viewport owns content scrolling and accessibility; two absolutely positioned edge layers remain fixed above it.

This was selected over:

- transform-based custom scrolling, which would reimplement native input, focus, and accessibility;
- CSS scroll snap, which requires sectioned content and is not a general-purpose content container.

## Public React API

```ts
export type ScrollAreaState = 'no-overflow' | 'start' | 'middle' | 'end';

export interface ScrollAreaProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onScroll'
> {
  children: ReactNode;
  label: string;
  scrollUpLabel: string;
  scrollDownLabel: string;
  viewportRef?: Ref<HTMLDivElement>;
  onViewportScroll?: UIEventHandler<HTMLDivElement>;
}
```

`ScrollArea` forwards its `HTMLDivElement` ref and remaining native props to the outer root. `className`, `style`, and `id` therefore size the same box that positions the blur and navigation overlays. `viewportRef` addresses the actual scrolling element for imperative `scrollTo`/`scrollBy`, and `onViewportScroll` observes its native scroll events. The component owns the viewport's `role="region"`, `aria-label`, and keyboard focusability so the hidden scrollbar never removes native access.

Button labels are required instead of assuming a product language. There is no size, height, step, or horizontal-axis prop in v0.1. Consumers constrain viewport height through `className` or `style`.

## Runtime states

Use a one-pixel epsilon to tolerate fractional browser geometry.

| State | Condition | Up button / blur | Down button / blur |
|---|---|---|---|
| `no-overflow` | neither direction has travel | disabled / off | disabled / off |
| `start` | only downward travel exists | disabled / off | enabled / on |
| `middle` | both directions have travel | enabled / on | enabled / on |
| `end` | only upward travel exists | enabled / on | disabled / off |

The wrapper and viewport expose the owned state with `data-state`. Each edge exposes `data-active`. Inactive buttons remain native `disabled`, are visually transparent, and are hidden from the accessibility tree so invisible controls are not announced.

## Behavior

- Compute `canScrollUp` from `scrollTop > 1`.
- Compute `canScrollDown` from `scrollHeight - clientHeight - scrollTop > 1`.
- Recompute after mount, on every native `scroll` event, and when `ResizeObserver` reports a size change for either viewport or content wrapper.
- Preserve and invoke `onViewportScroll` after the owned state has been synchronized.
- Scroll buttons call `viewport.scrollBy()` by 80% of the current viewport height in the requested direction. CSS provides smooth behavior; `prefers-reduced-motion: reduce` changes it to immediate movement.
- Keep native `overflow-y: auto`; never replace it with `overflow: hidden` or transform-based movement.
- Hide only the visual scrollbar with Firefox, legacy Microsoft, and WebKit scrollbar rules.

## Structure and visuals

```text
root (relative, forwarded ref/props, sizing box)
├─ viewport (native scrolling region, viewportRef/onViewportScroll target)
│  └─ content observer wrapper
├─ top edge (absolute, pointer-events none)
│  └─ up button (pointer-events auto when enabled)
└─ bottom edge (absolute, pointer-events none)
   └─ down button (pointer-events auto when enabled)
```

Enabled edge layers use a surface-to-transparent gradient and `backdrop-filter: blur(var(--ds-blur-subtle))`. Disabled edges set the blur to `none` and remove the gradient opacity. Buttons use the existing 44px control size and `Icon` `chevron-right`, rotated up or down. Edge layers never intercept wheel or touch gestures outside the button itself.

## Tokens

Add one primitive dimension token:

| Token | CSS variable | Value | Figma collection | Scope |
|---|---|---:|---|---|
| `blur/subtle` | `--ds-blur-subtle` | `8px` | Primitives | hidden (`[]`) |

Reuse existing surface, action, icon, border, focus, spacing, control-size, and radius tokens. No new icon, semantic color, text style, or effect style is required. In Figma, bind the background-blur radius directly to the new FLOAT variable.

## Accessibility

- The viewport is a named `region` and becomes keyboard-focusable when it can scroll; it uses `tabIndex=-1` when no overflow exists.
- The viewport uses `scroll-padding-block` equal to the edge control zone so focused descendants are not positioned beneath an active overlay.
- Both navigation controls are native `button type="button"` elements with required localized names and `aria-controls` pointing at the viewport ID.
- Navigation icons are decorative.
- The 44px targets meet the minimum touch target used by the system.
- Focus-visible and forced-colors treatments reuse the system focus ring.
- Reduced motion removes transitions and smooth scrolling.
- Native wheel, touch, trackpad, Page Up/Down, Home/End, and arrow-key behavior remains browser-owned.

## Figma library representation

Create page `04.5 ScrollArea` before `90 Native Differences`. Add a `ScrollArea` component set with one `State` variant axis and four values: `No overflow`, `Start`, `Middle`, and `End`. The set has four 320×240 examples, uses the existing `Icon/ChevronRight` component instances, and defines no TEXT, BOOLEAN, or INSTANCE_SWAP component properties because runtime content and accessible labels cannot be represented faithfully as a static Figma slot in this v0.1 library.

The page documents:

- hidden native scrollbar with preserved native input;
- 80% viewport button movement;
- active-direction-only blur and navigation;
- no visual or interactive chrome when travel is unavailable.

Update the `04 Components` overview so Icon, Badge, Button, TextField, and ScrollArea are all visible.

## Documentation and machine-readable artifacts

Add the ScrollArea MDX page, interactive demo, navigation entry, static route, and generated component manifest entry. Extend exact component, route, Figma-page, target-URL, and visual-baseline guardrails from four to five components. The canonical component order is `Icon`, `Badge`, `Button`, `TextField`, `ScrollArea`.

## Verification

React unit tests must cover all four states, fractional and bounce geometry, observer updates, `onViewportScroll`, both button directions and step size, root and viewport refs, root/native prop ownership, owned accessibility attributes, cleanup, and axe.

Browser tests must prove:

- wheel scrolling still changes `scrollTop` while the computed scrollbar is hidden;
- button scrolling works in both directions;
- state, disabled buttons, and blur cues agree at start, middle, end, and no overflow;
- navigation targets are at least 44px and keyboard focus remains visible;
- the demo has no axe violations.

Finally run token generation, unit tests, docs build, artifact checks, cross-browser visual baselines, live Figma structural/binding/property audits, page screenshots, and permanent Ubuntu/Windows CI.

## Out of scope

- horizontal or bidirectional scrolling;
- virtualized lists;
- configurable button placement or scroll step;
- product-specific content slots in Figma;
- custom inertial physics.
