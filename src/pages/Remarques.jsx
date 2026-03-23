import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { id: 'remarque', label: '💬 Remarque', color: '#118AB2', bg: '#E8F4FF' },
  { id: 'bilan', label: '📊 Bilan', color: '#06D6A0', bg: '#E0FBF1' },
  { id: 'urgent', label: '🚨 Urgent', color: '#FF4444', bg: '#FFE8E8' },
  { id: 'idee', label: '💡 Idée', color: '#FFD166', bg: '#FFF8E0' },
]

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function Remarques() {
  const { isAdmin } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({ auteur: '', contenu: '', categorie: 'remarque', date_journee: new Date().toISOString().slice(0,10) })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchNotes() }, [])

  async function fetchNotes() {
    setLoading(true)
    const { data } = await supabase.from('remarques').select('*').order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  async function saveNote() {
    if (!form.auteur || !form.contenu) return
    setSaving(true)
    await supabase.from('remarques').insert([{
      auteur: form.auteur.trim(),
      contenu: form.contenu.trim(),
      categorie: form.categorie,
      date_journee: form.date_journee,
    }])
    setSaving(false)
    setShowForm(false)
    setForm({ auteur: '', contenu: '', categorie: 'remarque', date_journee: new Date().toISOString().slice(0,10) })
    fetchNotes()
  }

  async function deleteNote(id) {
    if (!confirm('Supprimer cette remarque ?')) return
    await supabase.from('remarques').delete().eq('id', id)
    fetchNotes()
  }

  const filtered = filterCat === 'all' ? notes : notes.filter(n => n.categorie === filterCat)

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>💬 Remarques</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>
            Notes de journée & bilans
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Note
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
        <button onClick={() => setFilterCat('all')} style={{
          flexShrink: 0, padding: '6px 14px', borderRadius: 20,
          border: `2px solid ${filterCat === 'all' ? 'var(--orange)' : 'var(--border)'}`,
          background: filterCat === 'all' ? 'var(--orange)' : 'white',
          color: filterCat === 'all' ? 'white' : 'var(--text)',
          fontWeight: 700, fontSize: '0.78rem',
        }}>Tout</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setFilterCat(c.id)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${filterCat === c.id ? c.color : 'var(--border)'}`,
            background: filterCat === c.id ? c.color : 'white',
            color: filterCat === c.id ? 'white' : 'var(--text)',
            fontWeight: 700, fontSize: '0.78rem',
          }}>{c.label}</button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>💬</div>
          <p style={{ fontWeight: 700 }}>Aucune remarque</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Ajoute la première note de la journée !</p>
        </div>
      )}

      {/* Notes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(n => {
          const cat = CATEGORIES.find(c => c.id === n.categorie) || CATEGORIES[0]
          return (
            <div key={n.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="tag" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                  {n.date_journee && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600 }}>
                      {new Date(n.date_journee + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteNote(n.id)} style={{
                    background: 'none', border: 'none', color: 'var(--text2)',
                    fontSize: '0.9rem', opacity: 0.5,
                  }}>🗑</button>
                )}
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: 8 }}>{n.contenu}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'var(--orange)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white', fontSize: '0.65rem', fontWeight: 700,
                }}>
                  {n.auteur?.charAt(0)?.toUpperCase()}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{n.auteur}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text2)', marginLeft: 'auto' }}>{timeAgo(n.created_at)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          display: 'flex', alignItems: 'flex-end',
        }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: 'white', borderRadius: '24px 24px 0 0',
            padding: '24px 20px', width: '100%', maxHeight: '90dvh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>Nouvelle note</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>

            <label style={labelStyle}>Catégorie</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setForm(f=>({...f, categorie: c.id}))} style={{
                  padding: '10px', borderRadius: 10,
                  border: `2px solid ${form.categorie === c.id ? c.color : 'var(--border)'}`,
                  background: form.categorie === c.id ? c.bg : 'white',
                  fontWeight: 700, fontSize: '0.85rem',
                  color: form.categorie === c.id ? c.color : 'var(--text)',
                }}>
                  {c.label}
                </button>
              ))}
            </div>

            <label style={labelStyle}>Ton prénom</label>
            <input value={form.auteur} onChange={e => setForm(f=>({...f, auteur: e.target.value}))}
              placeholder="ex: Emma" style={inputStyle} />

            <label style={labelStyle}>Date de la journée</label>
            <input type="date" value={form.date_journee} onChange={e => setForm(f=>({...f, date_journee: e.target.value}))}
              style={inputStyle} />

            <label style={labelStyle}>Note / Remarque</label>
            <textarea value={form.contenu} onChange={e => setForm(f=>({...f, contenu: e.target.value}))}
              placeholder="Écris ta note ici…" rows={4}
              style={{ ...inputStyle, resize: 'vertical' }} />

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', opacity: (!form.auteur || !form.contenu || saving) ? 0.6 : 1 }}
              onClick={saveNote}
              disabled={!form.auteur || !form.contenu || saving}
            >
              {saving ? '⏳ Envoi…' : '📤 Publier la note'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '2px solid var(--border)', fontSize: '0.9rem',
  background: 'var(--bg)', color: 'var(--text)', marginBottom: 16,
}
