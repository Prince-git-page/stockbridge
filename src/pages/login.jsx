import { useState } from 'react'
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Package, ShieldCheck, TriangleAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function handleLogin(event) {
    event.preventDefault()
    if (!email || !password) return setError(t('fill_in_all_fields'))
    setLoading(true); setError('')
    try { const { error: authError } = await supabase.auth.signInWithPassword({ email, password }); if (authError) setError(authError.message) }
    catch { setError(t('unexpected_error_occurred')) } finally { setLoading(false) }
  }
  const features = ['feature_publish_catalogue', 'feature_track_orders', 'feature_collections']
  return <main className="min-h-screen bg-slate-50 text-slate-800 lg:grid lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-[#1e3a5f] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16"><div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><Package size={23} /></span><span className="text-2xl font-extrabold">{t('brand')}</span></div><div className="relative max-w-lg"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-200">{t('distributor_workspace')}</p><h1 className="mt-4 text-5xl font-extrabold leading-[1.08]">{t('wholesale_business_order')}</h1><p className="mt-5 max-w-md text-base leading-7 text-blue-100">{t('workspace_description')}</p><div className="mt-9 space-y-4">{features.map((key) => <p key={key} className="flex items-center gap-3 text-sm font-semibold"><CheckCircle2 size={14} className="text-emerald-200" />{t(key)}</p>)}</div></div><div className="relative flex items-center gap-2 text-sm text-blue-200"><ShieldCheck size={17} />{t('secure_distributor_access')}</div></section>
    <section className="flex min-h-screen items-center justify-center px-4 py-10"><div className="w-full max-w-md"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#1e3a5f]">{t('welcome_back')}</p><h2 className="mt-2 text-3xl font-extrabold text-slate-900">{t('sign_in_to_your_workspace')}</h2><p className="mt-2 text-sm text-slate-500">{t('enter_distributor_credentials')}</p></div>{error && <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"><TriangleAlert size={18} /><p><strong>{t('unable_to_sign_in')}</strong><br />{error}</p></div>}<form className="mt-7 space-y-5" onSubmit={handleLogin}><label className="block"><span className="mb-1.5 block text-sm font-bold">{t('email_address')}</span><div className="relative"><Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('email_placeholder')} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm" /></div></label><label className="block"><span className="mb-1.5 block text-sm font-bold">{t('password')}</span><div className="relative"><LockKeyhole size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t('password_placeholder')} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t('hide_password') : t('show_password')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label><button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3.5 text-sm font-extrabold text-white disabled:opacity-60">{loading ? t('signing_in') : <>{t('sign_in')} <ArrowRight size={17} /></>}</button></form><div className="mt-7 flex gap-3 rounded-xl bg-slate-50 p-4"><Building2 size={18} className="text-[#1e3a5f]" /><p className="text-xs text-slate-500"><strong>{t('b2b_demo_environment')}</strong><br />{t('b2b_demo_description')}</p></div></div><p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} {t('brand')}. {t('wholesale_made_simple')}</p></div></section>
  </main>
}
