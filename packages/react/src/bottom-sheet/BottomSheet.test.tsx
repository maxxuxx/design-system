import { readFileSync } from 'node:fs';
import {
  createRef,
  StrictMode,
  type RefObject,
} from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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
import { expectNoAxeViolations } from '../test/accessibility';
import {
  BottomSheet,
  type BottomSheetCloseReason,
  type BottomSheetProps,
} from './BottomSheet';

const defaultProps = {
  children: <p>배송지를 선택하세요.</p>,
  closeLabel: '바텀시트 닫기',
  onOpenChange: vi.fn(),
  open: true,
  title: '배송지 선택',
} satisfies BottomSheetProps;

const originalMatchMedia = window.matchMedia;

function setReducedMotion(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: reduced && query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

async function getOpenDialog() {
  const dialog = await screen.findByRole('dialog', { name: defaultProps.title });
  await waitFor(() => expect(dialog).toHaveAttribute('open'));
  return dialog as HTMLDialogElement;
}

beforeEach(() => {
  setReducedMotion(false);
  document.body.style.overflow = '';
});

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: originalMatchMedia,
  });
  document.body.style.overflow = '';
  vi.useRealTimers();
});

describe('BottomSheet', () => {
  it('is SSR-safe and hydrates without rendering a portal on the server', async () => {
    const element = <BottomSheet {...defaultProps} />;
    const html = renderToString(element);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(html).toBe('');
    const root = hydrateRoot(container, element);

    try {
      await getOpenDialog();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      consoleError.mockRestore();
    }
  });

  it('portals a native modal dialog with owned labels, description, close icon, body, and footer', async () => {
    const portalContainer = document.createElement('div');
    document.body.append(portalContainer);

    try {
      render(
        <BottomSheet
          {...defaultProps}
          description="저장된 주소 중 하나를 고릅니다."
          footer={<button type="button">선택 완료</button>}
          portalContainer={portalContainer}
        />,
      );

      const dialog = await getOpenDialog();
      const title = within(dialog).getByRole('heading', {
        level: 2,
        name: defaultProps.title,
      });
      const description = within(dialog).getByText(
        '저장된 주소 중 하나를 고릅니다.',
      );
      const closeButton = within(dialog).getByRole('button', {
        name: defaultProps.closeLabel,
      });

      expect(portalContainer).toContainElement(dialog);
      expect(dialog.tagName).toBe('DIALOG');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', title.id);
      expect(dialog).toHaveAttribute('aria-describedby', description.id);
      expect(dialog).toHaveAttribute('data-state', 'open');
      expect(closeButton).toHaveAttribute('type', 'button');
      expect(closeButton.querySelector('.ds-icon')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(within(dialog).getByText('배송지를 선택하세요.')).toBeVisible();
      expect(within(dialog).getByRole('button', { name: '선택 완료' }))
        .toBeVisible();
    } finally {
      portalContainer.remove();
    }
  });

  it('uses document.body after hydration and moves an open portal when its container changes', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const { rerender } = render(
      <BottomSheet {...defaultProps} portalContainer={first} />,
    );

    try {
      let dialog = await getOpenDialog();
      expect(first).toContainElement(dialog);

      rerender(<BottomSheet {...defaultProps} portalContainer={second} />);
      dialog = await getOpenDialog();
      expect(second).toContainElement(dialog);
      expect(first.querySelector('dialog')).toBeNull();

      rerender(<BottomSheet {...defaultProps} />);
      dialog = await getOpenDialog();
      expect(dialog.parentElement).toBe(document.body);
    } finally {
      first.remove();
      second.remove();
    }
  });

  it('reports the owned close button reason without closing itself', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<BottomSheet {...defaultProps} onOpenChange={onOpenChange} />);
    const dialog = await getOpenDialog();

    await user.click(
      within(dialog).getByRole('button', { name: defaultProps.closeLabel }),
    );

    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false, 'close-button');
    expect(dialog).toHaveAttribute('open');
  });

  it('reports Escape and prevents native close so the controlled owner decides', async () => {
    const onOpenChange = vi.fn();
    render(<BottomSheet {...defaultProps} onOpenChange={onOpenChange} />);
    const dialog = await getOpenDialog();
    const cancel = new Event('cancel', { bubbles: false, cancelable: true });

    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false, 'escape');
    expect(dialog).toHaveAttribute('open');
  });

  it('reports backdrop only when the same pointer starts and ends on the dialog backdrop', async () => {
    const onOpenChange = vi.fn();
    render(<BottomSheet {...defaultProps} onOpenChange={onOpenChange} />);
    const dialog = await getOpenDialog();
    const surface = dialog.querySelector('.ds-bottom-sheet__surface')!;

    fireEvent.pointerDown(dialog, { pointerId: 1 });
    fireEvent.pointerUp(surface, { pointerId: 1 });
    fireEvent.pointerDown(surface, { pointerId: 2 });
    fireEvent.pointerUp(dialog, { pointerId: 2 });
    fireEvent.pointerDown(dialog, { pointerId: 3 });
    fireEvent.pointerUp(dialog, { pointerId: 4 });
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.pointerDown(dialog, { pointerId: 5 });
    fireEvent.pointerUp(dialog, { pointerId: 5 });
    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false, 'backdrop');
  });

  it('blocks Escape and backdrop when nondismissible while retaining the close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <BottomSheet
        {...defaultProps}
        dismissible={false}
        onOpenChange={onOpenChange}
      />,
    );
    const dialog = await getOpenDialog();
    const cancel = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(cancel);
    fireEvent.pointerDown(dialog, { pointerId: 1 });
    fireEvent.pointerUp(dialog, { pointerId: 1 });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole('button', { name: defaultProps.closeLabel }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false, 'close-button');
  });

  it('focuses a valid initial target, keeps the closing dialog mounted, then restores focus', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = '열기';
    document.body.append(trigger);
    trigger.focus();
    const initialFocusRef = createRef<HTMLButtonElement>();
    const { rerender } = render(
      <BottomSheet
        {...defaultProps}
        initialFocusRef={initialFocusRef}
      >
        <button ref={initialFocusRef} type="button">주소 선택</button>
      </BottomSheet>,
    );

    try {
      const dialog = await getOpenDialog();
      expect(initialFocusRef.current).toHaveFocus();
      expect(document.body.style.overflow).toBe('hidden');
      vi.useFakeTimers();

      rerender(
        <BottomSheet
          {...defaultProps}
          initialFocusRef={initialFocusRef}
          open={false}
        >
          <button ref={initialFocusRef} type="button">주소 선택</button>
        </BottomSheet>,
      );
      await act(async () => Promise.resolve());
      expect(dialog).toHaveAttribute('data-state', 'closing');
      expect(dialog).toHaveAttribute('open');
      expect(document.body.style.overflow).toBe('hidden');

      await act(async () => vi.advanceTimersByTime(199));
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      await act(async () => vi.advanceTimersByTime(1));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(document.body.style.overflow).toBe('');
    } finally {
      trigger.remove();
    }
  });

  it('falls back to the owned close button when initialFocusRef is outside the dialog', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    const initialFocusRef = { current: outside } as RefObject<HTMLElement>;
    render(
      <BottomSheet {...defaultProps} initialFocusRef={initialFocusRef} />,
    );
    const dialog = await getOpenDialog();

    try {
      expect(
        within(dialog).getByRole('button', { name: defaultProps.closeLabel }),
      ).toHaveFocus();
    } finally {
      outside.remove();
    }
  });

  it('falls back when initialFocusRef points to a connected but nonfocusable child', async () => {
    const initialFocusRef = createRef<HTMLDivElement>();
    render(
      <BottomSheet {...defaultProps} initialFocusRef={initialFocusRef}>
        <div ref={initialFocusRef}>focus를 받을 수 없는 안내</div>
      </BottomSheet>,
    );
    const dialog = await getOpenDialog();

    expect(
      within(dialog).getByRole('button', { name: defaultProps.closeLabel }),
    ).toHaveFocus();
  });

  it('wraps Tab and Shift+Tab inside the native modal focus order', async () => {
    render(
      <BottomSheet
        {...defaultProps}
        footer={<button type="button">마지막 행동</button>}
      >
        <button type="button">본문 행동</button>
      </BottomSheet>,
    );
    const dialog = await getOpenDialog();
    const close = within(dialog).getByRole('button', {
      name: defaultProps.closeLabel,
    });
    const last = within(dialog).getByRole('button', { name: '마지막 행동' });

    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(close).toHaveFocus();

    close.focus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('restores the exact prior body overflow only after the last open instance releases its lock', async () => {
    document.body.style.overflow = 'clip';
    const first = render(
      <BottomSheet {...defaultProps} title="첫 번째 시트" />,
    );
    await screen.findByRole('dialog', { name: '첫 번째 시트' });
    const second = render(
      <BottomSheet {...defaultProps} title="두 번째 시트" />,
    );
    await screen.findByRole('dialog', { name: '두 번째 시트' });
    expect(document.body.style.overflow).toBe('hidden');

    first.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    second.unmount();
    expect(document.body.style.overflow).toBe('clip');
  });

  it('does not leak scroll locks or focus state through Strict Mode cleanup', async () => {
    document.body.style.overflow = 'scroll';
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();

    const view = render(
      <StrictMode>
        <BottomSheet {...defaultProps} />
      </StrictMode>,
    );
    await getOpenDialog();
    expect(document.body.style.overflow).toBe('hidden');

    view.unmount();
    expect(document.body.style.overflow).toBe('scroll');
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('cancels an owned exit timer when reopened and closes immediately for reduced motion', async () => {
    const { rerender } = render(<BottomSheet {...defaultProps} />);
    const dialog = await getOpenDialog();
    vi.useFakeTimers();

    rerender(<BottomSheet {...defaultProps} open={false} />);
    await act(async () => Promise.resolve());
    expect(dialog).toHaveAttribute('data-state', 'closing');

    rerender(<BottomSheet {...defaultProps} open />);
    await act(async () => vi.advanceTimersByTime(200));
    expect(dialog).toHaveAttribute('data-state', 'open');
    expect(dialog).toHaveAttribute('open');

    setReducedMotion(true);
    rerender(<BottomSheet {...defaultProps} open={false} />);
    await act(async () => Promise.resolve());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preserves long content in an owned scroll region and keeps the optional footer separate', async () => {
    const longCopy = 'BottomSheetLongUnbrokenCopy'.repeat(20);
    render(
      <BottomSheet
        {...defaultProps}
        footer={<button type="button">계속</button>}
      >
        <p>{longCopy}</p>
      </BottomSheet>,
    );
    const dialog = await getOpenDialog();

    expect(within(dialog).getByText(longCopy).closest('.ds-bottom-sheet__body'))
      .toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '계속' })
      .closest('.ds-bottom-sheet__footer')).toBeInTheDocument();
  });

  it('publishes only the controlled modal API and exact close reasons', () => {
    expectTypeOf<BottomSheetProps['open']>().toEqualTypeOf<boolean>();
    expectTypeOf<BottomSheetProps['onOpenChange']>()
      .toEqualTypeOf<(open: boolean, reason: BottomSheetCloseReason) => void>();
    expectTypeOf<BottomSheetCloseReason>()
      .toEqualTypeOf<'backdrop' | 'close-button' | 'escape'>();
  });

  it('uses only owned tokens for modal geometry, scrim, elevation, and motion', () => {
    const componentCss = readFileSync('src/bottom-sheet/BottomSheet.css', 'utf8');
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './bottom-sheet/BottomSheet.css';");
    expect(componentCss).toContain('var(--ds-color-bg-scrim)');
    expect(componentCss).toContain('var(--ds-motion-duration-medium)');
    expect(componentCss).toContain('var(--ds-motion-easing-standard)');
    expect(componentCss).toContain('var(--ds-radius-xl)');
    expect(componentCss).toContain('var(--ds-elevation-2)');
    expect(componentCss).toContain(
      'calc(100dvh - var(--ds-space-24))',
    );
    expect(componentCss).toContain('calc(var(--ds-space-64) * 10)');
    expect(componentCss).toContain('@media (forced-colors: active)');
    expect(componentCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(componentCss).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  it('has no axe violations with description, body actions, and footer', async () => {
    render(
      <BottomSheet
        {...defaultProps}
        description="주소를 확인한 뒤 저장합니다."
        footer={<button type="button">저장</button>}
      >
        <button type="button">주소 선택</button>
      </BottomSheet>,
    );
    await getOpenDialog();
    await expectNoAxeViolations(document.body);
  });
});
