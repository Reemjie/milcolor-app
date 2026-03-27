import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function resizeImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        const attempts = [{ maxW: 1400, q: 0.85 }, { maxW: 1000, q: 0.75 }, { maxW: 700, q: 0.65 }]
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

export default function GrandsJeux() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [fileType, setFileType] = useState(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase.from('grands_jeux').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  async function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type === 'application/pdf') {
      setFileType('pdf')
      setPreview(null)
    } else if (f.type.startsWith('image/')) {
      setFileType('image')
      const dataUrl = await resizeImage(f)
      setPreview(dataUrl)
    }
  }

  async function upload() {
    if (!titre || !file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}_${titre.replace(/\s+/g, '_')}.${ext}`
    const { error } = await supabase.storage.from('grands-jeux').upload(filename, file)
    if (error) { setUploading(false); alert('Erreur upload'); return }
    const { data: urlData } = supabase.storage.from('grands-jeux').getPublicUrl(filename)
    await supabase.from('grands_jeux').insert([{ titre, type: fileType, url: urlData.publicUrl }])
    setUploading(false)
    setShowForm(false)
    setTitre('')
    setFile(null)
    setPreview(null)
    setFileType(null)
    fetchItems()
  }

  async function deleteItem(id, url) {
    if (!confirm('Supprimer ?')) return
    const filename = url.split('/').pop()
    await supabase.storage.from('grands-jeux').remove([filename])
    await supabase.from('grands_jeux').delete().eq('id', id)
    fetchItems()
  }

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🎪 Grands jeux</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Fiches et ressources</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Ajouter</button>}
      </div>

      {loading && <div className="spinner" />}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎪</div>
          <p style={{ fontWeight: 700 }}>Aucun grand jeu</p>
          {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Clique sur "+ Ajouter" pour uploader une fiche</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div key={item.id} className="card" style={{ overflow: 'hidden' }}>
            {item.type === 'image' && (
              <img src={item.url} alt={item.titre} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: item.type === 'pdf' ? '#f0edf8' : '#E0FBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {item.type === 'pdf' ? '📄' : '🖼️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.titre}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: 2 }}>
                  {new Date(item.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', borderRadius: 8, background: '#9B5DE5', color: 'white', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>👁 Ouvrir</a>
                {isAdmin && <button onClick={() => deleteItem(item.id, item.url)} style={{ padding: '7px 10px', borderRadius: 8, background: '#fff0f0', border: '1.5px solid #f5c6cb', color: '#e74c3c', fontWeight: 700, fontSize: '0.78rem' }}>🗑</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>🎪 Nouveau grand jeu</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <label style={lStyle}>Titre *</label>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="ex: La grande chasse au trésor" style={iStyle} />
            <label style={lStyle}>Fichier (PDF ou image) *</label>
            {preview ? (
              <div style={{ marginBottom: 16 }}>
                <img src={preview} alt="" style={{ width: '100%', borderRadius: 12, maxHeight: 200, objectFit: 'contain', background: '#f8f8f8' }} />
                <button onClick={() => { setFile(null); setPreview(null); setFileType(null) }} style={{ marginTop: 8, width: '100%', padding: '8px', background: '#fff0f0', border: '1.5px solid #f5c6cb', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem', color: '#e74c3c' }}>🗑 Changer</button>
              </div>
            ) : file && fileType === 'pdf' ? (
              <div style={{ marginBottom: 16, padding: '14px', background: '#f0edf8', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.5rem' }}>📄</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                <button onClick={() => { setFile(null); setFileType(null) }} style={{ background: 'none', border: 'none', color: '#e74c3c', fontWeight: 700 }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '28px 20px', border: '2px dashed var(--border)', borderRadius: 14, cursor: 'pointer', color: 'var(--text2)', background: 'var(--bg)', marginBottom: 16 }}>
                <span style={{ fontSize: '2rem' }}>📎</span>
                <span style={{ fontWeight: 700 }}>Uploader un PDF ou une image</span>
                <input type="file" accept="application/pdf,image/*" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            )}
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!titre || !file || uploading) ? 0.6 : 1 }}
              onClick={upload} disabled={!titre || !file || uploading}>
              {uploading ? '⏳ Upload en cours…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)', marginBottom: 16 }
