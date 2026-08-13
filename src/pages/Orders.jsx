/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { formatToIST } from '../lib/formatDate'
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp, Clock3, IndianRupee, LogOut, Package, PackageOpen, Phone, Search, SlidersHorizontal, Store, Truck, XCircle } from 'lucide-react'

const STATUS_FLOW = ['placed', 'confirmed', 'dispatched', 'delivered']
const STATUS_STYLE = {
  placed: { bg: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Clock3, label: 'Pending' },
  confirmed: { bg: 'bg-blue-50 text-blue-700 ring-blue-200', icon: CheckCircle2, label: 'Processing' },
  dispatched: { bg: 'bg-indigo-50 text-indigo-700 ring-indigo-200', icon: Truck, label: 'Dispatched' },
  delivered: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2, label: 'Delivered' },
  cancelled: { bg: 'bg-rose-50 text-rose-700 ring-rose-200', icon: XCircle, label: 'Cancelled' },
}
const TABS = ['all', 'placed', 'confirmed', 'dispatched', 'delivered']
const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [orderItems, setOrderItems] = useState({})
  const [activeTab, setActiveTab] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const navigate = useNavigate()

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    loadOrders(user.id)
  }

  async function loadOrders(userId) {
    setLoading(true)
    const { data: dist } = await supabase.from('distributors').select('id').eq('user_id', userId).single()
    if (!dist) { setLoading(false); return }
    const { data } = await supabase.from('orders').select('*').eq('distributor_id', dist.id).order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function loadItems(orderId) {
    if (orderItems[orderId]) return
    const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId)
    setOrderItems((previous) => ({ ...previous, [orderId]: data || [] }))
  }

  function toggleExpand(orderId) {
    if (expandedId === orderId) setExpandedId(null)
    else { setExpandedId(orderId); loadItems(orderId) }
  }

  async function updateStatus(orderId, newStatus) {
    setUpdatingId(orderId)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (!error) setOrders((previous) => previous.map((order) => order.id === orderId ? { ...order, status: newStatus } : order))
    else alert('Failed to update status: ' + error.message)
    setUpdatingId(null)
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate('/login') }

  const displayedOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = orders.filter((order) => (activeTab === 'all' || order.status === activeTab) && (!normalizedSearch || `${order.retailer_name || ''} ${order.shop_name || order.retailer_shop || ''} ${order.mobile || order.retailer_phone || ''}`.toLowerCase().includes(normalizedSearch)))
    return [...filtered].sort((first, second) => {
      if (sortBy === 'oldest') return new Date(first.created_at) - new Date(second.created_at)
      if (sortBy === 'highest') return Number(second.total_amount || 0) - Number(first.total_amount || 0)
      if (sortBy === 'lowest') return Number(first.total_amount || 0) - Number(second.total_amount || 0)
      return new Date(second.created_at) - new Date(first.created_at)
    })
  }, [orders, activeTab, search, sortBy])

  const countFor = (tab) => tab === 'all' ? orders.length : orders.filter((order) => order.status === tab).length
  const formatDate = (timestamp) => formatToIST(timestamp, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  const pendingCount = countFor('placed')
  const deliveredCount = countFor('delivered')

  return <main className="min-h-screen bg-slate-50 pb-12 text-slate-800">
    <header className="bg-[#1e3a5f] text-white shadow-lg shadow-slate-900/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><Package size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">StockBridge</p><h1 className="text-xl font-extrabold tracking-tight">Orders</h1><p className="mt-0.5 text-sm text-blue-100">Track retailer requests from first order to delivery.</p></div></div><div className="flex flex-wrap items-center gap-2"><HeaderMetric label="Total" value={orders.length} /><HeaderMetric label="Pending" value={pendingCount} /><HeaderMetric label="Delivered" value={deliveredCount} /><button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-[#1e3a5f] transition hover:bg-blue-50"><ArrowLeft size={16} /> Dashboard</button><button onClick={handleLogout} aria-label="Log out" className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-bold transition hover:bg-white/20"><LogOut size={16} /><span className="hidden sm:inline">Logout</span></button></div></div></header>
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6"><section className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full lg:max-w-md"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search retailer or shop name…" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15" /></div><label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><SlidersHorizontal size={16} className="text-[#1e3a5f]" /><span className="sr-only">Sort orders</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-[#1e3a5f]"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="highest">Highest amount</option><option value="lowest">Lowest amount</option></select></label></section><div className="mb-5 flex gap-2 overflow-x-auto pb-1">{TABS.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold transition ${activeTab === tab ? 'bg-[#1e3a5f] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}>{tab === 'all' ? 'All orders' : STATUS_STYLE[tab].label}<span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${activeTab === tab ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>{countFor(tab)}</span></button>)}</div>
      {loading ? <LoadingState /> : displayedOrders.length === 0 ? <EmptyState hasSearch={Boolean(search) || activeTab !== 'all'} /> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(130px,.7fr)_150px_42px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Retailer</span><span>Date</span><span className="text-right">Order value</span><span /></div><div>{displayedOrders.map((order) => <OrderRow key={order.id} order={order} expanded={expandedId === order.id} items={orderItems[order.id]} updating={updatingId === order.id} formatDate={formatDate} onToggle={() => toggleExpand(order.id)} onUpdate={(status) => updateStatus(order.id, status)} />)}</div></section>}
    </div>
  </main>
}

function HeaderMetric({ label, value }) { return <div className="rounded-xl bg-white/10 px-3 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">{label}</p><p className="text-base font-extrabold leading-5">{value}</p></div> }
function LoadingState() { return <div className="grid min-h-80 place-items-center rounded-2xl border border-slate-200 bg-white text-center shadow-sm"><div><span className="mx-auto mb-4 block h-11 w-11 animate-spin rounded-full border-4 border-[#1e3a5f] border-t-transparent" /><p className="font-bold text-slate-700">Loading orders…</p><p className="mt-1 text-sm text-slate-500">Fetching your latest retailer requests.</p></div></div> }
function EmptyState({ hasSearch }) { return <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-[#1e3a5f]"><PackageOpen size={31} /></span><h2 className="text-lg font-bold text-slate-800">{hasSearch ? 'No matching orders' : 'No orders yet'}</h2><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{hasSearch ? 'Try adjusting your search or status filter.' : 'Orders from retailers will appear here.'}</p></div></div> }

function OrderRow({ order, expanded, items, updating, formatDate, onToggle, onUpdate }) {
  const style = STATUS_STYLE[order.status] || STATUS_STYLE.placed
  const StatusIcon = style.icon
  const currentIndex = STATUS_FLOW.indexOf(order.status)
  const nextStatus = STATUS_FLOW[currentIndex + 1]
  const shopName = order.shop_name || order.retailer_shop || 'Retailer shop'
  const mobile = order.mobile || order.retailer_phone
  return <article className="border-b border-slate-100 last:border-0"><button onClick={onToggle} className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[minmax(0,1.7fr)_minmax(130px,.7fr)_150px_42px] md:items-center md:gap-4 md:px-5"><div className="min-w-0"><div className="flex items-center gap-2"><Store size={16} className="shrink-0 text-[#1e3a5f]" /><p className="truncate font-bold text-slate-900">{shopName}</p><StatusBadge style={style} Icon={StatusIcon} /></div><p className="mt-1 truncate text-sm text-slate-500">{order.retailer_name || 'Retailer'}</p>{mobile ? <a href={`tel:${mobile}`} onClick={(event) => event.stopPropagation()} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a5f] hover:underline"><Phone size={12} />{mobile}</a> : <p className="mt-1 text-xs text-slate-400">No phone saved</p>}</div><p className="text-xs font-medium text-slate-500 md:text-sm">{formatDate(order.created_at)}</p><p className="flex items-center font-extrabold text-slate-900 md:justify-end"><IndianRupee size={16} />{formatAmount(order.total_amount)}</p><span className="hidden justify-self-end text-slate-400 md:block">{expanded ? <ChevronUp size={19} /> : <ChevronDown size={19} />}</span><span className="flex items-center justify-between text-xs text-slate-400 md:hidden"><span>{items ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'View order details'}</span>{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span></button>{expanded && <OrderDetails order={order} items={items} updating={updating} currentIndex={currentIndex} nextStatus={nextStatus} onUpdate={onUpdate} />}</article>
}

function StatusBadge({ style, Icon }) { return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold ring-1 ${style.bg}`}><Icon size={12} />{style.label}</span> }
function OrderDetails({ order, items, updating, currentIndex, nextStatus, onUpdate }) { return <div className="border-t border-slate-100 bg-slate-50 px-4 py-5 sm:px-5"><div className="grid gap-5 lg:grid-cols-[1fr_auto]"><div><div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Ordered products</h3>{items && <span className="text-xs font-bold text-slate-400">{items.length} item{items.length === 1 ? '' : 's'}</span>}</div>{!items ? <div className="flex items-center gap-2 py-4 text-sm text-slate-400"><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1e3a5f] border-t-transparent" />Loading products…</div> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{items.map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_55px_90px] gap-3 border-b border-slate-100 px-3 py-3 text-sm last:border-0"><span className="truncate font-semibold text-slate-700">{item.product_name}</span><span className="text-slate-500">x {item.quantity}</span><span className="text-right font-bold text-slate-800"><IndianRupee className="inline h-3.5 w-3.5" />{formatAmount(item.price * item.quantity)}</span></div>)}<div className="flex items-center justify-between bg-slate-50 px-3 py-3 text-sm font-extrabold"><span>Total</span><span className="flex items-center"><IndianRupee size={14} />{formatAmount(order.total_amount)}</span></div></div>}</div><div className="lg:w-60"><h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-500">Update status</h3><div className="flex flex-wrap gap-2 lg:flex-col">{STATUS_FLOW.map((status, index) => <button key={status} disabled={order.status === status || updating || index < currentIndex} onClick={() => onUpdate(status)} className={`rounded-lg px-3 py-2 text-left text-xs font-bold transition ${order.status === status ? STATUS_STYLE[status].bg : index < currentIndex ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-[#1e3a5f] text-white hover:bg-[#163354]'} disabled:opacity-60`}>{updating && status !== order.status ? 'Updating…' : STATUS_STYLE[status].label}</button>)}</div>{nextStatus && <button disabled={updating} onClick={() => onUpdate(nextStatus)} className="mt-3 w-full rounded-lg border border-[#1e3a5f] bg-white px-3 py-2 text-xs font-extrabold text-[#1e3a5f] transition hover:bg-blue-50 disabled:opacity-50">{updating ? 'Updating…' : `Mark as ${STATUS_STYLE[nextStatus].label}`}</button>}</div></div></div> }
