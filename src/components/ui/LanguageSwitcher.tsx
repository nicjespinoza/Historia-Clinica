import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
    { code: 'es', label: 'Español', flag: 'https://flagcdn.com/ni.svg' },
    { code: 'en', label: 'English', flag: 'https://flagcdn.com/us.svg' },
    { code: 'fr', label: 'Français', flag: 'https://flagcdn.com/fr.svg' },
    { code: 'pt', label: 'Português', flag: 'https://flagcdn.com/pt.svg' }
];

interface LanguageSwitcherProps {
    variant?: 'light' | 'dark';
}

export const LanguageSwitcher = ({ variant = 'dark' }: LanguageSwitcherProps) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 text-sm font-bold border ${variant === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200 shadow-sm'
                    }`}
            >
                <img src={currentLanguage.flag} alt={currentLanguage.label} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
                <span className="hidden sm:inline uppercase tracking-wider">{currentLanguage.label}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100]"
                    >
                        <div className="py-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => changeLanguage(lang.code)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors
                    ${i18n.language === lang.code ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-gray-700 font-medium'}
                  `}
                                >
                                    <img src={lang.flag} alt={lang.label} className="w-5 h-3.5 object-cover rounded-sm border border-gray-100 shadow-sm" />
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
