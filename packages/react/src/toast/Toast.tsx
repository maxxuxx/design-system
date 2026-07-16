import {
  createContext,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, ICON_NAMES, type IconName } from '../icon';
import { resolvePortalContainer } from '../internal/portal';
import { TextButton } from '../text-button';
import { createPausableTimer, type PausableTimer } from './timer';

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

interface NormalizedToast {
  action?: ToastAction;
  duration: number;
  icon?: IconName;
  message: string;
  position: ToastPosition;
  tone: ToastTone;
}

interface ToastItem extends NormalizedToast {
  id: string;
}

interface ToastState {
  visible: ToastItem | null;
  queue: ToastItem[];
}

type PauseReason = 'document-hidden' | 'focus' | 'pointer';

const ToastContext = createContext<ToastApi | null>(null);
const INITIAL_STATE: ToastState = { queue: [], visible: null };
const TOAST_TONES: readonly ToastTone[] = ['neutral', 'success', 'danger'];
const TOAST_POSITIONS: readonly ToastPosition[] = ['top', 'bottom'];

function normalizeToastOptions(options: ToastOptions): NormalizedToast {
  if (options === null || typeof options !== 'object') {
    throw new TypeError('Toast options must be an object.');
  }

  const message =
    typeof options.message === 'string' ? options.message.trim() : '';
  if (message.length === 0) {
    throw new TypeError('Toast message must be a non-empty string.');
  }

  const position =
    options.position === undefined ? 'bottom' : options.position;
  if (!TOAST_POSITIONS.includes(position)) {
    throw new TypeError('Toast position must be "top" or "bottom".');
  }

  const tone = options.tone === undefined ? 'neutral' : options.tone;
  if (!TOAST_TONES.includes(tone)) {
    throw new TypeError(
      'Toast tone must be "neutral", "success", or "danger".',
    );
  }

  if (options.icon !== undefined && !ICON_NAMES.includes(options.icon)) {
    throw new TypeError('Toast icon must be an owned Icon name.');
  }

  let action: ToastAction | undefined;
  const requestedAction = options.action as ToastAction | undefined;
  if (requestedAction !== undefined) {
    if (position === 'top') {
      throw new TypeError('Top Toasts cannot contain actions.');
    }
    if (requestedAction === null || typeof requestedAction !== 'object') {
      throw new TypeError('Toast action must be an object.');
    }

    const label =
      typeof requestedAction.label === 'string'
        ? requestedAction.label.trim()
        : '';
    if (label.length === 0) {
      throw new TypeError('Toast action label must be a non-empty string.');
    }
    if (typeof requestedAction.onPress !== 'function') {
      throw new TypeError('Toast action onPress must be callable.');
    }
    action = { label, onPress: requestedAction.onPress };
  }

  const duration =
    options.duration === undefined
      ? action === undefined
        ? 3000
        : 5000
      : options.duration;
  if (
    typeof duration !== 'number' ||
    !Number.isFinite(duration) ||
    duration < 0
  ) {
    throw new TypeError('Toast duration must be a finite non-negative number.');
  }

  return {
    action,
    duration,
    icon: options.icon,
    message,
    position,
    tone,
  };
}

function getNextStateAfterDismissal(
  state: ToastState,
  id: string,
): ToastState {
  if (state.visible?.id === id) {
    const [visible = null, ...queue] = state.queue;
    return { queue, visible };
  }

  const queue = state.queue.filter((item) => item.id !== id);
  return queue.length === state.queue.length ? state : { ...state, queue };
}

interface ToastViewportProps {
  addPauseReason: (reason: PauseReason) => void;
  dismiss: (id: string) => void;
  item: ToastItem;
  removePauseReason: (reason: PauseReason) => void;
  rootRef: RefObject<HTMLDivElement | null>;
}

function ToastViewport({
  addPauseReason,
  dismiss,
  item,
  removePauseReason,
  rootRef,
}: ToastViewportProps) {
  const role = item.tone === 'danger' ? 'alert' : 'status';
  const live = item.tone === 'danger' ? 'assertive' : 'polite';

  const handleAction = () => {
    if (item.action === undefined) return;
    try {
      item.action.onPress();
    } finally {
      dismiss(item.id);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      removePauseReason('focus');
    }
  };

  const handlePointerEnter = (_event: PointerEvent<HTMLDivElement>) => {
    addPauseReason('pointer');
  };

  return (
    <div className="hds-toast-layer" data-position={item.position}>
      <div
        ref={rootRef}
        aria-atomic="true"
        aria-live={live}
        className="hds-toast"
        data-position={item.position}
        data-tone={item.tone}
        onBlurCapture={handleBlur}
        onFocusCapture={() => addPauseReason('focus')}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={() => removePauseReason('pointer')}
        role={role}
      >
        {item.icon === undefined ? null : (
          <span aria-hidden="true" className="hds-toast__icon">
            <Icon name={item.icon} size={20} />
          </span>
        )}
        <span className="hds-toast__message">{item.message}</span>
        {item.action === undefined ? null : (
          <TextButton
            className="hds-toast__action"
            onClick={handleAction}
            size="medium"
            tone="neutral"
            variant="clear"
          >
            {item.action.label}
          </TextButton>
        )}
      </div>
    </div>
  );
}

