import { readFileSync } from 'node:fs';
import {
  createRef,
  type ReactElement,
} from 'react';
import { renderToString } from 'react-dom/server';
import {
  act,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';

import { Button, type ButtonProps } from '../button';
import { expectNoAxeViolations } from '../test/accessibility';

import {
  BottomCTA,
  type BottomCTAAction,
  type BottomCTAProps,
} from './BottomCTA';

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

beforeEach(() => {
  ResizeObserverDouble.instances = [];
  vi.stubGlobal('ResizeObserver', ResizeObserverDouble);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BottomCTA', () => {
  it('types actions as exact owned Button elements', () => {
    type OwnedButtonElement = ReactElement<ButtonProps, typeof Button>;

    expectTypeOf<BottomCTAAction>().toEqualTypeOf<OwnedButtonElement>();
    expectTypeOf<BottomCTAProps['primaryAction']>()
      .toEqualTypeOf<OwnedButtonElement>();
    expectTypeOf<BottomCTAProps['secondaryAction']>()
      .toEqualTypeOf<OwnedButtonElement | undefined>();
  });

  it('derives Single layout and forces the primary Button to large and full', () => {
    const { container } = render(
      <BottomCTA
        primaryAction={<Button size="small" width="hug">계속</Button>}
      />,
    );
    const root = container.firstElementChild;
    const button = screen.getByRole('button', { name: '계속' });

    expect(root).toHaveClass('ds-bottom-cta');
    expect(root).toHaveAttribute('data-layout', 'single');
    expect(root).toHaveAttribute('data-fixed', 'false');
    expect(root).toHaveAttribute('data-take-space', 'false');
    expect(root).toHaveAttribute('data-safe-area', 'true');
    expect(root).toHaveAttribute('data-background', 'default');
    expect(button).toHaveAttribute('data-size', 'large');
    expect(button).toHaveAttribute('data-width', 'full');
  });

  it('renders secondary then primary in DOM, focus, and visual order', async () => {
    const user = userEvent.setup();
    render(
      <BottomCTA
        primaryAction={<Button>확인</Button>}
        secondaryAction={<Button variant="weak">취소</Button>}
      />,
    );
    const buttons = screen.getAllByRole('button');

    expect(buttons.map((button) => button.textContent)).toEqual(['취소', '확인']);
    expect(buttons[0]).toHaveAttribute('data-variant', 'weak');
    expect(buttons[1]).toHaveAttribute('data-variant', 'fill');
    expect(buttons[0]?.closest('.ds-bottom-cta'))
      .toHaveAttribute('data-layout', 'double');

    await user.tab();
    expect(buttons[0]).toHaveFocus();
    await user.tab();
    expect(buttons[1]).toHaveFocus();
  });

  it('rejects non-Button primary and secondary actions at runtime', () => {
    const invalid = <span>잘못된 액션</span> as unknown as BottomCTAAction;

    expect(() => render(<BottomCTA primaryAction={invalid} />)).toThrow(
      'BottomCTA primaryAction must be a Button element.',
    );
    expect(() => render(
      <BottomCTA
        primaryAction={<Button>확인</Button>}
        secondaryAction={invalid}
      />,
    )).toThrow('BottomCTA secondaryAction must be a Button element.');
  });

  it('preserves Button behavior, native props, and the original action ref', async () => {
    const user = userEvent.setup();
    const actionRef = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(
      <form aria-label="결제 양식">
        <BottomCTA
          primaryAction={(
            <Button
              data-action="pay"
              form="payment-form"
              onClick={onClick}
              ref={actionRef}
              type="submit"
              variant="outline"
            >
              결제
            </Button>
          )}
        />
      </form>,
    );
    const button = screen.getByRole('button', { name: '결제' });

    expect(actionRef.current).toBe(button);
    expect(button).toHaveAttribute('data-action', 'pay');
    expect(button).toHaveAttribute('data-variant', 'outline');
    expect(button).toHaveAttribute('form', 'payment-form');
    expect(button).toHaveAttribute('type', 'submit');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('preserves disabled and loading authority while forcing only geometry', () => {
    render(
      <BottomCTA
        primaryAction={<Button loading variant="weak">처리 중</Button>}
        secondaryAction={<Button disabled variant="outline">이전</Button>}
      />,
    );

    const loading = screen.getByRole('button', { name: '처리 중' });
    const disabled = screen.getByRole('button', { name: '이전' });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute('aria-busy', 'true');
    expect(loading).toHaveAttribute('data-loading', 'true');
    expect(loading).toHaveAttribute('data-variant', 'weak');
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute('data-variant', 'outline');
  });

  it('forwards its root ref and safe native layout props while filtering unsafe style', () => {
    const ref = createRef<HTMLDivElement>();
    const onClick = vi.fn();
    const { container } = render(
      <BottomCTA
        aria-label="주요 행동"
        className="consumer-cta"
        data-consumer="checkout"
        dangerouslySetInnerHTML={{ __html: '<button>override</button>' }}
        onClick={onClick}
        primaryAction={<Button>계속</Button>}
        ref={ref}
        style={{
          backgroundColor: 'red',
          marginTop: 8,
          minHeight: 1,
          position: 'absolute',
        }}
      />,
    );
    const root = container.firstElementChild as HTMLDivElement;

    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute('aria-label', '주요 행동');
    expect(root).toHaveAttribute('data-consumer', 'checkout');
    expect(root).toHaveClass('ds-bottom-cta', 'consumer-cta');
    expect(root).toHaveStyle('margin-top: 8px');
    expect(root.style.backgroundColor).toBe('');
    expect(root.style.minHeight).toBe('');
    expect(root.style.position).toBe('');
    expect(screen.getByRole('button', { name: '계속' })).toBeInTheDocument();

    root.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('measures a fixed panel into its spacer, updates dynamically, and disconnects', () => {
    const { container, unmount } = render(
      <BottomCTA fixed primaryAction={<Button>계속</Button>} />,
    );
    const root = container.firstElementChild;
    const panel = container.querySelector<HTMLElement>('.ds-bottom-cta__panel');
    const spacer = container.querySelector<HTMLElement>('.ds-bottom-cta__spacer');
    const observer = ResizeObserverDouble.instances[0];

    expect(root).toHaveAttribute('data-fixed', 'true');
    expect(root).toHaveAttribute('data-take-space', 'true');
    expect(panel).not.toBeNull();
    expect(spacer).not.toBeNull();
    expect(observer?.observe).toHaveBeenCalledWith(panel);

    const bounds = vi.spyOn(panel as HTMLElement, 'getBoundingClientRect');
    bounds.mockReturnValue({
      bottom: 88,
      height: 88,
      left: 0,
      right: 320,
      top: 0,
      width: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    act(() => observer?.trigger(panel as Element));
    expect(spacer).toHaveStyle('block-size: 88px');

    bounds.mockReturnValue({
      bottom: 120,
      height: 120,
      left: 0,
      right: 320,
      top: 0,
      width: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    act(() => observer?.trigger(panel as Element));
    expect(spacer).toHaveStyle('block-size: 120px');

    unmount();
    expect(observer?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('uses a CSS spacer fallback and omits spacing when takeSpace is false', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const fixed = render(
      <BottomCTA fixed primaryAction={<Button>고정</Button>} />,
    );
    const fallbackSpacer = fixed.container.querySelector<HTMLElement>(
      '.ds-bottom-cta__spacer',
    );
    expect(fallbackSpacer).not.toBeNull();
    expect(fallbackSpacer?.style.blockSize).toBe('');
    fixed.unmount();

    const withoutSpace = render(
      <BottomCTA
        fixed
        primaryAction={<Button>공간 없음</Button>}
        takeSpace={false}
      />,
    );
    expect(withoutSpace.container.querySelector('.ds-bottom-cta__spacer'))
      .toBeNull();
    expect(withoutSpace.container.firstElementChild)
      .toHaveAttribute('data-take-space', 'false');
  });

  it('exposes background and safe-area states without changing action geometry', () => {
    const { container } = render(
      <BottomCTA
        background="none"
        hasSafeAreaPadding={false}
        primaryAction={<Button>계속</Button>}
      />,
    );
    const root = container.firstElementChild;

    expect(root).toHaveAttribute('data-background', 'none');
    expect(root).toHaveAttribute('data-safe-area', 'false');
    expect(screen.getByRole('button', { name: '계속' }))
      .toHaveAttribute('data-size', 'large');
  });

  it('uses token-backed reflow, safe-area, background-none, and forced-color CSS', () => {
    const css = readFileSync('src/bottom-cta/BottomCTA.css', 'utf8');
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './bottom-cta/BottomCTA.css';");
    expect(css).toContain('env(safe-area-inset-bottom, var(--ds-space-0))');
    expect(css).toContain('var(--ds-safe-area-bottom, var(--ds-space-0))');
    expect(css).toContain('max(');
    expect(css).toContain("[data-background='none']");
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('min-inline-size: 0');
    expect(css).toContain('@media (forced-colors: active)');
  });

  it('renders fixed and long localized actions safely on the server', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    expect(() => renderToString(
      <BottomCTA
        fixed
        primaryAction={(
          <Button>결제를 완료하고 다음 단계로 계속 진행합니다</Button>
        )}
        secondaryAction={<Button variant="weak">이전 단계로 돌아갑니다</Button>}
      />,
    )).not.toThrow();
  });

  it('has no axe violations in Single, Double, fixed, and background-none states', async () => {
    const { container } = render(
      <main>
        <BottomCTA primaryAction={<Button>계속</Button>} />
        <BottomCTA
          background="none"
          primaryAction={<Button>확인</Button>}
          secondaryAction={<Button variant="weak">취소</Button>}
        />
        <BottomCTA fixed primaryAction={<Button>완료</Button>} />
      </main>,
    );

    await expectNoAxeViolations(container);
  });
});
