import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Package, 
  LogOut, 
  TrendingUp, 
  Share2, 
  Copy, 
  Check, 
  ShoppingBag, 
  FileText, 
  ListCollapse, 
  Clock, 
  IndianRupee, 
  ChevronRight,
  ExternalLink
} from 'lucide-react'

export default function Dashboard() {
  const [distributor, setDistributor] = useState(null)
  const [orders, setOrders] = useState([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let { data: dist } = await supabase
        .from('distributors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!dist) {
        const { data: newDist } = await supabase
          .from('distributors')
          .insert({ user_id: user.id, name: user.email, shop_name: 'My Shop' })
          .select()
          .single()
        dist = newDist
      }

      setDistributor(dist)

      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('distributor_id', dist.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setOrders(recentOrders || [])

      const { data: allOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('distributor_id', dist.id)
        .eq('status', 'placed')

      const total = (allOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0)
      setTotalOutstanding(total)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const orderLink = distributor ? `${window.location.origin}/order/${distributor.id}` : ''

  function copyToClipboard() {
    navigator.clipboard.writeText(orderLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigation Header */}
      <nav className="bg-primary-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 p-1.5 rounded-lg text-white">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Stock<span className="text-primary-300">Bridge</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-semibold bg-primary-800 text-white">
                Dashboard
              </Link>
              <Link to="/catalogue" className="px-3 py-2 rounded-md text-sm font-semibold hover:bg-primary-600 transition">
                Catalogue
              </Link>
              <Link to="/orders" className="px-3 py-2 rounded-md text-sm font-semibold hover:bg-primary-600 transition">
                Orders
              </Link>
              <Link to="/ledger" className="px-3 py-2 rounded-md text-sm font-semibold hover:bg-primary-600 transition">
                Ledger
              </Link>
            </div>

            <div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-primary-800 hover:bg-rose-700 px-3 py-2 rounded-lg text-sm font-semibold transition duration-150"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden bg-primary-800 border-t border-primary-600 flex justify-around py-2 px-1">
          <Link to="/dashboard" className="flex flex-col items-center text-white px-2 py-1 text-xs font-bold">
            <TrendingUp className="h-5 w-5 mb-0.5 text-primary-300" />
            Dash
          </Link>
          <Link to="/catalogue" className="flex flex-col items-center text-primary-200 hover:text-white px-2 py-1 text-xs">
            <ListCollapse className="h-5 w-5 mb-0.5" />
            Catalogue
          </Link>
          <Link to="/orders" className="flex flex-col items-center text-primary-200 hover:text-white px-2 py-1 text-xs">
            <ShoppingBag className="h-5 w-5 mb-0.5" />
            Orders
          </Link>
          <Link to="/ledger" className="flex flex-col items-center text-primary-200 hover:text-white px-2 py-1 text-xs">
            <FileText className="h-5 w-5 mb-0.5" />
            Ledger
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header section with Distributor details */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome, {distributor?.shop_name || 'My Shop'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Registered Distributor: <span className="font-semibold">{distributor?.name || 'Loading...'}</span>
            </p>
          </div>
          <div className="text-xs bg-slate-100 text-slate-600 font-mono px-3 py-1.5 rounded-lg border border-slate-200 self-start md:self-center">
            ID: {distributor?.id || '...'}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Fetching dashboard insights...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pending Orders</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{orders.filter(o => o.status === 'placed').length}</h3>
                  <p className="text-xs text-slate-500 mt-1">Awaiting fulfillment</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                  <Clock className="h-8 w-8" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
                  <h3 className="text-3xl font-extrabold text-primary-700 mt-2 flex items-center">
                    <IndianRupee className="h-7 w-7" />
                    {totalOutstanding.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">From placed and unpaid orders</p>
                </div>
                <div className="p-4 rounded-2xl bg-primary-100/50 text-primary-700">
                  <IndianRupee className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Public Link Card */}
            {distributor && (
              <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white p-6 rounded-2xl shadow-lg mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="max-w-xl">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary-300" />
                      Retailer Ordering Link
                    </h3>
                    <p className="text-sm text-primary-100 mt-1">
                      Share this customized public ordering catalogue link with your retailers. They can place orders instantly without needing credentials!
                    </p>
                    <div className="mt-4 flex items-center gap-2 bg-black/15 p-2 rounded-lg border border-white/10 font-mono text-xs overflow-x-auto whitespace-nowrap scrollbar-none">
                      <span className="text-primary-200 shrink-0">{orderLink}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold transition"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </button>

                    <a
                      href={"https://wa.me/?text=" + encodeURIComponent("Hi, you can place your retailer order with us online here: " + orderLink)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-semibold transition shadow-md"
                    >
                      <Share2 className="h-4 w-4" />
                      Share on WhatsApp
                    </a>

                    <a
                      href={orderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-500 rounded-lg text-sm font-semibold transition"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Form
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Navigation Cards */}
            <h3 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">Quick Business Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <button
                onClick={() => navigate('/catalogue')}
                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary-500 hover:shadow-md transition text-left group flex flex-col justify-between"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit group-hover:bg-primary-700 group-hover:text-white transition">
                  <ListCollapse className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-slate-900 group-hover:text-primary-700 transition">Manage Catalogue</h4>
                  <p className="text-xs text-slate-500 mt-1">Add, update, or remove products and set bulk pricing rules.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 mt-4 self-end group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => navigate('/orders')}
                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary-500 hover:shadow-md transition text-left group flex flex-col justify-between"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl w-fit group-hover:bg-primary-700 group-hover:text-white transition">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-slate-900 group-hover:text-primary-700 transition">Orders Panel</h4>
                  <p className="text-xs text-slate-500 mt-1">Review placed retailer orders, update status, and track invoices.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 mt-4 self-end group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => navigate('/ledger')}
                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-primary-500 hover:shadow-md transition text-left group flex flex-col justify-between"
              >
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl w-fit group-hover:bg-primary-700 group-hover:text-white transition">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="mt-4">
                  <h4 className="font-bold text-slate-900 group-hover:text-primary-700 transition">Payment Ledger</h4>
                  <p className="text-xs text-slate-500 mt-1">Track payments, log settlements, and monitor outstanding dues.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 mt-4 self-end group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Recent Orders section */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Recent Orders Feed</h3>
                <Link to="/orders" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
                  View All Orders
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-500">
                    <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-600">No retailer orders placed yet</p>
                    <p className="text-xs text-slate-400 mt-1">Share your catalog link to receive instant orders!</p>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="p-6 hover:bg-slate-50/50 transition duration-150">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{order.retailer_shop}</span>
                            <span className="text-slate-400 text-xs">•</span>
                            <span className="text-slate-500 text-sm font-medium">{order.retailer_name}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Placed: {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2">
                          <span className="text-lg font-extrabold text-slate-900 flex items-center">
                            <IndianRupee className="h-4 w-4 shrink-0" />
                            {order.total_amount.toLocaleString('en-IN')}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                            order.status === 'placed' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : order.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
