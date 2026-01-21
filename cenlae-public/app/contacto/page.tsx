'use client';

import React, { useState } from 'react';
import { NavbarCenlae } from '@/components/NavbarCenlae';
import { FooterCenlae } from '@/components/FooterCenlae';

const ContactForm = () => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const isFormValid = name.trim() !== '' && message.trim() !== '';

    const handleWhatsAppClick = () => {
        if (!isFormValid) return;
        const text = `Hola, soy ${name}. ${message}`;
        window.open(`https://wa.me/50587893709?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Nombre Completo *
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingrese su nombre completo"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:border-[#0F4C81] outline-none transition-all"
                    required
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Mensaje *
                </label>
                <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escriba su mensaje aquí..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:border-[#0F4C81] outline-none transition-all resize-none"
                    required
                />
            </div>
            <button
                type="button"
                onClick={handleWhatsAppClick}
                disabled={!isFormValid}
                className={`w-full py-4 px-6 rounded-full font-bold text-lg flex items-center justify-center space-x-3 shadow-lg transition-all ${isFormValid
                    ? 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {/* Icons can be replaced with lucide-react if material icons are mostly used */}
                <span>Enviar por WhatsApp</span>
            </button>
        </form>
    );
};

export default function ContactPage() {
    return (
        <div className="bg-white font-body min-h-screen flex flex-col transition-colors duration-300">
            <NavbarCenlae activePage="contacto" />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="w-full relative rounded-2xl overflow-hidden shadow-lg mb-12 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        alt="Hospital exterior"
                        className="w-full h-[300px] md:h-[500px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                        src="https://static.wixstatic.com/media/3743a7_f10bb11b6de74d199ebb7def67d6aa94~mv2.jpeg/v1/crop/x_2,y_0,w_1082,h_549/fill/w_1001,h_549,al_c,q_85,enc_avif,quality_auto/3743a7_f10bb11b6de74d199ebb7def67d6aa94~mv2.jpeg"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start space-y-3 px-4">
                        <h2 className="text-cenlae-primary font-display font-bold text-xl md:text-2xl uppercase tracking-wide mb-2">DIRECCIÓN</h2>
                        <div className="text-black text-base space-y-1 font-semibold leading-relaxed">
                            <p>Carretera Masaya</p>
                            <p>Km. 9.8, 250 mts al oeste</p>
                            <p>Managua. Nicaragua</p>
                            <p className="mt-2 font-bold text-lg">Hospital Vivian Pellas</p>
                            <p>Torre 1, Segundo Piso, Consultorio 208</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start space-y-3 px-4 border-t pt-8 md:pt-0 md:border-t-0 md:border-l border-gray-200 md:pl-12">
                        <h2 className="text-cenlae-primary font-display font-bold text-xl md:text-2xl uppercase tracking-wide mb-2">CONTACTO</h2>
                        <div className="text-black text-base space-y-2 leading-relaxed">
                            <p><span className="font-bold">Consultas:</span> <a className="hover:text-cenlae-primary transition-colors" href="tel:+50587893709">(+505) 8789 3709</a></p>
                            <p><a className="hover:text-cenlae-primary transition-colors" href="tel:+50522556900">(+505) 2255 6900 Ext. 4208</a></p>
                            <p><span className="font-bold">Emergencias:</span> <a className="hover:text-cenlae-primary transition-colors" href="tel:+50585500592">(+505) 8550 0592</a></p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end space-y-3 px-4 border-t pt-8 md:pt-0 md:border-t-0 md:border-l border-gray-200">
                        <h2 className="text-cenlae-primary font-display font-bold text-xl md:text-2xl uppercase tracking-wide mb-2 text-center md:text-right w-full">HORARIO DE ATENCIÓN</h2>
                        <div className="text-black text-base space-y-1 font-semibold leading-relaxed text-center md:text-right w-full">
                            <p>Lunes a Viernes</p>
                            <p className="text-lg">08:00 AM - 05:00 PM</p>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="mt-12 w-full">
                    <div className="w-full h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                        <iframe
                            src="https://maps.google.com/maps?q=12.08611537797879,-86.23393562820002+(Dr.+Milton+Mairena)&z=17&output=embed"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Ubicación Dr. Milton Mairena"
                        ></iframe>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=12.08611537797879,-86.23393562820002"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <span>Abrir en Google Maps</span>
                        </a>
                        <a
                            href="https://waze.com/ul?ll=12.08611537797879,-86.23393562820002&navigate=yes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#33ccff] hover:bg-[#00aadd] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <span>Ir con Waze</span>
                        </a>
                    </div>
                </div>

                {/* Contact Form Section */}
                <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-slate-700">
                        <h2 className="text-[#0F4C81] dark:text-blue-400 font-display font-bold text-2xl md:text-3xl uppercase tracking-wide mb-6 text-center">Escríbenos</h2>
                        <ContactForm />
                    </div>
                    <div className="hidden lg:block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://static.wixstatic.com/media/3743a7_73ce9cf846ed475b8520a0369aa50889~mv2.jpg/v1/fill/w_1063,h_724,al_c,q_85,enc_avif,quality_auto/Imagen%20de%20WhatsApp%202025-10-22%20a%20las%2017_45_13_ef55356c.jpg"
                            alt="Dr. Milton Mairena"
                            className="w-full h-auto max-w-[540px] mx-auto rounded-3xl shadow-2xl object-cover aspect-square"
                        />
                    </div>
                </div>
            </main>

            <FooterCenlae />
        </div>
    );
}
