/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatToIST } from '../lib/formatDate'
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
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'

const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
  const formatDate = (date) => date ? formatToIST(date, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'

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
  const { t } = useLanguage()
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
      alert(t('retailer_not_found'))
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

    // fetch order items for the retrieved orders
    let itemsByOrder = {}
    const orderIds = (orderData || []).map((o) => o.id).filter(Boolean)
    if (orderIds.length) {
      const { data: items } = await supabase.from('order_items').select('*').in('order_id', orderIds)
      for (const item of items || []) {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
        itemsByOrder[item.order_id].push(item)
      }
    }

    const { data: paymentData } = await supabase
      .from('payments')
      .select('*')
      .eq('distributor_id', distributorId)
      .eq('retailer_shop', shop)
      .eq('retailer_phone', phone)
      .order('created_at', { ascending: false })

    const totalOrders = (orderData || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const totalPaid = (paymentData || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    // attach items to orders
    const ordersWithItems = (orderData || []).map((o) => ({ ...o, items: itemsByOrder[o.id] || [] }))
    setOrders(ordersWithItems)
    setPayments(paymentData || [])
    setSummary({ ordered: totalOrders, paid: totalPaid, outstanding: totalOrders - totalPaid })
    setLoading(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 grid place-items-center px-4 text-slate-700">
        <div className="text-center"><div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-[#1e3a5f] border-t-transparent" /><p className="font-semibold">{t('loading_ledger')}</p><p className="mt-1 text-sm text-slate-500">{t('gathering_history')}</p></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-800">
      <header className="border-b border-white/10 bg-[#1e3a5f] text-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-blue-50 transition hover:bg-white/10"><ArrowLeft size={18} /> {t('back')}</button>
          <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><Wallet size={18} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-200">{t('brand')}</p><h1 className="text-base font-bold">{t('payment_history')}</h1></div></div>
          <div className="flex items-center gap-2"><LanguageToggle /></div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="mb-7 overflow-hidden rounded-2xl bg-gradient-to-br from-[#163354] to-[#28547e] p-6 text-white shadow-lg shadow-slate-900/10 sm:p-7">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold text-blue-100">{t('current_outstanding_balance')}</p><p className="mt-2 flex items-center text-4xl font-extrabold tracking-tight"><IndianRupee size={29} />{formatAmount(summary.outstanding)}</p><p className="mt-2 text-sm text-blue-100">{t('balance_across_orders_payments')}</p></div><span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${summary.outstanding > 0 ? 'bg-amber-300 text-amber-950' : 'bg-emerald-300 text-emerald-950'}`}>{summary.outstanding > 0 ? <Clock3 size={14} /> : <CheckCircle2 size={14} />}{summary.outstanding > 0 ? t('payment_pending') : t('all_settled')}</span></div>
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">{t('total_ordered')}</p><p className="mt-1 flex items-center text-lg font-bold"><IndianRupee size={16} />{formatAmount(summary.ordered)}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-200">{t('payments_received')}</p><p className="mt-1 flex items-center text-lg font-bold"><IndianRupee size={16} />{formatAmount(summary.paid)}</p></div></div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold"><ReceiptText size={19} className="text-[#1e3a5f]" /> {t('order_history')}</h2><p className="mt-1 text-sm text-slate-500">{t('orders_placed_with_distributor')}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{orders.length}</span></div>
            {orders.length === 0 ? <EmptyState icon={PackageOpen} title={t('no_orders_yet')} copy={t('orders_will_appear_here')} /> : <div className="space-y-3">{orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center text-lg font-extrabold text-slate-900"><IndianRupee size={17} />{formatAmount(order.total_amount)}</p>
                    <p className="mt-1 text-sm text-slate-500">{t('ordered')} {formatDate(order.created_at)}</p>
                    {order.items && order.items.length > 0 && (
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {order.items.map((it) => (
                          <li key={it.id} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{it.product_name || it.name || t('product')}</p>
                              <p className="text-xs text-slate-500">{t('quantity')}: {it.quantity}</p>
                            </div>
                            <div className="text-right font-bold"><IndianRupee size={14} />{formatAmount(Number(it.price || 0) * Number(it.quantity || 0))}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${orderStatus(order.status)}`}>{order.status ? t(`status_${order.status}`) : t('status_pending')}</span>
                </div>
              </article>
            ))}</div>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold"><CreditCard size={19} className="text-[#1e3a5f]" /> {t('payment_history')}</h2><p className="mt-1 text-sm text-slate-500">{t('payments_recorded_by_distributor')}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{payments.length}</span></div>
            {payments.length === 0 ? <EmptyState icon={CreditCard} title={t('no_payments_recorded')} copy={t('payment_entries_will_show_here')} /> : <div className="space-y-3">{payments.map((payment) => <article key={payment.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="flex items-center text-lg font-extrabold text-emerald-700"><IndianRupee size={17} />{formatAmount(payment.amount)}</p><p className="mt-1 text-sm text-slate-600">{payment.note || t('payment_received')}</p></div><p className="shrink-0 text-xs font-medium text-slate-400">{formatDate(payment.created_at)}</p></div></article>)}</div>}
          </section>
        </div>
      </div>
    </main>
  )
}

function EmptyState({ icon: Icon, title, copy }) {
  return <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"><div><span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white text-[#1e3a5f] shadow-sm"><Icon size={21} /></span><h3 className="font-bold text-slate-700">{title}</h3><p className="mx-auto mt-1 max-w-60 text-sm leading-5 text-slate-500">{copy}</p></div></div>
}
