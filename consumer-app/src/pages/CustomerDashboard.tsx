import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAccess } from '../api/rbac'

interface AccessState { loading: boolean; allowed: boolean | null }

function useAccess(action: string, resource: string) {
  const userId = Number(localStorage.getItem('phi_user_id'))
  const [state, setState] = useState<AccessState>({ loading: true, allowed: null })
  useEffect(() => {
    checkAccess(userId, action, resource).then((allowed) => setState({ loading: false, allowed }))
  }, [userId, action, resource])
  return state
}

function ActionButton({ label, icon, action, resource, onClick }: {
  label: string; icon: string; action: string; resource: string; onClick: () => void
}) {
  const { loading, allowed } = useAccess(action, resource)
  if (loading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
  if (!allowed) return null
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 hover:border-blue-200"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const name = localStorage.getItem('phi_user_name') || 'Member'
  const [message, setMessage] = useState('')

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <div>
            <div className="font-bold text-gray-800">Prudential Health India</div>
            <div className="text-xs text-gray-400">Member Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Customer</div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome, {name.split(' ')[0]}!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your available actions are determined in real-time by the PHI Authorization system.
        </p>

        {message && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <ActionButton
            label="View My Policy"
            icon="📄"
            action="view"
            resource="policy"
            onClick={() => showMessage('📄 Loading your insurance policy… PHI-2024-HEALTH-001')}
          />
          <ActionButton
            label="View Claim Status"
            icon="🔍"
            action="view"
            resource="claim"
            onClick={() => showMessage('🔍 Claim #CLM-4521 — Status: Under Review')}
          />
          <ActionButton
            label="Submit New Claim"
            icon="📝"
            action="create"
            resource="claim"
            onClick={() => showMessage('📝 Claim submission form would open here')}
          />
          <ActionButton
            label="View Profile"
            icon="👤"
            action="view"
            resource="customer_profile"
            onClick={() => showMessage('👤 Profile: ' + name)}
          />
        </div>

        <div className="mt-6 p-4 bg-indigo-50 rounded-xl text-xs text-indigo-700">
          <strong>How this works:</strong> Every button above makes a live call to <code className="bg-indigo-100 px-1 rounded">/check-access</code> before rendering.
          Buttons you can't see have been denied by the authorization server based on your role.
        </div>
      </div>
    </div>
  )
}
