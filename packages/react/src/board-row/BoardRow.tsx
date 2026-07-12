import {
  forwardRef,
  type DetailsHTMLAttributes,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';
import { Icon } from '../icon';

export interface BoardRowProps extends Omit<
  DetailsHTMLAttributes<HTMLDetailsElement>,
  'children' | 'onToggle' | 'open' | 'prefix'
> {
  title: string;
  description?: string;
  prefix?: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type BoardRowRuntimeProps = BoardRowProps & {
  onToggle?: DetailsHTMLAttributes<HTMLDetailsElement>['onToggle'];
};

export const BoardRow = forwardRef<HTMLDetailsElement, BoardRowProps>(
  function BoardRow(props, forwardedRef) {
    const {
      children,
      className,
      defaultOpen = false,
      description,
      onOpenChange,
      onToggle: _callerOnToggle,
      open,
      prefix,
      title,
      ...detailsProps
    } = props as BoardRowRuntimeProps;
    const detailsRef = useRef<HTMLDetailsElement | null>(null);
    const controlledOpenRef = useRef(open);
    const previousControlledOpenRef = useRef(open);
    const initialOpenRef = useRef(open ?? defaultOpen);
    const suppressedToggleRef = useRef<boolean | null>(null);
    const userTogglePendingRef = useRef(false);
    controlledOpenRef.current = open;

    const setDetailsRef = useCallback((node: HTMLDetailsElement | null) => {
      detailsRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    }, [forwardedRef]);

    useLayoutEffect(() => {
      const details = detailsRef.current;
      if (!details || open === undefined) return;

      if (previousControlledOpenRef.current !== open) {
        suppressedToggleRef.current = open;
      }
      previousControlledOpenRef.current = open;

      if (details.open !== open) {
        suppressedToggleRef.current = open;
        details.open = open;
      }
    }, [open]);

    function handleToggle(event: SyntheticEvent<HTMLDetailsElement>) {
      const nextOpen = event.currentTarget.open;
      const userInitiated = userTogglePendingRef.current;
      userTogglePendingRef.current = false;

      if (!userInitiated) {
        if (suppressedToggleRef.current === nextOpen) {
          suppressedToggleRef.current = null;
        }
        return;
      }

      if (suppressedToggleRef.current !== null) {
        suppressedToggleRef.current = null;
      }

      onOpenChange?.(nextOpen);

      if (controlledOpenRef.current !== undefined) {
        const details = event.currentTarget;
        queueMicrotask(() => {
          const expectedOpen = controlledOpenRef.current;
          if (
            detailsRef.current === details
            && details.isConnected
            && expectedOpen !== undefined
            && details.open !== expectedOpen
          ) {
            suppressedToggleRef.current = expectedOpen;
            details.open = expectedOpen;
          }
        });
      }
    }

    const classes = ['ds-board-row', className].filter(Boolean).join(' ');

    return (
      <details
        {...detailsProps}
        ref={setDetailsRef}
        className={classes}
        dangerouslySetInnerHTML={undefined}
        open={open ?? initialOpenRef.current}
        onToggle={handleToggle}
      >
        <summary
          className="ds-board-row__summary"
          onClick={() => {
            userTogglePendingRef.current = true;
          }}
        >
          {prefix !== undefined && prefix !== null ? (
            <span aria-hidden="true" className="ds-board-row__prefix">
              {prefix}
            </span>
          ) : null}
          <span className="ds-board-row__copy">
            <span className="ds-board-row__title">{title}</span>
            {description !== undefined ? (
              <span className="ds-board-row__description">{description}</span>
            ) : null}
          </span>
          <span aria-hidden="true" className="ds-board-row__arrow">
            <Icon name="chevron-right" size={20} />
          </span>
        </summary>
        <div className="ds-board-row__content">{children}</div>
      </details>
    );
  },
);
