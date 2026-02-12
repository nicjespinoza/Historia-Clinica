import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
}

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    showCloseButton = true
}: ModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent scrolling on body
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // Focus trap could be added here for full a11y, simplified for now

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-all"
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={cn(
                                "bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto flex flex-col max-h-[90vh]",
                                className
                            )}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby={title ? "modal-title" : undefined}
                        >
                            {/* Header */}
                            {(title || showCloseButton) && (
                                <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                                    {title && (
                                        <h3 id="modal-title" className="text-xl font-bold text-gray-900">
                                            {title}
                                        </h3>
                                    )}
                                    {showCloseButton && (
                                        <button
                                            onClick={onClose}
                                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                            aria-label="Cerrar modal"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Body */}
                            <div className="p-6 overflow-y-auto flex-1">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};
