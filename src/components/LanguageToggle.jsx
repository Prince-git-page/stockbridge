import { useTranslation } from 'react-i18next'

export default function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const toggle = () => {
    const next = i18n.language === 'hi' ? 'en' : 'hi'
    i18n.changeLanguage(next)
    try { localStorage.setItem('lang', next) } catch (e) {}
    try { document.documentElement.lang = next } catch (e) {}
  }
  const isHi = i18n.language === 'hi'
  return (
    <button onClick={toggle} aria-label={t('language')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '8px 12px', fontSize: 13, fontWeight: 700, background: '#fff', color: '#1e3a5f', border: '1px solid #e6eef6' }}>
      {isHi ? t('show_hindi') : t('show_english')}
    </button>
  )
}
