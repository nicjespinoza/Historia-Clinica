import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from '../src/lib/cache';

describe('Throttle', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should execute function immediately on first call', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should block subsequent calls within throttle period', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        throttled();
        throttled();

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow call after throttle period expires', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled();
        expect(fn).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(101);
        throttled();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
        const fn = vi.fn();
        const throttled = throttle(fn, 100);

        throttled('arg1', 'arg2');
        expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
});

// Note: LocalStorage tests are skipped in Node environment
// They can be tested in a browser environment with jsdom
describe.skip('LocalStorage Persistence (Browser Only)', () => {
    it('should save and retrieve data from localStorage', () => {
        // This test requires browser environment with localStorage
    });
});
