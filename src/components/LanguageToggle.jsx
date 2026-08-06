import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const toggle = () => {
    const next = i18n.language === 'hi' ? 'en' : 'hi'
    i18n.changeLanguage(next)
    try { localStorage.setItem('lang', next) } catch (e) {}
  }
  return (
    <button onClick={toggle} aria-label={t('language')} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20">
      {i18n.language === 'hi' ? t('show_hindi') : t('show_english')}
    </button>
  )
}
