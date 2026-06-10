import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useParams } from 'react-router-dom'
import { 
  Package, 
  User, 
  ShoppingBag, 
  Plus, 
  Minus, 
  CheckCircle, 
  IndianRupee, 
  Building,
  Store,
  Info,
  ArrowRight,
  X,
  Phone,
  Mail
} from 'lucide-react'

export default function RetailerOrder() {
  const { distributorId } = useParams()
  const [distributor, setDistributor] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [retailerName, setRetailerName] = useState('')
  const [shopName, setShopName] = useState('')
  const [retailerPhone, setRetailerPhone] = useState('')
  const [retailerEmail, setRetailerEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => { 
    loadData() 
  }, [])

  async function loadData() {
    setPageLoading(true)
    try {
      const { data: dist } = await supabase
        .from('distributors')
        .select('*')
        .eq('id', distributorId)
        .single()
      
      if (dist) setDistributor(dist)

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('distributor_id', distributorId)
        .eq('active', true)
        .gt('stock', 0)
        .order('name', { ascending: true })
      
      setProducts(data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setPageLoading(false)
    }
  }

  function updateCart(productId, qty, maxStock) {
    let parsedQty = parseInt(qty) || 0
    if (parsedQty < 0) parsedQty = 0
    if (parsedQty > maxStock) parsedQty = maxStock
    setCart(prev => ({ ...prev, [productId]: parsedQty }))
  }

  function adjustQuantity(productId, delta, maxStock) {
    const currentQty = cart[productId] || 0
    let nextQty = currentQty + delta
    if (nextQty < 0) nextQty = 0
    if (nextQty > maxStock) nextQty = maxStock
    setCart(prev => ({ ...prev, [productId]: nextQty }))
  }

  const total = products.reduce((sum, p) => sum + (cart[p.id] || 0) * p.price, 0)
  const cartItemsCount = products.reduce((sum, p) => sum + (cart[p.id] || 0), 0)

  async function placeOrder(e) {
    e.preventDefault()
    if (!retailerName.trim() || !shopName.trim()) {
      alert('Please fill out your name and retail shop name')
      return
    }
    if (!retailerPhone.trim()) {
      alert('Phone number is required')
      return
    }
    if (!/^[6-9]\d{9}$/.test(retailerPhone.trim())) {
      alert('Enter a valid 10-digit Indian mobile number')
      return
    }
    const items = products.filter(p => cart[p.id] > 0)
    if (items.length === 0) {
      alert('Please select at least one item from the catalogue')
      return
    }

    setLoading(true)
    try {
      const orderPayload = {
        distributor_id: distributorId,
        retailer_name: retailerName.trim(),
        retailer_shop: shopName.trim(),
        retailer_phone: retailerPhone.trim(),
        status: 'placed',
        total_amount: total
      }
      if (retailerEmail.trim()) {
        orderPayload.retailer_email = retailerEmail.trim()
      }

      const { data: order } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single()

      if (order) {
        await supabase.from('order_items').insert(
          items.map(p => ({ 
            order_id: order.id, 
            product_id: p.id, 
            product_name: p.name, 
            quantity: cart[p.id], 
            price: p.price 
          }))
        )

        for (const item of items) {
          const remainingStock = item.stock - cart[item.id]
          await supabase
            .from('products')
            .update({ stock: remainingStock })
            .eq('id', item.id)
        }

        setSubmitted(true)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 shadow-sm animate-bounce">
            <CheckCircle className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Submitted!</h2>
            <p className="text-slate-500 text-sm">
              Your purchase request has been sent to <strong className="text-slate-800">{distributor?.shop_name || 'the distributor'}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-left space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Order Summary</span>
              <span className="text-emerald-600">Pending Fulfillment</span>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {products.filter(p => cart[p.id] > 0).map(p => (
                <div key={p.id} className="flex justify-between text-xs text-slate-600">
                  <span>{p.name} <strong className="text-slate-800">x{cart[p.id]}</strong></span>
                  <span className="font-mono">₹{(cart[p.id] * p.price).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-center font-bold text-sm text-slate-800">
              <span>Total Amount</span>
              <span className="text-primary-700 text-base flex items-center">
                <IndianRupee className="h-4 w-4 shrink-0" />
                {total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="pt-2 text-xs text-slate-400 flex items-center justify-center gap-1">
            <Info className="h-4 w-4" />
            The distributor will contact you shortly to confirm the shipment.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-12">

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={selectedImage}
            alt="Product"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <header className="bg-[#1e3a5f] text-white py-6 shadow-md mb-8">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-1.5 rounded-lg text-white">
              <Package className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Stock<span className="text-blue-300">Bridge</span> Order
            </span>
          </div>
          
          {distributor && (
            <div className="text-right">
              <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Ordering from</p>
              <h3 className="text-sm font-extrabold text-white">{distributor.shop_name}</h3>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {pageLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-10 w-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Fetching active catalogue...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500 max-w-md mx-auto mt-8">
            <ShoppingBag className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-bold text-slate-700">Catalogue offline</p>
            <p className="text-xs text-slate-500 mt-2">
              There are currently no active in-stock products listed by this distributor. Please contact them directly.
            </p>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="space-y-6">
            
            {/* Step 1: Retailer Info */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-[#1e3a5f]" />
                1. Your Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Shop Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Retail Shop Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Metro Provisions"
                      required
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm"
                    />
                  </div>
                </div>

                {/* Contact Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Your Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Kumar"
                      required
                      value={retailerName}
                      onChange={e => setRetailerName(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm"
                    />
                  </div>
                </div>

                {/* Phone - MANDATORY */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      required
                      maxLength={10}
                      value={retailerPhone}
                      onChange={e => setRetailerPhone(e.target.value.replace(/\D/g, ''))}
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">10-digit mobile number</p>
                </div>

                {/* Email - OPTIONAL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      placeholder="e.g. rajesh@gmail.com"
                      value={retailerEmail}
                      onChange={e => setRetailerEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] text-sm"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Step 2: Products */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#1e3a5f]" />
                  2. Select Products
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-medium border border-slate-200">
                  {products.length} Available
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {products.map(p => {
                  const qty = cart[p.id] || 0
                  return (
                    <div key={p.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            onClick={() => setSelectedImage(p.image_url)}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-100 shadow-sm cursor-zoom-in hover:opacity-80 transition"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-2xl">
                            📦
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{p.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="text-sm font-extrabold text-[#1e3a5f] flex items-center">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {p.price}
                              <span className="text-slate-400 text-xs font-normal ml-0.5">/ {p.unit || 'pcs'}</span>
                            </span>
                            <span>•</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm font-medium">
                              Stock: {p.stock}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(p.id, -1, p.stock)}
                          disabled={qty === 0}
                          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <input
                          type="number"
                          min="0"
                          max={p.stock}
                          value={qty || ''}
                          placeholder="0"
                          onChange={e => updateCart(p.id, e.target.value, p.stock)}
                          className="w-14 h-9 text-center border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
                        />
                        
                        <button
                          type="button"
                          onClick={() => adjustQuantity(p.id, 1, p.stock)}
                          disabled={qty >= p.stock}
                          className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cart Summary */}
            {total > 0 && (
              <div className="bg-emerald-600 text-white rounded-2xl shadow-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-emerald-100">Basket Summary</p>
                  <p className="text-sm font-medium text-white mt-0.5">
                    <strong className="font-extrabold">{cartItemsCount}</strong> items selected
                  </p>
                </div>
                <div className="text-center sm:text-right flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0.5 shrink-0">
                  <span className="text-xs font-semibold text-emerald-100 uppercase">Subtotal</span>
                  <span className="text-2xl font-extrabold text-white flex items-center">
                    <IndianRupee className="h-6 w-6 shrink-0" />
                    {total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={loading || total === 0}
              className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg text-base font-bold text-white bg-[#1e3a5f] hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a5f] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" />
                  Place Order
                  <ArrowRight className="h-5 w-5 ml-1" />
                </>
              )}
            </button>

          </form>
        )}
      </main>
    </div>
  )
}
