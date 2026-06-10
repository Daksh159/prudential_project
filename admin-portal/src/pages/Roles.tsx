import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

interface Role { id: number; name: string; description: string; created_at: string }
interface Permission { id: number; action: string; resource: string; description: string }

export default function Roles() {
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  })

  const { data: rolePerms = [] } = useQuery<Permission[]>({
    queryKey: ['role-perms', selectedRole?.id],
    queryFn: () => api.get(`/roles/${selectedRole!.id}/permissions`).then((r) => r.data),
    enabled: !!selectedRole,
  })

  const { data: allPerms = [] } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: () => api.get('/permissions').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post('/roles', { name: newName, description: newDesc }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setNewName(''); setNewDesc(''); setShowCreate(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setSelectedRole(null) },
  })

  const assignPerm = useMutation({
    mutationFn: (permId: number) => api.post(`/roles/${selectedRole!.id}/permissions/${permId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-perms', selectedRole?.id] }),
  })

  const removePerm = useMutation({
    mutationFn: (permId: number) => api.delete(`/roles/${selectedRole!.id}/permissions/${permId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-perms', selectedRole?.id] }),
  })

  const assignedIds = new Set(rolePerms.map((p) => p.id))

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Roles</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          + New Role
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Role Name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" placeholder="e.g. Fraud Analyst" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500 block mb-1">Description</label>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="border rounded px-3 py-2 text-sm w-full" placeholder="Optional" />
          </div>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!newName}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-3">All Roles ({roles.length})</h2>
          <div className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`p-3 rounded-lg cursor-pointer border transition ${
                  selectedRole?.id === role.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{role.name}</div>
                    <div className="text-xs text-gray-400">{role.description}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(role.id) }}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedRole && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3">
              Permissions for <span className="text-indigo-600">{selectedRole.name}</span>
            </h2>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {allPerms.map((perm) => {
                const assigned = assignedIds.has(perm.id)
                return (
                  <div key={perm.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {perm.action}_{perm.resource}
                      </span>
                    </div>
                    <button
                      onClick={() => assigned ? removePerm.mutate(perm.id) : assignPerm.mutate(perm.id)}
                      className={`text-xs px-2 py-1 rounded ${
                        assigned
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                      }`}
                    >
                      {assigned ? '✅ Assigned' : '+ Assign'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
