import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

export default function Dashboard() {
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => api.get('/roles').then((r) => r.data) })
  const { data: permissions } = useQuery({ queryKey: ['permissions'], queryFn: () => api.get('/permissions').then((r) => r.data) })
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => api.get('/users').then((r) => r.data) })
  const { data: auditLogs } = useQuery({ queryKey: ['audit-recent'], queryFn: () => api.get('/audit-logs?limit=100').then((r) => r.data) })

  const today = new Date().toDateString()
  const todayChecks = auditLogs?.filter((l: { timestamp: string }) => new Date(l.timestamp).toDateString() === today).length ?? 0
  const deniedCount = auditLogs?.filter((l: { allowed: boolean }) => !l.allowed).length ?? 0

  const stats = [
    { label: 'Total Users', value: users?.length ?? '…', icon: '👥', color: 'bg-blue-500' },
    { label: 'Total Roles', value: roles?.length ?? '…', icon: '🎭', color: 'bg-purple-500' },
    { label: 'Total Permissions', value: permissions?.length ?? '…', icon: '🔑', color: 'bg-green-500' },
    { label: 'Access Checks Today', value: todayChecks, icon: '✅', color: 'bg-orange-500' },
    { label: 'Denied Requests', value: deniedCount, icon: '🚫', color: 'bg-red-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-white text-xl`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-gray-800">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-3">Recent Access Events</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Time</th>
              <th className="pb-2">User ID</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">Resource</th>
              <th className="pb-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {(auditLogs ?? []).slice(0, 8).map((log: { id: number; timestamp: string; user_id: number; action: string; resource: string; allowed: boolean }) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="py-2 text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="py-2">{log.user_id}</td>
                <td className="py-2 font-mono text-xs">{log.action}</td>
                <td className="py-2 font-mono text-xs">{log.resource}</td>
                <td className="py-2">
                  {log.allowed ? (
                    <span className="text-green-600 font-medium">✅ Allowed</span>
                  ) : (
                    <span className="text-red-500 font-medium">❌ Denied</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
