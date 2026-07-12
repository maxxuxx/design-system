import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../icon-button';
import {
  acquireBodyScrollLock,
  closeDialog,
  getExitDurationMs,
  isValidInitialFocusTarget,
  showModal,
  trapDialogTabKey,
} from './dialog';

export type BottomSheetCloseReason =
  | 'backdrop'
  | 'close-button'
  | 'escape';

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (
    open: boolean,
    reason: BottomSheetCloseReason,
  ) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
  dismissible?: boolean;
  portalContainer?: HTMLElement | null;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

type BottomSheetPhase = 'closed' | 'open' | 'closing';

export function BottomSheet({
  children,
  closeLabel,
  description,
  dismissible = true,
  footer,
  initialFocusRef,
  onOpenChange,
  open,
  portalContainer,
  title,
}: BottomSheetProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [phase, setPhase] = useState<BottomSheetPhase>(
    open ? 'open' : 'closed',
  );
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const releaseScrollLockRef = useRef<(() => void) | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCycleRef = useRef(false);
  const backdropPointerRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const titleId = useId();
  const descriptionId = useId();

  const clearExitTimer = useCallback(() => {
    if (exitTimerRef.current === null) return;
    clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;
  }, []);

  const releaseActiveCycle = useCallback(() => {
    clearExitTimer();
    closeDialog(dialogRef.current);
    releaseScrollLockRef.current?.();
    releaseScrollLockRef.current = null;
    activeCycleRef.current = false;
    backdropPointerRef.current = null;

    const previousFocus = previousFocusRef.current;
    previousFocusRef.current = null;
    if (previousFocus?.isConnected) previousFocus.focus();
  }, [clearExitTimer]);

  const finishClose = useCallback(() => {
    releaseActiveCycle();
    phaseRef.current = 'closed';
    setPhase('closed');
  }, [releaseActiveCycle]);

  useEffect(() => {
    setContainer(portalContainer ?? document.body);
  }, [portalContainer]);

  useEffect(() => {
    if (open) {
      clearExitTimer();
      if (phaseRef.current !== 'open') {
        phaseRef.current = 'open';
        setPhase('open');
      }
      return;
    }

    if (phaseRef.current === 'open') {
      phaseRef.current = 'closing';
      setPhase('closing');
    }
  }, [clearExitTimer, open]);

  useLayoutEffect(() => {
    if (!container || phase === 'closed') return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!activeCycleRef.current) {
      const activeElement = dialog.ownerDocument.activeElement;
      previousFocusRef.current = activeElement instanceof HTMLElement
        && activeElement !== dialog.ownerDocument.body
        ? activeElement
        : null;
      releaseScrollLockRef.current = acquireBodyScrollLock(
        dialog.ownerDocument,
      );
      activeCycleRef.current = true;
    }

    showModal(dialog);
    if (phase !== 'open') return;

    const requestedTarget = initialFocusRef?.current;
    if (isValidInitialFocusTarget(dialog, requestedTarget)) {
      requestedTarget.focus();
    }
    if (dialog.ownerDocument.activeElement !== requestedTarget) {
      closeButtonRef.current?.focus();
    }
  }, [container, initialFocusRef, phase]);

  useEffect(() => {
    if (phase !== 'closing') return;
    const dialog = dialogRef.current;
    if (!dialog) {
      finishClose();
      return;
    }

    const duration = getExitDurationMs(dialog);
    if (duration === 0) {
      finishClose();
      return;
    }

    clearExitTimer();
    exitTimerRef.current = setTimeout(finishClose, duration);
    return clearExitTimer;
  }, [clearExitTimer, finishClose, phase]);

  useEffect(() => releaseActiveCycle, [releaseActiveCycle]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    backdropPointerRef.current = null;
    if (dismissible) onOpenChange(false, 'escape');
  };

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLDialogElement>,
  ) => {
    backdropPointerRef.current = event.target === event.currentTarget
      ? event.pointerId
      : null;
  };

  const handlePointerUp = (
    event: ReactPointerEvent<HTMLDialogElement>,
  ) => {
    const startedOnBackdrop = backdropPointerRef.current === event.pointerId;
    backdropPointerRef.current = null;
    if (
      dismissible
      && startedOnBackdrop
      && event.target === event.currentTarget
    ) {
      onOpenChange(false, 'backdrop');
    }
  };

  if (!container || phase === 'closed') return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-describedby={description === undefined ? undefined : descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="ds-bottom-sheet"
      data-state={phase}
      onCancel={handleCancel}
      onKeyDown={(event) => trapDialogTabKey(event.currentTarget, event.nativeEvent)}
      onPointerCancel={() => {
        backdropPointerRef.current = null;
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <section className="ds-bottom-sheet__surface">
        <header className="ds-bottom-sheet__header">
          <div className="ds-bottom-sheet__heading-copy">
            <h2 className="ds-bottom-sheet__title" id={titleId}>{title}</h2>
            {description === undefined ? null : (
              <p className="ds-bottom-sheet__description" id={descriptionId}>
                {description}
              </p>
            )}
          </div>
          <IconButton
            ref={closeButtonRef}
            className="ds-bottom-sheet__close"
            label={closeLabel}
            name="close"
            size="small"
            variant="clear"
            onClick={() => onOpenChange(false, 'close-button')}
          />
        </header>
        <div className="ds-bottom-sheet__body">{children}</div>
        {footer === undefined ? null : (
          <footer className="ds-bottom-sheet__footer">{footer}</footer>
        )}
      </section>
    </dialog>,
    container,
  );
}
