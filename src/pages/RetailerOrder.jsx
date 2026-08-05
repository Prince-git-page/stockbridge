/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, CheckCircle2, ClipboardList, Image, IndianRupee, Info, Mail, Minus, Package, PackageOpen, Phone, Plus, ShoppingBag, Store, User, Wallet, X } from 'lucide-react'

const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function RetailerOrder() {
  const navigate = useNavigate()
  const { distributorId } = useParams()
  const [distributor, setDistributor] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [retailerName, setRetailerName] = useState('')
  const [shopName, setShopName] = useState(() => localStorage.getItem('retailer_shop') || '')
  const [retailerPhone, setRetailerPhone] = useState(() => localStorage.getItem('retailer_phone') || '')
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
      const { data: dist } = await supabase.from('distributors').select('*').eq('id', distributorId).single()
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
    setCart((previous) => ({ ...previous, [productId]: parsedQty }))
  }

  function adjustQuantity(productId, delta, maxStock) {
    const currentQty = cart[productId] || 0
    let nextQty = currentQty + delta
    if (nextQty < 0) nextQty = 0
    if (nextQty > maxStock) nextQty = maxStock
    setCart((previous) => ({ ...previous, [productId]: nextQty }))
  }

  const total = products.reduce((sum, product) => sum + (cart[product.id] || 0) * product.price, 0)
  const cartItemsCount = products.reduce((sum, product) => sum + (cart[product.id] || 0), 0)
  const canAccessLedger = Boolean(shopName.trim() && /^[6-9]\d{9}$/.test(retailerPhone.trim()))

  function openLedger() {
    if (!canAccessLedger) return
    localStorage.setItem('retailer_shop', shopName.trim())
    localStorage.setItem('retailer_phone', retailerPhone.trim())
    navigate(`/retailer-ledger/${distributorId}`)
  }

  async function placeOrder(event) {
    event.preventDefault()
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
    const items = products.filter((product) => cart[product.id] > 0)
    if (items.length === 0) {
      alert('Please select at least one item from the catalogue')
      return
    }

    setLoading(true)
    try {
      const orderPayload = { distributor_id: distributorId, retailer_name: retailerName.trim(), retailer_shop: shopName.trim(), retailer_phone: retailerPhone.trim(), status: 'placed', total_amount: total }
      if (retailerEmail.trim()) orderPayload.retailer_email = retailerEmail.trim()

      const { data: order } = await supabase.from('orders').insert(orderPayload).select().single()
      if (order) {
        await supabase.from('order_items').insert(items.map((product) => ({ order_id: order.id, product_id: product.id, product_name: product.name, quantity: cart[product.id], price: product.price })))
        for (const item of items) {
          const remainingStock = item.stock - cart[item.id]
          await supabase.from('products').update({ stock: remainingStock }).eq('id', item.id)
        }
        setSubmitted(true)
        localStorage.setItem('retailer_shop', shopName.trim())
        localStorage.setItem('retailer_phone', retailerPhone.trim())
      }
    } catch (err) {
      console.error(err)
      alert('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function placeAnotherOrder() {
    setCart({})
    setSubmitted(false)
  }

  if (submitted) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 text-slate-800"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/60 sm:p-9"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={35} /></span><p className="mt-5 text-xs font-extrabold uppercase tracking-[.18em] text-emerald-600">Order confirmed</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">Order placed successfully</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">Your request has been sent to <strong className="text-slate-700">{distributor?.shop_name || 'the distributor'}</strong>. They will contact you to confirm fulfilment.</p><div className="mt-7 rounded-2xl bg-slate-50 p-5 text-left"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400"><span>Order summary</span><span className="text-amber-600">Pending</span></div><div className="mt-3 max-h-36 space-y-2 overflow-auto pr-1">{products.filter((product) => cart[product.id] > 0).map((product) => <div key={product.id} className="flex justify-between text-sm text-slate-600"><span>{product.name} <strong className="text-slate-800">× {cart[product.id]}</strong></span><span className="font-semibold"><IndianRupee className="inline h-3.5 w-3.5" />{formatAmount(cart[product.id] * product.price)}</span></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 font-bold"><span>Total amount</span><span className="flex items-center text-lg text-[#1e3a5f]"><IndianRupee size={17} />{formatAmount(total)}</span></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={placeAnotherOrder} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"><ShoppingBag size={17} /> Place another order</button><button onClick={openLedger} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#163354]"><Wallet size={17} /> View My Ledger</button></div></section></main>
  }

  return <main className="min-h-screen bg-slate-50 pb-12 text-slate-800"><style>{`.input { width: 100%; border: 1px solid #e2e8f0; border-radius: .5rem; padding: .625rem .75rem; font-size: .875rem; color: #0f172a; outline: none; transition: border-color .15s, box-shadow .15s; } .input::placeholder { color: #94a3b8; } .input:focus { border-color: #1e3a5f; box-shadow: 0 0 0 2px rgba(30,58,95,.15); }`}</style>
    {selectedImage && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4" onClick={() => setSelectedImage(null)}><button aria-label="Close image" className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20" onClick={() => setSelectedImage(null)}><X size={22} /></button><img src={selectedImage} alt="Product" className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} /></div>}
    <header className="bg-[#1e3a5f] text-white shadow-lg shadow-slate-900/10"><div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Package size={21} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-200">StockBridge</p><h1 className="font-bold">Retailer ordering portal</h1></div></div><div className="flex items-center gap-3">{distributor && <div className="hidden text-right sm:block"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Ordering from</p><p className="text-sm font-bold">{distributor.shop_name}</p></div>}{canAccessLedger && <button onClick={openLedger} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#1e3a5f] transition hover:bg-blue-50"><Wallet size={16} /><span className="hidden sm:inline">My Ledger</span></button>}</div></div></header>
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
      {pageLoading ? <LoadingState /> : products.length === 0 ? <EmptyCatalogue /> : <form onSubmit={placeOrder} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"><div className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><SectionHeading icon={Store} number="1" title="Your details" copy="Tell the distributor who is placing this order." /><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Retail shop name *" icon={Building2}><input required value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="e.g. Metro Provisions" className="input" /></Field><Field label="Your name *" icon={User}><input required value={retailerName} onChange={(event) => setRetailerName(event.target.value)} placeholder="e.g. Rajesh Kumar" className="input" /></Field><Field label="Mobile number *" icon={Phone}><input type="tel" required maxLength={10} value={retailerPhone} onChange={(event) => setRetailerPhone(event.target.value.replace(/\D/g, ''))} placeholder="9876543210" className="input" /><p className="mt-1 text-xs text-slate-400">10-digit mobile number</p></Field><Field label="Email address" optional icon={Mail}><input type="email" value={retailerEmail} onChange={(event) => setRetailerEmail(event.target.value)} placeholder="name@example.com" className="input" /></Field></div>{!canAccessLedger && <p className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800"><Info size={15} className="mt-0.5 shrink-0" />Enter your shop name and mobile number to access your ledger anytime.</p>}</section><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><SectionHeading icon={ShoppingBag} number="2" title="Choose products" copy="Select what you need today." /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{products.length} available</span></div><div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">{products.map((product) => <ProductCard key={product.id} product={product} qty={cart[product.id] || 0} onImage={() => product.image_url && setSelectedImage(product.image_url)} onChange={(value) => updateCart(product.id, value, product.stock)} onAdjust={(delta) => adjustQuantity(product.id, delta, product.stock)} />)}</div></section></div><aside className="lg:sticky lg:top-5"><section className="rounded-2xl bg-[#1e3a5f] p-5 text-white shadow-lg shadow-slate-900/15"><div className="flex items-center gap-2"><ClipboardList size={19} /><h2 className="font-bold">Order summary</h2></div><div className="my-5 border-y border-white/15 py-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-200">Items selected</p><p className="mt-1 text-2xl font-extrabold">{cartItemsCount || 0}</p></div><div className="flex items-end justify-between"><span className="text-sm text-blue-100">Estimated total</span><span className="flex items-center text-2xl font-extrabold"><IndianRupee size={20} />{formatAmount(total)}</span></div><button type="submit" disabled={loading || total === 0} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-extrabold text-[#1e3a5f] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1e3a5f] border-t-transparent" /> : <><ShoppingBag size={17} /> Place order <ArrowRight size={17} /></>}</button><p className="mt-3 text-center text-xs leading-5 text-blue-200">Your order will be reviewed by the distributor before fulfilment.</p></section></aside></form>}
    </div>
  </main>
}

function LoadingState() { return <div className="grid min-h-96 place-items-center text-center"><div><span className="mx-auto mb-4 block h-11 w-11 animate-spin rounded-full border-4 border-[#1e3a5f] border-t-transparent" /><p className="font-semibold text-slate-700">Loading catalogue…</p><p className="mt-1 text-sm text-slate-500">Finding products available for you.</p></div></div> }
function EmptyCatalogue() { return <section className="mx-auto grid max-w-md place-items-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm"><span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-[#1e3a5f]"><PackageOpen size={27} /></span><h2 className="text-lg font-bold">No products available</h2><p className="mt-2 text-sm leading-6 text-slate-500">There are no active products in stock right now. Please check back later or contact the distributor.</p></section> }
function SectionHeading({ icon: Icon, number, title, copy }) { return <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-xs font-extrabold text-[#1e3a5f]">{number}</span><Icon size={18} className="text-[#1e3a5f]" />{title}</h2><p className="mt-1 text-sm text-slate-500">{copy}</p></div> }
function Field({ label, icon: Icon, optional, children }) { return <label className="block"><span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500"><Icon size={14} />{label}{optional && <em className="normal-case font-medium text-slate-400">(optional)</em>}</span>{children}</label> }
function ProductCard({ product, qty, onImage, onChange, onAdjust }) { return <article className={`rounded-xl border p-4 transition ${qty > 0 ? 'border-blue-200 bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}><div className="flex gap-3">{product.image_url ? <button type="button" onClick={onImage} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200"><img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /></button> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400"><Image size={22} /></span>}<div className="min-w-0 flex-1"><h3 className="truncate font-bold text-slate-900">{product.name}</h3><p className="mt-1 flex items-center text-sm font-extrabold text-[#1e3a5f]"><IndianRupee size={14} />{formatAmount(product.price)}<span className="ml-1 text-xs font-medium text-slate-400">/ {product.unit || 'pcs'}</span></p><p className="mt-1 text-xs font-medium text-slate-500">{product.stock} in stock</p></div></div><div className="mt-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">Quantity</span><div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => onAdjust(-1)} disabled={qty === 0} aria-label={`Remove one ${product.name}`} className="grid h-9 w-9 place-items-center text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"><Minus size={15} /></button><input aria-label={`${product.name} quantity`} type="number" min="0" max={product.stock} value={qty || ''} placeholder="0" onChange={(event) => onChange(event.target.value)} className="h-9 w-10 border-x border-slate-200 text-center text-sm font-bold outline-none" /><button type="button" onClick={() => onAdjust(1)} disabled={qty >= product.stock} aria-label={`Add one ${product.name}`} className="grid h-9 w-9 place-items-center text-[#1e3a5f] transition hover:bg-blue-50 disabled:opacity-30"><Plus size={15} /></button></div></div></article> }
