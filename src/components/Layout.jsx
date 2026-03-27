import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/accueil',   icon: '🏠', label: 'Accueil'   },
  { to: '/documents', icon: '📁', label: 'Documents' },
  { to: '/session',   icon: '🎨', label: 'Activités' },
  { to: '/chat',      icon: '💬', label: 'Chat'      },
]

export default function Layout() {
  const { isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetchUnread()
    const channel = supabase.channel('notifs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchUnread()).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchUnread() {
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('lue', false)
    setUnread(count || 0)
  }

  const pageTitle = {
    '/accueil': '🏠 Accueil',
    '/plannings': '📅 Plannings',
    '/journee-type': '🗓 Journée type',
    '/objectifs': '🎯 Objectifs',
    '/session': '🎨 Session en cours',
    '/banque': '🗂 Catalogue d\'animations',
    '/rapides': '⚡ Animations rapides',
    '/chat': '💬 Chat & remarques',
    '/documents': '📁 Documents',
    '/urgences': '🚨 Urgences',
    '/materiel': '🔧 Matériel',
    '/notifications': '🔔 Notifications',
  }[location.pathname] || 'Milcolor App'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        paddingTop: 'max(10px, env(safe-area-inset-top))',
        background: 'white', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'var(--orange)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎨</div>
          <div>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: '1rem', color: 'var(--orange)', lineHeight: 1 }}>Milcolor App</div>
            {isAdmin && <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'white', background: 'var(--purple)', padding: '1px 6px', borderRadius: 20, display: 'inline-block', marginTop: 1 }}>✦ Directeur</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => navigate('/notifications')} style={{ position: 'relative', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            🔔
            {unread > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--orange)', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>{unread}</span>}
          </button>
          <button onClick={() => { logout(); navigate('/login', { replace: true }) }} style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text2)' }}>
            Quitter
          </button>
        </div>
      </header>

      {/* Page */}
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 'calc(var(--nav-h) + var(--safe-bottom))' }}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 'calc(var(--nav-h) + var(--safe-bottom))',
        paddingBottom: 'var(--safe-bottom)',
        background: 'white', borderTop: '1px solid var(--border)',
        display: 'flex', zIndex: 100,
      }}>
        {NAV.map(item => {
          const isActive = location.pathname === item.to || (item.to === '/session' && ['/session','/banque','/rapides'].some(p => location.pathname.startsWith(p)))
          return (
            <NavLink key={item.to} to={item.to} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, textDecoration: 'none',
              color: isActive ? 'var(--orange)' : 'var(--text2)',
              background: isActive ? 'rgba(255,107,53,0.06)' : 'transparent',
              borderTop: `2.5px solid ${isActive ? 'var(--orange)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700 }}>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
