import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import ptTranslations from './locales/pt.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: { translation: esTranslations },
            en: { translation: enTranslations },
            fr: { translation: frTranslations },
            pt: { translation: ptTranslations }
        },
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
            caches: ['localStorage']
        }
    });

export default i18n;
