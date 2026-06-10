import { NavLink, useNavigate } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/roles', label: 'Roles', icon: '🎭' },
  { to: '/permissions', label: 'Permissions', icon: '🔑' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/policies', label: 'Policies', icon: '📋' },
  { to: '/audit', label: 'Audit Logs', icon: '📜' },
  { to: '/ai-studio', label: 'AI Studio', icon: '🤖' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-indigo-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-indigo-700">
        <div className="text-xl font-bold">PHI Admin</div>
        <div className="text-indigo-300 text-xs mt-1">Authorization Platform</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={logout}
        className="m-3 py-2 px-3 rounded-lg text-sm text-indigo-300 hover:bg-indigo-800 hover:text-white text-left"
      >
        🚪 Logout
      </button>
    </aside>
  )
}
