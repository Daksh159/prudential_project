import { useQuery } from '@tanstack/react-query'
import api from '../api/client'

interface Policy { id: number; name: string; natural_language_text: string; structured_rules: Record<string, unknown> | null; created_at: string; is_active: boolean }

export default function PolicyExplorer() {
  const { data: policies = [] } = useQuery<Policy[]>({
    queryKey: ['policies'],
    queryFn: () => api.get('/policies').then((r) => r.data),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Policy Explorer</h1>
      {policies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-400">
          No policies yet. Use AI Studio to generate policies.
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{p.name}</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Active</span>
              </div>
              <p className="text-sm text-gray-600 mb-3 italic">"{p.natural_language_text}"</p>
              {p.structured_rules && (
                <pre className="bg-gray-50 rounded p-3 text-xs overflow-auto">
                  {JSON.stringify(p.structured_rules, null, 2)}
                </pre>
              )}
              <p className="text-xs text-gray-400 mt-2">Created: {new Date(p.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
