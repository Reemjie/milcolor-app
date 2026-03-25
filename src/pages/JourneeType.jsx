import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

function TextPage({ sectionId, icon, title, color, bg, placeholder }) {
  const { isAdmin } = useAuth()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchDoc() }, [sectionId])

  async function fetchDoc() {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*').eq('section_id', sectionId).maybeSingle()
    setDoc(data)
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    if (doc) {
      await supabase.from('documents').update({ contenu: editContent, updated_at: new Date().toISOString() }).eq('id', doc.id)
    } else {
      await supabase.from('documents').insert([{ section_id: sectionId, contenu: editContent }])
    }
    setSaving(false)
    setEditMode(false)
    fetchDoc()
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem' }}>{icon} {title}</h1>
        {isAdmin && <button className="btn btn-primary" onClick={() => { setEditContent(doc?.contenu || ''); setEditMode(true) }}>✏️ Modifier</button>}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ background: bg, padding: '14px 20px', borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', fontWeight: 600, color }}>{icon} {title}</span>
        </div>
        <div style={{ padding: '20px' }}>
          {doc?.contenu ? (
            <div style={{ fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{doc.contenu}</div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{icon}</div>
              <p style={{ fontWeight: 700 }}>Pas encore de contenu</p>
              {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Clique sur "Modifier" pour rédiger cette section</p>}
            </div>
          )}
        </div>
      </div>

      {editMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && setEditMode(false)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px', width: '100%', height: '90dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem' }}>{icon} {title}</h2>
              <button onClick={() => setEditMode(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder={placeholder} style={{ flex: 1, width: '100%', padding: '14px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.9rem', lineHeight: 1.6, resize: 'none', background: 'var(--bg)' }} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: 12, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
              {saving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function JourneeType() {
  return <TextPage sectionId="journee_type" icon="🗓" title="Journée type" color="#0F6E56" bg="#E0FBF1" placeholder="Décris ici le déroulement type d'une journée : horaires, routines, temps forts..." />
}

export function Objectifs() {
  return <TextPage sectionId="objectifs_session" icon="🎯" title="Objectifs de la session" color="#CC6600" bg="#FFF3E0" placeholder="Objectifs pédagogiques de cette session, thème, projets en cours, points d'attention..." />
}

export default JourneeType
