import {
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  type UIEventHandler,
} from 'react';
import { flushSync } from 'react-dom';
import { Icon } from '../icon';

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

const SCROLL_EPSILON = 1;
const SCROLL_STEP_RATIO = 0.8;

function getScrollState(viewport: HTMLDivElement): ScrollAreaState {
  const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
  const scrollTop = Math.min(Math.max(viewport.scrollTop, 0), maxScrollTop);
  const canScrollUp = scrollTop > SCROLL_EPSILON;
  const canScrollDown = maxScrollTop - scrollTop > SCROLL_EPSILON;

  if (canScrollUp && canScrollDown) {
    return 'middle';
  }

  if (canScrollUp) {
    return 'end';
  }

  if (canScrollDown) {
    return 'start';
  }

  return 'no-overflow';
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    {
      children,
      className,
      label,
      onViewportScroll,
      scrollDownLabel,
      scrollUpLabel,
      viewportRef,
      ...rootProps
    },
    ref,
  ) {
    const generatedId = useId();
    const viewportId = `ds-scroll-area-viewport-${generatedId}`;
    const internalViewportRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<ScrollAreaState>('no-overflow');
    const classes = ['ds-scroll-area', className].filter(Boolean).join(' ');
    const canScrollUp = state === 'middle' || state === 'end';
    const canScrollDown = state === 'start' || state === 'middle';

    const setViewportRef = useCallback((node: HTMLDivElement | null) => {
      internalViewportRef.current = node;
      assignRef(viewportRef, node);
    }, [viewportRef]);

    const synchronizeState = useCallback(() => {
      const viewport = internalViewportRef.current;
      if (viewport) {
        setState(getScrollState(viewport));
      }
    }, []);

    useLayoutEffect(() => {
      const viewport = internalViewportRef.current;
      const content = contentRef.current;
      if (!viewport || !content) {
        return;
      }

      synchronizeState();

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver(synchronizeState);
      observer.observe(viewport);
      observer.observe(content);

      return () => observer.disconnect();
    }, [synchronizeState]);

    const handleViewportScroll: UIEventHandler<HTMLDivElement> = useCallback((event) => {
      flushSync(synchronizeState);
      onViewportScroll?.(event);
    }, [onViewportScroll, synchronizeState]);

    const scrollBy = useCallback((direction: -1 | 1) => {
      const viewport = internalViewportRef.current;
      if (!viewport) {
        return;
      }

      viewport.scrollBy({
        top: viewport.clientHeight * SCROLL_STEP_RATIO * direction,
      });
    }, []);

    return (
      <div
        {...rootProps}
        ref={ref}
        className={classes}
        data-state={state}
      >
        <div
          ref={setViewportRef}
          aria-label={label}
          className="ds-scroll-area__viewport"
          data-state={state}
          id={viewportId}
          onScroll={handleViewportScroll}
          role="region"
          tabIndex={state === 'no-overflow' ? -1 : 0}
        >
          <div className="ds-scroll-area__content" ref={contentRef}>
            {children}
          </div>
        </div>
        <div
          className="ds-scroll-area__edge ds-scroll-area__edge--top"
          data-active={canScrollUp}
        >
          <button
            aria-controls={viewportId}
            aria-hidden={!canScrollUp}
            aria-label={scrollUpLabel}
            className="ds-scroll-area__button ds-scroll-area__button--up"
            disabled={!canScrollUp}
            onClick={() => scrollBy(-1)}
            type="button"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>
        <div
          className="ds-scroll-area__edge ds-scroll-area__edge--bottom"
          data-active={canScrollDown}
        >
          <button
            aria-controls={viewportId}
            aria-hidden={!canScrollDown}
            aria-label={scrollDownLabel}
            className="ds-scroll-area__button ds-scroll-area__button--down"
            disabled={!canScrollDown}
            onClick={() => scrollBy(1)}
            type="button"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </div>
      </div>
    );
  },
);
