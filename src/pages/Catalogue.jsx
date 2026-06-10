import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Catalogue() {
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

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function addProduct() {
    if (!form.name || !form.price) return alert('Name and price are required')
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
  if (!window.confirm('Delete this product?')) return
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) {
    console.error('Delete error:', error)
    alert(`Delete failed: ${error.message}`)
    return
  }
  await loadProducts()
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e3a5f] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Catalogue Management</h1>
          <p className="text-blue-200 text-sm">Control pricing, track inventory, and visibility settings.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm bg-white/20 px-3 py-1 rounded-lg">{products.length} PRODUCT{products.length !== 1 ? 'S' : ''} LISTED</span>
          <button onClick={() => navigate('/dashboard')} className="text-sm bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30">← Back</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Add Product Form */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">+ Add New Product</h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Title *</label>
              <input placeholder="e.g. Premium Basmati Rice" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price (₹) *</label>
                <input placeholder="450" value={form.price} type="number"
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Unit</label>
                <input placeholder="kg, box, bag" value={form.unit}
                  onChange={e => setForm({ ...form, unit: e.target.value })}
                  className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Initial Stock Qty</label>
              <input placeholder="e.g. 150" value={form.stock} type="number"
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]" />
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Image</label>
              <div className="mt-1 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#1e3a5f] transition-colors cursor-pointer"
                onClick={() => document.getElementById('imgInput').click()}>
                {preview ? (
                  <img src={preview} alt="preview" className="h-32 w-full object-cover rounded-lg" />
                ) : (
                  <div className="text-gray-400">
                    <p className="text-2xl">📷</p>
                    <p className="text-sm mt-1">Click to upload product photo</p>
                    <p className="text-xs text-gray-300">JPG, PNG up to 5MB</p>
                  </div>
                )}
              </div>
              <input id="imgInput" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              {preview && (
                <button onClick={() => { setImage(null); setPreview(null) }}
                  className="text-xs text-red-400 mt-1 hover:text-red-600">✕ Remove image</button>
              )}
            </div>

            <button onClick={addProduct} disabled={loading}
              className="w-full bg-[#1e3a5f] text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors mt-2">
              {loading ? 'Publishing...' : '+ Publish Product'}
            </button>
          </div>
        </div>

        {/* Product List */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Active Catalogue</h2>
          {products.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-dashed border-gray-200">
              No products yet. Add your first product.
            </div>
          ) : (
            products.map(p => (
              <div key={p.id} className={`bg-white rounded-xl border border-gray-200 mb-3 overflow-hidden shadow-sm transition-opacity ${p.active ? 'opacity-100' : 'opacity-50'}`}>
                <div className="flex">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-24 h-24 object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-300 text-3xl">📦</div>
                  )}
                  <div className="flex-1 p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-[#1e3a5f] font-bold">₹{p.price}{p.unit && <span className="text-gray-400 font-normal text-sm"> / {p.unit}</span>}</p>
                        <p className="text-xs text-gray-400 mt-1">Stock: {p.stock}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {p.active ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => toggleProduct(p.id, p.active)}
                        className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                        {p.active ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => deleteProduct(p.id)}
                        className="text-xs px-3 py-1 border border-red-100 text-red-400 rounded-lg hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}