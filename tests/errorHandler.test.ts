import { describe, it, expect, vi } from 'vitest';
import { classifyError, AppError } from '../src/lib/errorHandler';

describe('Error Handler', () => {
    describe('classifyError', () => {
        it('should classify network errors correctly', () => {
            const networkError = new TypeError('Failed to fetch');
            const result = classifyError(networkError);

            expect(result.type).toBe('network');
            expect(result.retryable).toBe(true);
            expect(result.userMessage).toContain('conexión');
        });

        it('should classify Firebase auth errors', () => {
            const authError = { code: 'auth/user-not-found', message: 'User not found' };
            const result = classifyError(authError);

            expect(result.type).toBe('auth');
            expect(result.code).toBe('auth/user-not-found');
            expect(result.retryable).toBe(false);
        });

        it('should classify permission errors', () => {
            const permError = { code: 'permission-denied', message: 'Permission denied' };
            const result = classifyError(permError);

            expect(result.type).toBe('permission');
            expect(result.retryable).toBe(false);
        });

        it('should classify retryable Firebase errors', () => {
            const unavailableError = { code: 'unavailable', message: 'Service unavailable' };
            const result = classifyError(unavailableError);

            expect(result.type).toBe('firebase');
            expect(result.retryable).toBe(true);
        });

        it('should classify deadline exceeded as retryable', () => {
            const timeoutError = { code: 'deadline-exceeded', message: 'Timeout' };
            const result = classifyError(timeoutError);

            expect(result.type).toBe('firebase');
            expect(result.retryable).toBe(true);
        });

        it('should classify unknown errors', () => {
            const unknownError = new Error('Something weird happened');
            const result = classifyError(unknownError);

            expect(result.type).toBe('unknown');
            expect(result.code).toBe('UNKNOWN_ERROR');
        });

        it('should return AppError unchanged', () => {
            const appError: AppError = {
                type: 'validation',
                code: 'INVALID_DATA',
                message: 'Invalid data',
                userMessage: 'Datos inválidos',
                retryable: false
            };
            const result = classifyError(appError);

            expect(result).toEqual(appError);
        });

        it('should handle null gracefully', () => {
            expect(classifyError(null).type).toBe('unknown');
        });

        it('should handle undefined gracefully', () => {
            expect(classifyError(undefined).type).toBe('unknown');
        });

        it('should provide Spanish messages for auth errors', () => {
            const authError = { code: 'auth/wrong-password', message: 'Wrong password' };
            const result = classifyError(authError);

            expect(result.userMessage).toContain('contraseña');
        });

        it('should provide Spanish messages for network errors', () => {
            const networkError = new TypeError('Failed to fetch');
            const result = classifyError(networkError);

            expect(result.userMessage).toContain('conexión');
            expect(result.userMessage).toContain('internet');
        });
    });
});

// Note: withRetry tests with fake timers are complex
// They are tested manually in the browser environment
