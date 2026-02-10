import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavbarCenlae } from './NavbarCenlae';
import { FooterCenlae } from './FooterCenlae';

export const EndoscopicProceduresPage = () => {
    const { t } = useTranslation();
    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-background-light dark:bg-background-dark text-gray-800 dark:text-gray-100 min-h-screen flex flex-col font-body">
            <NavbarCenlae activePage="servicios" />

            <main className="flex-grow bg-[#0a3d75] py-12 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-center text-4xl md:text-5xl font-bold text-white mb-12 uppercase tracking-wide drop-shadow-md">
                        {t('nav.endoscopic')}
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
                        {/* Item 1: Endoscopia Alta */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                {t('services.endoscopic_items.0.title')}
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Procedimiento de Endoscopia Alta con doctores y paciente" className="w-full h-64 object-cover object-top hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_c09e3d74cca946b69ca398f6ff5a3663~mv2.jpg/v1/crop/x_241,y_0,w_459,h_521/fill/w_544,h_620,al_c,lg_1,q_80,enc_avif,quality_auto/Top-a-2.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    {t('services.endoscopic_items.0.desc')}
                                </p>
                            </div>
                        </div>

                        {/* Item 2: Colonoscopia */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Colonoscopia
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Doctor revisando monitor durante colonoscopia" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_e0d5278c681e48728bcb87e905a72f16~mv2.jpg/v1/crop/x_271,y_0,w_363,h_412/fill/w_506,h_577,al_c,lg_1,q_80,enc_avif,quality_auto/servicios-5.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Procedimiento endoscópico que evalúa el interior del colon y recto para el diagnóstico y tratamiento de sus enfermedades.
                                </p>
                            </div>
                        </div>

                        {/* Item 3: Duodenoscopia */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Duodenoscopia
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Equipo médico realizando duodenoscopia" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_83f341aa5d474190888db7ada63847bc~mv2.jpg/v1/crop/x_21,y_0,w_803,h_617/fill/w_544,h_616,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Imagen%20de%20WhatsApp%202025-10-22%20a%20las%2017_45_14_0e78b2ad.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Procedimiento endoscópico que permite evaluar el duodeno y la Ampolla de Vater con fines diagnósticos y terapéuticos.
                                </p>
                            </div>
                        </div>

                        {/* Item 4: Ultrasonido Endoscópico */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Ultrasonido Endoscópico
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Imagen de ultrasonido endoscópico" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_17c54428bbe2486c9e3220b4523e1cf1~mv2.jpg/v1/crop/x_158,y_0,w_451,h_512/fill/w_539,h_614,al_c,lg_1,q_80,enc_avif,quality_auto/servicios-10.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Estudio endoscópico que permite la evaluación de las paredes del esófago, estómago y duodeno, así como de órganos vecinos (Páncreas, Vías Biliares, Ganglios y lesiones tumorales).
                                </p>
                            </div>
                        </div>

                        {/* Item 5: CPRE */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                CPRE
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Procedimiento médico CPRE en quirófano" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_03e69010b0d34193bbd12b3f84128ace~mv2.jpg/v1/crop/x_5,y_0,w_456,h_350/fill/w_430,h_490,al_c,lg_1,q_80,enc_avif,quality_auto/servicios-9.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Estudio endoscópico que permite diagnosticar y tratar enfermedades de la vía biliar y pancreática.
                                </p>
                            </div>
                        </div>

                        {/* Item 6: Colangioscopia */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Colangioscopia
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Visualización de conductos biliares" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_bffb389993d3430db15b4fa099fcfaef~mv2.jpg/v1/crop/x_307,y_0,w_676,h_768/fill/w_544,h_620,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Imagen%20de%20WhatsApp%202025-10-22%20a%20las%2017_45_14_5eaa3c82.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Técnica endoscópica que permite la visualización directa del interior de los conductos biliares y pancreáticos para diagnóstico y tratamiento.
                                </p>
                            </div>
                        </div>

                        {/* Item 7: Enteroscopia */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Enteroscopia
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Enteroscopia procedimiento" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_fc04cad3d8ed45f589352902b2cc96be~mv2.jpg/v1/crop/x_0,y_0,w_407,h_313/fill/w_384,h_438,al_c,lg_1,q_80,enc_avif,quality_auto/servicios-11.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Procedimiento endoscópico que permite el tratamiento de las enfermedades benignas y malignas del intestino delgado.
                                </p>
                            </div>
                        </div>

                        {/* Item 8: Cápsula Endoscópica */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Cápsula Endoscópica
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Cápsula Endoscópica PillCam" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_df2cbde2f1d242149040231ce8ebf435~mv2.jpg/v1/crop/x_0,y_66,w_1254,h_963/fill/w_544,h_620,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Imagen%20de%20WhatsApp%202025-10-22%20a%20las%2017_45_14_dcfc5e38.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Estudio que consiste en ingerir un dispositivo electronico con forma de capsula el cual toma fotografias del intestino delgado o del colon con fines diagnosticos.
                                </p>
                            </div>
                        </div>

                        {/* Item 9: Asistencia Nutricional */}
                        <div className="flex flex-col items-center group">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Asistencia Nutricional
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Asistencia Nutricional endoscópica" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_c86d14f6b8e641cf8444f22e8a382aa7~mv2.jpg/v1/crop/x_0,y_21,w_380,h_292/fill/w_359,h_409,al_c,lg_1,q_80,enc_avif,quality_auto/servicios-7.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Colocación endoscópica de sondas de alimentación en el estómago e intestino delgado (yeyuno), con el objetivo de la administración de medicamentos y alimento.
                                </p>
                            </div>
                        </div>

                        {/* Item 10: Balón Intragástrico */}
                        <div className="flex flex-col items-center group md:col-start-2">
                            <div className="bg-white dark:bg-surface-dark text-black font-bold text-lg md:text-xl px-8 py-3 rounded-2xl border border-gray-300 dark:border-slate-600 shadow-lg mb-[-1.5rem] z-10 w-auto text-center transform group-hover:-translate-y-1 transition-transform duration-300">
                                Balón Intragástrico
                            </div>
                            <div className="bg-white rounded-3xl p-4 pt-10 pb-8 shadow-2xl w-full h-full flex flex-col border-2 border-black">
                                <div className="rounded-2xl overflow-hidden shadow-inner border border-gray-100 dark:border-slate-700">
                                    <img alt="Balón Intragástrico" className="w-full h-64 object-cover object-center hover:scale-105 transition-transform duration-500" src="https://static.wixstatic.com/media/3743a7_de9df304fb9a4b679e022a76055e036a~mv2.jpg/v1/crop/x_1,y_0,w_698,h_536/fill/w_470,h_536,al_c,q_80,enc_avif,quality_auto/servicios-8.jpg" />
                                </div>
                                <p className="mt-6 text-black text-center leading-relaxed font-bold px-2">
                                    Consiste en colocar por vía endoscópica un balón relleno de agua durante 1 año con el objetivo de promover la perdida de peso en el paciente obeso.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>



            <FooterCenlae />
        </div>
    );
};
