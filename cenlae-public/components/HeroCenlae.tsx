'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Calendar } from 'lucide-react';
import Link from 'next/link';

export const HeroCenlae = () => {
    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-cenlae-primary/5 -skew-x-12 transform origin-top-right" />
                <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-100/50 rounded-tr-[100px] blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100"
                        >
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-cenlae-primary">
                                Cirugía Mínimamente Invasiva
                            </span>
                        </motion.div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900">
                            Cuidando su salud <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cenlae-primary to-blue-600">
                                digestiva
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                            Especialistas en cirugía laparoscópica avanzada y endoscopia digestiva. Tecnología de punta y atención humana para su bienestar.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <a
                                href="https://wa.me/50588888888" // Reemplazar con numero real
                                className="flex items-center justify-center px-8 py-4 bg-cenlae-primary text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-blue-800 hover:shadow-blue-900/30 transition-all group"
                            >
                                <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                Agendar Cita
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <Link
                                href="/servicios/quirurgicos"
                                className="flex items-center justify-center px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                                <Activity className="w-5 h-5 mr-2 text-cenlae-primary" />
                                Nuestros Servicios
                            </Link>
                        </div>

                        {/* Stats / Trust Indicators */}
                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200/60">
                            <div>
                                <h4 className="text-3xl font-bold text-gray-900">+15</h4>
                                <p className="text-sm text-gray-500 font-medium">Años Experiencia</p>
                            </div>
                            <div>
                                <h4 className="text-3xl font-bold text-gray-900">+5k</h4>
                                <p className="text-sm text-gray-500 font-medium">Pacientes Felices</p>
                            </div>
                            <div>
                                <h4 className="text-3xl font-bold text-gray-900">100%</h4>
                                <p className="text-sm text-gray-500 font-medium">Compromiso</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="relative hidden lg:block"
                    >
                        {/* Decorative circles behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100/50 to-transparent rounded-full blur-3xl" />

                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://static.wixstatic.com/media/3743a7_094060868dc34e4092b304724810246a~mv2.jpg/v1/fill/w_594,h_634,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Dr_%20Milton%20Mairena-8445.jpg"
                                alt="Dr. Milton Mairena en consulta"
                                className="w-full h-auto object-cover"
                            />

                            {/* Floating Card */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 max-w-xs"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <Activity className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Tecnología Avanzada</p>
                                        <p className="text-xs text-gray-500">Equipos de última generación</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};
