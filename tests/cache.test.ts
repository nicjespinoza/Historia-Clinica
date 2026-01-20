import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { firestoreCache, debounce } from '../src/lib/cache';

describe('FirestoreCache', () => {
    beforeEach(() => {
        firestoreCache.clear();
    });

    it('should calculate cache stats correctly', async () => {
        const fetchFn = vi.fn().mockResolvedValue('data');
        await firestoreCache.getOrFetch('key1', fetchFn);
        await firestoreCache.getOrFetch('key2', fetchFn);

        const stats = firestoreCache.getStats();
        expect(stats.size).toBe(2);
        expect(stats.keys).toContain('key1');
        expect(stats.keys).toContain('key2');
    });

    it('should return cached data if valid', async () => {
        const fetchFn = vi.fn().mockResolvedValue('fresh data');

        // First call - should fetch
        const result1 = await firestoreCache.getOrFetch('test-key', fetchFn);
        expect(result1).toBe('fresh data');
        expect(fetchFn).toHaveBeenCalledTimes(1);

        // Second call - should return cached
        const result2 = await firestoreCache.getOrFetch('test-key', fetchFn);
        expect(result2).toBe('fresh data');
        expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should invalidate specific key', async () => {
        const fetchFn = vi.fn().mockResolvedValue('data');
        await firestoreCache.getOrFetch('key', fetchFn);

        firestoreCache.invalidate('key');

        await firestoreCache.getOrFetch('key', fetchFn);
        expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('should invalidate by pattern', async () => {
        const fetchFn = vi.fn().mockResolvedValue('data');
        await firestoreCache.getOrFetch('user:1', fetchFn);
        await firestoreCache.getOrFetch('user:2', fetchFn);
        await firestoreCache.getOrFetch('post:1', fetchFn);

        firestoreCache.invalidatePattern('^user:');

        const stats = firestoreCache.getStats();
        expect(stats.size).toBe(1);
        expect(stats.keys).toContain('post:1');
    });

    it('should expire data after TTL', async () => {
        vi.useFakeTimers();
        const fetchFn = vi.fn().mockResolvedValue('data');

        // Cache with 1 minute TTL
        await firestoreCache.getOrFetch('key', fetchFn, 60000);

        // Fast forward 30s - should still be cached
        vi.advanceTimersByTime(30000);
        await firestoreCache.getOrFetch('key', fetchFn);
        expect(fetchFn).toHaveBeenCalledTimes(1);

        // Fast forward another 31s - should be expired
        vi.advanceTimersByTime(31000);
        await firestoreCache.getOrFetch('key', fetchFn);
        expect(fetchFn).toHaveBeenCalledTimes(2);

        vi.useRealTimers();
    });
});

describe('Debounce', () => {
    it('should debounce function calls', () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 100);

        debounced();
        debounced();
        debounced();

        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });
});
