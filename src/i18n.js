import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './i18n/en.js'
import hi from './i18n/hi.js'

const storedLanguage = (() => {
  try {
    return localStorage.getItem('stockbridge_language') || localStorage.getItem('lang')
  } catch {
    return null
  }
})()

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: storedLanguage || (navigator.language && navigator.language.startsWith('hi') ? 'hi' : 'en'),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

try { document.documentElement.lang = i18n.language } catch { /* non-browser environment */ }

export default i18n
