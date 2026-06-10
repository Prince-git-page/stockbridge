import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import {
  Package, LogOut, ChevronDown, ChevronUp,
  ShoppingBag, Store, Phone, IndianRupee,
  Clock, CheckCircle, Truck, PartyPopper
} from 'lucide-react'

const STATUS_FLOW = ['placed', 'confirmed', 'dispatched', 'delivered']

const STATUS_STYLE = {
  placed:     { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} /> },
  confirmed:  { bg: 'bg-blue-100',   text: 'text-blue-800',   icon: <CheckCircle size={14} /> },
  dispatched: { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Truck size={14} /> },
  delivered:  { bg: 'bg-green-100',  text: 'text-green-800',  icon: <PartyPopper size={14} /> },
}

const TABS = ['all', 'placed', 'confirmed', 'dispatched', 'delivered']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [orderItems, setOrderItems] = useState({})
  const [activeTab, setActiveTab] = useState('all')
  const [updatingId, setUpdatingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    loadOrders(user.id)
  }

  async function loadOrders(userId) {
    setLoading(true)
    const { data: dist } = await supabase
      .from('distributors')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!dist) { setLoading(false); return }

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('distributor_id', dist.id)
      .order('created_at', { ascending: false })

    setOrders(data || [])
    setLoading(false)
  }

  async function loadItems(orderId) {
    if (orderItems[orderId]) return
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    setOrderItems(prev => ({ ...prev, [orderId]: data || [] }))
  }

  function toggleExpand(orderId) {
    if (expandedId === orderId) {
      setExpandedId(null)
    } else {
      setExpandedId(orderId)
      loadItems(orderId)
    }
  }

  async function updateStatus(orderId, newStatus) {
    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      )
    } else {
      alert('Failed to update status: ' + error.message)
    }
    setUpdatingId(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab)

  const countFor = (tab) =>
    tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShoppingBag size={22} className="text-blue-600" />
          <span className="font-bold text-gray-800 text-lg">Orders</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1 text-gray-500 hover:text-red-500 text-sm">
          <LogOut size={16} /> Logout
        </button>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors
                ${activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className={`text-xs rounded-full px-1.5 py-0.5
                ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {countFor(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center text-gray-400 py-16">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <Package size={40} className="mx-auto mb-2 opacity-30" />
            <p>No {activeTab === 'all' ? '' : activeTab} orders yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(order => {
              const style = STATUS_STYLE[order.status] || STATUS_STYLE.placed
              const isExpanded = expandedId === order.id
              const isUpdating = updatingId === order.id
              const items = orderItems[order.id] || []
              const currentIndex = STATUS_FLOW.indexOf(order.status)
              const nextStatus = STATUS_FLOW[currentIndex + 1]

              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Store size={15} className="text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 truncate">{order.retailer_shop}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <Package size={13} className="flex-shrink-0" />
                          <span className="truncate">{order.retailer_name}</span>
                        </div>

                        {/* FIXED: clickable phone link */}
                        {order.retailer_phone ? (
                          <a
                            href={`tel:${order.retailer_phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium mt-1 hover:underline"
                          >
                            <Phone size={13} className="flex-shrink-0" />
                            {order.retailer_phone}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1 ml-5">No phone saved</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 font-bold text-gray-800">
                          <IndianRupee size={14} />
                          {Number(order.total_amount).toLocaleString('en-IN')}
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
                          {style.icon}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                      {isExpanded
                        ? <ChevronUp size={16} className="text-gray-400" />
                        : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded: Items + Status Update */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      {/* Items */}
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                      {items.length === 0 ? (
                        <p className="text-sm text-gray-400">Loading items...</p>
                      ) : (
                        <div className="flex flex-col gap-1 mb-4">
                          {items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-700">
                                {item.product_name}
                                <span className="text-gray-400 ml-1">× {item.quantity}</span>
                              </span>
                              <span className="font-medium text-gray-800 flex items-center gap-0.5">
                                <IndianRupee size={12} />
                                {(item.price * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-sm font-bold">
                            <span>Total</span>
                            <span className="flex items-center gap-0.5">
                              <IndianRupee size={12} />
                              {Number(order.total_amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Status Update */}
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
                      <div className="flex gap-2 flex-wrap">
                        {STATUS_FLOW.map((status, idx) => (
                          <button
                            key={status}
                            disabled={order.status === status || isUpdating}
                            onClick={() => updateStatus(order.id, status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                              ${order.status === status
                                ? `${STATUS_STYLE[status].bg} ${STATUS_STYLE[status].text} cursor-default`
                                : idx < currentIndex
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                              }`}
                          >
                            {isUpdating && status !== order.status ? '...' : status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Quick next-step button */}
                      {nextStatus && (
                        <button
                          disabled={isUpdating}
                          onClick={() => updateStatus(order.id, nextStatus)}
                          className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? 'Updating...' : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)} →`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
