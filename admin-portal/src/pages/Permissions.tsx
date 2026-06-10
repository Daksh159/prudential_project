import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

interface Permission { id: number; action: string; resource: string; description: string }

export default function Permissions() {
  const qc = useQueryClient()
  const [action, setAction] = useState('')
  const [resource, setResource] = useState('')
  const [description, setDescription] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api.get('/permissions').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/permissions', { action, resource, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permissions'] })
      setAction(''); setResource(''); setDescription(''); setShowCreate(false)
    },
  })

  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    acc[p.resource] = acc[p.resource] || []
    acc[p.resource].push(p)
    return acc
  }, {})

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Permissions</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          + New Permission
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Action</label>
            <input value={action} onChange={(e) => setAction(e.target.value)} className="border rounded px-3 py-2 text-sm" placeholder="e.g. approve" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Resource</label>
            <input value={resource} onChange={(e) => setResource(e.target.value)} className="border rounded px-3 py-2 text-sm" placeholder="e.g. claim" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" placeholder="Optional" />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!action || !resource}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([res, perms]) => (
          <div key={res} className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3 capitalize">{res.replace(/_/g, ' ')}</h3>
            <div className="space-y-2">
              {perms.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                  <span className="font-mono text-xs text-gray-700">{p.action}</span>
                  {p.description && <span className="text-xs text-gray-400 truncate">{p.description}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
