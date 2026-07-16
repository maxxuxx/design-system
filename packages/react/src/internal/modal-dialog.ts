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
    .getPropertyValue('--hds-motion-duration-medium')
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

function isTabbable(
  dialog: HTMLDialogElement,
  element: HTMLElement,
): boolean {
  if (element.tabIndex < 0 || element.matches(':disabled')) return false;
  if (element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  for (
    let ancestor = element.parentElement;
    ancestor && ancestor !== dialog;
    ancestor = ancestor.parentElement
  ) {
    if (
      ancestor.tagName === 'DETAILS'
      && !ancestor.hasAttribute('open')
      && !(element.tagName === 'SUMMARY' && element.parentElement === ancestor)
    ) return false;
  }

  const view = dialog.ownerDocument.defaultView;
  for (
    let current: HTMLElement | null = element;
    current && current !== dialog;
    current = current.parentElement
  ) {
    const style = view?.getComputedStyle(current);
    if (
      style?.display === 'none'
      || style?.visibility === 'hidden'
      || style?.contentVisibility === 'hidden'
    ) return false;
  }
  return true;
}

function isRadioInput(element: HTMLElement): element is HTMLInputElement {
  return element.tagName === 'INPUT'
    && (element as HTMLInputElement).type === 'radio';
}

function getTabbableElements(dialog: HTMLDialogElement): HTMLElement[] {
  const candidates = Array.from(
    dialog.querySelectorAll<HTMLElement>('*'),
  ).filter((element) => isTabbable(dialog, element));

  const radioAdjusted = candidates.filter((element) => {
    if (!isRadioInput(element) || element.name.length === 0) return true;
    const group = candidates.filter((candidate) =>
      isRadioInput(candidate)
      && candidate.name === element.name
      && candidate.form === element.form);
    const checked = group.find((candidate) =>
      isRadioInput(candidate) && candidate.checked);
    return checked ? checked === element : group[0] === element;
  });

  return radioAdjusted
    .map((element, documentOrder) => ({ documentOrder, element }))
    .sort((left, right) => {
      const leftIndex = left.element.tabIndex;
      const rightIndex = right.element.tabIndex;
      const leftPositive = leftIndex > 0;
      const rightPositive = rightIndex > 0;
      if (leftPositive && rightPositive && leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }
      if (leftPositive !== rightPositive) return leftPositive ? -1 : 1;
      return left.documentOrder - right.documentOrder;
    })
    .map(({ element }) => element);
}

export function trapDialogTabKey(
  dialog: HTMLDialogElement,
  event: KeyboardEvent,
): void {
  if (event.key !== 'Tab') return;

  const tabbable = getTabbableElements(dialog);
  if (tabbable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  const first = tabbable[0]!;
  const last = tabbable.at(-1)!;
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
