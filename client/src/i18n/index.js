import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  es: { translation: es },
  fr: { translation: fr },
};

const DEFAULT_LANG = localStorage.getItem('locale') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANG,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
