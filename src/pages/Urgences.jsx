import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const DEFAULT_URGENCES = [
  { titre: 'SAMU', numero: '15', couleur: '#CC3333' },
  { titre: 'Police / Gendarmerie', numero: '17', couleur: '#CC3333' },
  { titre: 'Pompiers', numero: '18', couleur: '#CC3333' },
  { titre: 'Urgences européen', numero: '112', couleur: '#CC3333' },
]

export default function Urgences() {
  const { isAdmin } = useAuth()
  const [doc, setDoc] = useState(null)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editContacts, setEditContacts] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: docData } = await supabase.from('documents').select('*').eq('section_id', 'urgences').single()
    setDoc(docData)
    const { data: contactsData } = await supabase.from('contacts_urgence').select('*').order('ordre')
    setContacts(contactsData || [])
    setLoading(false)
  }

  async function saveData() {
    setSaving(true)
    if (doc) {
      await supabase.from('documents').update({ contenu: editContent, updated_at: new Date().toISOString() }).eq('id', doc.id)
    } else {
      await supabase.from('documents').insert([{ section_id: 'urgences', contenu: editContent }])
    }
    await supabase.from('contacts_urgence').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (editContacts.length > 0) {
      await supabase.from('contacts_urgence').insert(editContacts.map((c, i) => ({ ...c, ordre: i })))
    }
    setSaving(false)
    setEditMode(false)
    fetchData()
  }

  function startEdit() {
    setEditContent(doc?.contenu || '')
    setEditContacts(contacts.length > 0 ? [...contacts] : DEFAULT_URGENCES.map((c, i) => ({ ...c, ordre: i })))
    setEditMode(true)
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🚨 Sécurité & urgences</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Numéros et procédures</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={startEdit}>✏️ Modifier</button>}
      </div>

      {/* Numéros d'urgence */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text2)', fontWeight: 700 }}>📞 Numéros d'urgence</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(contacts.length > 0 ? contacts : DEFAULT_URGENCES).map((c, i) => (
            <a key={i} href={`tel:${c.numero}`} style={{
              background: '#FFE8E8', border: '2px solid #FF6B6B',
              borderRadius: 14, padding: '14px', textDecoration: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: '2rem' }}>📞</span>
              <span style={{ fontWeight: 700, fontSize: '1.4rem', color: '#CC3333' }}>{c.numero}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CC3333', textAlign: 'center' }}>{c.titre}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Procédures */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ background: '#FFE8E8', padding: '14px 20px', borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', fontWeight: 600, color: '#CC3333' }}>📋 Procédures & informations</span>
        </div>
        <div style={{ padding: '20px' }}>
          {doc?.contenu ? (
            <div style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{doc.contenu}</div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text2)' }}>
              <p style={{ fontWeight: 700 }}>Pas encore de procédures renseignées</p>
              {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Clique sur "Modifier" pour ajouter les procédures d'urgence</p>}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && setEditMode(false)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px', width: '100%', height: '92dvh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem' }}>🚨 Modifier urgences</h2>
              <button onClick={() => setEditMode(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>

            <label style={lStyle}>Contacts d'urgence</label>
            {editContacts.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={c.titre} onChange={e => setEditContacts(cs => cs.map((x, j) => j === i ? {...x, titre: e.target.value} : x))} placeholder="Nom" style={{ flex: 2, padding: '10px 12px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.85rem', background: 'var(--bg)' }} />
                <input value={c.numero} onChange={e => setEditContacts(cs => cs.map((x, j) => j === i ? {...x, numero: e.target.value} : x))} placeholder="Numéro" style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.85rem', background: 'var(--bg)' }} />
                <button onClick={() => setEditContacts(cs => cs.filter((_, j) => j !== i))} style={{ background: '#fff0f0', border: '1.5px solid #f5c6cb', borderRadius: 10, padding: '0 10px', color: '#e74c3c', fontWeight: 700 }}>✕</button>
              </div>
            ))}
            <button onClick={() => setEditContacts(cs => [...cs, { titre: '', numero: '', couleur: '#CC3333' }])} style={{ background: 'var(--bg)', border: '2px dashed var(--border)', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 16 }}>+ Ajouter un contact</button>

            <label style={lStyle}>Procédures & informations</label>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Procédures d'urgence, point de rassemblement, trousse de secours, responsable..." rows={8} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.9rem', lineHeight: 1.6, resize: 'none', background: 'var(--bg)', marginBottom: 16 }} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: saving ? 0.6 : 1 }} onClick={saveData} disabled={saving}>
              {saving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.85rem' }
