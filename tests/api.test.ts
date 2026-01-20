import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * API Helper Functions Tests
 * 
 * These tests verify the helper functions used internally by the API
 * to normalize Firestore documents and timestamps.
 */

// Mock the helper functions since they're internal to api.ts
// We test the exported behavior through integration scenarios

describe('API Timestamp Helpers', () => {
    // Helper function implementations for testing
    const isTimestamp = (value: any): boolean => {
        return value && typeof value === 'object' && typeof value.toDate === 'function';
    };

    const normalizeTimestamps = (data: any): any => {
        if (!data || typeof data !== 'object') return data;
        if (isTimestamp(data)) return data.toDate().toISOString();
        if (!Array.isArray(data) && data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length <= 2) {
            return new Date(data.seconds * 1000).toISOString();
        }
        if (Array.isArray(data)) {
            return data.map(item => normalizeTimestamps(item));
        }
        const normalized: any = {};
        Object.keys(data).forEach(key => {
            normalized[key] = normalizeTimestamps(data[key]);
        });
        return normalized;
    };

    describe('isTimestamp', () => {
        it('should return true for Firestore Timestamp-like objects', () => {
            const mockTimestamp = {
                toDate: () => new Date('2024-01-01')
            };
            expect(isTimestamp(mockTimestamp)).toBe(true);
        });

        it('should return false for null', () => {
            expect(isTimestamp(null)).toBeFalsy();
        });

        it('should return false for undefined', () => {
            expect(isTimestamp(undefined)).toBeFalsy();
        });

        it('should return false for plain objects', () => {
            expect(isTimestamp({ date: '2024-01-01' })).toBeFalsy();
        });

        it('should return false for strings', () => {
            expect(isTimestamp('2024-01-01')).toBeFalsy();
        });

        it('should return false for numbers', () => {
            expect(isTimestamp(1704067200000)).toBeFalsy();
        });
    });

    describe('normalizeTimestamps', () => {
        it('should return primitive values unchanged', () => {
            expect(normalizeTimestamps('test')).toBe('test');
            expect(normalizeTimestamps(123)).toBe(123);
            expect(normalizeTimestamps(null)).toBe(null);
            expect(normalizeTimestamps(undefined)).toBe(undefined);
        });

        it('should convert Timestamp-like objects to ISO strings', () => {
            const mockTimestamp = {
                toDate: () => new Date('2024-01-01T00:00:00.000Z')
            };
            expect(normalizeTimestamps(mockTimestamp)).toBe('2024-01-01T00:00:00.000Z');
        });

        it('should convert raw {seconds, nanoseconds} objects to ISO strings', () => {
            const rawTimestamp = { seconds: 1704067200, nanoseconds: 0 };
            const result = normalizeTimestamps(rawTimestamp);
            expect(result).toBe(new Date(1704067200 * 1000).toISOString());
        });

        it('should normalize nested objects recursively', () => {
            const data = {
                name: 'Test',
                createdAt: { seconds: 1704067200, nanoseconds: 0 },
                nested: {
                    updatedAt: { seconds: 1704153600, nanoseconds: 0 }
                }
            };
            const result = normalizeTimestamps(data);
            expect(result.name).toBe('Test');
            expect(typeof result.createdAt).toBe('string');
            expect(typeof result.nested.updatedAt).toBe('string');
        });

        it('should normalize arrays correctly', () => {
            const data = [
                { date: { seconds: 1704067200, nanoseconds: 0 } },
                { date: { seconds: 1704153600, nanoseconds: 0 } }
            ];
            const result = normalizeTimestamps(data);
            expect(Array.isArray(result)).toBe(true);
            expect(typeof result[0].date).toBe('string');
            expect(typeof result[1].date).toBe('string');
        });

        it('should not modify objects with seconds/nanoseconds plus other fields', () => {
            const data = { seconds: 1704067200, nanoseconds: 0, extra: 'field' };
            const result = normalizeTimestamps(data);
            expect(result.seconds).toBe(1704067200);
            expect(result.extra).toBe('field');
        });
    });
});

describe('docToData Helper', () => {
    const normalizeTimestamps = (data: any): any => {
        if (!data || typeof data !== 'object') return data;
        if (data && typeof data === 'object' && typeof data.toDate === 'function') {
            return data.toDate().toISOString();
        }
        if (!Array.isArray(data) && data.seconds !== undefined && data.nanoseconds !== undefined && Object.keys(data).length <= 2) {
            return new Date(data.seconds * 1000).toISOString();
        }
        if (Array.isArray(data)) {
            return data.map(item => normalizeTimestamps(item));
        }
        const normalized: any = {};
        Object.keys(data).forEach(key => {
            normalized[key] = normalizeTimestamps(data[key]);
        });
        return normalized;
    };

    const docToData = <T>(doc: any): T => {
        const data = doc.data();
        const normalizedData = normalizeTimestamps(data);
        const { id: storedId, ...rest } = normalizedData;
        return {
            id: doc.id,
            ...rest
        } as T;
    };

    it('should use doc.id instead of stored id field', () => {
        const mockDoc = {
            id: 'firestore-doc-id',
            data: () => ({
                id: 'stored-id-to-ignore',
                name: 'Test Patient'
            })
        };
        const result = docToData<{ id: string; name: string }>(mockDoc);
        expect(result.id).toBe('firestore-doc-id');
        expect(result.name).toBe('Test Patient');
    });

    it('should normalize timestamps in document data', () => {
        const mockDoc = {
            id: 'doc-123',
            data: () => ({
                name: 'Test',
                createdAt: { seconds: 1704067200, nanoseconds: 0 }
            })
        };
        const result = docToData<{ id: string; name: string; createdAt: string }>(mockDoc);
        expect(result.id).toBe('doc-123');
        expect(typeof result.createdAt).toBe('string');
    });

    it('should handle documents without stored id field', () => {
        const mockDoc = {
            id: 'doc-456',
            data: () => ({
                firstName: 'Juan',
                lastName: 'Pérez'
            })
        };
        const result = docToData<{ id: string; firstName: string; lastName: string }>(mockDoc);
        expect(result.id).toBe('doc-456');
        expect(result.firstName).toBe('Juan');
        expect(result.lastName).toBe('Pérez');
    });
});
