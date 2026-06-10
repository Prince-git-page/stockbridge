import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  IndianRupee, LogOut, BookOpen, Store,
  Plus, X, ChevronDown, ChevronUp, Phone
} from 'lucide-react'

export default function Ledger() {
  const [ledger, setLedger] = useState([])   // per-retailer summary
  const [distributorId, setDistributorId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedShop, setExpandedShop] = useState(null)
  const [shopHistory, setShopHistory] = useState({}) // { shopKey: [...payments] }

  // Payment modal state
  const [showModal, setShowModal] = useState(false)
  const [modalRetailer, setModalRetailer] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [saving, setSaving] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: dist } = await supabase
      .from('distributors')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!dist) { setLoading(false); return }
    setDistributorId(dist.id)
    loadLedger(dist.id)
  }

  async function loadLedger(distId) {
    setLoading(true)

    // All delivered/confirmed/dispatched/placed orders
    const { data: orders } = await supabase
      .from('orders')
      .select('retailer_name, retailer_shop, retailer_phone, total_amount, status')
      .eq('distributor_id', distId)

    // All recorded payments
    const { data: payments } = await supabase
      .from('payments')
      .select('retailer_name, retailer_shop, amount')
      .eq('distributor_id', distId)

    // Build per-retailer map
    const map = {}
    for (const o of orders || []) {
      const key = `${o.retailer_name}||${o.retailer_shop}`
      if (!map[key]) map[key] = {
        retailer_name: o.retailer_name,
        retailer_shop: o.retailer_shop,
        retailer_phone: o.retailer_phone || '',
        total_ordered: 0,
        total_paid: 0,
      }
      map[key].total_ordered += Number(o.total_amount || 0)
    }
    for (const p of payments || []) {
      const key = `${p.retailer_name}||${p.retailer_shop}`
      if (!map[key]) map[key] = {
        retailer_name: p.retailer_name,
        retailer_shop: p.retailer_shop,
        retailer_phone: '',
        total_ordered: 0,
        total_paid: 0,
      }
      map[key].total_paid += Number(p.amount || 0)
    }

    const result = Object.values(map).map(r => ({
      ...r,
      outstanding: r.total_ordered - r.total_paid
    }))

    // Sort: highest outstanding first
    result.sort((a, b) => b.outstanding - a.outstanding)
    setLedger(result)
    setLoading(false)
  }

  async function loadHistory(retailer_name, retailer_shop) {
    const key = `${retailer_name}||${retailer_shop}`
    if (shopHistory[key]) return
    const { data } = await supabase
      .from('payments')
      .select('amount, note, created_at')
      .eq('distributor_id', distributorId)
      .eq('retailer_name', retailer_name)
      .eq('retailer_shop', retailer_shop)
      .order('created_at', { ascending: false })
    setShopHistory(prev => ({ ...prev, [key]: data || [] }))
  }

  function toggleExpand(key, retailer_name, retailer_shop) {
    if (expandedShop === key) {
      setExpandedShop(null)
    } else {
      setExpandedShop(key)
      loadHistory(retailer_name, retailer_shop)
    }
  }

  function openModal(retailer) {
    setModalRetailer(retailer)
    setPayAmount('')
    setPayNote('')
    setShowModal(true)
  }

  async function savePayment() {
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) {
      alert('Enter a valid amount')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('payments').insert({
      distributor_id: distributorId,
      retailer_name: modalRetailer.retailer_name,
      retailer_shop: modalRetailer.retailer_shop,
      amount: Number(payAmount),
      note: payNote.trim() || null,
    })
    if (error) {
      alert('Failed to save: ' + error.message)
      setSaving(false)
      return
    }
    // Clear cached history for this retailer so it reloads
    const key = `${modalRetailer.retailer_name}||${modalRetailer.retailer_shop}`
    setShopHistory(prev => { const n = { ...prev }; delete n[key]; return n })
    setShowModal(false)
    setSaving(false)
    loadLedger(distributorId)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const totalOutstanding = ledger.reduce((s, r) => s + r.outstanding, 0)

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-blue-600" />
          <span className="font-bold text-gray-800 text-lg">Ledger</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-red-500 text-sm">
          <LogOut size={16} /> Logout
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Total Outstanding Banner */}
        <div className="bg-blue-600 text-white rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm mb-0.5">Total Outstanding</p>
            <div className="flex items-center gap-1 text-2xl font-bold">
              <IndianRupee size={20} />
              {totalOutstanding.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-sm">{ledger.length} retailers</p>
          </div>
        </div>

        {/* Retailer List */}
        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading ledger...</div>
        ) : ledger.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ledger.map(retailer => {
              const key = `${retailer.retailer_name}||${retailer.retailer_shop}`
              const isExpanded = expandedShop === key
              const history = shopHistory[key] || []
              const isCleared = retailer.outstanding <= 0

              return (
                <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Row */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(key, retailer.retailer_name, retailer.retailer_shop)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Store size={15} className="text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 truncate">{retailer.retailer_shop}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-5">{retailer.retailer_name}</p>
                        {retailer.retailer_phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-400 ml-5 mt-0.5">
                            <Phone size={12} />
                            {retailer.retailer_phone}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className={`flex items-center gap-0.5 text-lg font-bold ${isCleared ? 'text-green-600' : 'text-red-600'}`}>
                          <IndianRupee size={16} />
                          {Math.abs(retailer.outstanding).toLocaleString('en-IN')}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCleared ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isCleared ? 'Cleared' : 'Due'}
                        </span>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="flex gap-4 mt-3 ml-5">
                      <div>
                        <p className="text-xs text-gray-400">Total Orders</p>
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-0.5">
                          <IndianRupee size={11} />{retailer.total_ordered.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Paid</p>
                        <p className="text-sm font-semibold text-green-700 flex items-center gap-0.5">
                          <IndianRupee size={11} />{retailer.total_paid.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Balance</p>
                        <p className={`text-sm font-semibold flex items-center gap-0.5 ${isCleared ? 'text-green-600' : 'text-red-600'}`}>
                          <IndianRupee size={11} />{retailer.outstanding.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400"></span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded: payment history + record button */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment History</p>
                        <button
                          onClick={() => openModal(retailer)}
                          className="flex items-center gap-1 bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus size={14} /> Record Payment
                        </button>
                      </div>

                      {history.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">No payments recorded yet</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {history.map((p, i) => (
                            <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                              <div>
                                <p className="text-sm text-gray-700">{p.note || 'Payment received'}</p>
                                <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>
                              </div>
                              <span className="text-sm font-semibold text-green-600 flex items-center gap-0.5">
                                + <IndianRupee size={12} />{Number(p.amount).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && modalRetailer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-800">Record Payment</h2>
                <p className="text-sm text-gray-500">{modalRetailer.retailer_shop}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Outstanding reminder */}
            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
              <span className="text-sm text-red-600">Outstanding</span>
              <span className="font-bold text-red-600 flex items-center gap-0.5">
                <IndianRupee size={13} />
                {modalRetailer.outstanding.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (₹)</label>
              <input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={payNote}
                onChange={e => setPayNote(e.target.value)}
                placeholder="e.g. Cash via Ramesh"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={savePayment}
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
