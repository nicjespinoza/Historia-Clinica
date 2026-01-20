import React, { useState, useEffect } from 'react';
import { NavbarCenlae } from './NavbarCenlae';
import { FooterCenlae } from './FooterCenlae';

export const SurgicalProceduresPage = () => {
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    return (
        <div className={`min-h-screen font-body antialiased transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
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
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-wide">Quirúrgicos</h1>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
                        {/* Column 1 */}
                        <div className="flex flex-col items-center">
                            <div className="z-10 -mb-5">
                                <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-500 rounded-xl px-8 py-3 shadow-lg">
                                    <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white whitespace-nowrap">Cirugía General</h2>
                                </div>
                            </div>
                            <div className="w-full bg-white dark:bg-gray-800 rounded-3xl p-4 pt-10 border-2 border-gray-900 dark:border-gray-600 shadow-2xl flex flex-col h-full">
                                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                    <img alt="Cirujanos operando en quirófano" className="w-full h-64 object-cover object-center transform hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_55eb3298da3b447cb3d72532fb35eb59~mv2.jpg/v1/crop/x_85,y_0,w_1111,h_853/fill/w_552,h_640,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Imagen%20de%20WhatsApp%202025-10-22%20a%20las%2017_45_13_66fb7446.jpg" />
                                </div>
                                <ul className="space-y-3 px-2 pb-4 text-gray-800 dark:text-gray-200 text-sm md:text-base leading-relaxed">
                                    <li className="flex items-start">
                                        <span className="mr-2 text-black dark:text-white">•</span>
                                        <span>Tratamiento quirúrgico de patología herniaria.</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2 text-black dark:text-white">•</span>
                                        <span>Diagnóstico y tratamiento de las enfermedades anorificiales (Enfermedad hemorroidal, fístulas, abscesos, fisuras)</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2 text-black dark:text-white">•</span>
                                        <span>Laparoscopia diagnostica en patología oncológica</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col items-center">
                            <div className="z-10 -mb-5">
                                <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-500 rounded-xl px-8 py-3 shadow-lg">
                                    <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white whitespace-nowrap">Minilaparoscopia</h2>
                                </div>
                            </div>
                            <div className="w-full bg-white dark:bg-gray-800 rounded-3xl p-4 pt-10 border-2 border-gray-900 dark:border-gray-600 shadow-2xl flex flex-col h-full">
                                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                    <img alt="Equipo de minilaparoscopia en quirófano" className="w-full h-64 object-cover object-center transform hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_a315d5f399c949e88c9de81b8cdf3142~mv2.jpeg/v1/crop/x_169,y_0,w_747,h_724/fill/w_552,h_640,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/WhatsApp%20Image%202025-09-24%20at%2010_49_40%20AM%20(1).jpeg" />
                                </div>
                                <div className="px-2 pb-4 text-gray-800 dark:text-gray-200 text-sm md:text-base leading-relaxed">
                                    <p>Técnica quirúrgica en enfermedades gastrointestinales o patología herniaria utilizando instrumentos muy finos (3 mm) con cicatrices mínimas o imperceptibles.</p>
                                </div>
                            </div>
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col items-center">
                            <div className="z-10 -mb-5">
                                <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-500 rounded-xl px-6 py-3 shadow-lg">
                                    <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white whitespace-nowrap">Cirugía Gastrointestinal</h2>
                                </div>
                            </div>
                            <div className="w-full bg-white dark:bg-gray-800 rounded-3xl p-4 pt-10 border-2 border-gray-900 dark:border-gray-600 shadow-2xl flex flex-col h-full">
                                <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                    <img alt="Equipo médico realizando cirugía gastrointestinal" className="w-full h-64 object-cover object-center transform hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_dd96ca0151d740a8928b65165ea80742~mv2.jpeg/v1/fill/w_560,h_648,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/3743a7_dd96ca0151d740a8928b65165ea80742~mv2.jpeg" />
                                </div>
                                <ul className="space-y-3 px-2 pb-4 text-gray-800 dark:text-gray-200 text-sm md:text-base leading-relaxed">
                                    <li className="flex items-start">
                                        <span className="mr-2 text-black dark:text-white">•</span>
                                        <span>Tratamiento laparoscópico de la litiasis vesicular</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2 text-black dark:text-white">•</span>
                                        <span>Tratamiento Mínimamente invasivo de la Enfermedad por Reflujo gastroesofágico</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2 text-black dark:text-white">•</span>
                                        <span>Tratamiento laparoscópico de la Acalasia</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2 text-black dark:text-white">•</span>
                                        <span>Abordaje mínimamente invasivo de la obesidad Mórbida y la Diabetes Mellitus Tipo II (Cirugía Metabólica)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-6 left-6 z-50">
                <button className="bg-gray-800 dark:bg-white text-white dark:text-gray-900 p-3 rounded-full shadow-lg hover:opacity-90 transition-opacity" onClick={toggleDarkMode}>
                    <span className="material-icons dark:hidden">dark_mode</span>
                    <span className="material-icons hidden dark:block">light_mode</span>
                </button>
            </div>

            <div className="fixed bottom-6 right-6 z-50">
                <button className="bg-[#0e407c] dark:bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors duration-300 flex items-center justify-center">
                    <span className="material-icons">chat_bubble</span>
                </button>
            </div>

            <FooterCenlae />
        </div>
    );
};
