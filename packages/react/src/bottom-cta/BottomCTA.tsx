import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type Ref,
  type RefAttributes,
} from 'react';

import { Button, type ButtonProps } from '../button';
import { getSafeLayoutStyle } from '../internal/safe-layout-style';

export type BottomCTAAction = ReactElement<ButtonProps, typeof Button>;
export type BottomCTABackground = 'default' | 'none';

export interface BottomCTAProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  primaryAction: BottomCTAAction;
  secondaryAction?: BottomCTAAction;
  fixed?: boolean;
  takeSpace?: boolean;
  hasSafeAreaPadding?: boolean;
  background?: BottomCTABackground;
}

type ButtonPropsWithRef = ButtonProps & RefAttributes<HTMLButtonElement>;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): Ref<T> | undefined {
  const assignedRefs = refs.filter((ref) => ref !== undefined);
  if (assignedRefs.length === 0) return undefined;
  return (value) => {
    for (const ref of assignedRefs) assignRef(ref, value);
  };
}

function getOwnedAction(
  action: BottomCTAAction,
  name: 'primaryAction' | 'secondaryAction',
): BottomCTAAction {
  if (!isValidElement<ButtonProps>(action) || action.type !== Button) {
    throw new Error(`BottomCTA ${name} must be a Button element.`);
  }
  return action as BottomCTAAction;
}

function cloneOwnedAction(action: BottomCTAAction): BottomCTAAction {
  const props = action.props as ButtonPropsWithRef;
  return cloneElement(action, {
    ref: mergeRefs(props.ref),
    size: 'large',
    width: 'full',
  } as Partial<ButtonPropsWithRef>) as BottomCTAAction;
}

export const BottomCTA = forwardRef<HTMLDivElement, BottomCTAProps>(
  function BottomCTA(
    {
      background = 'default',
      className,
      dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
      fixed = false,
      hasSafeAreaPadding = true,
      primaryAction,
      secondaryAction,
      style,
      takeSpace = true,
      ...rootProps
    },
    ref,
  ) {
    const ownedPrimaryAction = getOwnedAction(primaryAction, 'primaryAction');
    const ownedSecondaryAction = secondaryAction === undefined
      ? null
      : getOwnedAction(secondaryAction, 'secondaryAction');
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [spacerHeight, setSpacerHeight] = useState<number>();
    const reservesSpace = fixed && takeSpace;
    const classes = ['ds-bottom-cta', className].filter(Boolean).join(' ');

    useEffect(() => {
      const panel = panelRef.current;
      if (!reservesSpace || !panel) {
        setSpacerHeight(undefined);
        return;
      }

      const synchronizeHeight = () => {
        const nextHeight = panel.getBoundingClientRect().height;
        setSpacerHeight(nextHeight > 0 ? nextHeight : undefined);
      };

      synchronizeHeight();
      if (typeof ResizeObserver === 'undefined') return;

      const observer = new ResizeObserver(synchronizeHeight);
      observer.observe(panel);
      return () => observer.disconnect();
    }, [reservesSpace]);

    return (
      <div
        {...rootProps}
        ref={ref}
        className={classes}
        data-background={background}
        data-fixed={fixed}
        data-layout={ownedSecondaryAction ? 'double' : 'single'}
        data-safe-area={hasSafeAreaPadding}
        data-take-space={reservesSpace}
        style={getSafeLayoutStyle(style)}
      >
        {reservesSpace ? (
          <div
            aria-hidden="true"
            className="ds-bottom-cta__spacer"
            style={spacerHeight === undefined
              ? undefined
              : { blockSize: `${spacerHeight}px` }}
          />
        ) : null}
        <div className="ds-bottom-cta__panel" ref={panelRef}>
          <div className="ds-bottom-cta__actions">
            {ownedSecondaryAction ? cloneOwnedAction(ownedSecondaryAction) : null}
            {cloneOwnedAction(ownedPrimaryAction)}
          </div>
        </div>
      </div>
    );
  },
);
