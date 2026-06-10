import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('phi_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function checkAccess(userId: number, action: string, resource: string): Promise<boolean> {
  try {
    const res = await api.post('/check-access', { user_id: userId, action, resource })
    return res.data.allowed
  } catch {
    return false
  }
}

export default api
