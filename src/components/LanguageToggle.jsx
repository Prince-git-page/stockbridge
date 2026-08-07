import { useLanguage } from '../context/LanguageContext'

export default function LanguageToggle() {
  const { lang, changeLanguage, t } = useLanguage()
  const toggle = () => {
    changeLanguage(lang === 'hi' ? 'en' : 'hi')
  }
  const currentLanguage = lang === 'hi' ? t('switch_to_english') : t('switch_to_hindi')
  return (
    <button onClick={toggle} aria-label={t('language')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '8px 12px', fontSize: 13, fontWeight: 700, background: '#fff', color: '#1e3a5f', border: '1px solid #e6eef6' }}>
      {currentLanguage}
    </button>
  )
}
