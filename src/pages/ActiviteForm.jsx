import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TYPES = ['Jeux', 'Jeu de 11h', 'Activité manuelle', 'Temps calme']
const AGES = ['3-5 ans', '6-11 ans']

function resizeImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const attempts = [
          { maxW: 1000, q: 0.80 }, { maxW: 800, q: 0.72 },
          { maxW: 600, q: 0.65 }, { maxW: 450, q: 0.55 },
        ]
        let dataUrl = null
        for (const { maxW, q } of attempts) {
          let w = img.width, h = img.height
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
          const c = document.createElement('canvas')
          c.width = w; c.height = h
          c.getContext('2d').drawImage(img, 0, 0, w, h)
          dataUrl = c.toDataURL('image/jpeg', q)
          if (dataUrl.length < 2_000_000) break
        }
        resolve(dataUrl)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function ActiviteForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const isEdit = !!id

  const [form, setForm] = useState({
    nom: '', animateur: '', type: 'Activité manuelle', age: '3-5 ans',
    materiel: '', regles: '', commentaires: '', photo_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [deleteMode, setDeleteMode] = useState(false)

  useEffect(() => {
    if (isEdit) fetchActivite()
  }, [id])

  async function fetchActivite() {
    setLoading(true)
    const { data } = await supabase.from('activites').select('*').eq('id', id).single()
    if (data) {
      setForm(data)
      if (data.photo_url) setPhotoPreview(data.photo_url)
    }
    setLoading(false)
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizeImage(file)
    setPhotoPreview(dataUrl)
    setForm(f => ({ ...f, photo_url: dataUrl }))
  }

  async function handleSave() {
    if (!form.nom || !form.animateur) return
    setSaving(true)
    const payload = {
      nom: form.nom.trim(),
      animateur: form.animateur.trim(),
      type: form.type,
      age: form.age,
      materiel: form.materiel,
      regles: form.regles,
      commentaires: form.commentaires,
      photo_url: form.photo_url || null,
    }
    if (isEdit) {
      await supabase.from('activites').update(payload).eq('id', id)
    } else {
      await supabase.from('activites').insert([payload])
    }
    setSaving(false)
    navigate('/activites')
  }

  async function handleDelete() {
    if (!confirm('Supprimer définitivement cette activité ?')) return
    await supabase.from('activites').delete().eq('id', id)
    navigate('/activites')
  }

  function canEdit() {
    return isAdmin || !isEdit
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'white', border: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
        }}>←</button>
        <h1 style={{ fontSize: '1.4rem' }}>
          {isEdit ? '✏️ Modifier' : '✨ Nouvelle activité'}
        </h1>
      </div>

      {/* Photo */}
      <div style={{ marginBottom: 20 }}>
        {photoPreview ? (
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
            <img src={photoPreview} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
            {canEdit() && (
              <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 8 }}>
                <label style={{
                  background: 'rgba(255,255,255,0.9)', borderRadius: 8,
                  padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                }}>
                  📷 Changer
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                </label>
                <button onClick={() => { setPhotoPreview(null); setForm(f => ({...f, photo_url: ''})) }}
                  style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: '0.78rem', fontWeight: 700, color: '#e74c3c' }}>
                  🗑
                </button>
              </div>
            )}
          </div>
        ) : canEdit() ? (
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '28px 20px',
            border: '2px dashed var(--border)', borderRadius: 16,
            cursor: 'pointer', color: 'var(--text2)', background: 'white',
          }}>
            <span style={{ fontSize: '2rem' }}>📷</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Ajouter une photo</span>
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </label>
        ) : null}
      </div>

      {/* Form fields */}
      <Field label="Nom de l'activité *">
        <input value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))}
          placeholder="ex: Fresque de groupe" style={inputStyle} disabled={!canEdit()} />
      </Field>

      <Field label="Prénom de l'animateur *">
        <input value={form.animateur} onChange={e => setForm(f=>({...f,animateur:e.target.value}))}
          placeholder="ex: Emma" style={inputStyle} disabled={!canEdit()} />
      </Field>

      <Field label="Type d'activité">
        <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))} style={inputStyle} disabled={!canEdit()}>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="Tranche d'âge">
        <div style={{ display: 'flex', gap: 10 }}>
          {AGES.map(a => (
            <button key={a} onClick={() => canEdit() && setForm(f=>({...f,age:a}))} style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: `2px solid ${form.age === a ? 'var(--orange)' : 'var(--border)'}`,
              background: form.age === a ? 'rgba(255,107,53,0.08)' : 'white',
              fontWeight: 700, fontSize: '0.9rem',
              color: form.age === a ? 'var(--orange)' : 'var(--text)',
            }}>
              {a}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Matériel requis">
        <textarea value={form.materiel} onChange={e => setForm(f=>({...f,materiel:e.target.value}))}
          placeholder="Liste le matériel nécessaire…" rows={3} style={{...inputStyle, resize: 'vertical'}} disabled={!canEdit()} />
      </Field>

      <Field label="Règles / déroulement">
        <textarea value={form.regles} onChange={e => setForm(f=>({...f,regles:e.target.value}))}
          placeholder="Explique comment se déroule l'activité…" rows={4} style={{...inputStyle, resize: 'vertical'}} disabled={!canEdit()} />
      </Field>

      <Field label="Commentaires">
        <textarea value={form.commentaires} onChange={e => setForm(f=>({...f,commentaires:e.target.value}))}
          placeholder="Remarques, variantes, conseils…" rows={3} style={{...inputStyle, resize: 'vertical'}} disabled={!canEdit()} />
      </Field>

      {/* Actions */}
      {canEdit() && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '15px', fontSize: '1rem', opacity: (!form.nom || !form.animateur || saving) ? 0.6 : 1 }}
            onClick={handleSave}
            disabled={!form.nom || !form.animateur || saving}
          >
            {saving ? '⏳ Enregistrement…' : `💾 ${isEdit ? 'Enregistrer' : 'Publier l\'activité'}`}
          </button>
          {isEdit && isAdmin && (
            <button
              className="btn btn-ghost"
              style={{ width: '100%', padding: '14px', color: '#e74c3c', borderColor: '#f5c6cb' }}
              onClick={handleDelete}
            >
              🗑 Supprimer l'activité
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '2px solid var(--border)', fontSize: '0.9rem',
  background: 'white', color: 'var(--text)',
}
