import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TYPE_COLORS = {
  'Jeux': { bg: '#FFE8E8', color: '#CC3333' },
  'Jeu de 11h': { bg: '#FFF3E0', color: '#CC6600' },
  'Activité manuelle': { bg: '#E0FBF1', color: '#0A7A5A' },
  'Temps calme': { bg: '#E8F4FF', color: '#0A5A8A' },
}
const TYPE_ICONS = { 'Jeux': '⚽', 'Jeu de 11h': '☀️', 'Activité manuelle': '🎨', 'Temps calme': '📖' }

export default function BanqueAnimations() {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🗂 Catalogue d'animations</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>{filtered.length} activité{filtered.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/banque/nouvelle')}>+ Ajouter</button>
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { to: '/session', label: '📋 Session' },
          { to: '/banque', label: '🗂 Catalogue', active: true },
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
      </div>

      <div style={{ position: 'relative', marginBottom: 10 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'white' }} />
      </div>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        {['all', 'Jeux', 'Jeu de 11h', 'Activité manuelle', 'Temps calme'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20,
            border: `2px solid ${filterType === t ? 'var(--orange)' : 'var(--border)'}`,
            background: filterType === t ? 'var(--orange)' : 'white',
            color: filterType === t ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.75rem',
          }}>{t === 'all' ? 'Toutes' : `${TYPE_ICONS[t]} ${t}`}</button>
        ))}
        <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />
        {[...new Set(activites.map(a => a.animateur))].sort().map(anim => (
          <button key={anim} onClick={() => setFilterAnim(filterAnim === anim ? 'all' : anim)} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20,
            border: `2px solid ${filterAnim === anim ? '#FF6B9D' : 'var(--border)'}`,
            background: filterAnim === anim ? '#FF6B9D' : 'white',
            color: filterAnim === anim ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.75rem',
          }}>👤 {anim}</button>
        ))}
        {['all', '3-5 ans', '6-11 ans'].map(a => (
          <button key={a} onClick={() => setFilterAge(a)} style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 20,
            border: `2px solid ${filterAge === a ? '#118AB2' : 'var(--border)'}`,
            background: filterAge === a ? '#118AB2' : 'white',
            color: filterAge === a ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.75rem',
          }}>{a === 'all' ? 'Tous âges' : a}</button>
        ))}
      </div>

      {loading && <div className="spinner" />}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏦</div>
          <p style={{ fontWeight: 700 }}>Aucune activité trouvée</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(a => {
          const tc = TYPE_COLORS[a.type] || { bg: '#f5f5f5', color: '#666' }
          return (
            <div key={a.id} className="card" onClick={() => navigate(`/banque/${a.id}`)} style={{ cursor: 'pointer' }}>
              {a.photo_url && <img src={a.photo_url} alt={a.nom} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />}
              <div style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{TYPE_ICONS[a.type] || '🎯'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>{a.nom}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span className="tag" style={{ background: tc.bg, color: tc.color, fontSize: '0.68rem' }}>{a.type}</span>
                      <span className="tag" style={{ background: '#f0edf8', color: '#764ba2', fontSize: '0.68rem' }}>{a.age}</span>
                      <span className="tag" style={{ background: 'var(--bg)', color: 'var(--text2)', fontSize: '0.68rem' }}>👤 {a.animateur}</span>
                      {a.session_active && <span className="tag" style={{ background: '#E0FBF1', color: '#0A7A5A', fontSize: '0.68rem' }}>✓ Session</span>}
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
