import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function parseMateriel(texte) {
  if (!texte) return []
  return texte
    .split(/\n|,|;/)
    .map(s => s.trim())
    .filter(s => s.length > 2)
}

export default function ListeMateriel() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('materiel_checked') || '{}') }
    catch { return {} }
  })
  const [loading, setLoading] = useState(true)
  const [filterDone, setFilterDone] = useState('all')
  const [selected, setSelected] = useState({})

  useEffect(() => { fetchMateriel() }, [])

  async function fetchMateriel() {
    setLoading(true)
    const { data } = await supabase.from('activites').select('nom, materiel, animateur').eq('session_active', true)
    const all = []
    ;(data || []).forEach(a => {
      parseMateriel(a.materiel).forEach(m => {
        all.push({ id: `${a.nom}_${m}`, label: m, activite: a.nom, animateur: a.animateur })
      })
    })
    setItems(all)
    setLoading(false)
  }

  function toggle(id) {
    setChecked(prev => {
      const next = { ...prev, [id]: !prev[id] }
      sessionStorage.setItem('materiel_checked', JSON.stringify(next))
      return next
    })
  }

  function resetAll() {
    setChecked({})
    sessionStorage.removeItem('materiel_checked')
  }

  function toggleSelect(id) {
    setSelected(s => ({ ...s, [id]: !s[id] }))
  }

  function selectAll() {
    const allSelected = filtered.every(i => selected[i.id])
    if (allSelected) {
      setSelected({})
    } else {
      const next = {}
      filtered.forEach(i => { next[i.id] = true })
      setSelected(next)
    }
  }

  function deleteSelected() {
    if (!confirm('Supprimer les éléments sélectionnés ?')) return
    setItems(prev => prev.filter(i => !selected[i.id]))
    setSelected({})
  }

  const filtered = filterDone === 'all' ? items
    : filterDone === 'todo' ? items.filter(i => !checked[i.id])
    : items.filter(i => checked[i.id])

  const nbDone = items.filter(i => checked[i.id]).length

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/session')} style={{ width: 40, height: 40, borderRadius: 12, background: 'white', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem' }}>📦 Liste matériel</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: 2 }}>Générée depuis les activités en cours</p>
        </div>
        {nbDone > 0 && (
          <button onClick={resetAll} style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text2)' }}>
            ↺ Reset
          </button>
        )}
      </div>

      {/* Progression */}
      {items.length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 16, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Progression</span>
            <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.9rem' }}>{nbDone} / {items.length}</span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(nbDone / items.length) * 100}%`, background: 'var(--green)', borderRadius: 4, transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'all', label: `Tout (${items.length})` },
          { id: 'todo', label: `À trouver (${items.length - nbDone})` },
          { id: 'done', label: `✅ OK (${nbDone})` },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterDone(f.id)} style={{
            flex: 1, padding: '8px 6px', borderRadius: 10,
            border: `2px solid ${filterDone === f.id ? 'var(--orange)' : 'var(--border)'}`,
            background: filterDone === f.id ? 'var(--orange)' : 'white',
            color: filterDone === f.id ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.75rem',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Actions sélection */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={selectAll} style={{
            flex: 1, padding: '9px', borderRadius: 10,
            border: '2px solid var(--border)', background: 'white',
            fontWeight: 700, fontSize: '0.8rem', color: 'var(--text2)',
          }}>
            {filtered.every(i => selected[i.id]) ? '☐ Tout désélectionner' : '☑ Tout sélectionner'}
          </button>
          {Object.values(selected).some(Boolean) && (
            <button onClick={deleteSelected} style={{
              padding: '9px 14px', borderRadius: 10,
              background: '#fff0f0', border: '1.5px solid #f5c6cb',
              fontWeight: 700, fontSize: '0.8rem', color: '#e74c3c',
            }}>
              🗑 Supprimer ({Object.values(selected).filter(Boolean).length})
            </button>
          )}
        </div>
      )}

      {loading && <div className="spinner" />}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
          <p style={{ fontWeight: 700 }}>Aucun matériel renseigné</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Ajoute du matériel dans les fiches activités</p>
        </div>
      )}

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: selected[item.id] ? '#FFF3EC' : 'white',
              borderRadius: 12, padding: '14px 16px',
              boxShadow: 'var(--shadow)',
              opacity: checked[item.id] ? 0.5 : 1,
              transition: 'all 0.2s',
              border: `1.5px solid ${selected[item.id] ? 'var(--orange)' : checked[item.id] ? 'var(--green)' : 'var(--border)'}`,
            }}
          >
            <div onClick={() => toggleSelect(item.id)} style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              border: `2px solid ${selected[item.id] ? 'var(--orange)' : 'var(--border)'}`,
              background: selected[item.id] ? 'var(--orange)' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.9rem', transition: 'all 0.2s', cursor: 'pointer',
            }}>
              {selected[item.id] ? '✓' : ''}
            </div>
            <div onClick={() => toggle(item.id)} style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              border: `2px solid ${checked[item.id] ? 'var(--green)' : 'var(--border)'}`,
              background: checked[item.id] ? 'var(--green)' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.9rem', transition: 'all 0.2s', cursor: 'pointer',
            }}>
              {checked[item.id] ? '✓' : ''}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: checked[item.id] ? 'line-through' : 'none' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: 2 }}>
                🎨 {item.activite} · 👤 {item.animateur}
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); setItems(prev => prev.filter(i => i.id !== item.id)) }} style={{
              background: 'none', border: 'none', color: 'var(--text2)',
              opacity: 0.4, fontSize: '1rem', flexShrink: 0, cursor: 'pointer',
            }}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  )
}
