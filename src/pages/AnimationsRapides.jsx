import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function AnimationsRapides() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [anims, setAnims] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', duree: '5 min', materiel: '', age: 'tous' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAnims() }, [])

  async function fetchAnims() {
    setLoading(true)
    const { data } = await supabase.from('animations_rapides').select('*').order('created_at', { ascending: false })
    setAnims(data || [])
    setLoading(false)
  }

  async function saveAnim() {
    if (!form.titre) return
    setSaving(true)
    await supabase.from('animations_rapides').insert([form])
    setSaving(false)
    setShowForm(false)
    setForm({ titre: '', description: '', duree: '5 min', materiel: '', age: 'tous' })
    fetchAnims()
  }

  async function deleteAnim(id) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('animations_rapides').delete().eq('id', id)
    fetchAnims()
  }

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>⚡ Animations rapides</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Idées express pour combler un creux</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Ajouter</button>}
      </div>

      {/* Sub-nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[{ to: '/session', label: '📋 Session' }, { to: '/banque', label: "🗂 Catalogue d'animations" }, { to: '/rapides', label: '⚡ Rapides', active: true }].map(item => (
          <button key={item.to} onClick={() => navigate(item.to)} style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, border: `2px solid ${item.active ? 'var(--orange)' : 'var(--border)'}`, background: item.active ? 'var(--orange)' : 'white', color: item.active ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.82rem' }}>{item.label}</button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && anims.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚡</div>
          <p style={{ fontWeight: 700 }}>Aucune animation rapide</p>
          {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Ajoute des idées express pour les moments creux !</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {anims.map(a => (
          <div key={a.id} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.titre}</span>
                  <span className="tag" style={{ background: '#FFF3E0', color: '#CC6600' }}>⏱ {a.duree}</span>
                  {a.age !== 'tous' && <span className="tag" style={{ background: '#f0edf8', color: '#764ba2' }}>{a.age}</span>}
                </div>
                {a.description && <p style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5, marginBottom: a.materiel ? 6 : 0 }}>{a.description}</p>}
                {a.materiel && <p style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>📦 {a.materiel}</p>}
              </div>
              {isAdmin && <button onClick={() => deleteAnim(a.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '1rem', flexShrink: 0 }}>🗑</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px 20px', width: '100%', maxWidth: '480px', maxHeight: '80dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>⚡ Nouvelle animation rapide</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            {[
              { label: 'Titre *', key: 'titre', placeholder: 'ex: 1,2,3 soleil' },
              { label: 'Description', key: 'description', placeholder: 'Comment ça marche…', multiline: true },
              { label: 'Durée', key: 'duree', placeholder: 'ex: 5 min' },
              { label: 'Matériel (optionnel)', key: 'materiel', placeholder: 'ex: aucun' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>{f.label}</label>
                {f.multiline
                  ? <textarea value={form[f.key]} onChange={e => setForm(x => ({...x, [f.key]: e.target.value}))} placeholder={f.placeholder} rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', resize: 'vertical' }} />
                  : <input value={form[f.key]} onChange={e => setForm(x => ({...x, [f.key]: e.target.value}))} placeholder={f.placeholder} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)' }} />
                }
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Âge</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['tous', '3-5 ans', '6-11 ans'].map(a => (
                  <button key={a} onClick={() => setForm(f => ({...f, age: a}))} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.age === a ? 'var(--orange)' : 'var(--border)'}`, background: form.age === a ? 'rgba(255,107,53,0.08)' : 'white', fontWeight: 700, fontSize: '0.82rem', color: form.age === a ? 'var(--orange)' : 'var(--text)' }}>{a}</button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.titre || saving) ? 0.6 : 1 }} onClick={saveAnim} disabled={!form.titre || saving}>
              {saving ? '⏳…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
