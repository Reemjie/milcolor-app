import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const SECTIONS = [
  {
    id: 'activites', icon: '🧩', label: 'Activités du jour', color: '#9B5DE5', bg: '#f0edf8',
    fields: [
      { key: 'activites_realisees', label: 'Activités réalisées', placeholder: 'Liste les activités faites aujourd\'hui…', multiline: true },
      { key: 'activites_appreciees', label: 'Appréciées / moins bien passées', placeholder: 'Ce qui a bien marché, ce qui a moins bien fonctionné…', multiline: true },
      { key: 'materiel_manquant', label: 'Matériel manquant ?', placeholder: 'Si oui, lequel…', multiline: false },
    ]
  },
  {
    id: 'incidents', icon: '⚠️', label: 'Problèmes / incidents', color: '#CC3333', bg: '#FFE8E8',
    fields: [
      { key: 'difficultes', label: 'Difficultés rencontrées', placeholder: 'Comportement, météo, logistique…', multiline: true },
      { key: 'incidents', label: 'Incidents particuliers', placeholder: 'Blessures, conflits, situations à signaler…', multiline: true },
    ]
  },
  {
    id: 'groupe', icon: '😊', label: 'Vie du groupe', color: '#06D6A0', bg: '#E0FBF1',
    fields: [
      { key: 'ambiance', label: 'Ambiance générale du groupe', placeholder: 'Comment s\'est passée la journée globalement…', multiline: true },
      { key: 'enfants_surveiller', label: 'Enfants à surveiller / remarques spécifiques', placeholder: 'Comportements particuliers, enfants à l\'œil…', multiline: true },
    ]
  },
  {
    id: 'suggestions', icon: '💡', label: 'Suggestions / idées', color: '#FF9F43', bg: '#FFF3E0',
    fields: [
      { key: 'suggestions_activites', label: 'Propositions d\'activités pour les prochains jours', placeholder: 'Projets d\'enfants entendus ou demandés…', multiline: true },
      { key: 'autres_remarques', label: 'Autres remarques utiles', placeholder: 'Tout ce qui mérite d\'être transmis…', multiline: true },
    ]
  },
]

const TRANCHES = ['3-5 ans', '6-11 ans', 'Mixte']

export default function Bilan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const isEdit = !!id
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', jour: new Date().toISOString().slice(0, 10), tranche_age: '3-5 ans',
    activites_realisees: '', activites_appreciees: '', materiel_manquant: '',
    difficultes: '', incidents: '', ambiance: '', enfants_surveiller: '',
    suggestions_activites: '', autres_remarques: '',
  })

  useEffect(() => { if (isEdit) fetchBilan() }, [id])

  async function fetchBilan() {
    setLoading(true)
    const { data } = await supabase.from('bilans').select('*').eq('id', id).single()
    if (data) setForm(data)
    setLoading(false)
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function save() {
    if (!form.nom || !form.prenom) return
    setSaving(true)
    if (isEdit) {
      await supabase.from('bilans').update(form).eq('id', id)
    } else {
      await supabase.from('bilans').insert([form])
    await supabase.from('notifications').insert([{ titre: `📋 Bilan — ${form.prenom} ${form.nom}`, message: `Bilan du ${form.jour} soumis`, type: 'info', lue: false, lien: '/bilans' }])
    }
    setSaving(false)
    navigate('/chat')
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ width: 40, height: 40, borderRadius: 12, background: 'white', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>←</button>
        <div>
          <h1 style={{ fontSize: '1.4rem' }}>📋 {isEdit ? 'Modifier le' : 'Nouveau'} bilan</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: 2 }}>Bilan de fin de journée</p>
        </div>
      </div>

      {/* Infos générales */}
      <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: '1.2rem' }}>👤</span>
          <span style={{ fontFamily: 'Fredoka', fontSize: '1rem', fontWeight: 600, color: '#118AB2' }}>Informations</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lStyle}>Nom *</label>
            <input value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Dupont" style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Prénom *</label>
            <input value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Emma" style={iStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lStyle}>Jour</label>
          <input type="date" value={form.jour} onChange={e => set('jour', e.target.value)} style={iStyle} />
        </div>
        <div>
          <label style={lStyle}>Tranche d'âge</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TRANCHES.map(t => (
              <button key={t} onClick={() => set('tranche_age', t)} style={{
                flex: 1, padding: '9px 4px', borderRadius: 10,
                border: `2px solid ${form.tranche_age === t ? '#118AB2' : 'var(--border)'}`,
                background: form.tranche_age === t ? '#E8F4FF' : 'white',
                fontWeight: 700, fontSize: '0.78rem',
                color: form.tranche_age === t ? '#118AB2' : 'var(--text)',
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(section => (
        <div key={section.id} className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ background: section.bg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
            <span style={{ fontFamily: 'Fredoka', fontSize: '1rem', fontWeight: 600, color: section.color }}>{section.label}</span>
          </div>
          <div style={{ padding: '14px 16px' }}>
            {section.fields.map(field => (
              <div key={field.key} style={{ marginBottom: 12 }}>
                <label style={lStyle}>{field.label}</label>
                {field.multiline ? (
                  <textarea
                    value={form[field.key]}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{ ...iStyle, resize: 'vertical', marginBottom: 0 }}
                  />
                ) : (
                  <input
                    value={form[field.key]}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    style={{ ...iStyle, marginBottom: 0 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '15px', fontSize: '1rem', borderRadius: 14, opacity: (!form.nom || !form.prenom || saving) ? 0.5 : 1 }}
        onClick={save}
        disabled={!form.nom || !form.prenom || saving}
      >
        {saving ? '⏳ Enregistrement…' : `💾 ${isEdit ? 'Enregistrer' : 'Soumettre le bilan'}`}
      </button>
    </div>
  )
}

const lStyle = { display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem' }
const iStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.88rem', background: 'var(--bg)', color: 'var(--text)', marginBottom: 0 }
