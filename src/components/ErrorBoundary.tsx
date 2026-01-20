import React, { Component, ErrorInfo, ReactNode } from 'react';
import { classifyError, logError, AppError } from '../lib/errorHandler';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    onError?: (error: AppError) => void;
}

interface State {
    hasError: boolean;
    error: AppError | null;
    retryCount: number;
}

/**
 * Error Boundary mejorado con:
 * - Integración con errorHandler para clasificación de errores
 * - Logging estructurado
 * - UI mejorada con iconos
 * - Contador de reintentos
 * - Botón para ir al inicio
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        retryCount: 0
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        const classifiedError = classifyError(error);
        return { hasError: true, error: classifiedError };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const classifiedError = classifyError(error);

        // Log estructurado
        logError(classifiedError, `ComponentStack: ${errorInfo.componentStack}`);

        // Callback opcional para tracking externo
        this.props.onError?.(classifiedError);
    }

    private handleRetry = () => {
        this.setState(prev => ({
            hasError: false,
            error: null,
            retryCount: prev.retryCount + 1
        }));
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { error, retryCount } = this.state;
            const showRetry = error?.retryable !== false && retryCount < 3;

            return (
                <div className="min-h-[300px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full text-center bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-200 p-8 shadow-lg">
                        {/* Icono */}
                        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        {/* Título */}
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Algo salió mal
                        </h2>

                        {/* Mensaje amigable */}
                        <p className="text-gray-600 mb-4">
                            {error?.userMessage || 'Ha ocurrido un error inesperado.'}
                        </p>

                        {/* Detalles técnicos (colapsable) */}
                        {error && (
                            <details className="mb-4 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    Detalles técnicos
                                </summary>
                                <div className="mt-2 p-3 bg-white rounded-lg border text-xs font-mono text-gray-600 overflow-auto max-h-32">
                                    <p><strong>Tipo:</strong> {error.type}</p>
                                    <p><strong>Código:</strong> {error.code}</p>
                                    <p><strong>Mensaje:</strong> {error.message}</p>
                                </div>
                            </details>
                        )}

                        {/* Botones de acción */}
                        <div className="flex gap-3 justify-center">
                            {showRetry && (
                                <button
                                    onClick={this.handleRetry}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reintentar
                                    {retryCount > 0 && <span className="text-xs opacity-75">({retryCount}/3)</span>}
                                </button>
                            )}
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                            >
                                <Home className="w-4 h-4" />
                                Ir al inicio
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

