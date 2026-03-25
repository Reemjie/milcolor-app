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

  useEffect(() => { fetchActivites() }, [])

  async function fetchActivites() {
    setLoading(true)
    const { data } = await supabase.from('activites').select('*').eq('session_active', true).order('created_at', { ascending: false })
    setActivites(data || [])
    setLoading(false)
  }

  const filtered = filterAge === 'all' ? activites : activites.filter(a => a.age === filterAge)

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🎨 Session en cours</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Activités de cette session</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/banque/nouvelle')}>+ Ajouter</button>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { to: '/session', label: '📋 Session', active: true },
          { to: '/banque', label: '🏦 Banque' },
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

      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎨</div>
          <p style={{ fontWeight: 700 }}>Aucune activité pour cette session</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Ajoute des activités depuis la banque ou crées-en une nouvelle</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => navigate('/banque/nouvelle')}>+ Nouvelle activité</button>
            <button className="btn btn-ghost" onClick={() => navigate('/banque')}>Voir la banque</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(a => {
          const tc = TYPE_COLORS[a.type] || { bg: '#f5f5f5', color: '#666' }
          return (
            <div key={a.id} className="card" onClick={() => navigate(`/banque/${a.id}`)} style={{ cursor: 'pointer' }}>
              {a.photo_url && <img src={a.photo_url} alt={a.nom} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {TYPE_ICONS[a.type] || '🎯'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.nom}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="tag" style={{ background: tc.bg, color: tc.color }}>{a.type}</span>
                      <span className="tag" style={{ background: '#f0edf8', color: '#764ba2' }}>{a.age}</span>
                      <span className="tag" style={{ background: 'var(--bg)', color: 'var(--text2)' }}>👤 {a.animateur}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
