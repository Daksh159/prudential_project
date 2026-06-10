import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import CustomerDashboard from './pages/CustomerDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import ClaimsOfficerDashboard from './pages/ClaimsOfficerDashboard'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('phi_token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleRouter() {
  const role = localStorage.getItem('phi_role') || ''
  if (role === 'Doctor') return <DoctorDashboard />
  if (role === 'Claims Officer') return <ClaimsOfficerDashboard />
  return <CustomerDashboard />
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
              <RoleRouter />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
