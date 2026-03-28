import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const COLORS = ['#FF6B35', '#FFD166', '#06D6A0', '#118AB2', '#FF6B9D', '#9B5DE5']



export default function Plannings() {
  const { isAdmin } = useAuth()
  const [semaines, setSemaines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [activeSemaine, setActiveSemaine] = useState(0)
  const [form, setForm] = useState({ titre: '', date_debut: '', couleur: COLORS[0], photo_url: '' })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => { fetchSemaines() }, [])

  async function fetchSemaines() {
    setLoading(true)
    const { data } = await supabase.from('plannings').select('*').order('date_debut', { ascending: false })
    setSemaines(data || [])
    setLoading(false)
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoPreview('loading')
    const ext = file.name.split('.').pop()
    const filename = `planning_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('plannings').upload(filename, file, { upsert: true })
    if (error) { alert('Erreur upload: ' + error.message); setPhotoPreview(null); return }
    const { data } = supabase.storage.from('plannings').getPublicUrl(filename)
    setPhotoPreview(data.publicUrl)
    setForm(f => ({ ...f, photo_url: data.publicUrl }))
  }

  async function saveSemaine() {
    if (!form.titre.trim()) return
    setSaving(true)
    const payload = {
      titre: form.titre.trim(),
      date_debut: form.date_debut || null,
      couleur: form.couleur,
      photo_url: form.photo_url || null,
      slots: {},
    }
    if (editItem) {
      await supabase.from('plannings').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('plannings').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    setEditItem(null)
    setForm({ titre: '', date_debut: '', couleur: COLORS[0], photo_url: '' })
    setPhotoPreview(null)
    fetchSemaines()
  }

  async function deleteSemaine(id) {
    if (!confirm('Supprimer ce planning ?')) return
    await supabase.from('plannings').delete().eq('id', id)
    setActiveSemaine(0)
    fetchSemaines()
  }

  function openEdit(s) {
    setEditItem(s)
    setForm({ titre: s.titre, date_debut: s.date_debut || '', couleur: s.couleur, photo_url: s.photo_url || '' })
    setPhotoPreview(s.photo_url || null)
    setShowForm(true)
  }

  function openNew() {
    setEditItem(null)
    setForm({ titre: '', date_debut: '', couleur: COLORS[0], photo_url: '' })
    setPhotoPreview(null)
    setShowForm(true)
  }

  const sem = semaines[activeSemaine]

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>📅 Plannings</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>
            {semaines.length} semaine{semaines.length > 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openNew}>+ Semaine</button>}
      </div>

      {loading && <div className="spinner" />}

      {!loading && semaines.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
          <p style={{ fontWeight: 700 }}>Aucun planning publié</p>
          {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Clique sur "+ Semaine" pour commencer</p>}
        </div>
      )}

      {!loading && semaines.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            {semaines.map((s, i) => (
              <button key={s.id} onClick={() => setActiveSemaine(i)} style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 20,
                border: `2px solid ${activeSemaine === i ? s.couleur : 'var(--border)'}`,
                background: activeSemaine === i ? s.couleur : 'white',
                color: activeSemaine === i ? 'white' : 'var(--text)',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
              }}>{s.titre}</button>
            ))}
          </div>

          {sem && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ background: sem.couleur, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: 'white', fontFamily: 'Fredoka', fontSize: '1.2rem' }}>{sem.titre}</div>
                  {sem.date_debut && <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>Semaine du {new Date(sem.date_debut + 'T00:00:00').toLocaleDateString('fr-FR')}</div>}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(sem)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 12px', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>✏️ Modifier</button>
                    <button onClick={() => deleteSemaine(sem.id)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>🗑</button>
                  </div>
                )}
              </div>
              {sem.photo_url ? (
                <div style={{ position: 'relative' }}>
                  {sem.photo_url.toLowerCase().includes('.pdf') ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f0edf8' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 10 }}>📄</div>
                      <a href={sem.photo_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 12, background: '#9B5DE5', color: 'white', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>👁 Ouvrir le planning PDF</a>
                    </div>
                  ) : (
                    <>
                      <img src={sem.photo_url} alt={sem.titre} style={{ width: '100%', display: 'block', maxHeight: 500, objectFit: 'contain', background: '#f8f8f8' }} />
                      <a href={sem.photo_url} target="_blank" rel="noreferrer" style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none' }}>🔍 Agrandir</a>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text2)', background: 'var(--bg)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🖼️</div>
                  <p style={{ fontWeight: 700 }}>Pas encore d'image</p>
                  {isAdmin && <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Clique sur ✏️ Modifier pour uploader</p>}
                </div>
              )}
            </div>
          )}
        </>
      )}



      {/* MODAL — centré verticalement, pas en bas */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '16px 16px', width: '100%', maxWidth: 480, maxHeight: '65dvh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>{editItem ? '✏️ Modifier' : '➕ Nouveau'} planning</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: '1rem' }}>✕</button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                Nom du planning <span style={{ color: 'var(--orange)' }}>*</span>
              </label>
              <input
                value={form.titre}
                onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="ex: Semaine 1, Semaine de Pâques…"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `2px solid ${form.titre ? 'var(--orange)' : 'var(--border)'}`, fontSize: '1rem', background: 'var(--bg)' }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem' }}>Image du planning</label>
              {photoPreview ? (
                <div>
                  <img src={photoPreview} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'contain', background: '#f8f8f8', display: 'block' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <label style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'var(--bg)', borderRadius: 10, border: '2px solid var(--border)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text2)' }}>
                      📷 Changer
                      <input type="file" accept="image/*,application/pdf" onChange={handlePhoto} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => { setPhotoPreview(null); setForm(f => ({ ...f, photo_url: '' })) }} style={{ padding: '10px 16px', background: '#fff0f0', border: '2px solid #f5c6cb', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', color: '#e74c3c' }}>🗑</button>
                  </div>
                </div>
              ) : (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '24px 20px', border: '2px dashed var(--border)', borderRadius: 14, cursor: 'pointer', color: 'var(--text2)', background: 'var(--bg)' }}>
                  <span style={{ fontSize: '2rem' }}>📷</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Uploader l'image du planning</span>
                  <span style={{ fontSize: '0.75rem' }}>PDF ou photo du planning</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handlePhoto} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem' }}>Date de début (optionnel)</label>
              <input type="date" value={form.date_debut} onChange={e => setForm(f => ({ ...f, date_debut: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)' }} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.95rem' }}>Couleur de l'onglet</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(f => ({ ...f, couleur: c }))} style={{ width: 36, height: 36, borderRadius: '50%', background: c, border: form.couleur === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '15px', fontSize: '1rem', borderRadius: 14, opacity: (!form.titre.trim() || saving) ? 0.5 : 1 }}
              onClick={saveSemaine} disabled={!form.titre.trim() || saving}>
              {saving ? '⏳ Enregistrement…' : '💾 Enregistrer le planning'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
