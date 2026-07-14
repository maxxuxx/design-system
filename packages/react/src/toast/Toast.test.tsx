import { readFileSync } from 'node:fs';
import { type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import { ICON_PATHS } from '../icon';
import { expectNoAxeViolations } from '../test/accessibility';
import {
  ToastProvider,
  type ToastApi,
  type ToastOptions,
  useToast,
} from './Toast';

let currentApi: ToastApi | null = null;

function CaptureApi({ children }: { children?: ReactNode }) {
  currentApi = useToast();
  return children ?? null;
}

function getApi(): ToastApi {
  if (currentApi === null) throw new Error('Toast API was not captured');
  return currentApi;
}

function show(options: ToastOptions): string {
  let id = '';
  act(() => {
    id = getApi().show(options);
  });
  return id;
}

function renderProvider(
  portalContainer?: HTMLElement | null,
  children?: ReactNode,
) {
  return render(
    <ToastProvider portalContainer={portalContainer}>
      <CaptureApi>{children}</CaptureApi>
    </ToastProvider>,
  );
}

afterEach(() => {
  cleanup();
  currentApi = null;
  vi.useRealTimers();
});

describe('ToastProvider', () => {
  it('throws a descriptive error when useToast is called outside its provider', () => {
    expect(() => render(<CaptureApi />)).toThrow(/useToast.*ToastProvider/i);
  });

  it('is SSR-safe and renders provider children without a portal', () => {
    const html = renderToString(
      <ToastProvider>
        <span>server child</span>
      </ToastProvider>,
    );

    expect(html).toContain('server child');
  });

  it('normalizes defaults and expires plain and actionable Toasts at 3000ms and 5000ms', () => {
    vi.useFakeTimers();
    renderProvider();

    show({ message: ' 기본 알림 ' });
    expect(screen.getByRole('status')).toHaveTextContent('기본 알림');
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'neutral');
    expect(screen.getByRole('status')).toHaveAttribute(
      'data-position',
      'bottom',
    );

    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).toBeNull();

    show({
      action: { label: ' 실행 ', onPress: vi.fn() },
      message: '작업 알림',
    });
    expect(screen.getByRole('button', { name: '실행' })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(4999));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps duration zero persistent and clears its timer on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderProvider();

    show({ duration: 0, message: '지속 알림' });
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText('지속 알림')).toBeInTheDocument();

    act(() => getApi().dismiss('missing'));
    expect(screen.getByText('지속 알림')).toBeInTheDocument();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels a running visible timer on clear and provider unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderProvider();

    show({ duration: 1000, message: '지울 타이머' });
    expect(vi.getTimerCount()).toBe(1);
    act(() => getApi().clear());
    expect(vi.getTimerCount()).toBe(0);

    show({ duration: 1000, message: '언마운트 타이머' });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns stable prefixed monotonic IDs and advances one-visible FIFO order', () => {
    renderProvider();

    const first = show({ duration: 0, message: '첫 번째' });
    const second = show({ duration: 0, message: '두 번째' });
    const third = show({ duration: 0, message: '세 번째' });

    expect(first).toMatch(/^toast-.+-1$/);
    expect(second).toBe(first.replace(/-1$/, '-2'));
    expect(third).toBe(first.replace(/-1$/, '-3'));
    expect(screen.getByText('첫 번째')).toBeInTheDocument();
    expect(screen.queryByText('두 번째')).toBeNull();

    act(() => getApi().dismiss(first));
    expect(screen.getByText('두 번째')).toBeInTheDocument();
    act(() => getApi().dismiss(second));
    expect(screen.getByText('세 번째')).toBeInTheDocument();
  });

  it('dismisses queued IDs without disturbing the visible Toast', () => {
    renderProvider();
    const first = show({ duration: 0, message: '첫 번째' });
    const queued = show({ duration: 0, message: '제거할 대기 항목' });
    show({ duration: 0, message: '마지막' });

    act(() => getApi().dismiss(queued));
    expect(screen.getByText('첫 번째')).toBeInTheDocument();
    act(() => getApi().dismiss(first));
    expect(screen.getByText('마지막')).toBeInTheDocument();
    expect(screen.queryByText('제거할 대기 항목')).toBeNull();
  });

  it('clears visible and queued Toasts without invoking actions', () => {
    const onPress = vi.fn();
    renderProvider();
    show({
      action: { label: '실행', onPress },
      duration: 0,
      message: '첫 번째',
    });
    show({ duration: 0, message: '두 번째' });

    act(() => getApi().clear());

    expect(screen.queryByRole('status')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not start queued timers until each Toast becomes visible', () => {
    vi.useFakeTimers();
    renderProvider();
    const first = show({ duration: 0, message: '고정' });
    show({ duration: 100, message: '대기' });

    act(() => vi.advanceTimersByTime(500));
    act(() => getApi().dismiss(first));
    expect(screen.getByText('대기')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(99));
    expect(screen.getByText('대기')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('대기')).toBeNull();
  });

  it('keeps a newly visible queued timer paused under a stationary pointer', () => {
    vi.useFakeTimers();
    renderProvider();
    const first = show({ duration: 0, message: '포인터 첫 번째' });
    show({ duration: 100, message: '포인터 두 번째' });
    const toast = screen.getByRole('status');

    fireEvent.pointerEnter(toast);
    act(() => getApi().dismiss(first));
    expect(screen.getByText('포인터 두 번째')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('포인터 두 번째')).toBeInTheDocument();

    fireEvent.pointerLeave(screen.getByRole('status'));
    act(() => vi.advanceTimersByTime(99));
    expect(screen.getByText('포인터 두 번째')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('포인터 두 번째')).toBeNull();
  });

  it('keeps a newly visible queued timer paused while its reused action retains focus', () => {
    vi.useFakeTimers();
    renderProvider();
    const first = show({
      action: { label: '같은 액션', onPress: vi.fn() },
      duration: 0,
      message: '포커스 첫 번째',
    });
    show({
      action: { label: '같은 액션', onPress: vi.fn() },
      duration: 100,
      message: '포커스 두 번째',
    });
    const firstAction = screen.getByRole('button', { name: '같은 액션' });

    act(() => firstAction.focus());
    expect(firstAction).toHaveFocus();
    act(() => getApi().dismiss(first));
    const secondAction = screen.getByRole('button', { name: '같은 액션' });
    expect(secondAction).toHaveFocus();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('포커스 두 번째')).toBeInTheDocument();

    act(() => secondAction.blur());
    expect(secondAction).not.toHaveFocus();
    act(() => vi.advanceTimersByTime(99));
    expect(screen.getByText('포커스 두 번째')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('포커스 두 번째')).toBeNull();
  });

  it('invokes an action before dismissing and advancing the queue', async () => {
    const events: string[] = [];
    const user = userEvent.setup();
    renderProvider();
    show({
      action: {
        label: '되돌리기',
        onPress: () => {
          expect(screen.getByText('삭제됨')).toBeInTheDocument();
          events.push('action');
        },
      },
      duration: 0,
      message: '삭제됨',
    });
    show({ duration: 0, message: '다음 알림' });

    await user.click(screen.getByRole('button', { name: '되돌리기' }));

    expect(events).toEqual(['action']);
    expect(screen.getByText('다음 알림')).toBeInTheDocument();
  });

  it('dismisses in a finally path when an action throws', () => {
    const errors: unknown[] = [];
    const handleError = (event: ErrorEvent) => {
      errors.push(event.error);
      event.preventDefault();
    };
    window.addEventListener('error', handleError);
    renderProvider();
    show({
      action: {
        label: '실패',
        onPress: () => {
          throw new Error('action failed');
        },
      },
      duration: 0,
      message: '실패할 알림',
    });
    show({ duration: 0, message: '그래도 다음 알림' });

    try {
      fireEvent.click(screen.getByRole('button', { name: '실패' }));
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual(new Error('action failed'));
      expect(screen.getByText('그래도 다음 알림')).toBeInTheDocument();
    } finally {
      window.removeEventListener('error', handleError);
    }
  });

  it('validates and trims input before consuming an ID', () => {
    renderProvider();
    const invalid = [
      { message: '   ' },
      { duration: -1, message: '음수' },
      { duration: Number.NaN, message: 'NaN' },
      { duration: Number.POSITIVE_INFINITY, message: '무한' },
      { duration: null, message: 'null duration' },
      { message: 'null tone', tone: null },
      { message: 'null position', position: null },
      { action: { label: ' ', onPress: vi.fn() }, message: '빈 액션' },
      { action: { label: '실행', onPress: null }, message: '잘못된 액션' },
      {
        action: { label: '실행', onPress: vi.fn() },
        message: '상단 액션',
        position: 'top',
      },
    ] as unknown as ToastOptions[];

    for (const options of invalid) {
      expect(() => getApi().show(options)).toThrow();
    }

    const first = show({ duration: 0, message: ' 유효한 메시지 ' });
    expect(first).toMatch(/-1$/);
    expect(screen.getByText('유효한 메시지')).toBeInTheDocument();
  });

  it('rejects top actions at type level', () => {
    type TopOptions = Extract<ToastOptions, { position: 'top' }>;
    expectTypeOf<TopOptions['action']>().toEqualTypeOf<undefined>();

    // @ts-expect-error top Toasts cannot contain actions
    const invalidTop: ToastOptions = {
      action: { label: '실행', onPress: () => undefined },
      message: '상단',
      position: 'top',
    };
    expect(invalidTop).toBeDefined();
  });

  it('uses atomic polite status semantics for neutral and success', () => {
    renderProvider();
    const first = show({ duration: 0, message: '중립', tone: 'neutral' });
    const neutral = screen.getByRole('status');
    expect(neutral).toHaveAttribute('aria-live', 'polite');
    expect(neutral).toHaveAttribute('aria-atomic', 'true');

    act(() => getApi().dismiss(first));
    show({ duration: 0, message: '성공', tone: 'success' });
    const success = screen.getByRole('status');
    expect(success).toHaveAttribute('aria-live', 'polite');
    expect(success).toHaveAttribute('aria-atomic', 'true');
  });

  it('uses atomic assertive alert semantics for danger', () => {
    renderProvider();
    show({ duration: 0, message: '위험', tone: 'danger' });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(alert).toHaveAttribute('aria-atomic', 'true');
  });

  it('renders a requested owned Icon as decorative and explicitly inherited', () => {
    renderProvider();
    show({ duration: 0, icon: 'check', message: '완료', tone: 'success' });

    const icon = screen.getByRole('status').querySelector('.ds-icon');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(
      Array.from(icon?.querySelectorAll('path') ?? [], (path) =>
        path.getAttribute('d'),
      ),
    ).toEqual(ICON_PATHS.check);
  });

  it('pauses for overlapping pointer and focus reasons and resumes only after both clear', () => {
    vi.useFakeTimers();
    renderProvider();
    show({
      action: { label: '실행', onPress: vi.fn() },
      duration: 1000,
      message: '겹친 일시정지',
    });
    const toast = screen.getByRole('status');
    const action = screen.getByRole('button', { name: '실행' });

    act(() => vi.advanceTimersByTime(400));
    fireEvent.pointerEnter(toast);
    fireEvent.focus(action);
    fireEvent.pointerLeave(toast);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('겹친 일시정지')).toBeInTheDocument();

    fireEvent.blur(action);
    act(() => vi.advanceTimersByTime(599));
    expect(screen.getByText('겹친 일시정지')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('겹친 일시정지')).toBeNull();
  });

  it('pauses while the owning document is hidden and overlaps safely with pointer pause', () => {
    vi.useFakeTimers();
    let visibility: DocumentVisibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
    renderProvider();
    show({ duration: 1000, message: '문서 일시정지' });
    const toast = screen.getByRole('status');

    act(() => vi.advanceTimersByTime(300));
    fireEvent.pointerEnter(toast);
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    fireEvent.pointerLeave(toast);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText('문서 일시정지')).toBeInTheDocument();

    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(699));
    expect(screen.getByText('문서 일시정지')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('문서 일시정지')).toBeNull();
  });

  it('migrates portals and owner documents without resetting elapsed timer time', () => {
    vi.useFakeTimers();
    const first = document.createElement('div');
    document.body.append(first);
    const foreignDocument = document.implementation.createHTMLDocument('toast');
    const second = foreignDocument.createElement('div');
    foreignDocument.body.append(second);

    const { rerender } = renderProvider(first);
    show({ duration: 1000, message: '이동 중' });
    expect(within(first).getByText('이동 중')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(400));

    rerender(
      <ToastProvider portalContainer={second}>
        <CaptureApi />
      </ToastProvider>,
    );
    expect(first).toBeEmptyDOMElement();
    expect(within(second).getByText('이동 중').textContent).toBe('이동 중');

    act(() => vi.advanceTimersByTime(599));
    expect(within(second).getByText('이동 중').textContent).toBe('이동 중');
    act(() => vi.advanceTimersByTime(1));
    expect(within(second).queryByText('이동 중')).toBeNull();
    first.remove();
  });

  it('switches document-hidden pause tracking to a migrated portal ownerDocument', () => {
    vi.useFakeTimers();
    const first = document.createElement('div');
    document.body.append(first);
    const foreignDocument = document.implementation.createHTMLDocument('toast');
    const second = foreignDocument.createElement('div');
    foreignDocument.body.append(second);
    let foreignVisibility: DocumentVisibilityState = 'hidden';
    Object.defineProperty(foreignDocument, 'visibilityState', {
      configurable: true,
      get: () => foreignVisibility,
    });

    const { rerender } = renderProvider(first);
    show({ duration: 1000, message: '문서 이동 일시정지' });
    act(() => vi.advanceTimersByTime(400));
    rerender(
      <ToastProvider portalContainer={second}>
        <CaptureApi />
      </ToastProvider>,
    );

    act(() => vi.advanceTimersByTime(5000));
    expect(within(second).getByText('문서 이동 일시정지').textContent).toBe(
      '문서 이동 일시정지',
    );
    foreignVisibility = 'visible';
    foreignDocument.dispatchEvent(new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(599));
    expect(within(second).queryByText('문서 이동 일시정지')).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(within(second).queryByText('문서 이동 일시정지')).toBeNull();
    first.remove();
  });

  it('never moves focus, responds to Escape, or locks body scrolling', () => {
    renderProvider(undefined, <button type="button">바깥 포커스</button>);
    const outside = screen.getByRole('button', { name: '바깥 포커스' });
    outside.focus();
    const bodyOverflow = document.body.style.overflow;
    const bodyPaddingRight = document.body.style.paddingRight;

    show({ duration: 0, message: '비모달 알림' });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(outside).toHaveFocus();
    expect(screen.getByText('비모달 알림')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe(bodyOverflow);
    expect(document.body.style.paddingRight).toBe(bodyPaddingRight);
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('keeps the context API and operations referentially stable', () => {
    const { rerender } = renderProvider();
    const first = getApi();

    rerender(
      <ToastProvider>
        <CaptureApi />
      </ToastProvider>,
    );
    const second = getApi();

    expect(second).toBe(first);
    expect(second.show).toBe(first.show);
    expect(second.dismiss).toBe(first.dismiss);
    expect(second.clear).toBe(first.clear);
  });

  it('uses token-safe responsive, motion, and forced-color CSS contracts', () => {
    const css = readFileSync('src/toast/Toast.css', 'utf8');

    expect(css).toContain('var(--ds-');
    expect(css).toContain('max-inline-size');
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('env(safe-area-inset-bottom');
    expect(css).toContain('.ds-toast__icon .ds-icon');
    expect(css).toContain('.ds-toast__action.ds-text-button');
    expect(css).toContain(
      ".ds-toast .ds-toast__action.ds-text-button[data-tone='neutral']",
    );
    expect(css).toContain('color: inherit');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media (forced-colors: active)');
  });

  it('has no detectable axe violations', async () => {
    renderProvider();
    show({
      action: { label: '되돌리기', onPress: vi.fn() },
      duration: 0,
      icon: 'info',
      message: '저장했습니다',
    });

    await expectNoAxeViolations(document.body);
  });
});
