import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  PackageOpen,
  ShoppingBag,
  Wallet,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatToIST } from '../lib/formatDate'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const statusStyle = (status) => {
  const styles = {
      placed: { background: '#fff7ed', color: '#c2410c' },
      confirmed: { background: '#eff6ff', color: '#1d4ed8' },
      delivered: { background: '#ecfdf5', color: '#047857' },
      cancelled: { background: '#fef2f2', color: '#b91c1c' },
    }
    return styles[status] || { background: '#f1f5f9', color: '#475569' }
}
const displayCurrency = (amount) =>
  formatCurrency(amount).replace(/^[^0-9]*/, '\u20b9')

export default function Dashboard() {
  const { t } = useTranslation()
  const [distributor, setDistributor] = useState(null)
  const [orders, setOrders] = useState([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()

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

    const [{ data: allOrders }, { data: allPayments }] = await Promise.all([
      supabase.from('orders').select('total_amount, status').eq('distributor_id', dist.id),
      supabase.from('payments').select('amount').eq('distributor_id', dist.id),
    ])

    const outstandingOrders = (allOrders || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0)
    const totalPayments = (allPayments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    setTotalOutstanding(outstandingOrders - totalPayments)
    setPendingOrders((allOrders || []).filter((order) => order.status === 'placed').length)

    const [{ count: products }, { count: orderCount }] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('distributor_id', dist.id),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('distributor_id', dist.id),
    ])
    setProductCount(products || 0)
    setTotalOrders(orderCount || 0)
  }

  useEffect(() => {
    // Data loading is deliberately initiated once when this dashboard mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  async function copyOrderLink() {
    if (!orderLink) return
    try {
      await navigator.clipboard.writeText(orderLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // The ordering portal remains available through the open and share actions.
    }
  }

  const baseUrl = import.meta.env.VITE_APP_BASE_URL?.trim()?.replace(/\/+$/, '') || window.location.origin
  const orderLink = distributor ? `${baseUrl}/order/${distributor.id}` : ''
  const distributorName = distributor?.name || distributor?.shop_name || t('your_business')
  const actions = [
    { title: t('catalogue'), description: t('manage_products'), icon: Package, path: '/catalogue', color: '#e0f2fe', iconColor: '#0369a1' },
    { title: t('orders'), description: t('review_incoming_orders'), icon: ClipboardList, path: '/orders', color: '#ede9fe', iconColor: '#6d28d9' },
    { title: t('ledger'), description: t('track_collections'), icon: Wallet, path: '/ledger', color: '#dcfce7', iconColor: '#15803d' },
  ]
  const statusLabels = {
    placed: t('status_placed'),
    confirmed: t('status_confirmed'),
    delivered: t('status_delivered'),
    cancelled: t('status_cancelled'),
  }

  return (
    <main className="dashboard-shell">
      <style>{`
        * { box-sizing: border-box; }
        .dashboard-shell { min-height: 100vh; padding: 32px 24px 56px; background: #f8fafc; color: #172033; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .dashboard-container { width: min(1180px, 100%); margin: 0 auto; }
        .dashboard-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 34px; }
        .brand-row, .profile-row { display: flex; align-items: center; gap: 13px; }
        .brand-mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: #1e3a5f; color: #fff; box-shadow: 0 8px 18px rgba(30, 58, 95, .2); }
        .eyebrow { margin: 0 0 3px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .page-title { margin: 0; color: #102a43; font-size: clamp(24px, 4vw, 30px); letter-spacing: -.035em; }
        .profile-name { max-width: 210px; margin: 0; overflow: hidden; color: #334155; font-size: 14px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
        .avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #dbeafe; color: #1e3a5f; font-size: 14px; font-weight: 800; }
        .logout-button, .action-button, .button-primary, .button-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 10px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease, background .16s ease; }
        .logout-button:hover, .action-button:hover, .button-primary:hover, .button-secondary:hover { transform: translateY(-1px); }
        .logout-button { padding: 10px 12px; background: #fff; color: #475569; box-shadow: 0 1px 2px rgba(15, 23, 42, .07); }
        .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 30px; }
        .stat-card, .share-card, .orders-panel, .quick-action { border: 1px solid #e8edf3; border-radius: 16px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, .045); }
        .stat-card { padding: 20px; }
        .stat-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .stat-label { margin: 0; color: #64748b; font-size: 13px; font-weight: 600; }
        .stat-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; }
        .stat-value { margin: 18px 0 4px; color: #102a43; font-size: 27px; font-weight: 800; letter-spacing: -.04em; }
        .stat-note { margin: 0; color: #94a3b8; font-size: 12px; }
        .content-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, .95fr); gap: 24px; align-items: start; }
        .section-heading { margin: 0; color: #1e293b; font-size: 18px; letter-spacing: -.02em; }
        .section-copy { margin: 5px 0 0; color: #64748b; font-size: 14px; }
        .quick-actions { display: grid; gap: 12px; margin: 17px 0 25px; }
        .quick-action { display: flex; align-items: center; width: 100%; padding: 15px; text-align: left; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease; }
        .quick-action:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(15, 23, 42, .08); }
        .action-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; flex: 0 0 auto; }
        .action-text { margin-left: 13px; min-width: 0; } .action-title { display: block; color: #1e293b; font-size: 14px; font-weight: 800; } .action-description { display: block; margin-top: 3px; color: #64748b; font-size: 12px; }
        .action-arrow { margin-left: auto; color: #94a3b8; }
        .share-card { padding: 22px; background: linear-gradient(135deg, #123255, #1e4b76); border: 0; color: #fff; box-shadow: 0 12px 28px rgba(30, 58, 95, .2); }
        .share-label { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; color: #bfdbfe; font-size: 13px; font-weight: 700; }
        .share-title { margin: 0; font-size: 20px; letter-spacing: -.03em; } .share-copy { margin: 8px 0 19px; color: #dbeafe; font-size: 13px; line-height: 1.55; }
        .share-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; } .share-actions .button-primary { grid-column: 1 / -1; }
        .button-primary { min-height: 42px; background: #fff; color: #1e3a5f; } .button-primary:hover { box-shadow: 0 6px 16px rgba(0, 0, 0, .14); }
        .button-secondary { min-height: 40px; background: rgba(255,255,255,.12); color: #fff; outline: 1px solid rgba(255,255,255,.2); text-decoration: none; }
        .orders-panel { padding: 24px; } .orders-header { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 17px; }
        .view-all { border: 0; background: transparent; color: #1e3a5f; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
        .order-list { display: grid; gap: 10px; } .order-card { display: flex; align-items: center; gap: 13px; padding: 15px; border: 1px solid #edf1f5; border-radius: 13px; }
        .order-avatar { display: grid; place-items: center; width: 39px; height: 39px; border-radius: 11px; flex: 0 0 auto; background: #eff6ff; color: #1e3a5f; font-size: 14px; font-weight: 800; }
        .order-main { min-width: 0; flex: 1; } .order-shop { overflow: hidden; margin: 0; color: #1e293b; font-size: 14px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; } .order-retailer { overflow: hidden; margin: 3px 0 0; color: #64748b; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
        .order-meta { text-align: right; } .order-amount { display: block; color: #1e293b; font-size: 14px; font-weight: 800; } .order-date { display: block; margin-top: 3px; color: #94a3b8; font-size: 11px; }
        .status-badge { display: inline-block; margin-top: 7px; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; }
        .empty-state { display: grid; place-items: center; min-height: 250px; padding: 35px 20px; text-align: center; } .empty-icon { display: grid; place-items: center; width: 58px; height: 58px; margin-bottom: 14px; border-radius: 18px; background: #eff6ff; color: #1e3a5f; } .empty-title { margin: 0; color: #334155; font-size: 16px; } .empty-copy { max-width: 280px; margin: 7px 0 0; color: #64748b; font-size: 13px; line-height: 1.5; }
        @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .content-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px) { .dashboard-shell { padding: 20px 15px 40px; } .dashboard-header { align-items: flex-start; margin-bottom: 25px; } .profile-row { gap: 8px; } .profile-name, .avatar { display: none; } .logout-button { padding: 10px; font-size: 0; } .logout-button svg { width: 18px; height: 18px; } .stats-grid { gap: 10px; } .stat-card { padding: 15px; } .stat-value { margin-top: 14px; font-size: 23px; } .orders-panel { padding: 18px; } .order-card { padding: 12px; } }
      `}</style>

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div className="brand-row">
            <div className="brand-mark"><LayoutDashboard size={21} /></div>
            <div><p className="eyebrow">{t('brand')}</p><h1 className="page-title">{t('dashboard')}</h1></div>
          </div>
          <div className="profile-row">
            <div className="avatar">{distributorName.charAt(0).toUpperCase()}</div>
            <p className="profile-name">{distributorName}</p>
            <div className="flex items-center gap-2"><button className="logout-button" onClick={handleLogout} aria-label={t('logout')}><LogOut size={16} /> {t('logout')}</button></div>
          </div>
        </header>

        <section className="stats-grid" aria-label="Business overview">
          {[
            { label: t('pending_orders'), value: pendingOrders, note: t('awaiting_action'), icon: ClipboardList, bg: '#fff7ed', color: '#c2410c' },
            { label: t('outstanding_amount'), value: displayCurrency(totalOutstanding), note: t('from_all_orders_minus_payments'), icon: Wallet, bg: '#fef3c7', color: '#b45309' },
            { label: t('products_listed'), value: productCount, note: t('available_to_retailers'), icon: Package, bg: '#e0f2fe', color: '#0369a1' },
            { label: t('total_orders'), value: totalOrders, note: t('all_time'), icon: ShoppingBag, bg: '#dcfce7', color: '#15803d' },
          ].map(({ label, value, note, icon: Icon, bg, color }) => (
            <article className="stat-card" key={label}>
              <div className="stat-top"><p className="stat-label">{label}</p><span className="stat-icon" style={{ background: bg, color }}><Icon size={18} /></span></div>
              <p className="stat-value">{value}</p><p className="stat-note">{note}</p>
            </article>
          ))}
        </section>

        <div className="content-grid">
          <section>
            <h2 className="section-heading">{t('quick_actions')}</h2><p className="section-copy">{t('keep_business_moving')}</p>
            <div className="quick-actions">
              {actions.map(({ title, description, icon: Icon, path, color, iconColor }) => (
                <button className="quick-action" onClick={() => navigate(path)} key={title}>
                  <span className="action-icon" style={{ background: color, color: iconColor }}><Icon size={20} /></span>
                  <span className="action-text"><span className="action-title">{title}</span><span className="action-description">{description}</span></span>
                  <ArrowUpRight className="action-arrow" size={18} />
                </button>
              ))}
            </div>
            <section className="share-card">
              <p className="share-label"><ExternalLink size={15} /> {t('retailer_access')}</p>
              <h2 className="share-title">{t('retailer_portal')}</h2>
              <p className="share-copy">{t('share_private_ordering_page')}</p>
              <div className="share-actions">
                <button className="button-primary" onClick={copyOrderLink} disabled={!orderLink}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? t('copied') : t('copy_link')}</button>
                <a className="button-secondary" href={`https://wa.me/?text=${encodeURIComponent(`${t('order_from_us_here')} ${orderLink}`)}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> {t('whatsapp')}</a>
                <a className="button-secondary" href={orderLink || '#'} target="_blank" rel="noreferrer" onClick={(event) => !orderLink && event.preventDefault()}><ArrowUpRight size={15} /> {t('open_portal')}</a>
              </div>
            </section>
          </section>

          <section className="orders-panel">
            <div className="orders-header"><div><h2 className="section-heading">{t('recent_orders')}</h2><p className="section-copy">{t('latest_retailer_requests')}</p></div><button className="view-all" onClick={() => navigate('/orders')}>{t('view_all')}</button></div>
            {orders.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><PackageOpen size={28} /></div><h3 className="empty-title">{t('no_orders_yet')}</h3><p className="empty-copy">{t('share_portal_to_start')}</p></div>
            ) : <div className="order-list">{orders.map((order) => {
              const status = statusStyle(order.status)
              const retailer = order.retailer_name || t('retailer')
                return <article className="order-card" key={order.id}>
                <div className="order-avatar">{retailer.charAt(0).toUpperCase()}</div>
                <div className="order-main"><p className="order-shop">{order.retailer_shop || t('retailer_shop')}</p><p className="order-retailer">{retailer}</p></div>
                <div className="order-meta"><span className="order-amount">{displayCurrency(order.total_amount)}</span><span className="order-date">{order.created_at ? formatToIST(order.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span><span className="status-badge" style={{ background: status.background, color: status.color }}>{order.status ? statusLabels[order.status] || t('status_pending') : t('status_pending')}</span></div>
              </article>
            })}</div>}
          </section>
        </div>
      </div>
    </main>
  )
}
