import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Twitter, Linkedin, MessageCircle } from 'lucide-react';

const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/Dr.MiltonMairena' },
    { icon: Instagram, href: 'https://www.instagram.com/drmiltonmairena' },
    { icon: Twitter, href: 'https://x.com/drmiltonmairena' },
    { icon: Linkedin, href: 'https://www.linkedin.com/in/dr-milton-mairena-valle-a1a294101' },
];

// Hardcoded links removed, now handled by translation logic if needed or translated directly

// Componente reutilizable para efecto de expansión de texto completo
interface ExpandingBlockProps {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}

const ExpandingBlock = ({ children, delay = 0, className = '' }: ExpandingBlockProps) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
        whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{
            duration: 0.8,
            delay,
            ease: [0.16, 1, 0.3, 1]
        }}
        className={className}
    >
        {children}
    </motion.div>
);

export const FooterCenlae = () => {
    const { t } = useTranslation();

    const perfilLinks = [
        { name: t('nav.biography'), href: '#profile' },
        { name: t('profile.experience_title'), href: '#profile' },
        { name: t('profile.education_title'), href: '#profile' },
    ];

    const serviciosLinks = [
        { name: t('nav.surgical'), href: '#services' },
        { name: t('nav.endoscopic'), href: '#services' },
    ];

    return (
        <footer className="bg-cenlae-footer text-white py-8 sm:py-10 lg:py-12" id="contact">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                {/* Grid responsive: todo en columnas en móvil */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-row lg:justify-between gap-6 sm:gap-8 lg:gap-8">

                    {/* Logo Section */}
                    <div className="col-span-2 sm:col-span-2 md:col-span-1 lg:flex-shrink-0 lg:w-1/4">
                        <div className="flex flex-col items-center sm:items-start">
                            <ExpandingBlock delay={0}>
                                <img
                                    src="https://static.wixstatic.com/media/3743a7_a472540fb433489080045b63412f30cd~mv2.png/v1/fill/w_490,h_295,al_c,lg_1,q_85,enc_avif,quality_auto/drmiltonmairena.png"
                                    alt="Dr. Milton Mairena"
                                    className="h-20 sm:h-24 lg:h-32 w-auto brightness-0 invert mb-2"
                                />
                            </ExpandingBlock>

                        </div>
                    </div>

                    {/* Perfil Profesional */}
                    <div className="col-span-1 flex flex-col space-y-2 sm:space-y-3">
                        <ExpandingBlock delay={0}>
                            <h4 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">{t('footer.profile_title', { defaultValue: 'Perfil Profesional' })}</h4>
                        </ExpandingBlock>
                        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/90">
                            {perfilLinks.map((link, index) => (
                                <ExpandingBlock key={link.name} delay={0.1 + index * 0.05}>
                                    <li>
                                        <a href={link.href} className="hover:text-white transition-colors">
                                            {link.name}
                                        </a>
                                    </li>
                                </ExpandingBlock>
                            ))}
                        </ul>
                    </div>

                    {/* Servicios */}
                    <div className="col-span-1 flex flex-col space-y-2 sm:space-y-3">
                        <ExpandingBlock delay={0}>
                            <h4 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">{t('footer.services_title', { defaultValue: 'Servicios' })}</h4>
                        </ExpandingBlock>
                        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/90">
                            {serviciosLinks.map((link, index) => (
                                <ExpandingBlock key={link.name} delay={0.1 + index * 0.05}>
                                    <li>
                                        <a href={link.href} className="hover:text-white transition-colors">
                                            {link.name}
                                        </a>
                                    </li>
                                </ExpandingBlock>
                            ))}
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div className="col-span-1 flex flex-col space-y-2 sm:space-y-3">
                        <ExpandingBlock delay={0}>
                            <h4 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">{t('footer.contact', { defaultValue: 'Contacto' })}</h4>
                        </ExpandingBlock>
                        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-white/90">
                            <ExpandingBlock delay={0.1}>
                                <p className="font-medium">Hospital Vivian Pellas</p>
                            </ExpandingBlock>
                            <ExpandingBlock delay={0.15}>
                                <p>{t('footer.address_detail', { defaultValue: 'Torre 1, Piso 2, Consultorio 208' })}</p>
                            </ExpandingBlock>
                            <ExpandingBlock delay={0.2}>
                                <p>{t('footer.consultation')}: (505) 87893709</p>
                            </ExpandingBlock>
                            <ExpandingBlock delay={0.25}>
                                <p>{t('footer.emergencies')}: (505) 85500592</p>
                            </ExpandingBlock>
                            <ExpandingBlock delay={0.3}>
                                <p>{t('footer.hours')}</p>
                            </ExpandingBlock>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="col-span-1 flex flex-col items-center sm:items-start">
                        <ExpandingBlock delay={0}>
                            <h4 className="font-semibold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">{t('footer.follow_us', { defaultValue: 'Síguenos' })}</h4>
                        </ExpandingBlock>
                        <div className="flex space-x-2 sm:space-x-3">
                            {socialLinks.map((social, index) => (
                                <ExpandingBlock key={index} delay={index * 0.08}>
                                    <a
                                        href={social.href}
                                        className="bg-white text-cenlae-footer hover:bg-gray-100 transition-colors w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center"
                                    >
                                        <social.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
                                    </a>
                                </ExpandingBlock>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <ExpandingBlock delay={0.4}>
                    <div className="mt-6 sm:mt-8 lg:mt-12 pt-4 sm:pt-6 lg:pt-8 border-t border-white/20 text-[10px] sm:text-xs font-medium text-white/60 text-center">
                        <p>© 2026 {t('footer.all_rights_reserved')} Dr. Milton Mairena Valle</p>
                    </div>
                </ExpandingBlock>
            </div>


        </footer>
    );
};
