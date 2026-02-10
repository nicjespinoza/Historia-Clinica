import React, { useEffect, useState } from 'react';
import { NavbarCenlae } from './NavbarCenlae';
import { FooterCenlae } from './FooterCenlae';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Facebook, Instagram, Linkedin } from 'lucide-react';
import { VisitorChatWidget } from '../../components/chat/VisitorChatWidget';

const ContactForm = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const isFormValid = name.trim() !== '' && message.trim() !== '';

    const handleWhatsAppClick = () => {
        if (!isFormValid) return;
        const text = t('contact.whatsapp_template', { name, message });
        window.open(`https://wa.me/50587893709?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
                <label htmlFor="name" className="block text-base font-bold text-gray-800 mb-2">
                    {t('contact.full_name')}: <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border-none bg-[#083c79] text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-inner"
                    required
                />
            </div>
            <div>
                <label htmlFor="message" className="block text-base font-bold text-gray-800 mb-2">
                    {t('contact.message')}: <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-4 rounded-xl border-none bg-[#083c79] text-white placeholder-blue-300/50 focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none shadow-inner"
                    required
                />
            </div>
            <button
                type="button"
                onClick={handleWhatsAppClick}
                disabled={!isFormValid}
                className={`py-3 px-8 rounded-full font-bold text-lg flex items-center gap-3 shadow-md transition-all ${isFormValid
                    ? 'bg-gray-300 hover:bg-green-500 hover:text-white text-gray-600 transform hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
            >
                <span>{t('contact.send')}</span>
                <span className="material-icons text-xl">chat</span>
            </button>
        </form>
    );
};

export const ContactPage = () => {
    const { t } = useTranslation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-white font-body min-h-screen flex flex-col transition-colors duration-300">
            <NavbarCenlae activePage="contacto" />

            <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="w-full relative rounded-2xl overflow-hidden shadow-lg mb-12 group">
                    <img alt="Hospital exterior" className="w-full h-[300px] md:h-[500px] object-cover object-center transform transition-transform duration-700 group-hover:scale-105" src="https://static.wixstatic.com/media/3743a7_f10bb11b6de74d199ebb7def67d6aa94~mv2.jpeg/v1/crop/x_2,y_0,w_1082,h_549/fill/w_1001,h_549,al_c,q_85,enc_avif,quality_auto/3743a7_f10bb11b6de74d199ebb7def67d6aa94~mv2.jpeg" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start space-y-3 px-4">
                        <h2 className="text-cenlae-primary font-display font-bold text-xl md:text-2xl uppercase tracking-wide mb-2">{t('contact.address_title')}</h2>
                        <div className="text-black text-base space-y-1 font-semibold leading-relaxed">
                            <p>Carretera Masaya</p>
                            <p>Km. 9.8, 250 mts al oeste</p>
                            <p>Managua. Nicaragua</p>
                            <p className="mt-2 font-bold text-lg">Hospital Vivian Pellas</p>
                            <p>Torre 1, Segundo Piso, Consultorio 208</p>
                        </div>

                        {/* Social Media Icons */}
                        <div className="flex items-center gap-3 mt-6">
                            <a href="https://www.facebook.com/Dr.MiltonMairena" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                                <Facebook size={20} fill="currentColor" />
                            </a>
                            <a href="https://www.instagram.com/drmiltonmairena" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                                <Instagram size={20} />
                            </a>
                            <a href="https://x.com/drmiltonmairena" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/in/dr-milton-mairena-valle-a1a294101" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                                <Linkedin size={20} fill="currentColor" />
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start space-y-3 px-4 md:pl-12">
                        <h2 className="text-cenlae-primary font-display font-bold text-xl md:text-2xl uppercase tracking-wide mb-2">{t('contact.phone_title')}</h2>
                        <div className="text-black text-base space-y-2 leading-relaxed">
                            <p><span className="font-bold">{t('footer.consultation')}:</span> <a className="hover:text-cenlae-primary transition-colors" href="tel:+50587893709">(+505) 8789 3709</a></p>
                            <p><a className="hover:text-cenlae-primary transition-colors" href="tel:+50522556900">(+505) 2255 6900 Ext. 4208</a></p>
                            <p><span className="font-bold">{t('footer.emergencies')}:</span> <a className="hover:text-cenlae-primary transition-colors" href="tel:+50585500592">(+505) 8550 0592</a></p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end space-y-3 px-4">
                        <h2 className="text-cenlae-primary font-display font-bold text-xl md:text-2xl uppercase tracking-wide mb-2 text-center md:text-right w-full">{t('contact.hours_title')}</h2>
                        <div className="text-black text-base space-y-1 font-semibold leading-relaxed text-center md:text-right w-full">
                            <p>{t('contact.mon_fri')}</p>
                            <p className="text-lg">{t('footer.hours')}</p>
                        </div>
                    </div>
                </div>

                {/* Map Section */}
                <div className="mt-12 w-full relative group">
                    <div className="w-full h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 relative z-0">
                        <iframe
                            src="https://maps.google.com/maps?q=12.08611537797879,-86.23393562820002+(Dr.+Milton+Mairena)&z=17&output=embed"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Ubicación Dr. Milton Mairena"
                            className="grayscale-[0%] hover:grayscale-0 transition-all duration-700"
                        ></iframe>

                        {/* Overlay Gradient for better text readability if needed, but keeping clean for map */}
                        <div className="absolute inset-0 pointer-events-none shadow-inner rounded-2xl"></div>
                    </div>

                    {/* Floating Navigation Buttons */}
                    <div className="absolute bottom-6 right-6 flex flex-col sm:flex-row gap-3 z-10">
                        <a
                            href="https://www.google.com/maps/search/?api=1&query=12.08611537797879,-86.23393562820002"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 bg-white/90 backdrop-blur-md border border-white/50 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                <MapPin size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t('contact.view_location')}</span>
                                <span className="text-sm font-bold text-gray-900 group-hover:text-red-700 transition-colors">Google Maps</span>
                            </div>
                        </a>

                        <a
                            href="https://waze.com/ul?ll=12.08611537797879,-86.23393562820002&navigate=yes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 bg-[#083c79]/90 backdrop-blur-md border border-[#083c79]/50 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-[#083c79] transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#083c79] transition-colors">
                                <Navigation size={20} />
                            </div>
                            <div className="flex flex-col text-white">
                                <span className="text-xs text-blue-200 font-medium uppercase tracking-wider">{t('contact.navigate_with')}</span>
                                <span className="text-sm font-bold">Waze</span>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Contact Form Section - Below Map */}
                <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-xl">
                        <h2 className="text-[#083c79] font-display font-bold text-3xl tracking-tight mb-8">{t('contact.form_title')}</h2>
                        <ContactForm />
                    </div>
                    <div className="hidden lg:block">
                        <img
                            src="https://static.wixstatic.com/media/3743a7_73ce9cf846ed475b8520a0369aa50889~mv2.jpg/v1/fill/w_1063,h_724,al_c,q_85,enc_avif,quality_auto/Imagen%20de%20WhatsApp%202025-10-22%20a%20las%2017_45_13_ef55356c.jpg"
                            alt="Dr. Milton Mairena"
                            className="w-full h-auto max-w-[540px] mx-auto rounded-3xl shadow-2xl object-cover aspect-square"
                        />
                    </div>
                </div>
            </main>

            <FooterCenlae />
            <VisitorChatWidget />
        </div>
    );
};
