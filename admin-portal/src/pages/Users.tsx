import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/client'

interface User { id: number; email: string; full_name: string; is_active: boolean; created_at: string }
interface Role { id: number; name: string; description: string }

export default function Users() {
  const qc = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  })

  const { data: allRoles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  })

  const { data: userRoles = [] } = useQuery<Role[]>({
    queryKey: ['user-roles', selectedUser?.id],
    queryFn: () => api.get(`/users/${selectedUser!.id}/roles`).then((r) => r.data),
    enabled: !!selectedUser,
  })

  const assignRole = useMutation({
    mutationFn: (roleId: number) => api.post(`/users/${selectedUser!.id}/roles/${roleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-roles', selectedUser?.id] }),
  })

  const removeRole = useMutation({
    mutationFn: (roleId: number) => api.delete(`/users/${selectedUser!.id}/roles/${roleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-roles', selectedUser?.id] }),
  })

  const assignedIds = new Set(userRoles.map((r) => r.id))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Users</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-3">All Users ({users.length})</h2>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-3 rounded-lg cursor-pointer border transition ${
                  selectedUser?.id === user.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                }`}
              >
                <div className="font-medium text-sm">{user.full_name}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            ))}
          </div>
        </div>

        {selectedUser && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-1">
              Roles for <span className="text-indigo-600">{selectedUser.full_name}</span>
            </h2>
            <p className="text-xs text-gray-400 mb-3">{selectedUser.email}</p>
            <div className="space-y-1">
              {allRoles.map((role) => {
                const assigned = assignedIds.has(role.id)
                return (
                  <div key={role.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                      <div className="text-sm font-medium">{role.name}</div>
                      <div className="text-xs text-gray-400">{role.description}</div>
                    </div>
                    <button
                      onClick={() => assigned ? removeRole.mutate(role.id) : assignRole.mutate(role.id)}
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
