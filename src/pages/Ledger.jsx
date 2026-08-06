/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, CheckCircle2, ChevronDown, ChevronUp, Clock3, CreditCard, IndianRupee, LoaderCircle, LogOut, Phone, Plus, Search, Store, Wallet, X } from 'lucide-react'
import { formatToIST } from '../lib/formatDate'

const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function Ledger() {
  const [ledger, setLedger] = useState([])
  const [distributorId, setDistributorId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedShop, setExpandedShop] = useState(null)
  const [shopHistory, setShopHistory] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [modalRetailer, setModalRetailer] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payNote, setPayNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('highest')
  const navigate = useNavigate()

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: dist } = await supabase.from('distributors').select('id').eq('user_id', user.id).single()
    if (!dist) { setLoading(false); return }
    setDistributorId(dist.id)
    loadLedger(dist.id)
  }

  async function loadLedger(distId) {
    setLoading(true)
    const { data: orders } = await supabase.from('orders').select('retailer_name, retailer_shop, retailer_phone, total_amount, status').eq('distributor_id', distId)
    const { data: payments } = await supabase.from('payments').select(`
retailer_name,
retailer_shop,
retailer_phone,
amount
`).eq('distributor_id', distId)
    const map = {}
    for (const order of orders || []) {
      const key = `${order.retailer_shop || ''}||${order.retailer_phone || ''}`
      if (!map[key]) {
        map[key] = {
          retailer_name: order.retailer_name,
          retailer_shop: order.retailer_shop,
          retailer_phone: order.retailer_phone,
          total_ordered: 0,
          total_paid: 0,
        }
      }
      map[key].total_ordered += Number(order.total_amount || 0)
    }
    for (const payment of payments || []) {
      const key = `${payment.retailer_shop || ''}||${payment.retailer_phone || ''}`
      if (!map[key]) map[key] = { retailer_name: payment.retailer_name, retailer_shop: payment.retailer_shop, retailer_phone: payment.retailer_phone, total_ordered: 0, total_paid: 0 }
      map[key].total_paid += Number(payment.amount || 0)
    }
    const result = Object.values(map).map((retailer) => ({ ...retailer, outstanding: retailer.total_ordered - retailer.total_paid }))
    result.sort((first, second) => second.outstanding - first.outstanding)
    setLedger(result)
    setLoading(false)
  }

  async function loadHistory(retailer_name, retailer_shop, retailer_phone) {
    const key = `${retailer_shop || ''}||${retailer_phone || ''}`
    if (shopHistory[key]) return
    const { data } = await supabase.from('payments').select('amount, note, created_at').eq('distributor_id', distributorId).eq('retailer_shop', retailer_shop).eq('retailer_phone', retailer_phone).order('created_at', { ascending: false })
    setShopHistory((previous) => ({ ...previous, [key]: data || [] }))
  }

  function toggleExpand(key, retailer_name, retailer_shop, retailer_phone) {
    if (expandedShop === key) setExpandedShop(null)
    else {
      setExpandedShop(key)
      loadHistory(retailer_name, retailer_shop, retailer_phone)
    }
  }
  function openModal(retailer) { setModalRetailer(retailer); setPayAmount(''); setPayNote(''); setShowModal(true) }

  async function savePayment() {
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) { alert('Enter a valid amount'); return }
    setSaving(true)
    const { error } = await supabase.from('payments').insert({
      distributor_id: distributorId,
      retailer_name: modalRetailer.retailer_name,
      retailer_shop: modalRetailer.retailer_shop,
      retailer_phone: modalRetailer.retailer_phone,
      amount: Number(payAmount),
      note: payNote.trim() || null,
    })
    if (error) { alert('Failed to save: ' + error.message); setSaving(false); return }
    const key = `${modalRetailer.retailer_shop || ''}||${modalRetailer.retailer_phone || ''}`
    setShopHistory((previous) => { const next = { ...previous }; delete next[key]; return next })
    setShowModal(false)
    setSaving(false)
    loadLedger(distributorId)
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate('/login') }
  const totalOutstanding = ledger.reduce((sum, retailer) => sum + retailer.outstanding, 0)
  const totalPaid = ledger.reduce((sum, retailer) => sum + retailer.total_paid, 0)
  const pendingCollections = ledger.filter((retailer) => retailer.outstanding > 0).length
  const formatDate = (timestamp) => formatToIST(timestamp, { day: 'numeric', month: 'short', year: 'numeric' })
  const displayedLedger = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = ledger.filter((retailer) => !term || `${retailer.retailer_name || ''} ${retailer.retailer_shop || ''}`.toLowerCase().includes(term))
    return [...filtered].sort((first, second) => {
      if (sortBy === 'lowest') return first.outstanding - second.outstanding
      if (sortBy === 'alphabetical') return `${first.retailer_shop || ''}`.localeCompare(`${second.retailer_shop || ''}`)
      if (sortBy === 'recent') return 0
      return second.outstanding - first.outstanding
    })
  }, [ledger, search, sortBy])

  return <main className="min-h-screen bg-slate-50 pb-12 text-slate-800">
    <header className="bg-[#1e3a5f] text-white shadow-lg shadow-slate-900/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><BookOpen size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">StockBridge</p><h1 className="text-xl font-extrabold tracking-tight">Ledger</h1><p className="mt-0.5 text-sm text-blue-100">Stay on top of every retailer balance and collection.</p></div></div><div className="flex flex-wrap items-center gap-2"><HeaderMetric label="Outstanding" value={formatAmount(totalOutstanding)} currency /><HeaderMetric label="Received" value={formatAmount(totalPaid)} currency /><HeaderMetric label="Retailers" value={ledger.length} /><button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-[#1e3a5f] transition hover:bg-blue-50"><ArrowLeft size={16} /> Dashboard</button><button onClick={handleLogout} aria-label="Log out" className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold transition hover:bg-white/20"><LogOut size={16} /><span className="hidden sm:inline">Logout</span></button></div></div></header>
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard icon={Wallet} label="Outstanding amount" value={totalOutstanding} tone="text-rose-600 bg-rose-50" /><KpiCard icon={CreditCard} label="Total received" value={totalPaid} tone="text-emerald-600 bg-emerald-50" /><KpiCard icon={Store} label="Active retailers" value={ledger.length} noCurrency tone="text-blue-700 bg-blue-50" /><KpiCard icon={Clock3} label="Pending collections" value={pendingCollections} noCurrency tone="text-amber-700 bg-amber-50" /></section><section className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full lg:max-w-md"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search retailer or shop name…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15" /></div><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 outline-none focus:border-[#1e3a5f]"><option value="highest">Highest outstanding</option><option value="lowest">Lowest outstanding</option><option value="recent">Recently active</option><option value="alphabetical">Alphabetical</option></select></section>
      <section className="mt-5">{loading ? <LoadingState /> : displayedLedger.length === 0 ? <EmptyState hasSearch={Boolean(search)} /> : <div className="grid gap-4 lg:grid-cols-2">{displayedLedger.map((retailer) => { const key = `${retailer.retailer_shop || ''}||${retailer.retailer_phone || ''}`; return <RetailerCard key={key} retailer={retailer} history={shopHistory[key]} expanded={expandedShop === key} formatDate={formatDate} onToggle={() => toggleExpand(key, retailer.retailer_name, retailer.retailer_shop, retailer.retailer_phone)} onPayment={() => openModal(retailer)} /> })}</div>}</section>
    </div>{showModal && modalRetailer && <PaymentModal retailer={modalRetailer} amount={payAmount} note={payNote} saving={saving} onAmount={setPayAmount} onNote={setPayNote} onClose={() => setShowModal(false)} onSave={savePayment} />}
  </main>
}

function HeaderMetric({ label, value, currency }) { return <div className="rounded-xl bg-white/10 px-3 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">{label}</p><p className="flex items-center justify-center text-base font-extrabold leading-5">{currency && <IndianRupee size={13} />}{value}</p></div> }
function KpiCard({ icon: Icon, label, value, noCurrency, tone }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 flex items-center text-2xl font-extrabold tracking-tight text-slate-900">{!noCurrency && <IndianRupee size={20} />}{noCurrency ? value : formatAmount(value)}</p></article> }
function LoadingState() { return <div className="grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm"><div><span className="mx-auto mb-4 block h-11 w-11 animate-spin rounded-full border-4 border-[#1e3a5f] border-t-transparent" /><p className="font-bold text-slate-700">Loading ledger…</p><p className="mt-1 text-sm text-slate-500">Calculating retailer balances and payments.</p></div></div> }
function EmptyState({ hasSearch }) { return <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-[#1e3a5f]"><BookOpen size={31} /></span><h2 className="text-lg font-bold text-slate-800">{hasSearch ? 'No matching retailers' : 'No retailer transactions yet.'}</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{hasSearch ? 'Try a different retailer or shop name.' : 'Payments and ledger entries will appear here.'}</p></div></div> }
function RetailerCard({ retailer, history, expanded, formatDate, onToggle, onPayment }) { const cleared = retailer.outstanding <= 0; return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"><div role="button" tabIndex={0} onClick={onToggle} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onToggle() }} className="cursor-pointer p-5 transition hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1e3a5f]"><Store size={17} /></span><div className="min-w-0"><h2 className="truncate font-bold text-slate-900">{retailer.retailer_shop || 'Retailer shop'}</h2><p className="truncate text-sm text-slate-500">{retailer.retailer_name || 'Retailer'}</p></div></div>{retailer.retailer_phone && <a href={`tel:${retailer.retailer_phone}`} onClick={(event) => event.stopPropagation()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1e3a5f] hover:underline"><Phone size={13} />{retailer.retailer_phone}</a>}</div><div className="text-right"><p className={`flex items-center justify-end text-xl font-extrabold ${cleared ? 'text-emerald-600' : 'text-rose-600'}`}><IndianRupee size={17} />{formatAmount(Math.abs(retailer.outstanding))}</p><span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold ${cleared ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'}`}>{cleared ? <CheckCircle2 size={11} /> : <Clock3 size={11} />}{cleared ? 'Cleared' : 'Outstanding'}</span></div></div><div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4"><MiniAmount label="Ordered" amount={retailer.total_ordered} /><MiniAmount label="Paid" amount={retailer.total_paid} green /><MiniAmount label="Balance" amount={retailer.outstanding} red={!cleared} /></div><div className="mt-3 flex justify-end text-slate-400">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div></div>{expanded && <div className="border-t border-slate-100 bg-slate-50 p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Transaction timeline</p><p className="mt-1 text-xs text-slate-400">Payment history and running balance.</p></div><button onClick={onPayment} className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#163354]"><Plus size={14} /> Record payment</button></div>{!history ? <div className="flex items-center gap-2 py-4 text-sm text-slate-400"><LoaderCircle size={17} className="animate-spin text-[#1e3a5f]" />Loading payment history…</div> : history.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-400">No payments recorded yet.</div> : <div className="space-y-2">{history.map((payment, index) => <div key={index} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"><div><p className="text-sm font-semibold text-slate-700">{payment.note || 'Payment received'}</p><p className="mt-0.5 text-xs text-slate-400">{formatDate(payment.created_at)}</p></div><p className="flex items-center font-extrabold text-emerald-600">+<IndianRupee size={14} />{formatAmount(payment.amount)}</p></div>)}</div>}</div>}</article> }
function MiniAmount({ label, amount, green, red }) { return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 flex items-center text-sm font-extrabold ${green ? 'text-emerald-600' : red ? 'text-rose-600' : 'text-slate-700'}`}><IndianRupee size={12} />{formatAmount(amount)}</p></div> }
function PaymentModal({ retailer, amount, note, saving, onAmount, onNote, onClose, onSave }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 backdrop-blur-sm sm:items-center"><section role="dialog" aria-modal="true" aria-labelledby="payment-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1e3a5f]">Collection</p><h2 id="payment-title" className="mt-1 text-xl font-extrabold text-slate-900">Record payment</h2><p className="mt-1 text-sm text-slate-500">{retailer.retailer_shop} · {retailer.retailer_name}</p></div><button onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={19} /></button></div><div className="mt-5 flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 p-4"><span className="text-sm font-bold text-rose-700">Outstanding balance</span><span className="flex items-center text-lg font-extrabold text-rose-700"><IndianRupee size={16} />{formatAmount(retailer.outstanding)}</span></div><label className="mt-5 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Amount received</span><div className="relative"><IndianRupee size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="number" value={amount} onChange={(event) => onAmount(event.target.value)} placeholder="e.g. 2500" className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15" /></div></label><label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Note <em className="normal-case font-medium text-slate-400">(optional)</em></span><input type="text" value={note} onChange={(event) => onNote(event.target.value)} placeholder="e.g. Cash via Ramesh" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15" /></label><div className="mt-6 grid grid-cols-2 gap-3"><button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">Cancel</button><button onClick={onSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#163354] disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? 'Saving…' : 'Save payment'}</button></div></section></div> }
