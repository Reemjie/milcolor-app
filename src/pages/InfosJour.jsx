import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TYPES = [
  { id: 'entretien', icon: '📅', label: 'Entretiens', color: '#9B5DE5', bg: '#f0edf8', border: '#C084FC', adminOnly: true },
  { id: 'depart', icon: '🚪', label: 'Départs anticipés', color: '#CC6600', bg: '#FFF3E0', border: '#FF9F43', adminOnly: false },
  { id: 'info_parent', icon: '💬', label: 'Infos parents', color: '#118AB2', bg: '#E8F4FF', border: '#74B9FF', adminOnly: false },
  { id: 'todo', icon: '✅', label: 'À faire', color: '#0A7A5A', bg: '#E0FBF1', border: '#06D6A0', adminOnly: false },
]

function timeStr(d) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function InfosJour() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('depart')
  const [form, setForm] = useState({ contenu: '', auteur: sessionStorage.getItem('chat_auteur') || '' })
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => { fetchItems() }, [])

  useEffect(() => {
    const channel = supabase.channel('infos_jour')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'infos_jour' }, () => fetchItems())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase.from('infos_jour').select('*').eq('jour', today).order('created_at', { ascending: true })
    setItems(data || [])
    setLoading(false)
  }

  async function addItem() {
    if (!form.contenu.trim()) return
    setSaving(true)
    if (form.auteur) sessionStorage.setItem('chat_auteur', form.auteur)
    await supabase.from('infos_jour').insert([{
      type: formType,
      contenu: form.contenu.trim(),
      auteur: form.auteur.trim() || null,
      jour: today,
      fait: false,
    }])
    setSaving(false)
    setShowForm(false)
    setForm({ contenu: '', auteur: sessionStorage.getItem('chat_auteur') || '' })
    fetchItems()
  }

  async function toggleFait(item) {
    if (item.type !== 'todo') return
    const { data: auteurData } = await supabase.from('infos_jour').select('fait_par').eq('id', item.id).single()
    const prenom = sessionStorage.getItem('chat_auteur') || ''
    await supabase.from('infos_jour').update({ fait: !item.fait, fait_par: !item.fait ? prenom : null }).eq('id', item.id)
    fetchItems()
  }

  async function deleteItem(id) {
    await supabase.from('infos_jour').delete().eq('id', id)
    fetchItems()
  }

  function openForm(type) {
    setFormType(type)
    setShowForm(true)
  }

  const filtered = activeType === 'all' ? items : items.filter(i => i.type === activeType)
  const visibleTypes = isAdmin ? TYPES : TYPES.filter(t => !t.adminOnly)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 130px)' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: '1.5rem' }}>📋 Infos du jour</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          <button onClick={() => setActiveType('all')} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${activeType === 'all' ? 'var(--orange)' : 'var(--border)'}`,
            background: activeType === 'all' ? 'var(--orange)' : 'white',
            color: activeType === 'all' ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.75rem',
          }}>Tout ({items.length})</button>
          {TYPES.map(t => {
            const count = items.filter(i => i.type === t.id).length
            return (
              <button key={t.id} onClick={() => setActiveType(t.id)} style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                border: `2px solid ${activeType === t.id ? t.border : 'var(--border)'}`,
                background: activeType === t.id ? t.bg : 'white',
                color: activeType === t.id ? t.color : 'var(--text)', fontWeight: 700, fontSize: '0.75rem',
              }}>{t.icon} {t.label} {count > 0 ? `(${count})` : ''}</button>
            )
          })}
        </div>
      </div>

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {loading && <div className="spinner" />}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
            <p style={{ fontWeight: 700 }}>Rien pour l'instant</p>
            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Ajoute une info avec les boutons ci-dessous</p>
          </div>
        )}

        {/* Groupé par type */}
        {TYPES.map(t => {
          const typeItems = filtered.filter(i => i.type === t.id)
          if (typeItems.length === 0) return null
          return (
            <div key={t.id} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '1rem' }}>{t.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: t.color }}>{t.label}</span>
                <div style={{ flex: 1, height: 1, background: t.border, opacity: 0.3 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {typeItems.map(item => (
                  <div key={item.id} style={{
                    background: item.fait ? '#f8f8f8' : t.bg,
                    border: `1.5px solid ${item.fait ? 'var(--border)' : t.border}`,
                    borderRadius: 12, padding: '12px 14px',
                    opacity: item.fait ? 0.65 : 1,
                    cursor: item.type === 'todo' ? 'pointer' : 'default',
                  }}
                    onClick={() => item.type === 'todo' && toggleFait(item)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {item.type === 'todo' && (
                        <div style={{
                          width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 1,
                          border: `2px solid ${item.fait ? '#06D6A0' : t.border}`,
                          background: item.fait ? '#06D6A0' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.85rem',
                        }}>
                          {item.fait ? '✓' : ''}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.5, textDecoration: item.fait ? 'line-through' : 'none', color: 'var(--text)' }}>
                          {item.contenu}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          {item.auteur && <span style={{ fontSize: '0.7rem', color: t.color, fontWeight: 700 }}>👤 {item.auteur}</span>}
                          {item.fait && item.fait_par && <span style={{ fontSize: '0.7rem', color: '#0A7A5A', fontWeight: 700 }}>✓ Fait par {item.fait_par}</span>}
                          <span style={{ fontSize: '0.68rem', color: 'var(--text2)', marginLeft: 'auto' }}>{timeStr(item.created_at)}</span>
                        </div>
                      </div>
                      {(isAdmin || item.auteur === sessionStorage.getItem('chat_auteur')) && (
                        <button onClick={e => { e.stopPropagation(); deleteItem(item.id) }} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '0.9rem', flexShrink: 0 }}>🗑</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Boutons d'ajout rapide */}
      <div style={{ padding: '10px 12px 12px', background: 'white', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(4,1fr)' : 'repeat(3,1fr)', gap: 8 }}>
          {visibleTypes.map(t => (
            <button key={t.id} onClick={() => openForm(t.id)} style={{
              padding: '10px 6px', borderRadius: 12,
              border: `2px solid ${t.border}`,
              background: t.bg, color: t.color,
              fontWeight: 700, fontSize: '0.72rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal ajout */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480 }}>
            {(() => {
              const t = TYPES.find(x => x.id === formType)
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h2 style={{ fontSize: '1.2rem', color: t.color }}>{t.icon} {t.label}</h2>
                    <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
                  </div>

                  {!isAdmin && (
                    <div style={{ marginBottom: 14 }}>
                      <label style={lStyle}>Ton prénom</label>
                      <input value={form.auteur} onChange={e => setForm(f => ({ ...f, auteur: e.target.value }))}
                        placeholder="ex: Emma" style={iStyle} />
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <label style={lStyle}>
                      {formType === 'entretien' ? 'Horaire et nom de l\'animateur' :
                       formType === 'depart' ? 'Nom de l\'enfant et heure de départ' :
                       formType === 'info_parent' ? 'Information transmise par les parents' :
                       'Tâche à réaliser'}
                    </label>
                    <textarea value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                      placeholder={
                        formType === 'entretien' ? 'ex: 14h30 — Emma D.' :
                        formType === 'depart' ? 'ex: Léo M. — départ à 16h30, récupéré par la grand-mère' :
                        formType === 'info_parent' ? 'ex: Manon a mal dormi, à surveiller...' :
                        'ex: Ranger le matériel de peinture'
                      }
                      rows={3} style={{ ...iStyle, resize: 'vertical' }} />
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.contenu.trim() || saving) ? 0.6 : 1 }}
                    onClick={addItem} disabled={!form.contenu.trim() || saving}>
                    {saving ? '⏳…' : '📤 Ajouter'}
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)' }
