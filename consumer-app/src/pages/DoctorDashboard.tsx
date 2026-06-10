import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAccess } from '../api/rbac'

function useAccess(action: string, resource: string) {
  const userId = Number(localStorage.getItem('phi_user_id'))
  const [state, setState] = useState({ loading: true, allowed: false })
  useEffect(() => {
    checkAccess(userId, action, resource).then((allowed) => setState({ loading: false, allowed }))
  }, [userId, action, resource])
  return state
}

function ActionButton({ label, icon, description, action, resource, color, onClick }: {
  label: string; icon: string; description: string; action: string; resource: string; color: string; onClick: () => void
}) {
  const { loading, allowed } = useAccess(action, resource)
  if (loading) return <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
  if (!allowed) return (
    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
      <div className="text-2xl mb-1 grayscale opacity-40">{icon}</div>
      <div className="text-xs text-gray-400">{label} — Not authorized</div>
    </div>
  )
  return (
    <button
      onClick={onClick}
      className={`p-5 ${color} rounded-xl text-white text-left hover:opacity-90 transition shadow-sm`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold">{label}</div>
      <div className="text-xs opacity-80 mt-1">{description}</div>
    </button>
  )
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const name = localStorage.getItem('phi_user_name') || 'Doctor'
  const [message, setMessage] = useState('')

  const logout = () => { localStorage.clear(); navigate('/login') }
  const showMessage = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <div>
            <div className="font-bold text-gray-800">Prudential Health India</div>
            <div className="text-xs text-gray-400">Doctor Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Doctor</div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Dr. {name.replace('Dr. ', '')}</h2>
        <p className="text-gray-500 text-sm mb-6">
          Access to features is controlled by your role permissions in the PHI Authorization system.
        </p>

        {message && (
          <div className="mb-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <ActionButton label="Upload Medical Report" icon="📤" description="Submit patient medical documents" action="upload" resource="medical_report" color="bg-teal-600" onClick={() => showMessage('📤 Upload form: Select patient ID and attach report PDF')} />
          <ActionButton label="View Medical Reports" icon="📋" description="Access existing reports" action="view" resource="medical_report" color="bg-blue-600" onClick={() => showMessage('📋 Showing 12 medical reports for your patients')} />
          <ActionButton label="Delete Medical Report" icon="🗑️" description="Remove outdated reports" action="delete" resource="medical_report" color="bg-red-500" onClick={() => showMessage('🗑️ Delete confirmation would appear here')} />
          <ActionButton label="View Claim" icon="🔍" description="Review patient claims" action="view" resource="claim" color="bg-purple-600" onClick={() => showMessage('🔍 Viewing claims linked to your patients')} />
        </div>

        <div className="mt-6 p-4 bg-teal-50 rounded-xl text-xs text-teal-700">
          <strong>Note:</strong> Greyed-out actions above are blocked by your role permissions.
          The authorization check happens live — changes from Admin Portal take effect immediately.
        </div>
      </div>
    </div>
  )
}
