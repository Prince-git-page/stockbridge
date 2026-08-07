import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shop, setShop] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)

    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    // Step 2: Save distributor profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          shop_name: shop,
          phone: phone,
        },
      ])

    if (profileError) {
      alert(profileError.message)
      setLoading(false)
      return
    }

    alert('Account created successfully!')
    navigate('/dashboard')
    setLoading(false)
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow"
      >
        <h1 className="text-xl font-bold text-center">
          Create Distributor Account
        </h1>

        <input
          className="w-full border p-2 rounded"
          placeholder="Shop Name"
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          required
        />

        <input
          className="w-full border p-2 rounded"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          className="w-full border p-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1e3a5f] text-white py-2 rounded font-semibold"
        >
          {loading ? 'Creating...' : 'Sign Up'}
        </button>

        <p className="text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-semibold">
            Login
          </Link>
        </p>
      </form>
    </main>
  )
}