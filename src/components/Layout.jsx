import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const NAV_ITEMS = [
  { to: '/plannings', icon: '📅', label: 'Plannings' },
  { to: '/activites', icon: '🎨', label: 'Activités' },
  { to: '/remarques', icon: '💬', label: 'Remarques' },
  { to: '/documents', icon: '📁', label: 'Documents' },
]

export default function Layout() {
  const { isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        background: 'white',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        paddingTop: 'max(12px, env(safe-area-inset-top))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'var(--orange)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>🎨</div>
          <div>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: '1.1rem', color: 'var(--orange)', lineHeight: 1 }}>
              Milcolor App
            </div>
            {isAdmin && (
              <div style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: 'white', background: 'var(--purple)',
                padding: '1px 6px', borderRadius: 20, display: 'inline-block',
                marginTop: 2,
              }}>
                ✦ Directeur
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'var(--bg)',
            border: '1.5px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--text2)',
          }}
        >
          Déconnexion
        </button>
      </header>

      {/* Page content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom))',
      }}>
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0, right: 0,
        height: 'calc(var(--nav-h) + var(--safe-bottom))',
        paddingBottom: 'var(--safe-bottom)',
        background: 'white',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
      }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isActive ? 'var(--orange)' : 'var(--text2)',
              background: isActive ? 'rgba(255,107,53,0.06)' : 'transparent',
              transition: 'all 0.15s',
              borderTop: isActive ? '2.5px solid var(--orange)' : '2.5px solid transparent',
            })}
          >
            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
