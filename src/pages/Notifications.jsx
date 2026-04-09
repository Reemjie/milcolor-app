import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function Notifications() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', message: '', type: 'info' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { 
    fetchNotifs()
    return () => { markAllRead() }
  }, [])

  async function fetchNotifs() {
    setLoading(true)
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
    setNotifs(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ lue: true }).eq('lue', false)
  }

  async function saveNotif() {
    if (!form.titre) return
    setSaving(true)
    await supabase.from('notifications').insert([{ ...form, lue: false }])
    setSaving(false)
    setShowForm(false)
    setForm({ titre: '', message: '', type: 'info' })
    fetchNotifs()
  }

  async function deleteNotif(id) {
    await supabase.from('notifications').delete().eq('id', id)
    fetchNotifs()
  }

  const TYPES = {
    info: { icon: '🔔', bg: '#E8F4FF', color: '#118AB2', label: 'Info' },
    urgent: { icon: '🚨', bg: '#FFE8E8', color: '#CC3333', label: 'Urgent' },
    planning: { icon: '📅', bg: '#E0FBF1', color: '#0A7A5A', label: 'Planning' },
  }

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🔔 Notifications</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Messages du directeur</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Envoyer</button>}
      </div>

      {loading && <div className="spinner" />}

      {!loading && notifs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔔</div>
          <p style={{ fontWeight: 700 }}>Aucune notification</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {notifs.map(n => {
          const t = TYPES[n.type] || TYPES.info
          return (
            <div key={n.id} onClick={() => n.lien && navigate(n.lien)} style={{ background: n.lue ? 'white' : t.bg, border: `2px solid ${n.lue ? 'var(--border)' : t.color}`, borderRadius: 14, padding: '14px 16px', cursor: n.lien ? 'pointer' : 'default' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{n.titre}</div>
                    {n.message && <p style={{ fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.5 }}>{n.message}</p>}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: 6 }}>
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                {isAdmin && <button onClick={() => deleteNotif(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, flexShrink: 0 }}>🗑</button>}
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px 20px', width: '100%', maxHeight: '80dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>🔔 Nouvelle notification</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <label style={lStyle}>Type</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {Object.entries(TYPES).map(([key, t]) => (
                <button key={key} onClick={() => setForm(f => ({...f, type: key}))} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${form.type === key ? t.color : 'var(--border)'}`, background: form.type === key ? t.bg : 'white', fontWeight: 700, fontSize: '0.78rem', color: form.type === key ? t.color : 'var(--text)' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <label style={lStyle}>Titre *</label>
            <input value={form.titre} onChange={e => setForm(f=>({...f,titre:e.target.value}))} placeholder="ex: Planning modifié" style={iStyle} />
            <label style={lStyle}>Message (optionnel)</label>
            <textarea value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} placeholder="Détails supplémentaires…" rows={3} style={{...iStyle, resize: 'vertical'}} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.titre || saving) ? 0.6 : 1 }} onClick={saveNotif} disabled={!form.titre || saving}>
              {saving ? '⏳ Envoi…' : '📤 Envoyer à tous'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)', marginBottom: 16 }
