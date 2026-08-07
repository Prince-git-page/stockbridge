import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from './lib/supabase'
import LanguageToggle from './components/LanguageToggle'
import Login from './pages/login'
import Dashboard from './pages/Dashboard'
import Catalogue from './pages/Catalogue'
import Orders from './pages/Orders'
import Ledger from './pages/Ledger'
import RetailerOrder from './pages/RetailerOrder'
import RetailerLedger from './pages/RetailerLedger'
import Signup from './pages/Signup'

function App() {
  const { t } = useTranslation()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return <AppLoading t={t} />

  return (
    <BrowserRouter>
      <header style={{ background: '#f8fafc', borderBottom: '1px solid #e6eef6', padding: '10px 18px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#1e3a5f', fontWeight: 800 }}>{t('brand')}</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><LanguageToggle /></div>
        </div>
      </header>
      <Routes>
        <Route
  path="/"
  element={
    session
      ? <Navigate to="/dashboard" replace />
      : <Navigate to="/login" replace />
  }
/>
        {/* Authentication */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />

        {/* Distributor workspace — authenticated routes */}
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/catalogue" element={session ? <Catalogue /> : <Navigate to="/login" replace />} />
        <Route path="/orders" element={session ? <Orders /> : <Navigate to="/login" replace />} />
        <Route path="/ledger" element={session ? <Ledger /> : <Navigate to="/login" replace />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/dashboard" />} />
        {/* Retailer portal — public distributor-specific routes */}
        <Route path="/order/:distributorId" element={<RetailerOrder />} />
        <Route path="/retailer-ledger/:distributorId" element={<RetailerLedger />} />

        {/* Unknown URLs retain browser history and offer a graceful return path. */}
        <Route path="*" element={<NotFoundPage isAuthenticated={Boolean(session)} t={t} />} />
      </Routes>
    </BrowserRouter>
  )
}

function AppLoading({ t }) {
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#1e3a5f', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}><div style={{ textAlign: 'center' }}><span style={{ display: 'block', width: 38, height: 38, margin: '0 auto 14px', border: '4px solid #dbeafe', borderTopColor: '#1e3a5f', borderRadius: '50%', animation: 'stockbridge-spin .8s linear infinite' }} /><p style={{ margin: 0, fontWeight: 700 }}>{t('loading_app')}</p><style>{'@keyframes stockbridge-spin { to { transform: rotate(360deg); } }'}</style></div></main>
}

function NotFoundPage({ isAuthenticated, t }) {
  const destination = isAuthenticated ? '/dashboard' : '/login'
  const label = isAuthenticated ? t('go_to_dashboard') : t('go_to_sign_in')

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', color: '#1e293b', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}><section style={{ width: '100%', maxWidth: 440, padding: 36, border: '1px solid #e2e8f0', borderRadius: 20, background: '#fff', boxShadow: '0 14px 32px rgba(15, 23, 42, .08)', textAlign: 'center' }}><p style={{ margin: 0, color: '#1e3a5f', fontSize: 12, fontWeight: 800, letterSpacing: '.14em' }}>STOCKBRIDGE</p><p style={{ margin: '20px 0 0', color: '#1e3a5f', fontSize: 48, fontWeight: 800, lineHeight: 1 }}>404</p><h1 style={{ margin: '12px 0 0', fontSize: 22 }}>{t('page_not_found')}</h1><p style={{ margin: '10px 0 24px', color: '#64748b', fontSize: 14, lineHeight: 1.55 }}>{t('page_not_found_detail')}</p><Link to={destination} replace style={{ display: 'inline-block', padding: '11px 16px', borderRadius: 10, background: '#1e3a5f', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>{label}</Link></section></main>
}

export default App
