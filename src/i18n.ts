import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import i18n from 'i18next';
import translationEN from './i18n/en.json';

const resources = {
  en: {
    translation: translationEN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  // @ts-expect-error: temporary fix for legacy code
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },

    keySeperator: false,
    resources,
  });

// Fixed logic: Check if language is NOT en AND NOT tr
if (i18n.language !== 'en' && i18n.language !== 'tr') {
  if (i18n.language.slice(0, 2) === 'tr') {
    localStorage.setItem('i18nextLng', 'tr');
    i18n.changeLanguage('tr');
  } else {
    localStorage.setItem('i18nextLng', 'en');
    i18n.changeLanguage('en');
  }
}

export default i18n;
