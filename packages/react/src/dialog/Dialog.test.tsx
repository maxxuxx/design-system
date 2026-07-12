import { readFileSync } from 'node:fs';
import { type CSSProperties } from 'react';
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
  AlertDialog,
  type AlertDialogCloseReason,
  type AlertDialogProps,
  ConfirmDialog,
  type ConfirmDialogCloseReason,
  type ConfirmDialogProps,
} from './Dialog';

const defaultAlertProps = {
  alertLabel: '확인',
  onOpenChange: vi.fn(),
  open: true,
  title: '알림',
} satisfies AlertDialogProps;

const defaultConfirmProps = {
  cancelLabel: '취소',
  confirmLabel: '삭제',
  description: '삭제하면 되돌릴 수 없습니다.',
  onOpenChange: vi.fn(),
  open: true,
  title: '삭제할까요?',
} satisfies ConfirmDialogProps;

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

async function getOpenConfirmDialog(title = defaultConfirmProps.title) {
  const dialog = await screen.findByRole('dialog', { name: title });
  await waitFor(() => expect(dialog).toHaveAttribute('open'));
  return dialog as HTMLDialogElement;
}

async function getOpenAlertDialog(title = defaultAlertProps.title) {
  const dialog = await screen.findByRole('alertdialog', { name: title });
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

describe('Dialog', () => {
  it('renders AlertDialog as a labelled native alertdialog with one owned action', async () => {
    render(
      <AlertDialog
        {...defaultAlertProps}
        description="계정 설정이 저장되었습니다."
      />,
    );
    const dialog = await getOpenAlertDialog();
    const title = within(dialog).getByRole('heading', {
      level: 2,
      name: defaultAlertProps.title,
    });
    const description = within(dialog).getByText(
      '계정 설정이 저장되었습니다.',
    );
    const actions = within(dialog).getAllByRole('button');

    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', title.id);
    expect(dialog).toHaveAttribute('aria-describedby', description.id);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toHaveAccessibleName(defaultAlertProps.alertLabel);
    expect(actions[0]).toHaveAttribute('type', 'button');
  });

  it('renders ConfirmDialog with native dialog semantics and cancel then confirm actions', async () => {
    render(<ConfirmDialog {...defaultConfirmProps} />);
    const dialog = await getOpenConfirmDialog();
    const title = within(dialog).getByRole('heading', {
      level: 2,
      name: defaultConfirmProps.title,
    });
    const description = within(dialog).getByText(
      defaultConfirmProps.description,
    );
    const actions = within(dialog).getAllByRole('button');

    expect(dialog.tagName).toBe('DIALOG');
    expect(dialog).toHaveAttribute('role', 'dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', title.id);
    expect(dialog).toHaveAttribute('aria-describedby', description.id);
    expect(actions).toHaveLength(2);
    expect(actions.map((action) => action.textContent)).toEqual([
      defaultConfirmProps.cancelLabel,
      defaultConfirmProps.confirmLabel,
    ]);
    expect(actions[0]).toHaveAttribute('type', 'button');
    expect(actions[1]).toHaveAttribute('type', 'button');
  });

  it('omits aria-describedby when description is absent', async () => {
    render(
      <ConfirmDialog
        {...defaultConfirmProps}
        description={undefined}
      />,
    );
    const dialog = await getOpenConfirmDialog();

    expect(dialog).not.toHaveAttribute('aria-describedby');
    expect(dialog.querySelector('.ds-dialog__description')).toBeNull();
  });

  it('reports exact owned alert, cancel, and confirm reasons without closing itself', async () => {
    const user = userEvent.setup();
    const onAlertOpenChange = vi.fn();
    const alertView = render(
      <AlertDialog
        {...defaultAlertProps}
        onOpenChange={onAlertOpenChange}
      />,
    );
    const alertDialog = await getOpenAlertDialog();

    await user.click(within(alertDialog).getByRole('button', { name: '확인' }));
    expect(onAlertOpenChange).toHaveBeenCalledWith(false, 'alert-button');
    expect(alertDialog).toHaveAttribute('open');
    alertView.unmount();

    const onConfirmOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...defaultConfirmProps}
        onOpenChange={onConfirmOpenChange}
      />,
    );
    const confirmDialog = await getOpenConfirmDialog();

    await user.click(
      within(confirmDialog).getByRole('button', { name: '취소' }),
    );
    await user.click(
      within(confirmDialog).getByRole('button', { name: '삭제' }),
    );
    expect(onConfirmOpenChange.mock.calls).toEqual([
      [false, 'cancel-button'],
      [false, 'confirm-button'],
    ]);
    expect(confirmDialog).toHaveAttribute('open');
  });

  it('reports Escape and same-pointer backdrop by default', async () => {
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...defaultConfirmProps}
        onOpenChange={onOpenChange}
      />,
    );
    const dialog = await getOpenConfirmDialog();
    const surface = dialog.querySelector('.ds-dialog__surface')!;
    const cancel = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false, 'escape');

    fireEvent.pointerDown(dialog, { pointerId: 1 });
    fireEvent.pointerUp(surface, { pointerId: 1 });
    fireEvent.pointerDown(surface, { pointerId: 2 });
    fireEvent.pointerUp(dialog, { pointerId: 2 });
    fireEvent.pointerDown(dialog, { pointerId: 3 });
    fireEvent.pointerUp(dialog, { pointerId: 4 });
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(dialog, { pointerId: 5 });
    fireEvent.pointerUp(dialog, { pointerId: 5 });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'backdrop');
  });

  it('blocks Escape and backdrop when nondismissible while retaining owned actions', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog
        {...defaultConfirmProps}
        dismissible={false}
        onOpenChange={onOpenChange}
      />,
    );
    const dialog = await getOpenConfirmDialog();
    const cancel = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(cancel);
    fireEvent.pointerDown(dialog, { pointerId: 1 });
    fireEvent.pointerUp(dialog, { pointerId: 1 });
    expect(cancel.defaultPrevented).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));
    expect(onOpenChange.mock.calls).toEqual([
      [false, 'cancel-button'],
      [false, 'confirm-button'],
    ]);
  });

  it('focuses the acknowledgement action for AlertDialog', async () => {
    render(<AlertDialog {...defaultAlertProps} />);
    const dialog = await getOpenAlertDialog();

    expect(within(dialog).getByRole('button', { name: '확인' })).toHaveFocus();
  });

  it('focuses cancel for ConfirmDialog and contains forward and reverse Tab', async () => {
    render(<ConfirmDialog {...defaultConfirmProps} />);
    const dialog = await getOpenConfirmDialog();
    const cancel = within(dialog).getByRole('button', { name: '취소' });
    const confirm = within(dialog).getByRole('button', { name: '삭제' });

    expect(cancel).toHaveFocus();

    const reverseWrap = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: true,
    });
    cancel.dispatchEvent(reverseWrap);
    expect(reverseWrap.defaultPrevented).toBe(true);
    expect(confirm).toHaveFocus();

    const forwardWrap = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    });
    confirm.dispatchEvent(forwardWrap);
    expect(forwardWrap.defaultPrevented).toBe(true);
    expect(cancel).toHaveFocus();
  });

  it('restores the trigger focus after the controlled dialog closes', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = '대화상자 열기';
    document.body.append(trigger);
    trigger.focus();
    const { rerender } = render(<ConfirmDialog {...defaultConfirmProps} />);
    await getOpenConfirmDialog();
    setReducedMotion(true);

    rerender(<ConfirmDialog {...defaultConfirmProps} open={false} />);
    await act(async () => Promise.resolve());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('maps confirm disabled and loading to the owned confirm Button only', async () => {
    const { rerender } = render(
      <ConfirmDialog
        {...defaultConfirmProps}
        confirmDisabled
      />,
    );
    let dialog = await getOpenConfirmDialog();
    let cancel = within(dialog).getByRole('button', { name: '취소' });
    let confirm = within(dialog).getByRole('button', { name: '삭제' });

    expect(cancel).toBeEnabled();
    expect(confirm).toBeDisabled();
    expect(confirm).not.toHaveAttribute('aria-busy');

    rerender(
      <ConfirmDialog
        {...defaultConfirmProps}
        confirmLoading
      />,
    );
    dialog = await getOpenConfirmDialog();
    cancel = within(dialog).getByRole('button', { name: '취소' });
    confirm = within(dialog).getByRole('button', { name: '삭제' });
    expect(cancel).toBeEnabled();
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
  });

  it('keeps long copy in the internal scroll region while actions remain separate', async () => {
    const longCopy = 'DialogLongUnbrokenLocalizedCopy'.repeat(24);
    render(
      <ConfirmDialog
        {...defaultConfirmProps}
        description={longCopy}
      />,
    );
    const dialog = await getOpenConfirmDialog();
    const description = within(dialog).getByText(longCopy);
    const confirm = within(dialog).getByRole('button', { name: '삭제' });

    expect(description.closest('.ds-dialog__body')).toBeInTheDocument();
    expect(confirm.closest('.ds-dialog__actions')).toBeInTheDocument();
    expect(confirm.closest('.ds-dialog__body')).toBeNull();
  });

  it('is SSR-safe and hydrates without rendering a server portal', async () => {
    const element = <ConfirmDialog {...defaultConfirmProps} />;
    const html = renderToString(element);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = hydrateRoot(container, element);

    try {
      expect(html).toBe('');
      await getOpenConfirmDialog();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      await act(async () => root.unmount());
      container.remove();
      consoleError.mockRestore();
    }
  });

  it('uses the requested portal container and moves back to document.body', async () => {
    const portalContainer = document.createElement('div');
    document.body.append(portalContainer);
    const { rerender } = render(
      <ConfirmDialog
        {...defaultConfirmProps}
        portalContainer={portalContainer}
      />,
    );

    try {
      let dialog = await getOpenConfirmDialog();
      expect(portalContainer).toContainElement(dialog);

      rerender(<ConfirmDialog {...defaultConfirmProps} />);
      dialog = await getOpenConfirmDialog();
      expect(dialog.parentElement).toBe(document.body);
      expect(portalContainer.querySelector('dialog')).toBeNull();
    } finally {
      portalContainer.remove();
    }
  });

  it('forwards consumer root attributes and filters inline styles', async () => {
    render(
      <ConfirmDialog
        {...defaultConfirmProps}
        className="consumer-dialog"
        data-consumer="safe"
        style={{
          backgroundColor: 'red',
          color: 'red',
          marginTop: 1,
          minHeight: 1,
          order: 2,
          position: 'absolute',
        } satisfies CSSProperties}
      />,
    );
    const dialog = await getOpenConfirmDialog();
    const surface = dialog.querySelector('.ds-dialog__surface');

    expect(surface).toHaveClass('ds-dialog__surface', 'consumer-dialog');
    expect(surface).toHaveAttribute('data-consumer', 'safe');
    expect(surface).toHaveStyle('margin-top: 1px');
    expect(surface).toHaveStyle('order: 2');
    expect((surface as HTMLElement).style.backgroundColor).toBe('');
    expect((surface as HTMLElement).style.color).toBe('');
    expect((surface as HTMLElement).style.minHeight).toBe('');
    expect((surface as HTMLElement).style.position).toBe('');
  });

  it('does not let dangerous HTML replace the owned title and actions', async () => {
    const unsafeProps = {
      dangerouslySetInnerHTML: {
        __html: '<button data-injected="true">주입</button>',
      },
    } as unknown as Partial<ConfirmDialogProps>;
    render(<ConfirmDialog {...defaultConfirmProps} {...unsafeProps} />);
    const dialog = await getOpenConfirmDialog();

    expect(within(dialog).getByRole('heading', { name: '삭제할까요?' }))
      .toBeInTheDocument();
    expect(within(dialog).getAllByRole('button')).toHaveLength(2);
    expect(dialog.querySelector('[data-injected="true"]')).toBeNull();
  });

  it('publishes exact public close reasons and confirm state props', () => {
    expectTypeOf<AlertDialogCloseReason>()
      .toEqualTypeOf<'alert-button' | 'backdrop' | 'escape'>();
    expectTypeOf<ConfirmDialogCloseReason>()
      .toEqualTypeOf<
        'cancel-button' | 'confirm-button' | 'backdrop' | 'escape'
      >();
    expectTypeOf<ConfirmDialogProps['confirmDisabled']>()
      .toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ConfirmDialogProps['confirmLoading']>()
      .toEqualTypeOf<boolean | undefined>();
  });

  it('uses semantic tokens and explicit forced-colors and reduced-motion modes', () => {
    const componentCss = readFileSync('src/dialog/Dialog.css', 'utf8');
    const reactStyles = readFileSync('src/styles.css', 'utf8');

    expect(reactStyles).toContain("@import './dialog/Dialog.css';");
    expect(componentCss).toContain('var(--ds-color-bg-scrim)');
    expect(componentCss).toContain('var(--ds-color-bg-surface)');
    expect(componentCss).toContain('var(--ds-color-text-primary)');
    expect(componentCss).toContain('var(--ds-radius-xl)');
    expect(componentCss).toContain('var(--ds-elevation-2)');
    expect(componentCss).toContain('var(--ds-motion-duration-medium)');
    expect(componentCss).toContain('overflow-y: auto');
    expect(componentCss).toContain('@media (forced-colors: active)');
    expect(componentCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(componentCss).not.toMatch(/#[\da-f]{3,8}\b|rgba?\(|hsla?\(/i);
  });

  it('has no axe violations for alert and confirm variants', async () => {
    const alertView = render(
      <AlertDialog
        {...defaultAlertProps}
        description="변경 사항이 저장되었습니다."
      />,
    );
    await getOpenAlertDialog();
    await expectNoAxeViolations(document.body);
    alertView.unmount();

    render(<ConfirmDialog {...defaultConfirmProps} />);
    await getOpenConfirmDialog();
    await expectNoAxeViolations(document.body);
  });
});
