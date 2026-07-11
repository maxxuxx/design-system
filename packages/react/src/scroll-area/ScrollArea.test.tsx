import { readFileSync } from 'node:fs';
import { createRef, type RefCallback } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';

const { flushSyncSpy } = vi.hoisted(() => ({
  flushSyncSpy: vi.fn<(callback: () => unknown) => unknown>(),
}));

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  flushSyncSpy.mockImplementation((callback) => actual.flushSync(callback));
  return { ...actual, flushSync: flushSyncSpy };
});

import { expectNoAxeViolations } from '../test/accessibility';
import {
  ScrollArea,
  type ScrollAreaProps,
  type ScrollAreaState,
} from './ScrollArea';

interface ScrollGeometry {
  clientHeight: number;
  scrollHeight: number;
  scrollTop: number;
}

class ResizeObserverDouble {
  static instances: ResizeObserverDouble[] = [];

  readonly disconnect = vi.fn();
  readonly observe = vi.fn((_target: Element) => undefined);
  readonly unobserve = vi.fn((_target: Element) => undefined);
  readonly takeRecords = vi.fn((): ResizeObserverEntry[] => []);

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverDouble.instances.push(this);
  }

  trigger(target: Element): void {
    this.callback(
      [{ target } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

function installGeometry(
  viewport: HTMLDivElement,
  initial: ScrollGeometry,
): {
  geometry: ScrollGeometry;
  scrollBy: ReturnType<typeof vi.fn>;
} {
  const geometry = { ...initial };
  const scrollBy = vi.fn();

  Object.defineProperties(viewport, {
    clientHeight: {
      configurable: true,
      get: () => geometry.clientHeight,
    },
    scrollBy: {
      configurable: true,
      value: scrollBy,
    },
    scrollHeight: {
      configurable: true,
      get: () => geometry.scrollHeight,
    },
    scrollTop: {
      configurable: true,
      get: () => geometry.scrollTop,
      set: (value: number) => {
        geometry.scrollTop = value;
      },
    },
  });

  return { geometry, scrollBy };
}

const defaultProps = {
  label: '주문 내역',
  scrollDownLabel: '아래로 스크롤',
  scrollUpLabel: '위로 스크롤',
} as const;

function renderArea(
  geometry: ScrollGeometry = {
    clientHeight: 200,
    scrollHeight: 200,
    scrollTop: 0,
  },
  props: Partial<ScrollAreaProps> = {},
) {
  const mounted: {
    viewport?: HTMLDivElement;
    geometryController?: ReturnType<typeof installGeometry>;
  } = {};
  const viewportRef: RefCallback<HTMLDivElement> = (node) => {
    if (node) {
      mounted.viewport = node;
      mounted.geometryController = installGeometry(node, geometry);
    }
  };
  const result = render(
    <ScrollArea {...defaultProps} {...props} viewportRef={viewportRef}>
      <p>첫 번째 주문</p>
      <p>두 번째 주문</p>
    </ScrollArea>,
  );
  const viewport = mounted.viewport;
  const geometryController = mounted.geometryController;

  if (!viewport || !geometryController) {
    throw new Error('ScrollArea did not attach its viewport ref.');
  }

  return {
    ...result,
    controller: geometryController,
    root: result.container.firstElementChild as HTMLDivElement,
    viewport: viewport as HTMLDivElement,
  };
}

function expectState(
  root: HTMLDivElement,
  viewport: HTMLDivElement,
  state: ScrollAreaState,
  canScrollUp: boolean,
  canScrollDown: boolean,
): void {
  const upEdge = root.querySelector<HTMLElement>('.ds-scroll-area__edge--top');
  const downEdge = root.querySelector<HTMLElement>('.ds-scroll-area__edge--bottom');
  const upButton = root.querySelector<HTMLButtonElement>('.ds-scroll-area__button--up');
  const downButton = root.querySelector<HTMLButtonElement>('.ds-scroll-area__button--down');

  expect(root).toHaveAttribute('data-state', state);
  expect(viewport).toHaveAttribute('data-state', state);
  expect(viewport).toHaveAttribute('tabindex', state === 'no-overflow' ? '-1' : '0');
  expect(upEdge).toHaveAttribute('data-active', String(canScrollUp));
  expect(downEdge).toHaveAttribute('data-active', String(canScrollDown));
  expect(upButton).toHaveProperty('disabled', !canScrollUp);
  expect(downButton).toHaveProperty('disabled', !canScrollDown);
  expect(upButton).toHaveAttribute('aria-hidden', String(!canScrollUp));
  expect(downButton).toHaveAttribute('aria-hidden', String(!canScrollDown));
}

beforeEach(() => {
  ResizeObserverDouble.instances = [];
  flushSyncSpy.mockClear();
  vi.stubGlobal('ResizeObserver', ResizeObserverDouble);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ScrollArea', () => {
  it.each<{
    geometry: ScrollGeometry;
    state: ScrollAreaState;
    canScrollUp: boolean;
    canScrollDown: boolean;
  }>([
    {
      geometry: { clientHeight: 200, scrollHeight: 200, scrollTop: 0 },
      state: 'no-overflow',
      canScrollUp: false,
      canScrollDown: false,
    },
    {
      geometry: { clientHeight: 200, scrollHeight: 600, scrollTop: 0 },
      state: 'start',
      canScrollUp: false,
      canScrollDown: true,
    },
    {
      geometry: { clientHeight: 200, scrollHeight: 600, scrollTop: 180 },
      state: 'middle',
      canScrollUp: true,
      canScrollDown: true,
    },
    {
      geometry: { clientHeight: 200, scrollHeight: 600, scrollTop: 400 },
      state: 'end',
      canScrollUp: true,
      canScrollDown: false,
    },
  ])('derives the $state state on mount', ({
    geometry,
    state,
    canScrollUp,
    canScrollDown,
  }) => {
    const { root, viewport } = renderArea(geometry);
    expectState(root, viewport, state, canScrollUp, canScrollDown);
  });

  it.each<{
    scrollTop: number;
    state: ScrollAreaState;
  }>([
    { scrollTop: -24, state: 'start' },
    { scrollTop: 1, state: 'start' },
    { scrollTop: 1.01, state: 'middle' },
    { scrollTop: 398.99, state: 'middle' },
    { scrollTop: 399, state: 'end' },
    { scrollTop: 424, state: 'end' },
  ])('clamps bounce geometry and applies the epsilon at $scrollTop', ({ scrollTop, state }) => {
    const { root, viewport } = renderArea({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop,
    });
    expect(root).toHaveAttribute('data-state', state);
    expect(viewport).toHaveAttribute('data-state', state);
  });

  it('recomputes state on native viewport scroll before calling the consumer handler', () => {
    const observedTargets: Array<EventTarget | null> = [];
    const observedStates: Array<{
      root: string | null;
      viewport: string | null;
    }> = [];
    const onViewportScroll = vi.fn((event) => {
      observedTargets.push(event.currentTarget);
      observedStates.push({
        root: event.currentTarget.parentElement?.getAttribute('data-state') ?? null,
        viewport: event.currentTarget.getAttribute('data-state'),
      });
    });
    const { controller, root, viewport } = renderArea(
      { clientHeight: 200, scrollHeight: 600, scrollTop: 0 },
      { onViewportScroll },
    );

    controller.geometry.scrollTop = 200;
    fireEvent.scroll(viewport);

    expect(root).toHaveAttribute('data-state', 'middle');
    expect(viewport).toHaveAttribute('data-state', 'middle');
    expect(onViewportScroll).toHaveBeenCalledTimes(1);
    expect(observedTargets).toEqual([viewport]);
    expect(observedStates).toEqual([{ root: 'middle', viewport: 'middle' }]);
  });

  it('flushes synchronously only when a scroll crosses a state boundary', () => {
    const { controller, viewport } = renderArea({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 0,
    });

    fireEvent.scroll(viewport);
    expect(flushSyncSpy).not.toHaveBeenCalled();

    controller.geometry.scrollTop = 200;
    fireEvent.scroll(viewport);
    expect(flushSyncSpy).toHaveBeenCalledTimes(1);

    fireEvent.scroll(viewport);
    expect(flushSyncSpy).toHaveBeenCalledTimes(1);
  });

  it('observes viewport and content geometry and recomputes for either target', () => {
    const { controller, root, viewport } = renderArea({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 0,
    });
    const content = root.querySelector('.ds-scroll-area__content');
    const observer = ResizeObserverDouble.instances[0];

    expect(observer).toBeDefined();
    expect(content).toBeInstanceOf(HTMLDivElement);
    expect(observer?.observe).toHaveBeenCalledWith(viewport);
    expect(observer?.observe).toHaveBeenCalledWith(content);

    controller.geometry.scrollTop = 200;
    act(() => observer?.trigger(viewport));
    expect(root).toHaveAttribute('data-state', 'middle');

    controller.geometry.scrollHeight = 400;
    act(() => observer?.trigger(content as Element));
    expect(root).toHaveAttribute('data-state', 'end');
  });

  it('guards environments without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { root, viewport } = renderArea({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 0,
    });

    expectState(root, viewport, 'start', false, true);
  });

  it('scrolls down and up by 80 percent of the current viewport without JS motion options', () => {
    const downArea = renderArea({
      clientHeight: 250,
      scrollHeight: 750,
      scrollTop: 0,
    });
    fireEvent.click(screen.getByRole('button', { name: defaultProps.scrollDownLabel }));
    expect(downArea.controller.scrollBy).toHaveBeenCalledWith({ top: 200 });
    downArea.unmount();

    const upArea = renderArea({
      clientHeight: 250,
      scrollHeight: 750,
      scrollTop: 500,
    });
    fireEvent.click(screen.getByRole('button', { name: defaultProps.scrollUpLabel }));
    expect(upArea.controller.scrollBy).toHaveBeenCalledWith({ top: -200 });
  });

  it('targets native root props and refs at the sizing root and viewportRef at the scroller', () => {
    const rootRef = createRef<HTMLDivElement>();
    const viewportRef = createRef<HTMLDivElement>();
    const { container } = render(
      <ScrollArea
        {...defaultProps}
        className="consumer-scroll-area"
        data-consumer="orders"
        data-state="consumer-state"
        id="orders-scroll-area"
        ref={rootRef}
        style={{ height: 320 }}
        viewportRef={viewportRef}
      >
        <p>주문</p>
      </ScrollArea>,
    );
    const root = container.firstElementChild;
    const viewport = screen.getByRole('region', { name: defaultProps.label });

    expect(root).toBe(rootRef.current);
    expect(root).toHaveAttribute('id', 'orders-scroll-area');
    expect(root).toHaveAttribute('data-consumer', 'orders');
    expect(root).toHaveAttribute('data-state', 'no-overflow');
    expect(root).toHaveClass('ds-scroll-area', 'consumer-scroll-area');
    expect(root).toHaveStyle({ height: '320px' });
    expect(viewportRef.current).toBe(viewport);
    expect(viewport).not.toHaveAttribute('id', 'orders-scroll-area');
  });

  it('owns the viewport region, focusability, controls, labels, and decorative icons', () => {
    const { root, viewport } = renderArea({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 200,
    });
    const buttons = root.querySelectorAll<HTMLButtonElement>('button');

    expect(viewport).toHaveAttribute('role', 'region');
    expect(viewport).toHaveAccessibleName(defaultProps.label);
    expect(viewport.id).toMatch(/^ds-scroll-area-viewport-/);
    expect(viewport).toHaveAttribute('tabindex', '0');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute('type', 'button');
    expect(buttons[0]).toHaveAttribute('aria-label', defaultProps.scrollUpLabel);
    expect(buttons[1]).toHaveAttribute('aria-label', defaultProps.scrollDownLabel);
    expect(buttons[0]).toHaveAttribute('aria-controls', viewport.id);
    expect(buttons[1]).toHaveAttribute('aria-controls', viewport.id);
    expect(buttons[0]?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(buttons[1]?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders 20 pixel navigation icons', () => {
    const { root } = renderArea({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 200,
    });
    const icons = root.querySelectorAll<SVGSVGElement>('.ds-scroll-area__button .ds-icon');

    expect(icons).toHaveLength(2);
    for (const icon of icons) {
      expect(icon).toHaveAttribute('data-size', '20');
      expect(icon).toHaveAttribute('height', '20');
      expect(icon).toHaveAttribute('width', '20');
    }
  });

  it('disconnects its geometry observer when unmounted', () => {
    const { unmount } = renderArea();
    const observer = ResizeObserverDouble.instances[0];

    expect(observer).toBeDefined();
    unmount();
    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('exposes the exact public state and prop contracts', () => {
    expectTypeOf<ScrollAreaState>().toEqualTypeOf<
      'no-overflow' | 'start' | 'middle' | 'end'
    >();
    expectTypeOf<ScrollAreaProps['label']>().toEqualTypeOf<string>();
    expectTypeOf<ScrollAreaProps['scrollUpLabel']>().toEqualTypeOf<string>();
    expectTypeOf<ScrollAreaProps['scrollDownLabel']>().toEqualTypeOf<string>();
    expectTypeOf<ScrollAreaProps>().not.toHaveProperty('onScroll');
  });

  it('wires the blur token and required ScrollArea CSS hooks', () => {
    const componentCss = readFileSync('src/scroll-area/ScrollArea.css', 'utf8');
    const reactStyles = readFileSync('src/styles.css', 'utf8');
    const tokenStyles = readFileSync('../tokens/dist/tokens.css', 'utf8');

    expect(tokenStyles).toContain('--ds-blur-subtle: 8px;');
    expect(reactStyles).toContain("@import './scroll-area/ScrollArea.css';");
    for (const selector of [
      '.ds-scroll-area',
      '.ds-scroll-area__viewport',
      '.ds-scroll-area__content',
      '.ds-scroll-area__edge',
      '.ds-scroll-area__edge--top',
      '.ds-scroll-area__edge--bottom',
      '.ds-scroll-area__button',
      '.ds-scroll-area__button--up',
      '.ds-scroll-area__button--down',
    ]) {
      expect(componentCss).toContain(selector);
    }
    expect(componentCss).toMatch(
      /\.ds-scroll-area__edge\s*\{[^}]*box-sizing: border-box;/s,
    );
    expect(componentCss).toContain('blur(var(--ds-blur-subtle))');
    expect([
      ...componentCss.matchAll(
        /\.ds-scroll-area__edge--(?:top|bottom)\[data-active='true'\]\s*\{[^}]*background:\s*linear-gradient\(\s*to (?:top|bottom),\s*color-mix\(\s*in srgb,\s*var\(--ds-color-bg-surface\)\s+36%,\s*transparent\s*\),\s*transparent\s*\)\s*;?/g,
      ),
    ]).toHaveLength(2);
  });

  it('has no axe violations in an overflow state', async () => {
    const { container } = renderArea({
      clientHeight: 200,
      scrollHeight: 600,
      scrollTop: 200,
    });
    await expectNoAxeViolations(container);
  });
});
