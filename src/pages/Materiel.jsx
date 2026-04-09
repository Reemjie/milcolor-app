import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const STATUTS = [
  { id: 'alerte', label: '⚠️ Manque', color: '#CC6600', bg: '#FFF3E0', border: '#FF9F43' },
  { id: 'casse', label: '🔨 Cassé', color: '#CC3333', bg: '#FFE8E8', border: '#FF6B6B' },
  { id: 'resolu', label: '✅ Résolu', color: '#0A7A5A', bg: '#E0FBF1', border: '#06D6A0' },
]

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Materiel() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatut, setFilterStatut] = useState('actif')
  const [form, setForm] = useState({ nom: '', description: '', statut: 'alerte', signale_par: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch() }, [])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('materiel').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function save() {
    if (!form.nom || !form.signale_par) return
    setSaving(true)
    await supabase.from('materiel').insert([form])
    await supabase.from('notifications').insert([{ titre: `🔧 Signalement matériel — ${form.nom}`, message: form.description || form.statut, type: 'info', lue: false }])
    setSaving(false)
    setShowForm(false)
    setForm({ nom: '', description: '', statut: 'alerte', signale_par: '' })
    fetch()
  }

  async function updateStatut(id, statut) {
    await supabase.from('materiel').update({ statut }).eq('id', id)
    fetch()
  }

  async function deleteItem(id) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('materiel').delete().eq('id', id)
    fetch()
  }

  const filtered = filterStatut === 'actif'
    ? items.filter(i => i.statut !== 'resolu')
    : filterStatut === 'all' ? items : items.filter(i => i.statut === filterStatut)

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🔧 Matériel</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Signaler un manque ou une casse</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Signaler</button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'actif', label: '🔴 En cours' },
          { id: 'alerte', label: '⚠️ Manque' },
          { id: 'casse', label: '🔨 Cassé' },
          { id: 'resolu', label: '✅ Résolu' },
          { id: 'all', label: 'Tout' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilterStatut(f.id)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `2px solid ${filterStatut === f.id ? 'var(--orange)' : 'var(--border)'}`, background: filterStatut === f.id ? 'var(--orange)' : 'white', color: filterStatut === f.id ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.78rem' }}>{f.label}</button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔧</div>
          <p style={{ fontWeight: 700 }}>Aucun signalement</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Clique "+ Signaler" pour rapporter un problème de matériel</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(item => {
          const s = STATUTS.find(x => x.id === item.statut) || STATUTS[0]
          return (
            <div key={item.id} style={{ background: item.statut === 'resolu' ? 'white' : s.bg, border: `2px solid ${s.border}`, borderRadius: 14, padding: '14px 16px', opacity: item.statut === 'resolu' ? 0.7 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="tag" style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.border}` }}>{s.label}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.nom}</span>
                  </div>
                  {item.description && <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 6 }}>{item.description}</p>}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>
                    👤 {item.signale_par} · {timeAgo(item.created_at)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {item.statut !== 'resolu' && (
                    <button onClick={() => updateStatut(item.id, 'resolu')} style={{ background: '#E0FBF1', border: '1.5px solid #06D6A0', borderRadius: 8, padding: '5px 10px', fontWeight: 700, fontSize: '0.72rem', color: '#0A7A5A' }}>✅ Résolu</button>
                  )}
                  {isAdmin && <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '0.9rem' }}>🗑</button>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px 20px', width: '100%', maxHeight: '80dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>🔧 Signaler un problème</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>

            <label style={lStyle}>Type de problème</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {STATUTS.filter(s => s.id !== 'resolu').map(s => (
                <button key={s.id} onClick={() => setForm(f => ({...f, statut: s.id}))} style={{ flex: 1, padding: '10px 6px', borderRadius: 10, border: `2px solid ${form.statut === s.id ? s.border : 'var(--border)'}`, background: form.statut === s.id ? s.bg : 'white', fontWeight: 700, fontSize: '0.8rem', color: form.statut === s.id ? s.color : 'var(--text)' }}>{s.label}</button>
              ))}
            </div>

            <label style={lStyle}>Nom du matériel *</label>
            <input value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="ex: Cerceaux, ballon, craies…" style={iStyle} />

            <label style={lStyle}>Précisions (optionnel)</label>
            <textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Quantité manquante, état, où ça se trouve…" rows={3} style={{...iStyle, resize: 'vertical'}} />

            <label style={lStyle}>Ton prénom *</label>
            <input value={form.signale_par} onChange={e => setForm(f=>({...f,signale_par:e.target.value}))} placeholder="ex: Emma" style={iStyle} />

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.nom || !form.signale_par || saving) ? 0.6 : 1 }} onClick={save} disabled={!form.nom || !form.signale_par || saving}>
              {saving ? '⏳ Envoi…' : '📤 Signaler'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)', marginBottom: 16 }
