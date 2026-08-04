  import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [distributor, setDistributor] = useState(null)
  const [orders, setOrders] = useState([])
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

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

    const { data: allOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('distributor_id', dist.id)
      .eq('status', 'placed')

    const total = (allOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0)
    setTotalOutstanding(total)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const orderLink = distributor ? `${window.location.origin}/order/${distributor.id}` : ''

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>THIS IS THE NEW DASHBOARD</h2>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
          <p style={{ margin: 0, color: '#666' }}>Pending Orders</p>
          <h3 style={{ margin: '0.5rem 0 0' }}>{orders.length}</h3>
        </div>
        <div style={{ flex: 1, padding: '1.5rem', backgroundColor: '#fef9c3', borderRadius: '8px' }}>
          <p style={{ margin: 0, color: '#666' }}>Outstanding Amount</p>
          <h3 style={{ margin: '0.5rem 0 0' }}>₹{totalOutstanding}</h3>
        </div>
      </div>

      {distributor && (
        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '2rem' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 'bold' }}>Your Order Link (share with retailers):</p>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', wordBreak: 'break-all' }}>{orderLink}</p>
          
          <a href={"https://wa.me/?text=" + encodeURIComponent("Order from us here: " + orderLink)}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#16a34a', color: 'white', borderRadius: '4px', textDecoration: 'none' }}
          >
            Share on WhatsApp
          </a>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/catalogue')} style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>Catalogue</button>
        <button onClick={() => navigate('/orders')} style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>Orders</button>
        <button onClick={() => navigate('/ledger')} style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>Ledger</button>
      </div>

      <h3>Recent Orders</h3>
      {orders.length === 0 ? (
        <p style={{ color: '#666' }}>No orders yet. Share your link with retailers!</p>
      ) : (
        orders.map(order => (
          <div key={order.id} style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{order.retailer_shop} — {order.retailer_name}</span>
              <span style={{ fontWeight: 'bold' }}>₹{order.total_amount}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
              Status: {order.status} · {new Date(order.created_at).toLocaleDateString('en-IN')}
            </div>
          </div>
        ))
      )}
    </div>
  )
}