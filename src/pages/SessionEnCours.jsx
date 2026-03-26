import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const TYPE_COLORS = {
  'Jeux': { bg: '#FFE8E8', color: '#CC3333' },
  'Jeu de 11h': { bg: '#FFF3E0', color: '#CC6600' },
  'Activité manuelle': { bg: '#E0FBF1', color: '#0A7A5A' },
  'Temps calme': { bg: '#E8F4FF', color: '#0A5A8A' },
}
const TYPE_ICONS = { 'Jeux': '⚽', 'Jeu de 11h': '☀️', 'Activité manuelle': '🎨', 'Temps calme': '📖' }

export default function SessionEnCours() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [activites, setActivites] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAge, setFilterAge] = useState('all')
  const [actionId, setActionId] = useState(null)

  useEffect(() => { fetchActivites() }, [])

  async function fetchActivites() {
    setLoading(true)
    const { data } = await supabase.from('activites').select('*').eq('session_active', true).order('created_at', { ascending: false })
    setActivites(data || [])
    setLoading(false)
  }

  async function archiver(id) {
    await supabase.from('activites').update({ session_active: false }).eq('id', id)
    setActionId(null)
    fetchActivites()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer définitivement cette activité ?')) return
    await supabase.from('activites').delete().eq('id', id)
    setActionId(null)
    fetchActivites()
  }

  const filtered = filterAge === 'all' ? activites : activites.filter(a => a.age === filterAge)

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🎨 Activités en cours</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>{filtered.length} activité{filtered.length > 1 ? 's' : ''} cette session</p>
        </div>
        <button onClick={() => navigate('/materiel-session')} style={{ background: '#E0FBF1', border: '1.5px solid #06D6A0', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: '0.82rem', color: '#0A7A5A' }}>📦 Matériel</button>
        <button className="btn btn-primary" onClick={() => navigate('/banque/nouvelle')}>+ Ajouter</button>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { to: '/session', label: '📋 En cours', active: true },
          { to: '/banque', label: '🗂 Catalogue' },
          { to: '/rapides', label: '⚡ Rapides' },
        ].map(item => (
          <button key={item.to} onClick={() => navigate(item.to)} style={{
            flexShrink: 0, padding: '7px 16px', borderRadius: 20,
            border: `2px solid ${item.active ? 'var(--orange)' : 'var(--border)'}`,
            background: item.active ? 'var(--orange)' : 'white',
            color: item.active ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.82rem',
          }}>{item.label}</button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
        {['all', '3-5 ans', '6-11 ans'].map(a => (
          <button key={a} onClick={() => setFilterAge(a)} style={{
            flexShrink: 0, padding: '7px 14px', borderRadius: 20,
            border: `2px solid ${filterAge === a ? '#118AB2' : 'var(--border)'}`,
            background: filterAge === a ? '#118AB2' : 'white',
            color: filterAge === a ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.78rem',
          }}>{a === 'all' ? 'Tous âges' : a}</button>
        ))}
      </div>

      {/* Bandeau info fin de session */}
      {isAdmin && activites.length > 0 && (
        <div style={{ background: '#FFF3E0', border: '2px solid #FF9F43', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>💡</span>
          <p style={{ fontSize: '0.8rem', color: '#CC6600', lineHeight: 1.4 }}>
            <strong>Fin de session :</strong> archive les activités dans le Catalogue pour les retrouver plus tard, ou supprime-les.
          </p>
        </div>
      )}

      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎨</div>
          <p style={{ fontWeight: 700 }}>Aucune activité en cours</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Les animateurs peuvent en ajouter avec le bouton "+"</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/banque/nouvelle')}>+ Nouvelle activité</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(a => {
          const tc = TYPE_COLORS[a.type] || { bg: '#f5f5f5', color: '#666' }
          const isOpen = actionId === a.id
          return (
            <div key={a.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Fiche */}
              <div style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => navigate(`/banque/${a.id}`)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {a.photo_url && <img src={a.photo_url} alt={a.nom} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.nom}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="tag" style={{ background: tc.bg, color: tc.color }}>{TYPE_ICONS[a.type]} {a.type}</span>
                      <span className="tag" style={{ background: '#f0edf8', color: '#764ba2' }}>{a.age}</span>
                      <span className="tag" style={{ background: '#FBEAF0', color: '#CC4477' }}>👤 {a.animateur}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions fin de session */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600 }}>Fin de session :</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => archiver(a.id)}
                    style={{ padding: '6px 14px', borderRadius: 8, background: '#E0FBF1', border: '1.5px solid #06D6A0', color: '#0A7A5A', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    🗂 Archiver
                  </button>
                  <button
                    onClick={() => supprimer(a.id)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: '#fff0f0', border: '1.5px solid #f5c6cb', color: '#e74c3c', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    🗑 Supprimer
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
