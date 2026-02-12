/**
 * Error Handler Centralizado
 * 
 * Proporciona manejo de errores consistente con:
 * - Clasificación de errores por tipo
 * - Mensajes amigables en español
 * - Logging estructurado
 * - Retry automático para errores de red
 */

// ============================================================
// TIPOS DE ERROR
// ============================================================

export type ErrorType =
    | 'network'      // Sin conexión, timeout
    | 'auth'         // No autenticado, sesión expirada
    | 'permission'   // Sin permisos
    | 'validation'   // Datos inválidos
    | 'not_found'    // Recurso no encontrado
    | 'firebase'     // Errores específicos de Firebase
    | 'unknown';     // Errores desconocidos

export interface AppError {
    type: ErrorType;
    code: string;
    message: string;           // Mensaje técnico
    userMessage: string;       // Mensaje amigable para el usuario
    originalError?: Error;
    retryable: boolean;
}

// ============================================================
// MAPEO DE MENSAJES EN ESPAÑOL
// ============================================================

const USER_MESSAGES: Record<ErrorType, string> = {
    network: 'No hay conexión a internet. Por favor, verifica tu conexión e intenta de nuevo.',
    auth: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    permission: 'No tienes permisos para realizar esta acción.',
    validation: 'Los datos ingresados no son válidos. Por favor, revisa e intenta de nuevo.',
    not_found: 'El recurso solicitado no fue encontrado.',
    firebase: 'Ocurrió un error al procesar tu solicitud. Intenta de nuevo.',
    unknown: 'Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.'
};

// Firebase error codes a mensajes específicos
const FIREBASE_MESSAGES: Record<string, string> = {
    'permission-denied': 'No tienes permisos para acceder a estos datos.',
    'unavailable': 'El servicio no está disponible. Intenta más tarde.',
    'deadline-exceeded': 'La operación tardó demasiado. Intenta de nuevo.',
    'resource-exhausted': 'Has realizado muchas solicitudes. Espera un momento.',
    'failed-precondition': 'La operación no puede realizarse en este momento.',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
    'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
};

// ============================================================
// CLASIFICACIÓN DE ERRORES
// ============================================================

/**
 * Clasifica un error y retorna información estructurada
 */
export function classifyError(error: unknown): AppError {
    // Si ya es un AppError, retornarlo
    if (isAppError(error)) {
        return error;
    }

    const err = error as any;

    // Error de red (fetch failed, timeout, etc.)
    if (isNetworkError(err)) {
        return {
            type: 'network',
            code: 'NETWORK_ERROR',
            message: err.message || 'Network error',
            userMessage: USER_MESSAGES.network,
            originalError: err,
            retryable: true
        };
    }

    // Errores de Firebase
    if (err?.code) {
        const code = err.code;

        // Auth errors
        if (code.startsWith('auth/')) {
            return {
                type: 'auth',
                code,
                message: err.message,
                userMessage: FIREBASE_MESSAGES[code] || USER_MESSAGES.auth,
                originalError: err,
                retryable: false
            };
        }

        // Permission errors
        if (code === 'permission-denied') {
            return {
                type: 'permission',
                code,
                message: err.message,
                userMessage: FIREBASE_MESSAGES[code] || USER_MESSAGES.permission,
                originalError: err,
                retryable: false
            };
        }

        // Retryable Firebase errors
        if (['unavailable', 'deadline-exceeded'].includes(code)) {
            return {
                type: 'firebase',
                code,
                message: err.message,
                userMessage: FIREBASE_MESSAGES[code] || USER_MESSAGES.firebase,
                originalError: err,
                retryable: true
            };
        }

        // Other Firebase errors
        return {
            type: 'firebase',
            code,
            message: err.message,
            userMessage: FIREBASE_MESSAGES[code] || USER_MESSAGES.firebase,
            originalError: err,
            retryable: false
        };
    }

    // Error genérico
    return {
        type: 'unknown',
        code: 'UNKNOWN_ERROR',
        message: err?.message || String(error),
        userMessage: USER_MESSAGES.unknown,
        originalError: err instanceof Error ? err : undefined,
        retryable: false
    };
}

// ============================================================
// UTILIDADES
// ============================================================

function isAppError(error: unknown): error is AppError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'type' in error &&
        'code' in error &&
        'userMessage' in error
    );
}

function isNetworkError(error: any): boolean {
    if (!error) return false;

    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';

    return (
        name === 'typeerror' && message.includes('fetch') ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('offline') ||
        message.includes('connection') ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND'
    );
}

// ============================================================
// RETRY CON BACKOFF EXPONENCIAL
// ============================================================

interface RetryOptions {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
}

/**
 * Ejecuta una función con retry automático para errores de red
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        baseDelay = 1000,
        maxDelay = 10000
    } = options;

    let lastError: AppError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = classifyError(error);

            // Solo reintentar si es un error recuperable
            if (!lastError.retryable || attempt === maxAttempts) {
                throw lastError;
            }

            // Calcular delay con exponential backoff
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);


            await sleep(delay);
        }
    }

    throw lastError;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// LOGGING
// ============================================================

/**
 * Log estructurado de errores
 */
export function logError(error: AppError, context?: string): void {
    const logData = {
        timestamp: new Date().toISOString(),
        type: error.type,
        code: error.code,
        message: error.message,
        context,
        retryable: error.retryable
    };

    console.error('🔴 Error:', logData);

    // En producción, aquí se enviaría a un servicio de logging
    // como Sentry, LogRocket, etc.
}

/**
 * Muestra un error al usuario (puede integrarse con toast/alert)
 */
export function showUserError(error: AppError): void {
    // Por defecto usa console, pero puede integrarse con un sistema de notificaciones
    console.warn(`⚠️ ${error.userMessage}`);
}

// ============================================================
// EXPORTS PRINCIPALES
// ============================================================

export const errorHandler = {
    classify: classifyError,
    withRetry,
    log: logError,
    show: showUserError,
    messages: USER_MESSAGES
};

export default errorHandler;
