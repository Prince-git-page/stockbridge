import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18n from '../i18n'

const LANG_STORAGE_KEY = 'lang'
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) || localStorage.getItem('stockbridge_language')
      if (stored === 'en' || stored === 'hi') return stored
      return navigator.language?.startsWith('hi') ? 'hi' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    if (!language) return
    i18n.changeLanguage(language)
    try { localStorage.setItem(LANG_STORAGE_KEY, language) } catch {
      // Ignore storage failures in private mode.
    }
    try { document.documentElement.lang = language } catch {
      // Ignore document language failures.
    }
  }, [language])

  const changeLanguage = (nextLanguage) => {
    if (nextLanguage === 'en' || nextLanguage === 'hi') setLanguage(nextLanguage)
  }
  const value = useMemo(() => ({
    lang: language,
    language,
    changeLanguage,
    setLanguage: changeLanguage,
    t: i18n.t.bind(i18n),
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
