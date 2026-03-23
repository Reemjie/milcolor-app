import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TYPE_COLORS = {
  'Jeux': { bg: '#FFE8E8', text: '#CC3333', dot: '#FF6B6B' },
  'Jeu de 11h': { bg: '#FFF3E0', text: '#CC6600', dot: '#FF9F43' },
  'Activité manuelle': { bg: '#E0FBF1', text: '#0A7A5A', dot: '#06D6A0' },
  'Temps calme': { bg: '#E8F4FF', text: '#0A5A8A', dot: '#74B9FF' },
}
const TYPE_ICONS = { 'Jeux': '⚽', 'Jeu de 11h': '☀️', 'Activité manuelle': '🎨', 'Temps calme': '📖' }

export default function Activites() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [activites, setActivites] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterAge, setFilterAge] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchActivites() }, [])

  async function fetchActivites() {
    setLoading(true)
    const { data } = await supabase.from('activites').select('*').order('created_at', { ascending: false })
    setActivites(data || [])
    setLoading(false)
  }

  const filtered = activites.filter(a => {
    const typeOk = filterType === 'all' || a.type === filterType
    const ageOk = filterAge === 'all' || a.age === filterAge
    const q = search.toLowerCase()
    const searchOk = !q || a.nom?.toLowerCase().includes(q) || a.animateur?.toLowerCase().includes(q)
    return typeOk && ageOk && searchOk
  })

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🎨 Activités</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>{filtered.length} activité{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" style={{ flexShrink: 0 }} onClick={() => navigate('/activites/nouvelle')}>
          + Ajouter
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher…"
          style={{
            width: '100%', padding: '11px 14px 11px 42px',
            borderRadius: 12, border: '2px solid var(--border)',
            fontSize: '0.9rem', background: 'white',
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {['all', 'Jeux', 'Jeu de 11h', 'Activité manuelle', 'Temps calme'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${filterType === t ? 'var(--orange)' : 'var(--border)'}`,
            background: filterType === t ? 'var(--orange)' : 'white',
            color: filterType === t ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.2s',
          }}>
            {t === 'all' ? 'Toutes' : `${TYPE_ICONS[t]} ${t}`}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
        {['all', '3-5 ans', '6-11 ans'].map(a => (
          <button key={a} onClick={() => setFilterAge(a)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${filterAge === a ? 'var(--blue)' : 'var(--border)'}`,
            background: filterAge === a ? 'var(--blue)' : 'white',
            color: filterAge === a ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.2s',
          }}>
            {a === 'all' ? 'Tous âges' : a}
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
          <p style={{ fontWeight: 700 }}>Aucune activité trouvée</p>
        </div>
      )}

      {/* Cards grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(a => {
          const tc = TYPE_COLORS[a.type] || { bg: '#f5f5f5', text: '#666', dot: '#999' }
          return (
            <div key={a.id} className="card" onClick={() => navigate(`/activites/${a.id}`)}
              style={{ cursor: 'pointer', overflow: 'hidden' }}>
              {a.photo_url && (
                <img src={a.photo_url} alt={a.nom}
                  style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: tc.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
                  }}>
                    {TYPE_ICONS[a.type] || '🎯'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>{a.nom}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="tag" style={{ background: tc.bg, color: tc.text }}>{a.type}</span>
                      <span className="tag" style={{ background: '#f0edf8', color: '#764ba2' }}>{a.age}</span>
                      <span className="tag" style={{ background: 'var(--bg)', color: 'var(--text2)' }}>👤 {a.animateur}</span>
                    </div>
                  </div>
                </div>
                {a.materiel && (
                  <p style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.4 }}>
                    📦 {a.materiel.split('\n').slice(0,2).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
