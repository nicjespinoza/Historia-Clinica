'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCog, Stethoscope, ArrowRight } from 'lucide-react';

interface DoctorAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DoctorAccessModal = ({ isOpen, onClose }: DoctorAccessModalProps) => {
    // Redirect URLs - pointing to the private app
    const DOCTOR_LOGIN_URL = `${process.env.NEXT_PUBLIC_APP_URL}/doctor/login`;
    const ASSISTANT_LOGIN_URL = `${process.env.NEXT_PUBLIC_APP_URL}/doctor/login`; // Usually same login page for now

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100"
                        >
                            {/* Header */}
                            <div className="bg-cenlae-primary p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1"
                                >
                                    <X size={20} />
                                </button>

                                <h3 className="text-2xl font-bold mb-1">Acceso Administrativo</h3>
                                <p className="text-blue-100 text-sm">Sistema de Gestión Clínica</p>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4">
                                <p className="text-gray-600 text-sm mb-4 text-center">
                                    Seleccione su perfil para ingresar al panel de control:
                                </p>

                                {/* Doctor Option */}
                                <a
                                    href={DOCTOR_LOGIN_URL}
                                    className="group flex items-center p-4 rounded-xl border border-gray-200 hover:border-cenlae-primary hover:bg-blue-50/50 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="bg-blue-100 p-3 rounded-lg text-cenlae-primary group-hover:bg-cenlae-primary group-hover:text-white transition-colors">
                                        <Stethoscope size={24} />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-cenlae-primary transition-colors">Personal Médico</h4>
                                        <p className="text-xs text-gray-500">Doctores y especialistas</p>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-cenlae-primary transform group-hover:translate-x-1 transition-all" />
                                </a>

                                {/* Assistant Option */}
                                <a
                                    href={ASSISTANT_LOGIN_URL}
                                    className="group flex items-center p-4 rounded-xl border border-gray-200 hover:border-teal-600 hover:bg-teal-50/50 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="bg-teal-100 p-3 rounded-lg text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                        <UserCog size={24} />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-teal-700 transition-colors">Administración</h4>
                                        <p className="text-xs text-gray-500">Asistentes y recepción</p>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-300 group-hover:text-teal-600 transform group-hover:translate-x-1 transition-all" />
                                </a>
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    Acceso restringido únicamente a personal autorizado.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
