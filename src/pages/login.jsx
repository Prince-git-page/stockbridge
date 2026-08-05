import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Package, ShieldCheck, TriangleAlert } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event) {
    event.preventDefault()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <main className="min-h-screen bg-slate-50 text-slate-800 lg:grid lg:grid-cols-2">
    <section className="relative hidden overflow-hidden bg-[#1e3a5f] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" /><div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 shadow-lg"><Package size={23} /></span><span className="text-2xl font-extrabold tracking-tight">Stock<span className="text-blue-300">Bridge</span></span></div><div className="relative max-w-lg"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-blue-200">Distributor workspace</p><h1 className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight">Your wholesale business, in perfect order.</h1><p className="mt-5 max-w-md text-base leading-7 text-blue-100">Manage inventory, retailer orders, and collections from one focused workspace built for growing distributors.</p><div className="mt-9 space-y-4">{['Publish a retailer-ready catalogue', 'Track every retailer order', 'Stay ahead of outstanding collections'].map((feature) => <p key={feature} className="flex items-center gap-3 text-sm font-semibold text-white"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/20 text-emerald-200"><CheckCircle2 size={14} /></span>{feature}</p>)}</div></div><div className="relative flex items-center gap-2 text-sm text-blue-200"><ShieldCheck size={17} /> Secure distributor access</div></section>

    <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6"><div className="w-full max-w-md"><div className="mb-8 text-center lg:hidden"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#1e3a5f] text-white shadow-lg shadow-slate-900/15"><Package size={24} /></div><p className="mt-3 text-2xl font-extrabold tracking-tight text-[#1e3a5f]">Stock<span className="text-blue-500">Bridge</span></p></div><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8"><div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#1e3a5f]">Welcome back</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Sign in to your workspace</h2><p className="mt-2 text-sm leading-6 text-slate-500">Enter your distributor credentials to continue.</p></div>{error && <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"><TriangleAlert size={18} className="mt-0.5 shrink-0" /><p className="leading-5"><strong className="font-extrabold">Unable to sign in.</strong><br />{error}</p></div>}<form className="mt-7 space-y-5" onSubmit={handleLogin}><label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Email address</span><div className="relative"><Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="distributor@stockbridge.com" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15" /></div></label><label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700">Password</span><div className="relative"><LockKeyhole size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label><button type="submit" disabled={loading} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3.5 text-sm font-extrabold text-white shadow-md shadow-slate-900/15 transition hover:bg-[#163354] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Signing in…</> : <>Sign in <ArrowRight size={17} /></>}</button></form><div className="mt-7 flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#1e3a5f] shadow-sm"><Building2 size={18} /></span><p className="text-xs leading-5 text-slate-500"><strong className="font-bold text-slate-700">B2B Demo Environment</strong><br />Secure, single-distributor access is enabled for inventory and order management.</p></div></div><p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} StockBridge. Wholesale made simple.</p></div></section>
  </main>
}
