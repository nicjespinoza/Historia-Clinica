import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavbarCenlae } from './NavbarCenlae';
import { FooterCenlae } from './FooterCenlae';

export const SurgicalProceduresPage = () => {
    const { t } = useTranslation();
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);



    return (
        <div className="min-h-screen font-body antialiased bg-white">
            {/* Reusing existing Navbar but ideally adapting it. For now, using the provided HTML structure almost exactly 
                but reusing the NavbarCenlae component for consistency across the app, 
                OR implementing the specific header provided in the snippet if the user wants strictly that look.
                Checking the snippet: it has a specific header. 
                However, to maintain "app consistency", it is usually better to use the main Navbar.
                But the user asked for "this code", so I will implement the page with the specific content provided,
                including the header in the snippet if it seems unique, OR replace the header with NavbarCenlae.
                
                The snippet header looks very similar to NavbarCenlae. I will use NavbarCenlae to keep navigation working consistently.
                I will only use the <main> content from the snippet.
             */}
            <NavbarCenlae activePage="servicios" />

            <main className="bg-[#0e407c] min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-wide">{t('nav.surgical')}</h1>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
                        {/* Column 1 */}
                        <div className="flex flex-col items-center">
                            <div className="z-10 -mb-5">
                                <div className="bg-white border-2 border-black rounded-xl px-8 py-3 shadow-lg">
                                    <h2 className="text-xl font-display font-bold text-black whitespace-nowrap">{t('services.surgical_items.0.title')}</h2>
                                </div>
                            </div>
                            <div className="w-full bg-white rounded-3xl p-4 pt-10 border-2 border-black shadow-2xl flex flex-col h-full">
                                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                    <img alt="Cirujanos operando en quirófano" className="w-full h-64 object-cover object-center transform hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_55eb3298da3b447cb3d72532fb35eb59~mv2.jpg/v1/crop/x_85,y_0,w_1111,h_853/fill/w_552,h_640,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Imagen%20de%20WhatsApp%202025-10-22%20a%20las%2017_45_13_66fb7446.jpg" />
                                </div>
                                <ul className="space-y-3 px-2 pb-4 text-black text-sm md:text-base leading-relaxed">
                                    {(t('services.surgical_items.0.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <span className="mr-2 text-black">•</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col items-center">
                            <div className="z-10 -mb-5">
                                <div className="bg-white border-2 border-black rounded-xl px-8 py-3 shadow-lg">
                                    <h2 className="text-xl font-display font-bold text-black whitespace-nowrap">{t('services.surgical_items.2.title')}</h2>
                                </div>
                            </div>
                            <div className="w-full bg-white rounded-3xl p-4 pt-10 border-2 border-black shadow-2xl flex flex-col h-full">
                                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                    <img alt="Equipo de minilaparoscopia en quirófano" className="w-full h-64 object-cover object-center transform hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_a315d5f399c949e88c9de81b8cdf3142~mv2.jpeg/v1/crop/x_169,y_0,w_747,h_724/fill/w_552,h_640,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/WhatsApp%20Image%202025-09-24%20at%2010_49_40%20AM%20(1).jpeg" />
                                </div>
                                <div className="px-2 pb-4 text-black text-sm md:text-base leading-relaxed text-center">
                                    <p>{t('services.surgical_items.2.desc')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col items-center">
                            <div className="z-10 -mb-5">
                                <div className="bg-white border-2 border-black rounded-xl px-6 py-3 shadow-lg">
                                    <h2 className="text-xl font-display font-bold text-black whitespace-nowrap">{t('services.surgical_items.1.title')}</h2>
                                </div>
                            </div>
                            <div className="w-full bg-white rounded-3xl p-4 pt-10 border-2 border-black shadow-2xl flex flex-col h-full">
                                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                    <img alt="Equipo médico realizando cirugía gastrointestinal" className="w-full h-64 object-cover object-center transform hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_dd96ca0151d740a8928b65165ea80742~mv2.jpeg/v1/fill/w_560,h_648,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/3743a7_dd96ca0151d740a8928b65165ea80742~mv2.jpeg" />
                                </div>
                                <ul className="space-y-3 px-2 pb-4 text-black text-sm md:text-base leading-relaxed">
                                    {(t('services.surgical_items.1.features', { returnObjects: true }) as string[]).map((feature, idx) => (
                                        <li key={idx} className="flex items-start">
                                            <span className="mr-2 text-black">•</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>



            <FooterCenlae />
        </div>
    );
};
