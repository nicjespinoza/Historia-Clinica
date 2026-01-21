import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';

export const FooterCenlae = () => {
    return (
        <footer className="bg-cenlae-footer text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Column 1: About */}
                    <div className="space-y-6">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="https://static.wixstatic.com/media/3743a7_bc65d6328e9c443e95b330a92181fbc8~mv2.png/v1/crop/x_13,y_9,w_387,h_61/fill/w_542,h_85,al_c,lg_1,q_85,enc_avif,quality_auto/logo-drmairenavalle.png"
                            alt="Dr. Milton Mairena Valle"
                            className="h-12 w-auto brightness-0 invert opacity-90"
                        />
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Comprometidos con la excelencia médica y el cuidado integral de su salud digestiva a través de tecnología de vanguardia y atención personalizada.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="bg-white/10 hover:bg-cenlae-primary p-2 rounded-full transition-colors duration-300">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="bg-white/10 hover:bg-cenlae-primary p-2 rounded-full transition-colors duration-300">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="bg-white/10 hover:bg-cenlae-primary p-2 rounded-full transition-colors duration-300">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="bg-white/10 hover:bg-cenlae-primary p-2 rounded-full transition-colors duration-300">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 flex items-center">
                            <span className="w-8 h-1 bg-cenlae-primary mr-3 rounded-full"></span>
                            Enlaces Rápidos
                        </h3>
                        <ul className="space-y-3">
                            {['Inicio', 'Perfil', 'Servicios', 'Contacto'].map((item) => (
                                <li key={item}>
                                    <Link
                                        href={item === 'Inicio' ? '/' : `/${item.toLowerCase()}`}
                                        className="text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 text-sm"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <a
                                    href="https://app.cenlae.com/app/patient/login"
                                    className="text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 text-sm"
                                >
                                    Portal Pacientes
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 flex items-center">
                            <span className="w-8 h-1 bg-cenlae-primary mr-3 rounded-full"></span>
                            Procedimientos
                        </h3>
                        <ul className="space-y-3">
                            {[
                                'Cirugía Laparoscópica',
                                'Endoscopia Digestiva',
                                'Cirugía de Obesidad',
                                'Hernias de Pared',
                                'Reflujo Gastroesofágico'
                            ].map((item) => (
                                <li key={item}>
                                    <Link href="/servicios/quirurgicos" className="text-gray-300 hover:text-white hover:translate-x-1 inline-block transition-all duration-300 text-sm">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 flex items-center">
                            <span className="w-8 h-1 bg-cenlae-primary mr-3 rounded-full"></span>
                            Contacto
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start group">
                                <MapPin className="w-5 h-5 text-cenlae-primary mr-3 mt-1 group-hover:text-white transition-colors" />
                                <span className="text-gray-300 text-sm">
                                    Hospital Vivian Pellas, Torre 2, Consultorio 608<br />
                                    Managua, Nicaragua
                                </span>
                            </li>
                            <li className="flex items-center group">
                                <Phone className="w-5 h-5 text-cenlae-primary mr-3 group-hover:text-white transition-colors" />
                                <span className="text-gray-300 text-sm">+505 8888 8888</span>
                            </li>
                            <li className="flex items-center group">
                                <Mail className="w-5 h-5 text-cenlae-primary mr-3 group-hover:text-white transition-colors" />
                                <span className="text-gray-300 text-sm">citas@drmiltonmairena.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 mt-8 text-center sm:text-left sm:flex sm:justify-between sm:items-center">
                    <p className="text-gray-400 text-xs">
                        &copy; {new Date().getFullYear()} Dr. Milton Mairena Valle. Todos los derechos reservados.
                    </p>
                    <div className="mt-4 sm:mt-0 space-x-6">
                        <Link href="/privacidad" className="text-gray-400 hover:text-white text-xs transition-colors">
                            Política de Privacidad
                        </Link>
                        <Link href="/terminos" className="text-gray-400 hover:text-white text-xs transition-colors">
                            Términos de Uso
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
