import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../api/client'

interface AuditLog {
  id: number
  user_id: number
  action: string
  resource: string
  allowed: boolean
  reason: string
  timestamp: string
  ip_address: string
}

export default function AuditLogs() {
  const [explanations, setExplanations] = useState<Record<number, string>>({})
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const { data: logs = [] } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit-logs?limit=200').then((r) => r.data),
    refetchInterval: 10000,
  })

  const explain = async (log: AuditLog) => {
    if (explanations[log.id]) return
    setLoadingId(log.id)
    try {
      const res = await api.post('/ai/explain-access', {
        user_id: log.user_id,
        action: log.action,
        resource: log.resource,
      })
      setExplanations((prev) => ({ ...prev, [log.id]: res.data.explanation }))
    } catch {
      setExplanations((prev) => ({ ...prev, [log.id]: log.reason }))
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Logs</h1>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Resource</th>
              <th className="px-4 py-3 text-left">Result</th>
              <th className="px-4 py-3 text-left">AI Explanation</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3">User #{log.user_id}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.resource}</td>
                <td className="px-4 py-3">
                  {log.allowed ? (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium">✅ Allowed</span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">❌ Denied</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {explanations[log.id] ? (
                    <span className="text-xs text-gray-600">{explanations[log.id]}</span>
                  ) : (
                    <button
                      onClick={() => explain(log)}
                      disabled={loadingId === log.id || !log.user_id}
                      className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                    >
                      {loadingId === log.id ? '⏳ Loading…' : '🤖 Explain'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-12 text-gray-400">No audit logs yet. Access checks will appear here.</div>
        )}
      </div>
    </div>
  )
}
