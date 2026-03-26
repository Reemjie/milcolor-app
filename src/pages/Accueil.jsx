import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Accueil() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [alertes, setAlertes] = useState([])

  useEffect(() => {
    fetchNotifs()
    fetchAlertes()
  }, [])

  async function fetchNotifs() {
    const { data } = await supabase.from('notifications').select('*').eq('lue', false).order('created_at', { ascending: false }).limit(3)
    setNotifs(data || [])
  }

  async function fetchAlertes() {
    const { data } = await supabase.from('materiel').select('*').eq('statut', 'alerte').order('created_at', { ascending: false }).limit(2)
    setAlertes(data || [])
  }

  const now = new Date()
  const heure = now.getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const quickActions = [
    { icon: '📅', label: 'Planning\nsemaine',   to: '/plannings',    color: '#06D6A0', bg: '#E0FBF1' },
    { icon: '🎨', label: 'Activités\nen cours', to: '/session',      color: '#9B5DE5', bg: '#f0edf8' },
    { icon: '🎯', label: 'Objectifs\nsession',  to: '/objectifs',    color: '#CC6600', bg: '#FFF3E0' },
    { icon: '🗂', label: 'Catalogue',            to: '/banque',       color: '#118AB2', bg: '#E8F4FF' },
    { icon: '🗓', label: 'Journée\ntype',        to: '/journee-type', color: '#FF6B9D', bg: '#FBEAF0' },
    { icon: '⚡', label: 'Anim.\nrapides',      to: '/rapides',      color: '#FF9F43', bg: '#FFF3E0' },
  ]

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem' }}>{salut} 👋</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2, textTransform: 'capitalize' }}>{dateStr}</p>
      </div>

      {/* Alertes urgentes */}
      {alertes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {alertes.map(a => (
            <div key={a.id} onClick={() => navigate('/materiel')} style={{
              background: '#FFF3E0', border: '2px solid #FF9F43',
              borderRadius: 14, padding: '12px 16px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <span style={{ fontSize: '1.3rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#CC6600' }}>Alerte matériel</div>
                <div style={{ fontSize: '0.78rem', color: '#CC6600' }}>{a.nom}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications */}
      {notifs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {notifs.map(n => (
            <div key={n.id} onClick={() => navigate('/notifications')} style={{
              background: n.type === 'urgent' ? '#FFE8E8' : '#E8F4FF',
              border: `2px solid ${n.type === 'urgent' ? '#FF6B6B' : '#74B9FF'}`,
              borderRadius: 14, padding: '12px 16px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <span style={{ fontSize: '1.3rem' }}>{n.type === 'urgent' ? '🚨' : '🔔'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{n.titre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text2)', fontWeight: 700 }}>Accès rapide</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {quickActions.map(a => (
            <button key={a.to} onClick={() => navigate(a.to)} style={{
              background: a.bg, border: 'none', borderRadius: 14,
              padding: '16px 8px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '1.6rem' }}>{a.icon}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: a.color, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Boutons urgences / objectifs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => navigate('/urgences')} style={{
          background: '#FFE8E8', border: '2px solid #FF6B6B',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#CC3333' }}>Sécurité & urgences</div>
            <div style={{ fontSize: '0.78rem', color: '#CC3333' }}>Numéros et procédures d'urgence</div>
          </div>
        </button>

        <button onClick={() => navigate('/materiel')} style={{
          background: '#FFF3E0', border: '2px solid #FF9F43',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1.5rem' }}>🔧</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#CC6600' }}>Signaler matériel</div>
            <div style={{ fontSize: '0.78rem', color: '#CC6600' }}>Manque ou casse de matériel</div>
          </div>
        </button>

        <button onClick={() => navigate('/objectifs')} style={{
          background: '#E0FBF1', border: '2px solid #06D6A0',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#0A7A5A' }}>Objectifs de la session</div>
            <div style={{ fontSize: '0.78rem', color: '#0A7A5A' }}>Rappel des priorités du directeur</div>
          </div>
        </button>
      </div>
    </div>
  )
}