export function ToastProvider({
  children,
  portalContainer,
}: ToastProviderProps): ReactNode {
  const [state, setState] = useState<ToastState>(INITIAL_STATE);
  const reactId = useId();
  const nextId = useRef(0);
  const timer = useRef<PausableTimer | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const pauseReasons = useRef(new Set<PauseReason>());
  const container = resolvePortalContainer(portalContainer);
  const ownerDocument = container?.ownerDocument ?? null;

  const dismiss = useCallback((id: string) => {
    setState((current) => getNextStateAfterDismissal(current, id));
  }, []);

  const clear = useCallback(() => {
    setState((current) =>
      current.visible === null && current.queue.length === 0
        ? current
        : INITIAL_STATE,
    );
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const normalized = normalizeToastOptions(options);
      nextId.current += 1;
      const id = `toast-${reactId}-${nextId.current}`;
      const item: ToastItem = { ...normalized, id };

      setState((current) =>
        current.visible === null
          ? { queue: current.queue, visible: item }
          : { ...current, queue: [...current.queue, item] },
      );
      return id;
    },
    [reactId],
  );

  const addPauseReason = useCallback((reason: PauseReason) => {
    const reasons = pauseReasons.current;
    if (reasons.has(reason)) return;

    const shouldPause = reasons.size === 0;
    reasons.add(reason);
    if (shouldPause) timer.current?.pause();
  }, []);

  const removePauseReason = useCallback((reason: PauseReason) => {
    const reasons = pauseReasons.current;
    const removed = reasons.delete(reason);
    if (removed && reasons.size === 0) timer.current?.resume();
  }, []);

  useEffect(() => {
    timer.current?.cancel();
    timer.current = null;

    if (state.visible === null) {
      pauseReasons.current.clear();
    } else {
      const { duration, id } = state.visible;
      const element = viewport.current;
      const currentDocument = element?.ownerDocument ?? ownerDocument;
      const activeElement = currentDocument?.activeElement ?? null;

      if (element?.contains(activeElement)) {
        pauseReasons.current.add('focus');
      } else {
        pauseReasons.current.delete('focus');
      }
      if (currentDocument?.visibilityState === 'hidden') {
        pauseReasons.current.add('document-hidden');
      } else {
        pauseReasons.current.delete('document-hidden');
      }

      const nextTimer = createPausableTimer(duration, () => dismiss(id));
      timer.current = nextTimer;
      if (pauseReasons.current.size > 0) nextTimer.pause();
    }

    return () => {
      timer.current?.cancel();
      timer.current = null;
    };
  }, [dismiss, state.visible?.duration, state.visible?.id]);

  useEffect(() => {
    if (state.visible === null || ownerDocument === null) return;

    const syncVisibility = () => {
      if (ownerDocument.visibilityState === 'hidden') {
        addPauseReason('document-hidden');
      } else {
        removePauseReason('document-hidden');
      }
    };

    syncVisibility();
    ownerDocument.addEventListener('visibilitychange', syncVisibility);
    return () => {
      ownerDocument.removeEventListener('visibilitychange', syncVisibility);
      removePauseReason('document-hidden');
    };
  }, [
    addPauseReason,
    ownerDocument,
    removePauseReason,
    state.visible?.id,
  ]);

  useEffect(() => {
    if (state.visible === null || container === null) {
      removePauseReason('focus');
      removePauseReason('pointer');
      return;
    }

    const element = viewport.current;
    if (element?.matches(':hover')) {
      addPauseReason('pointer');
    } else {
      removePauseReason('pointer');
    }

    const activeElement = element?.ownerDocument.activeElement ?? null;
    if (element?.contains(activeElement)) {
      addPauseReason('focus');
    } else {
      removePauseReason('focus');
    }
  }, [
    addPauseReason,
    container,
    removePauseReason,
    state.visible === null,
  ]);

  const api = useMemo<ToastApi>(
    () => ({ clear, dismiss, show }),
    [clear, dismiss, show],
  );

  const portal =
    container !== null && state.visible !== null
      ? createPortal(
          <ToastViewport
            addPauseReason={addPauseReason}
            dismiss={dismiss}
            item={state.visible}
            removePauseReason={removePauseReason}
            rootRef={viewport}
          />,
          container,
        )
      : null;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return api;
}
