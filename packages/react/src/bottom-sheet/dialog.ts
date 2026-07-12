interface ScrollLockState {
  count: number;
  previousOverflow: string;
}

const scrollLocks = new WeakMap<Document, ScrollLockState>();
const FALLBACK_EXIT_DURATION_MS = 200;

export function acquireBodyScrollLock(document: Document): () => void {
  const current = scrollLocks.get(document);
  if (current) {
    current.count += 1;
  } else {
    scrollLocks.set(document, {
      count: 1,
      previousOverflow: document.body.style.overflow,
    });
    document.body.style.overflow = 'hidden';
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;

    const state = scrollLocks.get(document);
    if (!state) return;
    state.count -= 1;
    if (state.count > 0) return;

    document.body.style.overflow = state.previousOverflow;
    scrollLocks.delete(document);
  };
}

export function closeDialog(dialog: HTMLDialogElement | null): void {
  if (dialog?.open) dialog.close();
}

export function getExitDurationMs(dialog: HTMLDialogElement): number {
  const view = dialog.ownerDocument.defaultView;
  if (view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 0;

  const tokenValue = view
    ?.getComputedStyle(dialog)
    .getPropertyValue('--ds-motion-duration-medium')
    .trim();
  if (tokenValue?.endsWith('ms')) {
    const milliseconds = Number.parseFloat(tokenValue);
    if (Number.isFinite(milliseconds) && milliseconds >= 0) {
      return milliseconds;
    }
  }
  if (tokenValue?.endsWith('s')) {
    const seconds = Number.parseFloat(tokenValue);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }
  return FALLBACK_EXIT_DURATION_MS;
}

export function isValidInitialFocusTarget(
  dialog: HTMLDialogElement,
  target: HTMLElement | null | undefined,
): target is HTMLElement {
  if (!target || !target.isConnected || !dialog.contains(target)) return false;
  if ('disabled' in target && target.disabled === true) return false;
  return target.getAttribute('aria-hidden') !== 'true';
}

export function showModal(dialog: HTMLDialogElement): void {
  if (!dialog.open) dialog.showModal();
}

export function trapDialogTabKey(
  dialog: HTMLDialogElement,
  event: KeyboardEvent,
): void {
  if (event.key !== 'Tab') return;

  const focusable = Array.from(dialog.querySelectorAll<HTMLElement>([
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(','))).filter((element) =>
    !element.hasAttribute('hidden')
    && element.getAttribute('aria-hidden') !== 'true');

  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = focusable[0]!;
  const last = focusable.at(-1)!;
  const activeElement = dialog.ownerDocument.activeElement;
  const focusEscaped = !dialog.contains(activeElement);

  if (event.shiftKey && (activeElement === first || focusEscaped)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (activeElement === last || focusEscaped)) {
    event.preventDefault();
    first.focus();
  }
}
