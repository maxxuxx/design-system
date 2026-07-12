export interface PausableTimer {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export function createPausableTimer(
  duration: number,
  onComplete: () => void,
): PausableTimer {
  let remaining = duration;
  let startedAt: number | null = null;
  let handle: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const pause = () => {
    if (cancelled || handle === null || startedAt === null) return;

    remaining = Math.max(0, remaining - (Date.now() - startedAt));
    clearTimeout(handle);
    handle = null;
    startedAt = null;
  };

  const resume = () => {
    if (cancelled || handle !== null || remaining <= 0) return;

    startedAt = Date.now();
    handle = setTimeout(() => {
      handle = null;
      startedAt = null;
      remaining = 0;
      cancelled = true;
      onComplete();
    }, remaining);
  };

  const cancel = () => {
    if (cancelled) return;

    cancelled = true;
    if (handle !== null) clearTimeout(handle);
    handle = null;
    startedAt = null;
  };

  resume();

  return { cancel, pause, resume };
}
