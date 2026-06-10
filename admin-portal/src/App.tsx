import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Roles from './pages/Roles'
import Permissions from './pages/Permissions'
import Users from './pages/Users'
import PolicyExplorer from './pages/PolicyExplorer'
import AuditLogs from './pages/AuditLogs'
import AIStudio from './pages/AIStudio'
import Login from './pages/Login'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/roles" element={<Roles />} />
                  <Route path="/permissions" element={<Permissions />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/policies" element={<PolicyExplorer />} />
                  <Route path="/audit" element={<AuditLogs />} />
                  <Route path="/ai-studio" element={<AIStudio />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
