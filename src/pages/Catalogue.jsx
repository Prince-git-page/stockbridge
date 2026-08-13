import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Box, CalendarDays, ImagePlus, IndianRupee, LoaderCircle, Package, Pencil, Plus, Upload, X } from 'lucide-react'
import { formatToIST } from '../lib/formatDate'

const formatAmount = (amount) => Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
const emptyForm = { name: '', price: '', unit: '', stock: '' }

export default function Catalogue() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [distributorId, setDistributorId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editImage, setEditImage] = useState(null)
  const [editPreview, setEditPreview] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editMessage, setEditMessage] = useState('')

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: dist } = await supabase.from('distributors').select('id').eq('user_id', user.id).single()
    if (!dist) return
    setDistributorId(dist.id)
    const { data, error } = await supabase.from('products').select('*').eq('distributor_id', dist.id).order('created_at', { ascending: false })
    if (error) console.error('PRODUCT LOAD ERROR:', error)
    setProducts(data || [])
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function uploadProductImage(file) {
    const extension = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from('product-images').upload(fileName, file)
    if (error) throw error
    return supabase.storage.from('product-images').getPublicUrl(fileName).data.publicUrl
  }

  async function addProduct() {
    if (!form.name.trim() || form.price === '') return alert(t('name_and_price_required'))
    setLoading(true)
    try {
      const image_url = image ? await uploadProductImage(image) : null
      const { error } = await supabase.from('products').insert({ distributor_id: distributorId, name: form.name.trim(), price: Number(form.price), unit: form.unit.trim(), stock: Number(form.stock) || 0, image_url })
      if (error) throw error
      setForm(emptyForm); setImage(null); setPreview(null)
      await loadProducts()
    } catch (error) {
      console.error('PRODUCT CREATE ERROR:', error)
      alert(error.message)
    } finally { setLoading(false) }
  }

  async function toggleProduct(id, active) {
    const { error } = await supabase.from('products').update({ active: !active }).eq('id', id).eq('distributor_id', distributorId)
    if (error) return alert(error.message)
    await loadProducts()
  }

  async function deleteProduct(id) {
    if (!window.confirm(t('delete_product_confirm'))) return
    const { error } = await supabase.from('products').delete().eq('id', id).eq('distributor_id', distributorId)
    if (error) { console.error('Delete error:', error); alert(t('delete_failed_message', { message: error.message })); return }
    await loadProducts()
  }

  function openEdit(product) {
    setEditingProduct(product)
    setEditForm({ name: product.name || '', price: String(product.price ?? ''), unit: product.unit || '', stock: String(product.stock ?? 0) })
    setEditImage(null); setEditPreview(product.image_url || null); setEditMessage('')
  }

  function closeEdit() {
    if (!savingEdit) { setEditingProduct(null); setEditImage(null); setEditPreview(null); setEditMessage('') }
  }

  function handleEditImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setEditImage(file)
    setEditPreview(URL.createObjectURL(file))
  }

  async function saveProductChanges(event) {
    event.preventDefault()
    const price = Number(editForm.price)
    const stock = Number(editForm.stock)
    if (!editForm.name.trim() || !editForm.unit.trim()) return setEditMessage(t('product_name_and_unit_required'))
    if (!Number.isFinite(price) || price < 0) return setEditMessage(t('price_must_be_non_negative'))
    if (!Number.isInteger(stock) || stock < 0) return setEditMessage(t('stock_must_be_non_negative'))
    if (savingEdit || !editingProduct) return
    setSavingEdit(true); setEditMessage('')
    try {
      const updates = { name: editForm.name.trim(), price, unit: editForm.unit.trim(), stock }
      if (editImage) updates.image_url = await uploadProductImage(editImage)
      const { data, error } = await supabase.from('products').update(updates).eq('id', editingProduct.id).eq('distributor_id', distributorId).select().single()
      if (error) throw error
      setProducts((current) => current.map((product) => product.id === data.id ? data : product))
      setEditMessage(t('product_updated_successfully'))
      window.setTimeout(() => closeEdit(), 700)
    } catch (error) {
      console.error('PRODUCT UPDATE ERROR:', error)
      setEditMessage(`${t('failed_to_update_product')}: ${error.message}`)
    } finally { setSavingEdit(false) }
  }

  const activeProducts = products.filter((product) => product.active).length
  return <main className="min-h-screen bg-slate-50 pb-12 text-slate-800"><style>{`.catalogue-input { width: 100%; border: 1px solid #e2e8f0; border-radius: .5rem; padding: .625rem .75rem; font-size: .875rem; color: #0f172a; outline: none; transition: border-color .15s, box-shadow .15s; } .catalogue-input::placeholder { color: #94a3b8; } .catalogue-input:focus { border-color: #1e3a5f; box-shadow: 0 0 0 2px rgba(30,58,95,.15); }`}</style>
    <header className="border-b border-white/10 bg-[#1e3a5f] text-white shadow-lg shadow-slate-900/10"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><Package size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-200">{t('brand')}</p><h1 className="text-xl font-extrabold tracking-tight">{t('catalogue_management')}</h1><p className="mt-0.5 text-sm text-blue-100">{t('manage_your_retailer_ready_inventory')}</p></div></div><div className="flex items-center gap-3"><div className="rounded-xl bg-white/10 px-3 py-2 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">{t('total_products')}</p><p className="text-lg font-extrabold leading-5">{products.length}</p></div><button onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-bold text-[#1e3a5f]"><ArrowLeft size={16} /> {t('dashboard')}</button></div></div></header>
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#1e3a5f]"><Plus size={21} /></span><div><h2 className="text-lg font-bold text-slate-900">{t('add_a_product')}</h2><p className="mt-1 text-sm leading-5 text-slate-500">{t('publish_an_item_to_your_portal')}</p></div></div><div className="mt-6 space-y-4"><FormField label={t('product_name')} required><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={t('example_premium_basmati_rice')} className="catalogue-input" /></FormField><div className="grid grid-cols-2 gap-3"><FormField label={t('price')} required><input value={form.price} type="number" min="0" onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder={t('example_price')} className="catalogue-input" /></FormField><FormField label={t('unit')}><input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder={t('example_unit')} className="catalogue-input" /></FormField></div><FormField label={t('opening_stock')}><input value={form.stock} type="number" min="0" step="1" onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder={t('example_stock')} className="catalogue-input" /></FormField><ImagePicker inputId="add-product-image" preview={preview} onChange={handleImageChange} onClear={() => { setImage(null); setPreview(null) }} t={t} /><button onClick={addProduct} disabled={loading || !distributorId} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3.5 text-sm font-extrabold text-white disabled:opacity-60">{loading ? <><LoaderCircle size={18} className="animate-spin" /> {t('publishing_product')}</> : <><Plus size={18} /> {t('publish_product')}</>}</button></div></section>
      <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold tracking-tight text-slate-900">{t('your_inventory')}</h2><p className="mt-1 text-sm text-slate-500">{t('visible_to_retailers_summary', { visible: activeProducts, hidden: products.length - activeProducts })}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#1e3a5f]">{products.length} {t('products')}</span></div>{products.length === 0 ? <EmptyProducts t={t} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} t={t} onEdit={() => openEdit(product)} onToggle={() => toggleProduct(product.id, product.active)} onDelete={() => deleteProduct(product.id)} />)}</div>}</section></div>
    {editingProduct && <EditProductModal product={editingProduct} form={editForm} preview={editPreview} saving={savingEdit} message={editMessage} onChange={(field, value) => setEditForm((current) => ({ ...current, [field]: value }))} onImageChange={handleEditImageChange} onClearImage={() => { setEditImage(null); setEditPreview(editingProduct.image_url || null) }} onClose={closeEdit} onSave={saveProductChanges} t={t} />}
  </main>
}

