'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Globe, ChevronDown, Menu, X } from 'lucide-react';
import { DoctorAccessModal } from './DoctorAccessModal';

interface NavbarCenlaeProps {
    activePage?: 'inicio' | 'perfil' | 'servicios' | 'contacto';
}

export const NavbarCenlae = ({ activePage = 'inicio' }: NavbarCenlaeProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

    const navLinks = [
        { name: 'Inicio', href: '/', id: 'inicio' },
        { name: 'Perfil', href: '/perfil', id: 'perfil' },
        {
            name: 'Servicios',
            href: '#',
            id: 'servicios',
            submenu: [
                { name: 'Quirúrgicos', href: '/servicios/quirurgicos' },
                { name: 'Endoscópicos', href: '/servicios/endoscopicos' },
            ]
        },
        { name: 'Contacto', href: '/contacto', id: 'contacto' },
    ];

    return (
        <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24">

                    {/* Logo - responsive sizing */}
                    {/* Note: This points to the App Login in the original, but for public site logic it might point Home. 
                        Keeping original behavior or pointing to Home? Usually Logo -> Home.
                        Let's point to Home for the public site. 
                    */}
                    <div
                        onClick={() => setIsAccessModalOpen(true)}
                        className="flex-shrink-0 flex items-center -ml-2 sm:-ml-4 lg:-ml-8 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_13,y_9,w_387,h_61/fill/w_542,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                            alt="Dr. Milton Mairena Valle - Endoscopia y Laparoscopia"
                            className="h-10 sm:h-12 lg:h-16 w-auto object-contain"
                        />
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {/* Language Selector */}
                        <div className="flex items-center text-black hover:text-cenlae-primary cursor-pointer transition-colors">
                            <Globe className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Español</span>
                            <ChevronDown className="w-4 h-4 ml-1" />
                        </div>

                        {/* Nav Links */}
                        <nav className="flex space-x-8">
                            {navLinks.map((link) => (
                                <div key={link.name} className="relative group">
                                    <Link
                                        href={link.href}
                                        className={`flex items-center text-base font-semibold transition-colors tracking-wide ${activePage === link.id
                                            ? 'text-cenlae-primary hover:text-blue-700'
                                            : 'text-black hover:text-cenlae-primary'
                                            }`}
                                    >
                                        {link.name}
                                        {link.submenu && <ChevronDown className="w-4 h-4 ml-1" />}
                                    </Link>

                                    {/* Dropdown Menu */}
                                    {link.submenu && (
                                        <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-100 shadow-lg rounded-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-left z-50">
                                            <div className="py-2">
                                                {link.submenu.map((sublink) => (
                                                    <Link
                                                        key={sublink.name}
                                                        href={sublink.href}
                                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-cenlae-primary transition-colors"
                                                    >
                                                        {sublink.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* CTA Button - Replaces Link to App with absolute URL if hosted separately, 
                            but for now we assume they might be on same domain or we use absolute path.
                            Based on plan: Cross-App links.
                        */}
                        <a
                            href={`${process.env.NEXT_PUBLIC_APP_URL}/patient/login`}
                            className="bg-black text-white px-6 py-2 rounded text-sm font-semibold hover:bg-cenlae-primary transition-colors"
                        >
                            Acceso pacientes
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-black hover:text-gray-500 focus:outline-none"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-100"
                    >
                        <div className="px-4 py-4 space-y-3">
                            {navLinks.map((link) => (
                                <div key={link.name}>
                                    {link.submenu ? (
                                        <>
                                            <div className="block text-base font-semibold py-2 text-gray-500">
                                                {link.name}
                                            </div>
                                            <div className="pl-4 space-y-2">
                                                {link.submenu.map((sublink) => (
                                                    <Link
                                                        key={sublink.name}
                                                        href={sublink.href}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="block text-sm font-medium py-1 text-gray-400 hover:text-cenlae-primary"
                                                    >
                                                        {sublink.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`block text-base font-semibold py-2 ${activePage === link.id ? 'text-cenlae-primary' : 'text-gray-400'
                                                }`}
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                </div>
                            ))}
                            <a
                                href={`${process.env.NEXT_PUBLIC_APP_URL}/patient/login`}
                                className="block w-full text-center bg-gray-100 text-gray-500 px-6 py-3 rounded text-sm font-semibold mt-4"
                            >
                                Acceso pacientes
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Administrative Access Modal */}
            <DoctorAccessModal
                isOpen={isAccessModalOpen}
                onClose={() => setIsAccessModalOpen(false)}
            />
        </header>
    );
};
