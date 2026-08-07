import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Package,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()

    if (!email || !password) {
      setError(t('fill_in_all_fields'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password
        })

      if (authError) {
        setError(authError.message)
      }
    } catch (err) {
      setError(t('unexpected_error_occurred'))
    } finally {
      setLoading(false)
    }
  }

  const features = [
    'feature_publish_catalogue',
    'feature_track_orders',
    'feature_collections'
  ]

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 lg:grid lg:grid-cols-2">

      {/* LEFT PANEL */}
      <section className="hidden bg-[#1e3a5f] text-white lg:flex flex-col justify-between px-10 py-12 xl:px-16">

        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
            <Package size={23} />
          </span>
          <span className="text-2xl font-extrabold">
            {t('brand')}
          </span>
        </div>

        <div className="max-w-lg">
          <p className="text-xs font-extrabold uppercase tracking-wide text-blue-200">
            {t('distributor_workspace')}
          </p>

          <h1 className="mt-4 text-5xl font-extrabold leading-tight">
            {t('wholesale_business_order')}
          </h1>

          <p className="mt-5 text-blue-100">
            {t('workspace_description')}
          </p>

          <div className="mt-8 space-y-3">
            {features.map((key) => (
              <p key={key} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className="text-green-300" />
                {t(key)}
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-blue-200">
          <ShieldCheck size={16} />
          {t('secure_distributor_access')}
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="flex items-center justify-center px-4 py-10">

        <div className="w-full max-w-md">

          <div className="bg-white border rounded-3xl p-6 shadow-xl sm:p-8">

            <p className="text-xs font-bold uppercase text-[#1e3a5f]">
              {t('welcome_back')}
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {t('sign_in_to_your_workspace')}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              {t('enter_distributor_credentials')}
            </p>

            {/* ERROR */}
            {error && (
              <div className="mt-5 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                <TriangleAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">

              {/* EMAIL */}
              <div>
                <label className="text-sm font-semibold">
                  {t('email_address')}
                </label>

                <div className="relative mt-1">
                  <Mail size={16} className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('email_placeholder')}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-semibold">
                  {t('password')}
                </label>

                <div className="relative mt-1">
                  <LockKeyhole size={16} className="absolute left-3 top-3 text-gray-400" />

                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    className="w-full pl-9 pr-10 py-2 border rounded-lg"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e3a5f] text-white py-2 rounded-lg font-bold"
              >
                {loading ? t('signing_in') : t('sign_in')}
              </button>
            </form>

            {/* 🔥 SIGNUP LINK (FIXED) */}
            <p className="text-sm text-center mt-5">
              {t('no_account')}{' '}
              <Link to="/signup" className="text-blue-600 font-semibold">
                {t('create_account')}
              </Link>
            </p>

            {/* DEMO BOX */}
            <div className="mt-6 flex gap-2 bg-gray-50 p-3 rounded-lg text-xs text-gray-500">
              <Building2 size={16} />
              <span>
                <b>{t('b2b_demo_environment')}</b><br />
                {t('b2b_demo_description')}
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <p className="text-center text-xs text-gray-400 mt-5">
            © {new Date().getFullYear()} {t('brand')} — {t('wholesale_made_simple')}
          </p>

        </div>
      </section>
    </main>
  )
}