function FormField({ label, required, children }) { return <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}{required && <span className="ml-0.5 text-rose-500">*</span>}</span>{children}</label> }
function ImagePicker({ inputId, preview, onChange, onClear, t }) { return <div><p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">{t('product_image')}</p><input id={inputId} type="file" accept="image/*" onChange={onChange} className="hidden" />{preview ? <div className="relative overflow-hidden rounded-xl border border-slate-200"><img src={preview} alt={t('product_preview')} className="h-40 w-full object-cover" /><button type="button" onClick={onClear} className="absolute right-2 top-2 rounded-lg bg-slate-950/65 p-2 text-white"><X size={15} /></button></div> : <label htmlFor={inputId} className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center"><ImagePlus size={20} className="mb-2 text-[#1e3a5f]" /><span className="text-sm font-bold text-slate-700">{t('upload_product_photo')}</span><span className="mt-1 text-xs text-slate-400">{t('image_file_types')}</span></label>}<p className="mt-2 flex gap-1.5 text-xs leading-5 text-slate-400"><Upload size={14} />{t('images_help')}</p></div> }
function EmptyProducts({ t }) { return <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><Box size={31} className="mx-auto mb-4 text-[#1e3a5f]" /><h3 className="text-lg font-bold">{t('no_products_yet')}</h3><p className="mt-2 text-sm text-slate-500">{t('add_first_product_to_start_orders')}</p></div></div> }
function ProductCard({ product, onEdit, onToggle, onDelete, t }) { const stock = Number(product.stock || 0); const stockState = stock === 0 ? { label: t('out_of_stock'), style: 'bg-rose-50 text-rose-700' } : stock <= 10 ? { label: t('low_stock'), style: 'bg-amber-50 text-amber-700' } : { label: t('in_stock'), style: 'bg-emerald-50 text-emerald-700' }; const createdAt = product.created_at ? formatToIST(product.created_at, { day: 'numeric', month: 'short' }) : null; return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="relative h-40 bg-slate-100">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-300"><Package size={38} /></div>}<span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-600">{product.active ? t('visible') : t('hidden')}</span></div><div className="p-4"><div className="flex items-start justify-between gap-2"><h3 className="min-w-0 truncate font-bold" title={product.name}>{product.name}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${stockState.style}`}>{stockState.label}</span></div><p className="mt-2 text-xl font-extrabold text-[#1e3a5f]"><IndianRupee size={17} className="inline" />{formatAmount(product.price)}{product.unit && <span className="ml-1 text-xs font-medium text-slate-400">/ {product.unit}</span>}</p><div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-xs"><span className="font-semibold text-slate-500">{t('stock_label')} <strong className="ml-1 text-slate-800">{stock}</strong></span>{createdAt && <span className="flex items-center gap-1 text-slate-400"><CalendarDays size={12} />{createdAt}</span>}</div><div className="mt-4 grid grid-cols-3 gap-2"><button onClick={onEdit} className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-200 px-2 py-2 text-xs font-bold text-[#1e3a5f]"><Pencil size={14} />{t('edit')}</button><button onClick={onToggle} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600">{t('hide')}</button><button onClick={onDelete} className="rounded-lg border border-rose-200 px-2 py-2 text-xs font-bold text-rose-700">{t('delete')}</button></div></div></article> }
function EditProductModal({ product, form, preview, saving, message, onChange, onImageChange, onClearImage, onClose, onSave, t }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={onClose}><form onSubmit={onSave} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f]">{t('edit_product')}</p><h2 className="mt-1 text-xl font-extrabold">{product.name}</h2></div><button type="button" onClick={onClose} disabled={saving} aria-label={t('close')} className="rounded-lg p-2 text-slate-400"><X /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><FormField label={t('product_name')} required><input value={form.name} onChange={(event) => onChange('name', event.target.value)} className="catalogue-input" /></FormField><FormField label={t('unit')} required><input value={form.unit} onChange={(event) => onChange('unit', event.target.value)} className="catalogue-input" /></FormField><FormField label={t('price')} required><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => onChange('price', event.target.value)} className="catalogue-input" /></FormField><FormField label={t('stock')} required><input type="number" min="0" step="1" value={form.stock} onChange={(event) => onChange('stock', event.target.value)} className="catalogue-input" /></FormField></div><div className="mt-4"><ImagePicker inputId={`edit-product-image-${product.id}`} preview={preview} onChange={onImageChange} onClear={onClearImage} t={t} /></div>{message && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${message === t('product_updated_successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</p>}<div className="mt-6 grid grid-cols-2 gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">{t('cancel')}</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-extrabold text-white disabled:opacity-60">{saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? t('saving_changes') : t('save_changes')}</button></div></form></div> }
