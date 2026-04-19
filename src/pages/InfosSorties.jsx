import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function InfosSorties() {
  const { isAdmin } = useAuth()
  const [sorties, setSorties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titre: '', date_sortie: '', heure_depart: '',
    heure_retour: '', lieu: '', deroulement: '', infos_pratiques: ''
  })

  useEffect(() => { fetchSorties() }, [])

  async function fetchSorties() {
    setLoading(true)
    const { data } = await supabase.from('infos_sorties').select('*').order('date_sortie', { ascending: true })
    setSorties(data || [])
    setLoading(false)
  }

  function openForm(item = null) {
    if (item) {
      setEditItem(item)
      setForm({
        titre: item.titre || '', date_sortie: item.date_sortie || '',
        heure_depart: item.heure_depart || '', heure_retour: item.heure_retour || '',
        lieu: item.lieu || '', deroulement: item.deroulement || '', infos_pratiques: item.infos_pratiques || '',
      })
    } else {
      setEditItem(null)
      setForm({ titre: '', date_sortie: '', heure_depart: '', heure_retour: '', lieu: '', deroulement: '', infos_pratiques: '' })
    }
    setShowForm(true)
  }

  async function save() {
    if (!form.titre) return
    setSaving(true)
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (editItem) {
      await supabase.from('infos_sorties').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('infos_sorties').insert([payload])
      await supabase.from('notifications').insert([{ titre: `🗺️ Sortie ajoutée — ${form.titre}`, message: form.lieu || '', type: 'info', lue: false, lien: '/infos-sorties' }])
    }
    setSaving(false)
    setShowForm(false)
    fetchSorties()
  }

  async function deleteSortie(id) {
    if (!confirm('Supprimer cette sortie ?')) return
    await supabase.from('infos_sorties').delete().eq('id', id)
    fetchSorties()
  }

  function formatDate(d) {
    if (!d) return ''
    return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🗺️ Sorties prévues</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Programme des sorties de la session</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => openForm()}>+ Ajouter</button>}
      </div>

      {loading && <div className="spinner" />}

      {!loading && sorties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🗺️</div>
          <p style={{ fontWeight: 700 }}>Aucune sortie prévue</p>
          {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Clique sur "+ Ajouter" pour renseigner une sortie</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sorties.map(s => (
          <div key={s.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #06D6A0, #118AB2)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', color: 'white', fontWeight: 700 }}>{s.titre}</h2>
                  {s.date_sortie && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', marginTop: 2 }}>📅 {formatDate(s.date_sortie)}</p>}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openForm(s)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700, fontSize: '0.78rem' }}>✏️</button>
                    <button onClick={() => deleteSortie(s.id)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700, fontSize: '0.78rem' }}>🗑</button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(s.heure_depart || s.heure_retour) && (
                <div style={{ display: 'flex', gap: 12 }}>
                  {s.heure_depart && (
                    <div style={{ flex: 1, background: '#E0FBF1', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#0A7A5A', fontWeight: 700, marginBottom: 2 }}>DÉPART BUS</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0A7A5A', fontFamily: 'Fredoka' }}>{s.heure_depart.slice(0,5)}</div>
                    </div>
                  )}
                  {s.heure_retour && (
                    <div style={{ flex: 1, background: '#E8F4FF', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#118AB2', fontWeight: 700, marginBottom: 2 }}>RETOUR PRÉVU</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#118AB2', fontFamily: 'Fredoka' }}>{s.heure_retour.slice(0,5)}</div>
                    </div>
                  )}
                </div>
              )}
              {s.lieu && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📍</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 2 }}>LIEU</div>
                    <div style={{ fontSize: '0.9rem' }}>{s.lieu}</div>
                  </div>
                </div>
              )}
              {s.deroulement && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🗓</span>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 2 }}>DÉROULEMENT</div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{s.deroulement}</div>
                  </div>
                </div>
              )}
              {s.infos_pratiques && (
                <div style={{ background: '#FFF3EC', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--orange)', marginBottom: 4 }}>ℹ️ INFOS PRATIQUES</div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{s.infos_pratiques}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '90dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>🗺️ {editItem ? 'Modifier' : 'Nouvelle'} sortie</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <label style={lStyle}>Titre *</label>
            <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="ex: Sortie forêt de Lyons" style={iStyle} />
            <label style={lStyle}>Date</label>
            <input type="date" value={form.date_sortie} onChange={e => setForm(f => ({ ...f, date_sortie: e.target.value }))} style={iStyle} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={lStyle}>Heure départ bus</label>
                <input type="time" value={form.heure_depart} onChange={e => setForm(f => ({ ...f, heure_depart: e.target.value }))} style={{ ...iStyle, marginBottom: 0 }} />
              </div>
              <div>
                <label style={lStyle}>Heure retour</label>
                <input type="time" value={form.heure_retour} onChange={e => setForm(f => ({ ...f, heure_retour: e.target.value }))} style={{ ...iStyle, marginBottom: 0 }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }} />
            <label style={lStyle}>Lieu</label>
            <input value={form.lieu} onChange={e => setForm(f => ({ ...f, lieu: e.target.value }))} placeholder="ex: Forêt de Lyons-la-Forêt" style={iStyle} />
            <label style={lStyle}>Déroulement</label>
            <textarea value={form.deroulement} onChange={e => setForm(f => ({ ...f, deroulement: e.target.value }))} placeholder="ex: 9h30 départ, 10h arrivée, balade, pique-nique, 15h retour..." rows={4} style={{ ...iStyle, resize: 'vertical' }} />
            <label style={lStyle}>Infos pratiques</label>
            <textarea value={form.infos_pratiques} onChange={e => setForm(f => ({ ...f, infos_pratiques: e.target.value }))} placeholder="ex: Prévoir chaussures fermées, casquette, pique-nique tiré du sac..." rows={3} style={{ ...iStyle, resize: 'vertical' }} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.titre || saving) ? 0.6 : 1 }}
              onClick={save} disabled={!form.titre || saving}>
              {saving ? '⏳…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)', marginBottom: 16 }
