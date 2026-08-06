import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: localStorage.getItem('lang') || (navigator.language && navigator.language.startsWith('hi') ? 'hi' : 'en'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

try { document.documentElement.lang = i18n.language } catch (e) {}

export default i18n
