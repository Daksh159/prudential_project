import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/rbac'

const DEMO_USERS = [
  { email: 'customer@phi.com', label: '👤 Customer' },
  { email: 'doctor@phi.com', label: '🩺 Doctor' },
  { email: 'claims@phi.com', label: '📋 Claims Officer' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('phi_token', res.data.access_token)
      // Get user info to determine role routing
      const me = await api.get('/auth/me')
      const rolesRes = await api.get(`/users/${me.data.id}/roles`)
      const roles: { name: string }[] = rolesRes.data
      const primaryRole = roles[0]?.name || 'Customer'
      localStorage.setItem('phi_user_id', String(me.data.id))
      localStorage.setItem('phi_role', primaryRole)
      localStorage.setItem('phi_user_name', me.data.full_name)
      navigate('/')
    } catch {
      setError('Invalid credentials. Try password: "password"')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🏥</div>
          <h1 className="text-2xl font-bold text-gray-900">Prudential Health India</h1>
          <p className="text-gray-500 text-sm mt-1">Member Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-400 text-center mb-3">Demo accounts (password: "password")</p>
          <div className="space-y-1">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                onClick={() => setEmail(u.email)}
                className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-600 flex justify-between"
              >
                <span>{u.label}</span>
                <span className="text-gray-400">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
