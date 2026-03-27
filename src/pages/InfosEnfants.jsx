import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const TYPES = [
  { id: 'allergie', icon: '🚨', label: 'Allergie', color: '#CC3333', bg: '#FFE8E8', border: '#FF6B6B' },
  { id: 'pai', icon: '📋', label: 'PAI', color: '#CC6600', bg: '#FFF3E0', border: '#FF9F43' },
  { id: 'regime', icon: '🥗', label: 'Régime alimentaire', color: '#0A7A5A', bg: '#E0FBF1', border: '#06D6A0' },
  { id: 'autre', icon: 'ℹ️', label: 'Autre info', color: '#118AB2', bg: '#E8F4FF', border: '#74B9FF' },
]

const TRANCHES = ['3-5 ans', '6-11 ans', 'tous']

export default function InfosEnfants() {
  const { isAdmin } = useAuth()
  const [infos, setInfos] = useState([])
  const [effectif, setEffectif] = useState({ nb_35: 0, nb_611: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [form, setForm] = useState({ type: 'allergie', nom: '', detail: '', tranche_age: '3-5 ans' })
  const [saving, setSaving] = useState(false)
  const [editEffectif, setEditEffectif] = useState(false)
  const [effForm, setEffForm] = useState({ nb_35: 0, nb_611: 0 })
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: infosData } = await supabase.from('infos_enfants').select('*').order('type').order('nom')
    setInfos(infosData || [])
    const { data: effData } = await supabase.from('effectifs').select('*').eq('jour', today).maybeSingle()
    if (effData) setEffectif(effData)
    setLoading(false)
  }

  async function saveInfo() {
    if (!form.nom) return
    setSaving(true)
    await supabase.from('infos_enfants').insert([form])
    setSaving(false)
    setShowForm(false)
    setForm({ type: 'allergie', nom: '', detail: '', tranche_age: '3-5 ans' })
    fetchData()
  }

  async function deleteInfo(id) {
    if (!confirm('Supprimer ?')) return
    await supabase.from('infos_enfants').delete().eq('id', id)
    fetchData()
  }

  async function saveEffectif() {
    const { data: existing } = await supabase.from('effectifs').select('id').eq('jour', today).maybeSingle()
    if (existing) {
      await supabase.from('effectifs').update({ nb_35: effForm.nb_35, nb_611: effForm.nb_611 }).eq('id', existing.id)
    } else {
      await supabase.from('effectifs').insert([{ jour: today, nb_35: effForm.nb_35, nb_611: effForm.nb_611 }])
    }
    setEditEffectif(false)
    fetchData()
  }

  const filtered = filterType === 'all' ? infos : infos.filter(i => i.type === filterType)
  const total = (effectif.nb_35 || 0) + (effectif.nb_611 || 0)

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>👶 Infos enfants</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Allergies, PAI, régimes</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Ajouter</button>}
      </div>

      {/* Effectif du jour */}
      <div style={{ background: 'white', borderRadius: 16, padding: '16px', marginBottom: 20, boxShadow: 'var(--shadow)', border: '2px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', fontWeight: 600 }}>📊 Effectif du jour</span>
          {isAdmin && (
            <button onClick={() => { setEffForm({ nb_35: effectif.nb_35 || 0, nb_611: effectif.nb_611 || 0 }); setEditEffectif(true) }}
              style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text2)' }}>
              ✏️ Modifier
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: '3-5 ans', value: effectif.nb_35 || 0, color: '#FF6B9D', bg: '#FBEAF0' },
            { label: '6-11 ans', value: effectif.nb_611 || 0, color: '#9B5DE5', bg: '#f0edf8' },
            { label: 'Total', value: total, color: 'var(--orange)', bg: '#FFF3EC' },
          ].map(e => (
            <div key={e.label} style={{ background: e.bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: e.color, fontFamily: 'Fredoka' }}>{e.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: e.color }}>{e.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
        <button onClick={() => setFilterType('all')} style={{
          flexShrink: 0, padding: '6px 14px', borderRadius: 20,
          border: `2px solid ${filterType === 'all' ? 'var(--orange)' : 'var(--border)'}`,
          background: filterType === 'all' ? 'var(--orange)' : 'white',
          color: filterType === 'all' ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.78rem',
        }}>Tout ({infos.length})</button>
        {TYPES.map(t => (
          <button key={t.id} onClick={() => setFilterType(t.id)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${filterType === t.id ? t.border : 'var(--border)'}`,
            background: filterType === t.id ? t.bg : 'white',
            color: filterType === t.id ? t.color : 'var(--text)', fontWeight: 700, fontSize: '0.78rem',
          }}>{t.icon} {t.label} ({infos.filter(i => i.type === t.id).length})</button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>👶</div>
          <p style={{ fontWeight: 700 }}>Aucune info renseignée</p>
          {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Clique sur "+ Ajouter" pour commencer</p>}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(info => {
          const t = TYPES.find(x => x.id === info.type) || TYPES[3]
          return (
            <div key={info.id} style={{ background: t.bg, border: `2px solid ${t.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: t.color }}>{info.nom}</span>
                    <span className="tag" style={{ background: 'white', color: t.color, fontSize: '0.65rem' }}>{info.tranche_age}</span>
                  </div>
                  {info.detail && <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text)' }}>{info.detail}</p>}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteInfo(info.id)} style={{ background: 'none', border: 'none', color: t.color, opacity: 0.5, fontSize: '1rem', flexShrink: 0 }}>🗑</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal effectif */}
      {editEffectif && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setEditEffectif(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.2rem' }}>📊 Effectif du jour</h2>
              <button onClick={() => setEditEffectif(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            {[{ key: 'nb_35', label: '3-5 ans' }, { key: 'nb_611', label: '6-11 ans' }].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.9rem' }}>{f.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setEffForm(x => ({ ...x, [f.key]: Math.max(0, x[f.key] - 1) }))}
                    style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '1.3rem', fontWeight: 700 }}>−</button>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Fredoka' }}>{effForm[f.key]}</span>
                  <button onClick={() => setEffForm(x => ({ ...x, [f.key]: x[f.key] + 1 }))}
                    style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--orange)', border: 'none', color: 'white', fontSize: '1.3rem', fontWeight: 700 }}>+</button>
                </div>
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: 8 }} onClick={saveEffectif}>
              💾 Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* Modal ajout info */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>👶 Nouvelle info</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>

            <label style={lStyle}>Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, type: t.id }))} style={{
                  padding: '10px 8px', borderRadius: 10,
                  border: `2px solid ${form.type === t.id ? t.border : 'var(--border)'}`,
                  background: form.type === t.id ? t.bg : 'white',
                  fontWeight: 700, fontSize: '0.82rem', color: form.type === t.id ? t.color : 'var(--text)',
                }}>{t.icon} {t.label}</button>
              ))}
            </div>

            <label style={lStyle}>Nom de l'enfant *</label>
            <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="ex: Léa M." style={iStyle} />

            <label style={lStyle}>Tranche d'âge</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {TRANCHES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, tranche_age: t }))} style={{
                  flex: 1, padding: '10px 6px', borderRadius: 10,
                  border: `2px solid ${form.tranche_age === t ? 'var(--orange)' : 'var(--border)'}`,
                  background: form.tranche_age === t ? 'rgba(255,107,53,0.08)' : 'white',
                  fontWeight: 700, fontSize: '0.78rem', color: form.tranche_age === t ? 'var(--orange)' : 'var(--text)',
                }}>{t}</button>
              ))}
            </div>

            <label style={lStyle}>Détails</label>
            <textarea value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
              placeholder="ex: Allergie aux arachides — épipen dans le sac rouge..." rows={3}
              style={{ ...iStyle, resize: 'vertical' }} />

            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.nom || saving) ? 0.6 : 1 }}
              onClick={saveInfo} disabled={!form.nom || saving}>
              {saving ? '⏳…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)', marginBottom: 16 }
