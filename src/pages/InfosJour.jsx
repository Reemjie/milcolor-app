import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TYPES = [
  { id: 'entretien', icon: '📅', label: 'Entretiens', color: '#9B5DE5', bg: '#f0edf8', border: '#C084FC', adminOnly: true },
  { id: 'todo', icon: '✅', label: 'À faire', color: '#0A7A5A', bg: '#E0FBF1', border: '#06D6A0', adminOnly: false },
]

function timeStr(d) {
  return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function InfosJour() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('depart')
  const [form, setForm] = useState({ contenu: '', auteur: sessionStorage.getItem('chat_auteur') || '' })
  const [saving, setSaving] = useState(false)
  const [impressions, setImpressions] = useState([])
  const [showImpForm, setShowImpForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [impForm, setImpForm] = useState({ nom: '', taille: 'A4', quantite: 1, auteur: sessionStorage.getItem('chat_auteur') || '', files: [] })
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => { fetchItems(); fetchImpressions() }, [])

  useEffect(() => {
    const channel = supabase.channel('infos_jour')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'infos_jour' }, () => fetchItems())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data: entretiens } = await supabase.from('infos_jour').select('*').eq('type', 'entretien').order('created_at', { ascending: true })
    const { data: autres } = await supabase.from('infos_jour').select('*').neq('type', 'entretien').eq('jour', today).order('created_at', { ascending: true })
    const data = [...(entretiens || []), ...(autres || [])]
    setItems(data || [])
    setLoading(false)
  }

  async function fetchImpressions() {
    const { data } = await supabase.from('impressions').select('*').order('created_at', { ascending: false })
    setImpressions(data || [])
  }

  async function uploadImpression() {
    if (!impForm.nom || impForm.files.length === 0) return
    setUploading(true)
    if (impForm.auteur) sessionStorage.setItem('chat_auteur', impForm.auteur)
    for (const file of impForm.files) {
      const filename = `${Date.now()}_${file.name}`
      await supabase.storage.from('impressions').upload(filename, file)
      const { data } = supabase.storage.from('impressions').getPublicUrl(filename)
      await supabase.from('impressions').insert([{
        nom: impForm.files.length > 1 ? `${impForm.nom} (${file.name})` : impForm.nom,
        url: data.publicUrl,
        taille: impForm.taille,
        quantite: impForm.quantite,
        auteur: impForm.auteur || null,
        jour: today,
      }])
      await supabase.from('notifications').insert([{ titre: `🖨️ À imprimer${impForm.auteur ? ' — ' + impForm.auteur : ''}`, message: `${impForm.nom} (${impForm.taille} x${impForm.quantite})`, type: 'info', lue: false, lien: '/infos-jour' }])
    }
    setUploading(false)
    setShowImpForm(false)
    setImpForm({ nom: '', taille: 'A4', quantite: 1, auteur: sessionStorage.getItem('chat_auteur') || '', files: [] })
    fetchImpressions()
  }

  async function toggleImprime(item) {
    await supabase.from('impressions').update({ imprime: !item.imprime }).eq('id', item.id)
    fetchImpressions()
  }

  async function deleteImpression(id, url) {
    if (!confirm('Supprimer ?')) return
    const filename = url.split('/').pop()
    await supabase.storage.from('impressions').remove([filename])
    await supabase.from('impressions').delete().eq('id', id)
    fetchImpressions()
  }

  async function addItem() {
    if (!form.contenu.trim()) return
    setSaving(true)
    if (form.auteur) sessionStorage.setItem('chat_auteur', form.auteur)
    const typeLabel = { entretien: '📅 Entretien', depart: '🚪 Départ anticipé', info_parent: '💬 Info parent', todo: '✅ À faire' }[formType] || formType
    await supabase.from('infos_jour').insert([{
      type: formType,
      contenu: form.contenu.trim(),
      auteur: form.auteur.trim() || null,
      jour: today,
      fait: false,
    }])
    await supabase.from('notifications').insert([{ titre: `${typeLabel}${form.auteur ? ' — ' + form.auteur.trim() : ''}`, message: form.contenu.trim().slice(0, 100), type: 'info', lue: false, lien: '/infos-jour' }])
    setSaving(false)
    setShowForm(false)
    setForm({ contenu: '', auteur: sessionStorage.getItem('chat_auteur') || '' })
    fetchItems()
  }

  async function toggleFait(item) {
    if (item.type !== 'todo') return
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

  const filtered = activeType === 'all' ? items : activeType === 'impression' ? [] : items.filter(i => i.type === activeType)
  const visibleTypes = isAdmin ? TYPES : TYPES.filter(t => !t.adminOnly)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 130px)' }}>
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: 12 }}>
          <h1 style={{ fontSize: '1.5rem' }}>📋 Infos du jour</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          <button onClick={() => setActiveType('all')} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: `2px solid ${activeType === 'all' ? 'var(--orange)' : 'var(--border)'}`, background: activeType === 'all' ? 'var(--orange)' : 'white', color: activeType === 'all' ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.75rem' }}>Tout ({items.length})</button>
          <button onClick={() => setActiveType('impression')} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: `2px solid ${activeType === 'impression' ? '#9B5DE5' : 'var(--border)'}`, background: activeType === 'impression' ? '#f0edf8' : 'white', color: activeType === 'impression' ? '#9B5DE5' : 'var(--text)', fontWeight: 700, fontSize: '0.75rem' }}>🖨️ À imprimer ({impressions.length})</button>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setActiveType(t.id)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: `2px solid ${activeType === t.id ? t.border : 'var(--border)'}`, background: activeType === t.id ? t.bg : 'white', color: activeType === t.id ? t.color : 'var(--text)', fontWeight: 700, fontSize: '0.75rem' }}>
              {t.icon} {t.label} ({items.filter(i => i.type === t.id).length})
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {loading && <div className="spinner" />}

        {!loading && activeType === 'impression' && (
          <div>
            {impressions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🖨️</div>
                <p style={{ fontWeight: 700 }}>Rien à imprimer</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {impressions.map(imp => (
                  <div key={imp.id} style={{ background: imp.imprime ? '#f8f8f8' : '#f0edf8', border: `1.5px solid ${imp.imprime ? 'var(--border)' : '#C084FC'}`, borderRadius: 12, padding: '14px 16px', opacity: imp.imprime ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4, textDecoration: imp.imprime ? 'line-through' : 'none' }}>{imp.nom}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span className="tag" style={{ background: '#E8F4FF', color: '#118AB2' }}>📐 {imp.taille}</span>
                          <span className="tag" style={{ background: '#FFF3E0', color: '#CC6600' }}>×{imp.quantite}</span>
                          {imp.auteur && <span className="tag" style={{ background: 'var(--bg)', color: 'var(--text2)' }}>👤 {imp.auteur}</span>}
                          {imp.imprime && <span className="tag" style={{ background: '#E0FBF1', color: '#0A7A5A' }}>✅ Imprimé</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={imp.url} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 8, background: '#9B5DE5', color: 'white', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>👁 Ouvrir</a>
                          <button onClick={() => toggleImprime(imp)} style={{ padding: '6px 12px', borderRadius: 8, background: imp.imprime ? 'var(--bg)' : '#E0FBF1', border: `1.5px solid ${imp.imprime ? 'var(--border)' : '#06D6A0'}`, color: imp.imprime ? 'var(--text2)' : '#0A7A5A', fontWeight: 700, fontSize: '0.78rem' }}>
                            {imp.imprime ? '↩ Remettre' : '✅ Imprimé'}
                          </button>
                        </div>
                      </div>
                      <button onClick={() => deleteImpression(imp.id, imp.url)} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '1rem' }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && activeType !== 'impression' && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
            <p style={{ fontWeight: 700 }}>Rien pour l'instant</p>
          </div>
        )}

        {activeType !== 'impression' && TYPES.map(t => {
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
                  <div key={item.id} style={{ background: item.fait ? '#f8f8f8' : t.bg, border: `1.5px solid ${item.fait ? 'var(--border)' : t.border}`, borderRadius: 12, padding: '12px 14px', opacity: item.fait ? 0.65 : 1, cursor: item.type === 'todo' ? 'pointer' : 'default' }}
                    onClick={() => item.type === 'todo' && toggleFait(item)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      {item.type === 'todo' && (
                        <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 1, border: `2px solid ${item.fait ? '#06D6A0' : t.border}`, background: item.fait ? '#06D6A0' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem' }}>
                          {item.fait ? '✓' : ''}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.5, textDecoration: item.fait ? 'line-through' : 'none', color: 'var(--text)' }}>{item.contenu}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          {item.auteur && <span style={{ fontSize: '0.7rem', color: t.color, fontWeight: 700 }}>👤 {item.auteur}</span>}
                          {item.fait && item.fait_par && <span style={{ fontSize: '0.7rem', color: '#0A7A5A', fontWeight: 700 }}>✓ Fait par {item.fait_par}</span>}
                          <span style={{ fontSize: '0.68rem', color: 'var(--text2)', marginLeft: 'auto' }}>{timeStr(item.created_at)}</span>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteItem(item.id) }} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '0.9rem', flexShrink: 0 }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '10px 12px 12px', background: 'white', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <button onClick={() => navigate('/sorties')} style={{ padding: '10px 6px', borderRadius: 12, border: '2px solid #FF6B6B', background: '#FFE8E8', color: '#CC3333', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>🚶</div>Je sors avec un groupe
          </button>
          <button onClick={() => { setShowImpForm(true); setActiveType('impression') }} style={{ padding: '10px 6px', borderRadius: 12, border: '2px solid #C084FC', background: '#f0edf8', color: '#9B5DE5', fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>🖨️</div>À imprimer
          </button>
          {visibleTypes.map(t => (
            <button key={t.id} onClick={() => openForm(t.id)} style={{ padding: '10px 6px', borderRadius: 12, border: `2px solid ${t.border}`, background: t.bg, color: t.color, fontWeight: 700, fontSize: '0.72rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 2 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
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
                      <input value={form.auteur} onChange={e => setForm(f => ({ ...f, auteur: e.target.value }))} placeholder="ex: Emma" style={iStyle} />
                    </div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <label style={lStyle}>
                      {formType === 'entretien' ? "Horaire et nom de l'animateur" :
                       formType === 'depart' ? "Nom de l'enfant et heure de départ" :
                       formType === 'info_parent' ? "Information transmise par les parents" :
                       "Tâche à réaliser"}
                    </label>
                    <textarea value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                      placeholder={
                        formType === 'entretien' ? "ex: 14h30 — Emma D." :
                        formType === 'depart' ? "ex: Léo M. — départ à 16h30" :
                        formType === 'info_parent' ? "ex: Manon a mal dormi..." :
                        "ex: Ranger le matériel de peinture"
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

      {showImpForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowImpForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem', color: '#9B5DE5' }}>🖨️ À imprimer</h2>
              <button onClick={() => setShowImpForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <label style={lStyle}>Ton prénom</label>
            <input value={impForm.auteur} onChange={e => setImpForm(f => ({ ...f, auteur: e.target.value }))} placeholder="ex: Emma" style={{ ...iStyle, marginBottom: 14 }} />
            <label style={lStyle}>Nom du document *</label>
            <input value={impForm.nom} onChange={e => setImpForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex: Règles du jeu" style={{ ...iStyle, marginBottom: 14 }} />
            <label style={lStyle}>Taille</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {['A3', 'A4', 'A5'].map(t => (
                <button key={t} onClick={() => setImpForm(f => ({ ...f, taille: t }))} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${impForm.taille === t ? '#9B5DE5' : 'var(--border)'}`, background: impForm.taille === t ? '#f0edf8' : 'white', fontWeight: 700, fontSize: '0.9rem', color: impForm.taille === t ? '#9B5DE5' : 'var(--text)' }}>{t}</button>
              ))}
            </div>
            <label style={lStyle}>Quantité</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <button onClick={() => setImpForm(f => ({ ...f, quantite: Math.max(1, f.quantite - 1) }))} style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '1.3rem', fontWeight: 700 }}>−</button>
              <span style={{ flex: 1, textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Fredoka' }}>{impForm.quantite}</span>
              <button onClick={() => setImpForm(f => ({ ...f, quantite: f.quantite + 1 }))} style={{ width: 44, height: 44, borderRadius: 12, background: '#9B5DE5', border: 'none', color: 'white', fontSize: '1.3rem', fontWeight: 700 }}>+</button>
            </div>
            <label style={lStyle}>Fichier (PDF ou image) *</label>
            {impForm.files.length > 0 ? (
              <div style={{ marginBottom: 14 }}>
                {impForm.files.map((f, i) => (
                  <div key={i} style={{ padding: '10px 12px', background: '#f0edf8', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem' }}>📄</span>
                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <button onClick={() => setImpForm(x => ({ ...x, files: x.files.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: '#e74c3c', fontWeight: 700 }}>✕</button>
                  </div>
                ))}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1.5px dashed #C084FC', borderRadius: 10, cursor: 'pointer', color: '#9B5DE5', fontSize: '0.82rem', fontWeight: 700 }}>
                  + Ajouter un fichier
                  <input type="file" accept="application/pdf,image/*" multiple onChange={e => setImpForm(f => ({ ...f, files: [...f.files, ...Array.from(e.target.files || [])] }))} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', border: '2px dashed var(--border)', borderRadius: 12, cursor: 'pointer', color: 'var(--text2)', background: 'var(--bg)', marginBottom: 14 }}>
                <span style={{ fontSize: '1.5rem' }}>📎</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Choisir un fichier</span>
                <input type="file" accept="application/pdf,image/*" multiple onChange={e => setImpForm(f => ({ ...f, files: Array.from(e.target.files || []) }))} style={{ display: 'none' }} />
              </label>
            )}
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!impForm.nom || impForm.files.length === 0 || uploading) ? 0.6 : 1 }}
              onClick={uploadImpression} disabled={!impForm.nom || impForm.files.length === 0 || uploading}>
              {uploading ? '⏳ Upload…' : '📤 Ajouter à la liste'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)' }
