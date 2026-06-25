import { afterEach, beforeEach, describe, expect, it, jest, mock } from 'bun:test';

import { debounce } from './utils';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls the function once after the delay when invoked repeatedly', () => {
    const fn = mock(() => {});
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('resets the timer on each invocation', () => {
    const fn = mock(() => {});
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(50);
    debounced();
    jest.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
