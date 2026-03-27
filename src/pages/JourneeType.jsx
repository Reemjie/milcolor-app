import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function resizeImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const attempts = [{ maxW: 1200, q: 0.82 }, { maxW: 900, q: 0.72 }, { maxW: 700, q: 0.62 }]
        let dataUrl = null
        for (const { maxW, q } of attempts) {
          let w = img.width, h = img.height
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
          const c = document.createElement('canvas')
          c.width = w; c.height = h
          c.getContext('2d').drawImage(img, 0, 0, w, h)
          dataUrl = c.toDataURL('image/jpeg', q)
          if (dataUrl.length < 2_500_000) break
        }
        resolve(dataUrl)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

function TextPage({ sectionId, icon, title, color, bg, placeholder }) {
  const { isAdmin } = useAuth()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editPhoto, setEditPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchDoc() }, [sectionId])

  async function fetchDoc() {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*').eq('section_id', sectionId).maybeSingle()
    setDoc(data)
    setLoading(false)
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizeImage(file)
    setPhotoPreview(dataUrl)
    setEditPhoto(dataUrl)
  }

  async function save() {
    setSaving(true)
    const payload = {
      contenu: editContent,
      photo_url: editPhoto !== undefined ? editPhoto : doc?.photo_url,
      updated_at: new Date().toISOString()
    }
    if (doc) {
      await supabase.from('documents').update(payload).eq('id', doc.id)
    } else {
      await supabase.from('documents').insert([{ section_id: sectionId, ...payload }])
    }
    setSaving(false)
    setEditMode(false)
    setEditPhoto(undefined)
    fetchDoc()
  }

  function startEdit() {
    setEditContent(doc?.contenu || '')
    setPhotoPreview(doc?.photo_url || null)
    setEditPhoto(undefined)
    setEditMode(true)
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem' }}>{icon} {title}</h1>
        {isAdmin && <button className="btn btn-primary" onClick={startEdit}>✏️ Modifier</button>}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ background: bg, padding: '14px 20px', borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', fontWeight: 600, color }}>{icon} {title}</span>
        </div>
        <div style={{ padding: '20px' }}>
          {doc?.photo_url && (
            <img src={doc.photo_url} alt={title} style={{ width: '100%', borderRadius: 12, marginBottom: 16, display: 'block', objectFit: 'contain', background: '#f8f8f8' }} />
          )}
          {doc?.contenu ? (
            <div style={{ fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{doc.contenu}</div>
          ) : !doc?.photo_url ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{icon}</div>
              <p style={{ fontWeight: 700 }}>Pas encore de contenu</p>
              {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Clique sur "Modifier" pour rédiger</p>}
            </div>
          ) : null}
        </div>
      </div>

      {editMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setEditMode(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px 20px', width: '100%', maxWidth: '480px', maxHeight: '80dvh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem' }}>{icon} {title}</h2>
              <button onClick={() => setEditMode(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.85rem' }}>Image (optionnel)</label>
            {photoPreview ? (
              <div style={{ marginBottom: 16 }}>
                <img src={photoPreview} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 180, objectFit: 'contain', background: '#f8f8f8', display: 'block' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <label style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg)', borderRadius: 10, border: '2px solid var(--border)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', color: 'var(--text2)' }}>
                    📷 Changer <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                  </label>
                  <button onClick={() => { setPhotoPreview(null); setEditPhoto(null) }} style={{ padding: '8px 12px', background: '#fff0f0', border: '2px solid #f5c6cb', borderRadius: 10, fontWeight: 700, fontSize: '0.78rem', color: '#e74c3c' }}>🗑</button>
                </div>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: '2px dashed var(--border)', borderRadius: 12, cursor: 'pointer', color: 'var(--text2)', background: 'var(--bg)', marginBottom: 16 }}>
                <span style={{ fontSize: '1.5rem' }}>📷</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Ajouter une image</span>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            )}

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.85rem' }}>Texte (optionnel)</label>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              placeholder={placeholder}
              style={{ width: '100%', minHeight: 120, padding: '14px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.9rem', lineHeight: 1.6, resize: 'vertical', background: 'var(--bg)', marginBottom: 16 }} />

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
              {saving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function JourneeType() {
  return <TextPage sectionId="journee_type" icon="🗓" title="Journée type" color="#0F6E56" bg="#E0FBF1" placeholder="Décris le déroulement type d'une journée : horaires, routines, temps forts..." />
}

export function Objectifs() {
  const { isAdmin } = useAuth()
  const [fichiers, setFichiers] = useState([])
  const [uploading, setUploading] = useState(false)
  const [doc, setDoc] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: docData } = await supabase.from('documents').select('*').eq('section_id', 'objectifs_session').maybeSingle()
    setDoc(docData)
    const { data: fichiersData } = await supabase.from('objectifs_fichiers').select('*').order('created_at', { ascending: false })
    setFichiers(fichiersData || [])
    setLoading(false)
  }

  async function uploadFichier(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      let url = null
      if (isImage) {
        const dataUrl = await resizeImage(file)
        const blob = await fetch(dataUrl).then(r => r.blob())
        const filename = `${Date.now()}_${file.name}`
        await supabase.storage.from('objectifs').upload(filename, blob)
        const { data } = supabase.storage.from('objectifs').getPublicUrl(filename)
        url = data.publicUrl
      } else {
        const filename = `${Date.now()}_${file.name}`
        await supabase.storage.from('objectifs').upload(filename, file)
        const { data } = supabase.storage.from('objectifs').getPublicUrl(filename)
        url = data.publicUrl
      }
      if (url) await supabase.from('objectifs_fichiers').insert([{ url, nom: file.name }])
    }
    setUploading(false)
    e.target.value = ''
    fetchAll()
  }

  async function deleteFichier(id, url) {
    if (!confirm('Supprimer ce fichier ?')) return
    const filename = url.split('/').pop()
    await supabase.storage.from('objectifs').remove([filename])
    await supabase.from('objectifs_fichiers').delete().eq('id', id)
    fetchAll()
  }

  async function saveDoc() {
    setSaving(true)
    if (doc) {
      await supabase.from('documents').update({ contenu: editContent, updated_at: new Date().toISOString() }).eq('id', doc.id)
    } else {
      await supabase.from('documents').insert([{ section_id: 'objectifs_session', contenu: editContent }])
    }
    setSaving(false)
    setEditMode(false)
    fetchAll()
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem' }}>🎯 Objectifs de la session</h1>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{ background: '#FFF3E0', border: '1.5px solid #FF9F43', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: '0.8rem', color: '#CC6600', cursor: 'pointer' }}>
              {uploading ? '⏳…' : '📎 Fichier'}
              <input type="file" accept="image/*,application/pdf" multiple onChange={uploadFichier} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-primary" onClick={() => { setEditContent(doc?.contenu || ''); setEditMode(true) }}>✏️ Texte</button>
          </div>
        )}
      </div>

      {/* Texte */}
      {doc?.contenu && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{doc.contenu}</div>
        </div>
      )}

      {/* Fichiers */}
      {fichiers.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {fichiers.map(f => {
            const isImage = !f.nom?.endsWith('.pdf')
            return (
              <div key={f.id} className="card" style={{ overflow: 'hidden' }}>
                {isImage && <img src={f.url} alt={f.nom} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', background: '#f8f8f8', display: 'block' }} />}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.3rem' }}>{isImage ? '🖼️' : '📄'}</span>
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nom?.replace(/^\d+_/, '')}</span>
                  <a href={f.url} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', borderRadius: 8, background: '#FFF3E0', color: '#CC6600', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>👁 Ouvrir</a>
                  {isAdmin && <button onClick={() => deleteFichier(f.id, f.url)} style={{ padding: '6px 10px', borderRadius: 8, background: '#fff0f0', border: '1.5px solid #f5c6cb', color: '#e74c3c', fontWeight: 700, fontSize: '0.78rem' }}>🗑</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!doc?.contenu && fichiers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎯</div>
          <p style={{ fontWeight: 700 }}>Pas encore de contenu</p>
          {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Ajoute du texte ou des fichiers</p>}
        </div>
      )}

      {editMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setEditMode(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px 20px', width: '100%', maxWidth: '480px', maxHeight: '80dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem' }}>🎯 Objectifs</h2>
              <button onClick={() => setEditMode(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              placeholder="Objectifs pédagogiques, thème, projets en cours..."
              style={{ flex: 1, width: '100%', padding: '14px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.9rem', lineHeight: 1.6, resize: 'none', background: 'var(--bg)' }} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: 12, opacity: saving ? 0.6 : 1 }} onClick={saveDoc} disabled={saving}>
              {saving ? '⏳…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default JourneeType
