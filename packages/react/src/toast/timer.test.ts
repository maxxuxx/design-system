import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPausableTimer } from './timer';

afterEach(() => {
  vi.useRealTimers();
});

describe('createPausableTimer', () => {
  it('starts one timeout and invokes the completion callback once', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    createPausableTimer(3000, onComplete);

    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(2999);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps duration zero persistent without scheduling a timeout', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    const timer = createPausableTimer(0, onComplete);
    timer.pause();
    timer.resume();
    vi.runAllTimers();

    expect(vi.getTimerCount()).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('pauses with remaining time and makes overlapping calls idempotent', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const timer = createPausableTimer(1000, onComplete);

    vi.advanceTimersByTime(400);
    timer.pause();
    timer.pause();
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(5000);
    expect(onComplete).not.toHaveBeenCalled();

    timer.resume();
    timer.resume();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(599);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('cancels idempotently and never resumes after cancellation', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const timer = createPausableTimer(1000, onComplete);

    vi.advanceTimersByTime(200);
    timer.cancel();
    timer.cancel();
    timer.resume();
    vi.runAllTimers();

    expect(vi.getTimerCount()).toBe(0);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
