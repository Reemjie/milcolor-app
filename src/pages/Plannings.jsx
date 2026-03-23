import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
const TRANCHES = ['Matin (9h-12h)', 'Repas (12h-14h)', 'Après-midi (14h-17h)']
const COLORS = ['#FF6B35', '#FFD166', '#06D6A0', '#118AB2', '#FF6B9D', '#9B5DE5']

export default function Plannings() {
  const { isAdmin } = useAuth()
  const [semaines, setSemaines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [activeSemaine, setActiveSemaine] = useState(0)
  const [form, setForm] = useState({ titre: '', date_debut: '', couleur: COLORS[0], slots: {} })

  useEffect(() => { fetchSemaines() }, [])

  async function fetchSemaines() {
    setLoading(true)
    const { data } = await supabase.from('plannings').select('*').order('date_debut', { ascending: false })
    setSemaines(data || [])
    setLoading(false)
  }

  async function saveSemaine() {
    const payload = {
      titre: form.titre,
      date_debut: form.date_debut,
      couleur: form.couleur,
      slots: form.slots,
    }
    if (editItem) {
      await supabase.from('plannings').update(payload).eq('id', editItem.id)
    } else {
      await supabase.from('plannings').insert([payload])
    }
    setShowForm(false)
    setEditItem(null)
    setForm({ titre: '', date_debut: '', couleur: COLORS[0], slots: {} })
    fetchSemaines()
  }

  async function deleteSemaine(id) {
    if (!confirm('Supprimer cette semaine ?')) return
    await supabase.from('plannings').delete().eq('id', id)
    fetchSemaines()
  }

  function openEdit(s) {
    setEditItem(s)
    setForm({ titre: s.titre, date_debut: s.date_debut, couleur: s.couleur, slots: s.slots || {} })
    setShowForm(true)
  }

  function setSlot(jour, tranche, value) {
    setForm(f => ({ ...f, slots: { ...f.slots, [`${jour}_${tranche}`]: value } }))
  }

  const sem = semaines[activeSemaine]

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--text)' }}>📅 Plannings</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>
            {semaines.length} semaine{semaines.length > 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ titre: '', date_debut: '', couleur: COLORS[0], slots: {} }); setShowForm(true) }}>
            + Semaine
          </button>
        )}
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
          {/* Week selector */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            {semaines.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSemaine(i)}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: `2px solid ${activeSemaine === i ? s.couleur : 'var(--border)'}`,
                  background: activeSemaine === i ? s.couleur : 'white',
                  color: activeSemaine === i ? 'white' : 'var(--text)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                }}
              >
                {s.titre}
              </button>
            ))}
          </div>

          {/* Active week grid */}
          {sem && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                background: sem.couleur,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ color: 'white', fontFamily: 'Fredoka', fontSize: '1.2rem' }}>{sem.titre}</div>
                  {sem.date_debut && (
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                      Semaine du {new Date(sem.date_debut).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(sem)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>✏️ Modifier</button>
                    <button onClick={() => deleteSemaine(sem.id)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>🗑</button>
                  </div>
                )}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.78rem', color: 'var(--text2)', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Créneau</th>
                      {JOURS.map(j => (
                        <th key={j} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text2)', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>{j}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TRANCHES.map((t, ti) => (
                      <tr key={t} style={{ background: ti % 2 === 0 ? 'white' : 'var(--bg)' }}>
                        <td style={{ padding: '10px 12px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{t}</td>
                        {JOURS.map(j => (
                          <td key={j} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                            {sem.slots?.[`${j}_${t}`] || <span style={{ color: 'var(--border)' }}>—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal form */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'flex-end',
        }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <div style={{
            background: 'white',
            borderRadius: '24px 24px 0 0',
            padding: '24px 20px',
            width: '100%',
            maxHeight: '90dvh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>{editItem ? 'Modifier' : 'Nouvelle'} semaine</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>

            <label style={labelStyle}>Titre de la semaine</label>
            <input value={form.titre} onChange={e => setForm(f => ({...f, titre: e.target.value}))} placeholder="ex: Semaine 1 — Printemps" style={inputStyle} />

            <label style={labelStyle}>Date de début</label>
            <input type="date" value={form.date_debut} onChange={e => setForm(f => ({...f, date_debut: e.target.value}))} style={inputStyle} />

            <label style={labelStyle}>Couleur</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({...f, couleur: c}))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.couleur === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>

            <label style={labelStyle}>Contenu du planning</label>
            {TRANCHES.map(t => (
              <div key={t} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>{t}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {JOURS.map(j => (
                    <div key={j}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text2)', textAlign: 'center', marginBottom: 3 }}>{j}</div>
                      <input
                        value={form.slots[`${j}_${t}`] || ''}
                        onChange={e => setSlot(j, t, e.target.value)}
                        placeholder="…"
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.78rem', marginBottom: 0, textAlign: 'center' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: 8 }}
              onClick={saveSemaine}
              disabled={!form.titre}
            >
              💾 Enregistrer
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
  marginBottom: 16, background: 'var(--bg)',
}
