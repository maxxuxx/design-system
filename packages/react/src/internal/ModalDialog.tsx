import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  acquireBodyScrollLock,
  closeDialog,
  getExitDurationMs,
  isValidInitialFocusTarget,
  showModal,
  trapDialogTabKey,
} from './modal-dialog';
import { resolvePortalContainer } from './portal';

type ModalDialogPhase = 'closed' | 'open' | 'closing';
type ModalDialogRole = 'alertdialog' | 'dialog';

export interface ModalDialogProps {
  open: boolean;
  dismissible: boolean;
  portalContainer?: HTMLElement | null;
  initialFocusRef?: RefObject<HTMLElement | null>;
  fallbackFocusRef: RefObject<HTMLElement | null>;
  onEscape: () => void;
  onBackdrop: () => void;
  role: ModalDialogRole;
  ariaLabelledBy: string;
  ariaDescribedBy?: string;
  className: string;
  children: ReactNode;
}

export function ModalDialog({
  ariaDescribedBy,
  ariaLabelledBy,
  children,
  className,
  dismissible,
  fallbackFocusRef,
  initialFocusRef,
  onBackdrop,
  onEscape,
  open,
  portalContainer,
  role,
}: ModalDialogProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [phase, setPhase] = useState<ModalDialogPhase>(
    open ? 'open' : 'closed',
  );
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const releaseScrollLockRef = useRef<(() => void) | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitGenerationRef = useRef(0);
  const activeCycleRef = useRef(false);
  const backdropPointerRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const openRef = useRef(open);
  phaseRef.current = phase;
  openRef.current = open;

  const clearExitTimer = useCallback(() => {
    exitGenerationRef.current += 1;
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
    if (openRef.current) return;
    releaseActiveCycle();
    phaseRef.current = 'closed';
    setPhase('closed');
  }, [releaseActiveCycle]);

  useEffect(() => {
    setContainer(resolvePortalContainer(portalContainer));
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
      fallbackFocusRef.current?.focus();
    }
  }, [container, fallbackFocusRef, initialFocusRef, phase]);

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
    const exitGeneration = exitGenerationRef.current;
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      if (
        exitGenerationRef.current !== exitGeneration
        || openRef.current
      ) return;
      finishClose();
    }, duration);
    return clearExitTimer;
  }, [clearExitTimer, finishClose, phase]);

  useEffect(() => releaseActiveCycle, [releaseActiveCycle]);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    backdropPointerRef.current = null;
    if (dismissible) onEscape();
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
    ) onBackdrop();
  };

  if (!container || phase === 'closed') return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      aria-modal="true"
      className={className}
      data-state={phase}
      role={role}
      onCancel={handleCancel}
      onKeyDown={(event) => {
        trapDialogTabKey(event.currentTarget, event.nativeEvent);
      }}
      onPointerCancel={() => {
        backdropPointerRef.current = null;
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {children}
    </dialog>,
    container,
  );
}
