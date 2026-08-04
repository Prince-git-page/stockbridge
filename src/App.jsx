import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/login'
import Dashboard from './pages/Dashboard'
import Catalogue from './pages/Catalogue'
import Orders from './pages/Orders'
import Ledger from './pages/Ledger'
import RetailerOrder from './pages/RetailerOrder'
import RetailerLedger from './pages/RetailerLedger'

function App() {
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

  if (loading) return <div style={{padding:'2rem'}}>Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/catalogue" element={session ? <Catalogue /> : <Navigate to="/login" />} />
        <Route path="/orders" element={session ? <Orders /> : <Navigate to="/login" />} />
        <Route path="/ledger" element={session ? <Ledger /> : <Navigate to="/login" />} />
        <Route path="/order/:distributorId" element={<RetailerOrder />} />
        <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
        <Route
  path="/retailer-ledger/:distributorId"
  element={<RetailerLedger />}
/>
      </Routes>
    </BrowserRouter>
  )
}

export default App