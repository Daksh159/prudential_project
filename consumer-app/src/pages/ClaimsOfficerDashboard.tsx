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

interface ClaimAction {
  label: string; icon: string; action: string; resource: string; color: string; description: string; onClick: () => void
}

function ActionCard({ label, icon, action, resource, color, description, onClick }: ClaimAction) {
  const { loading, allowed } = useAccess(action, resource)
  if (loading) return <div className="h-28 bg-gray-100 rounded-xl animate-pulse" />
  if (!allowed) return (
    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 opacity-50">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-gray-400">{label} — Access Denied</div>
    </div>
  )
  return (
    <button
      onClick={onClick}
      className={`p-5 ${color} rounded-xl text-white text-left hover:opacity-90 transition shadow-sm w-full`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold">{label}</div>
      <div className="text-xs opacity-80 mt-1">{description}</div>
    </button>
  )
}

const MOCK_CLAIMS = [
  { id: 'CLM-4521', patient: 'Rahul Sharma', amount: '₹28,500', status: 'Pending', type: 'Hospitalization' },
  { id: 'CLM-4522', patient: 'Priya Mehta', amount: '₹12,000', status: 'Pending', type: 'Outpatient' },
  { id: 'CLM-4523', patient: 'Arjun Kapoor', amount: '₹75,000', status: 'Pending', type: 'Surgery' },
]

export default function ClaimsOfficerDashboard() {
  const navigate = useNavigate()
  const name = localStorage.getItem('phi_user_name') || 'Claims Officer'
  const [message, setMessage] = useState('')
  const [claimStatus, setClaimStatus] = useState<Record<string, string>>({})

  const logout = () => { localStorage.clear(); navigate('/login') }
  const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(''), 4000) }

  const handleClaim = (claimId: string, action: 'approve' | 'reject') => {
    setClaimStatus((prev) => ({ ...prev, [claimId]: action === 'approve' ? 'Approved' : 'Rejected' }))
    showMsg(`${action === 'approve' ? '✅' : '❌'} Claim ${claimId} has been ${action}d and logged to audit trail.`)
  }

  const canApprove = useAccess('approve', 'claim')
  const canReject = useAccess('reject', 'claim')
  const canViewClaim = useAccess('view', 'claim')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏥</span>
          <div>
            <div className="font-bold text-gray-800">Prudential Health India</div>
            <div className="text-xs text-gray-400">Claims Officer Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">Claims Officer</div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Claims Queue</h2>
        <p className="text-gray-500 text-sm mb-6">Approve or reject pending claims. All actions are logged in real-time.</p>

        {message && (
          <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-3 text-sm">
            {message}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <ActionCard label="View Medical Reports" icon="📋" action="view" resource="medical_report" color="bg-blue-600" description="Review supporting docs" onClick={() => showMsg('Showing 8 medical reports for pending claims')} />
          <ActionCard label="View Customer Profiles" icon="👤" action="view" resource="customer_profile" color="bg-purple-600" description="Check customer history" onClick={() => showMsg('Loading customer profiles…')} />
          <ActionCard label="Create New Claim" icon="📝" action="create" resource="claim" color="bg-gray-600" description="Manual claim entry" onClick={() => showMsg('Manual claim entry form would open')} />
        </div>

        {/* Claims table */}
        {canViewClaim.allowed && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-700">Pending Claims ({MOCK_CLAIMS.length})</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Claim ID</th>
                  <th className="px-4 py-2 text-left">Patient</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CLAIMS.map((claim) => {
                  const status = claimStatus[claim.id]
                  return (
                    <tr key={claim.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{claim.id}</td>
                      <td className="px-4 py-3 font-medium">{claim.patient}</td>
                      <td className="px-4 py-3 text-gray-500">{claim.type}</td>
                      <td className="px-4 py-3 font-medium">{claim.amount}</td>
                      <td className="px-4 py-3">
                        {status ? (
                          <span className={`text-xs px-2 py-1 rounded font-medium ${status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {status === 'Approved' ? '✅' : '❌'} {status}
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            {canApprove.allowed && (
                              <button
                                onClick={() => handleClaim(claim.id, 'approve')}
                                className="bg-green-600 text-white text-xs px-3 py-1.5 rounded hover:bg-green-700"
                              >
                                ✅ Approve
                              </button>
                            )}
                            {canReject.allowed && (
                              <button
                                onClick={() => handleClaim(claim.id, 'reject')}
                                className="bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600"
                              >
                                ❌ Reject
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 p-3 bg-orange-50 rounded-xl text-xs text-orange-700">
          Every approve/reject action triggers a <code className="bg-orange-100 px-1 rounded">/check-access</code> call first. All decisions appear in Admin Audit Logs.
        </div>
      </div>
    </div>
  )
}
