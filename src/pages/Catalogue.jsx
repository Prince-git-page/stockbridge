import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Box, CalendarDays, ImagePlus, IndianRupee, LoaderCircle, Package, Plus, Upload, X } from 'lucide-react'
import { formatToIST } from '../lib/formatDate'

const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export default function Catalogue() {
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [distributorId, setDistributorId] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', unit: '', stock: '' })
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: dist } = await supabase.from('distributors').select('*').eq('user_id', user.id).single()
    if (dist) {
      setDistributorId(dist.id)
      const { data } = await supabase.from('products').select('*').eq('distributor_id', dist.id).order('created_at', { ascending: false })
      setProducts(data || [])
    }
  }

  function handleImageChange(event) {
    const file = event.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function addProduct() {
    if (!form.name || !form.price) return alert(t('name_and_price_required'))
    setLoading(true)
    let image_url = null
    if (image) {
      const ext = image.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, image)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }
    }
    await supabase.from('products').insert({
      distributor_id: distributorId,
      name: form.name,
      price: parseFloat(form.price),
      unit: form.unit,
      stock: parseInt(form.stock) || 0,
      image_url,
    })
    setForm({ name: '', price: '', unit: '', stock: '' })
    setImage(null)
    setPreview(null)
    await loadProducts()
    setLoading(false)
  }

  async function toggleProduct(id, active) {
    await supabase.from('products').update({ active: !active }).eq('id', id)
    await loadProducts()
  }

  async function deleteProduct(id) {
    if (!window.confirm(t('delete_product_confirm'))) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error)
      alert(t('delete_failed_message', { message: error.message }))
      return
    }
    await loadProducts()
  }

  const activeProducts = products.filter((product) => product.active).length

  return <main className="min-h-screen bg-slate-50 pb-12 text-slate-800"><style>{`.catalogue-input { width: 100%; border: 1px solid #e2e8f0; border-radius: .5rem; padding: .625rem .75rem; font-size: .875rem; color: #0f172a; outline: none; transition: border-color .15s, box-shadow .15s; } .catalogue-input::placeholder { color: #94a3b8; } .catalogue-input:focus { border-color: #1e3a5f; box-shadow: 0 0 0 2px rgba(30,58,95,.15); }`}</style>
    <header className="border-b border-white/10 bg-[#1e3a5f] text-white shadow-lg shadow-slate-900/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><Package size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">StockBridge</p><h1 className="text-xl font-extrabold tracking-tight">Catalogue Management</h1><p className="mt-0.5 text-sm text-blue-100">Manage your retailer-ready inventory in one place.</p></div></div><div className="flex items-center gap-3"><div className="rounded-xl bg-white/10 px-3 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Total products</p><p className="text-lg font-extrabold leading-5">{products.length}</p></div><button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-bold text-[#1e3a5f] transition hover:bg-blue-50"><ArrowLeft size={16} /> Dashboard</button></div></div></header>

    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1e3a5f]"><Plus size={21} /></span><div><h2 className="text-lg font-bold text-slate-900">{t('add_a_product')}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{t('publish_an_item_to_your_portal')}</p></div></div><div className="mt-6 space-y-4"><FormField label={t('product_name')} required><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t('example_premium_basmati_rice')} className="catalogue-input" /></FormField><div className="grid grid-cols-2 gap-3"><FormField label={t('price')} required><div className="relative"><IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={form.price} type="number" onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder={t('example_price')} className="catalogue-input pl-8" /></div></FormField><FormField label={t('unit')}><input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder={t('example_unit')} className="catalogue-input" /></FormField></div><FormField label={t('opening_stock')}><input value={form.stock} type="number" onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder={t('example_stock')} className="catalogue-input" /></FormField><div><p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">{t('product_image')}</p><input id="imgInput" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />{preview ? <div className="relative overflow-hidden rounded-xl border border-slate-200"><img src={preview} alt={t('product_preview')} className="h-40 w-full object-cover" /><div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-slate-950/60 px-3 py-2"><span className="text-xs font-semibold text-white">Ready to upload</span><button onClick={() => { setImage(null); setPreview(null) }} className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs font-bold text-white transition hover:bg-white/25"><X size={13} /> Remove</button></div></div> : <button onClick={() => document.getElementById('imgInput').click()} className="grid w-full place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center transition hover:border-[#1e3a5f] hover:bg-blue-50"><span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-white text-[#1e3a5f] shadow-sm"><ImagePlus size={20} /></span><span className="text-sm font-bold text-slate-700">Upload product photo</span><span className="mt-1 text-xs text-slate-400">JPG, PNG, or WEBP</span></button>}</div><p className="flex gap-1.5 text-xs leading-5 text-slate-400"><Upload size={14} className="mt-0.5 shrink-0" />Images help retailers find the right product faster.</p><button onClick={addProduct} disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3.5 text-sm font-extrabold text-white shadow-md shadow-slate-900/10 transition hover:bg-[#163354] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><LoaderCircle size={18} className="animate-spin" /> Publishing product…</> : <><Plus size={18} /> Publish product</>}</button></div></section>

      <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold tracking-tight text-slate-900">{t('your_inventory')}</h2><p className="mt-1 text-sm text-slate-500">{t('visible_to_retailers_summary', { visible: activeProducts, hidden: products.length - activeProducts })}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1e3a5f]">{products.length} {t('products')}</span></div>{products.length === 0 ? <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-[#1e3a5f]"><Box size={31} /></span><h3 className="text-lg font-bold text-slate-800">{t('no_products_yet')}</h3><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{t('add_first_product_to_start_orders')}</p></div></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} t={t} onToggle={() => toggleProduct(product.id, product.active)} onDelete={() => deleteProduct(product.id)} />)}</div>}</section>
    </div>
  </main>
}

function FormField({ label, required, children }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}{required && <span className="ml-0.5 text-rose-500">*</span>}</span>{children}</label> }

function ProductCard({ product, onToggle, onDelete, t }) {
  const stock = Number(product.stock || 0)
  const stockState = stock === 0 ? { label: t('out_of_stock'), style: 'bg-rose-50 text-rose-700 ring-rose-200' } : stock <= 10 ? { label: t('low_stock'), style: 'bg-amber-50 text-amber-700 ring-amber-200' } : { label: t('in_stock'), style: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
  const createdAt = product.created_at ? formatToIST(product.created_at, { day: 'numeric', month: 'short' }) : null

  return (
    <article className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${product.active ? 'border-slate-200' : 'border-slate-200 opacity-75'}`}>
      <div className="relative h-40 bg-slate-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-slate-300"><Package size={38} /></div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5"><span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${product.active ? 'bg-white text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}>{product.active ? 'Visible' : 'Hidden'}</span></div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate font-bold text-slate-900" title={product.name}>{product.name}</h3>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${stockState.style}`}>{stockState.label}</span>
        </div>
        <p className="mt-2 flex items-center text-xl font-extrabold tracking-tight text-[#1e3a5f]"><IndianRupee size={17} />{formatAmount(product.price)}{product.unit && <span className="ml-1 text-xs font-medium text-slate-400">/ {product.unit}</span>}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
          <span className="font-semibold text-slate-500">Stock <strong className="ml-1 text-slate-800">{stock}</strong></span>
          {createdAt && <span className="flex items-center gap-1 text-slate-400"><CalendarDays size={12} />{createdAt}</span>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onToggle} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50">{t('toggle')}</button>
          <button onClick={onDelete} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-2 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50">{t('delete')}</button>
        </div>
      </div>
    </article>
  )
}
