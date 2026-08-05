/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  PackageOpen,
  ReceiptText,
  Wallet,
} from 'lucide-react'

const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const orderStatus = (status) => {
  const styles = {
    placed: 'bg-amber-50 text-amber-700 ring-amber-200',
    confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
    delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  }
  return styles[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
}

export default function RetailerLedger() {
  const navigate = useNavigate()
  const { distributorId } = useParams()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState({ ordered: 0, paid: 0, outstanding: 0 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const shop = localStorage.getItem('retailer_shop')
    const phone = localStorage.getItem('retailer_phone')

    if (!shop || !phone) {
      alert('Retailer not found')
      navigate(-1)
      return
    }

    setLoading(true)

    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('distributor_id', distributorId)
      .eq('retailer_shop', shop)
      .eq('retailer_phone', phone)
      .order('created_at', { ascending: false })

    const { data: paymentData } = await supabase
      .from('payments')
      .select('*')
      .eq('distributor_id', distributorId)
      .eq('retailer_shop', shop)
      .eq('retailer_phone', phone)
      .order('created_at', { ascending: false })

    const totalOrders = (orderData || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const totalPaid = (paymentData || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    setOrders(orderData || [])
    setPayments(paymentData || [])
    setSummary({ ordered: totalOrders, paid: totalPaid, outstanding: totalOrders - totalPaid })
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center px-4 text-slate-700">
        <div className="text-center"><div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-[#1e3a5f] border-t-transparent" /><p className="font-semibold">Loading your ledger…</p><p className="mt-1 text-sm text-slate-500">Gathering your order and payment history.</p></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-800">
      <header className="border-b border-white/10 bg-[#1e3a5f] text-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-blue-50 transition hover:bg-white/10"><ArrowLeft size={18} /> Back</button>
          <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Wallet size={18} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-200">StockBridge</p><h1 className="text-base font-bold">My Ledger</h1></div></div>
          <div className="w-14" />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-[#163354] to-[#28547e] p-6 text-white shadow-lg shadow-slate-900/10 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold text-blue-100">Current outstanding balance</p><p className="mt-2 flex items-center text-4xl font-extrabold tracking-tight"><IndianRupee size={29} />{formatAmount(summary.outstanding)}</p><p className="mt-2 text-sm text-blue-100">Balance across all orders and recorded payments.</p></div><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${summary.outstanding > 0 ? 'bg-amber-300 text-amber-950' : 'bg-emerald-300 text-emerald-950'}`}>{summary.outstanding > 0 ? <Clock3 size={14} /> : <CheckCircle2 size={14} />}{summary.outstanding > 0 ? 'Payment pending' : 'All settled'}</span></div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Total ordered</p><p className="mt-1 flex items-center text-lg font-bold"><IndianRupee size={16} />{formatAmount(summary.ordered)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Payments received</p><p className="mt-1 flex items-center text-lg font-bold"><IndianRupee size={16} />{formatAmount(summary.paid)}</p></div></div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold"><ReceiptText size={19} className="text-[#1e3a5f]" /> Order history</h2><p className="mt-1 text-sm text-slate-500">Every order placed with this distributor.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{orders.length}</span></div>
            {orders.length === 0 ? <EmptyState icon={PackageOpen} title="No orders yet" copy="Your placed orders will appear here automatically." /> : <div className="space-y-3">{orders.map((order) => <article key={order.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="flex items-center text-lg font-extrabold text-slate-900"><IndianRupee size={17} />{formatAmount(order.total_amount)}</p><p className="mt-1 text-sm text-slate-500">Ordered {formatDate(order.created_at)}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${orderStatus(order.status)}`}>{order.status || 'Pending'}</span></div></article>)}</div>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold"><CreditCard size={19} className="text-[#1e3a5f]" /> Payment history</h2><p className="mt-1 text-sm text-slate-500">Payments recorded by your distributor.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{payments.length}</span></div>
            {payments.length === 0 ? <EmptyState icon={CreditCard} title="No payments recorded" copy="Payment entries will show here once they are added." /> : <div className="space-y-3">{payments.map((payment) => <article key={payment.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="flex items-center text-lg font-extrabold text-emerald-700"><IndianRupee size={17} />{formatAmount(payment.amount)}</p><p className="mt-1 text-sm text-slate-600">{payment.note || 'Payment received'}</p></div><p className="shrink-0 text-xs font-medium text-slate-400">{formatDate(payment.created_at)}</p></div></article>)}</div>}
          </section>
        </div>
      </div>
    </main>
  )
}

function EmptyState({ icon: Icon, title, copy }) {
  return <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"><div><span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white text-[#1e3a5f] shadow-sm"><Icon size={21} /></span><h3 className="font-bold text-slate-700">{title}</h3><p className="mx-auto mt-1 max-w-60 text-sm leading-5 text-slate-500">{copy}</p></div></div>
}
