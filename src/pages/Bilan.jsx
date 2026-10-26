import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { notifyTeam } from '../lib/notify'
import {
  SCORE_ITEMS,
  CHECK_ITEMS,
  emptyScores,
  emptyChecks,
  checksComplete,
  legacyFromStructured,
  scoreColor,
} from '../lib/bilan'
import { dismissBilanRappel } from '../lib/bilanRappel'

const TRANCHES = ['3-5 ans', '6-11 ans', 'Mixte']
const NOTES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function Bilan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [jour, setJour] = useState(new Date().toISOString().slice(0, 10))
  const [tranche, setTranche] = useState('3-5 ans')
  const [scores, setScores] = useState(emptyScores())
  const [checks, setChecks] = useState(emptyChecks())
  const [activites, setActivites] = useState('')
  const [notesDirecteur, setNotesDirecteur] = useState('')

  useEffect(() => { if (isEdit) fetchBilan() }, [id])

  async function fetchBilan() {
    setLoading(true)
    const { data } = await supabase.from('bilans').select('*').eq('id', id).single()
    if (data) {
      setNom(data.nom || '')
      setPrenom(data.prenom || '')
      setJour(data.jour || new Date().toISOString().slice(0, 10))
      setTranche(data.tranche_age || '3-5 ans')
      setActivites(data.activites_realisees || '')
      setNotesDirecteur(data.notes_directeur || '')
      if (data.scores && Object.keys(data.scores).length) {
        setScores({ ...emptyScores(), ...data.scores })
      } else {
        // Ancien format texte → tenter d'extraire une note
        setScores(emptyScores())
      }
      if (data.checks && Object.keys(data.checks).length) {
        setChecks({ ...emptyChecks(), ...data.checks })
      } else {
        // Migration douce depuis les anciennes colonnes
        setChecks({
          incident: { oui: !!data.incidents, comment: data.incidents || '' },
          materiel: { oui: !!data.materiel_manquant, comment: data.materiel_manquant || '' },
          surveiller: { oui: !!data.enfants_surveiller, comment: data.enfants_surveiller || '' },
          suggestion: { oui: !!data.suggestions_activites, comment: data.suggestions_activites || '' },
        })
      }
    }
    setLoading(false)
  }

  function setScore(key, n) {
    setScores(s => ({ ...s, [key]: n }))
  }

  function setCheck(key, patch) {
    setChecks(c => ({ ...c, [key]: { ...c[key], ...patch } }))
  }

  const activitesOk = activites.trim().length > 0
  const scoresOk = SCORE_ITEMS.every(i => typeof scores[i.key] === 'number')
  const checksOk = checksComplete(checks)
  const checksDone = CHECK_ITEMS.filter(i => typeof checks[i.key]?.oui === 'boolean').length
  const canSave = nom.trim() && prenom.trim() && activitesOk && scoresOk && checksOk && !saving

  async function save() {
    if (!canSave) return
    setSaving(true)
    const legacy = legacyFromStructured({ scores, checks, activites_realisees: activites })
    const payload = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      jour,
      tranche_age: tranche,
      scores,
      checks,
      activites_realisees: activites.trim(),
      ...legacy,
      ...(isEdit ? { notes_directeur: notesDirecteur } : {}),
    }
    if (isEdit) {
      await supabase.from('bilans').update(payload).eq('id', id)
    } else {
      await supabase.from('bilans').insert([payload])
      dismissBilanRappel()
      await notifyTeam({
        titre: `📋 Bilan — ${prenom.trim()} ${nom.trim()}`,
        message: `Notes ${scores.ambiance}/${scores.activites}/${scores.deroulement} · ${jour}`,
        type: 'info',
        lien: '/bilans',
      })
    }
    setSaving(false)
    navigate('/bilans')
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button type="button" onClick={() => navigate(-1)} style={backBtn}>←</button>
        <div>
          <h1 style={{ fontSize: '1.4rem' }}>{isEdit ? 'Modifier le bilan' : 'Bilan du jour'}</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: 2 }}>
            Activités + 3 notes + 4 cases · ~1 minute
          </p>
        </div>
      </div>

      {/* Infos */}
      <section className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, color: '#118AB2', marginBottom: 12 }}>👤 Toi & le groupe</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={lStyle}>Prénom *</label>
            <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Emma" style={iStyle} />
          </div>
          <div>
            <label style={lStyle}>Nom *</label>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" style={iStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lStyle}>Jour</label>
          <input type="date" value={jour} onChange={e => setJour(e.target.value)} style={iStyle} />
        </div>
        <label style={lStyle}>Tranche d'âge</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {TRANCHES.map(t => (
            <button key={t} type="button" onClick={() => setTranche(t)} style={{
              flex: 1, padding: '9px 4px', borderRadius: 10,
              border: `2px solid ${tranche === t ? '#118AB2' : 'var(--border)'}`,
              background: tranche === t ? '#E8F4FF' : 'white',
              fontWeight: 700, fontSize: '0.78rem',
              color: tranche === t ? '#118AB2' : 'var(--text)',
            }}>{t}</button>
          ))}
        </div>
      </section>

      {/* Activités — obligatoire, en premier */}
      <section className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, color: '#06D6A0', marginBottom: 6 }}>🧩 Activités réalisées *</div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 10 }}>Liste courte de ce qui a été fait aujourd’hui.</p>
        <textarea
          value={activites}
          onChange={e => setActivites(e.target.value)}
          placeholder="ex: parcours moteur, peinture, chasse au trésor…"
          rows={3}
          style={{
            ...iStyle,
            resize: 'vertical',
            borderColor: activitesOk ? 'var(--border)' : '#FFD4A8',
          }}
        />
      </section>

      {/* Notes /10 */}
      <section className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 600, color: '#FF6B35' }}>⭐ Notes sur 10</div>
          <span style={{ fontSize: '0.72rem', color: scoresOk ? '#0A7A5A' : 'var(--text2)', fontWeight: 700 }}>
            {SCORE_ITEMS.filter(i => scores[i.key] != null).length}/3
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 14 }}>
          Un tap par ligne — notes + cases obligatoires.
        </p>
        {SCORE_ITEMS.map(item => (
          <div key={item.key} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.icon} {item.label}</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: scoreColor(scores[item.key]), fontFamily: 'Fredoka' }}>
                {scores[item.key] != null ? scores[item.key] : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
              {NOTES.map(n => {
                const active = scores[item.key] === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScore(item.key, n)}
                    style={{
                      flex: 1, minWidth: 0, padding: '10px 0', borderRadius: 8,
                      border: `2px solid ${active ? scoreColor(n) : 'var(--border)'}`,
                      background: active ? scoreColor(n) : 'white',
                      color: active ? 'white' : 'var(--text2)',
                      fontWeight: 800, fontSize: '0.78rem',
                    }}
                  >{n}</button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Oui / Non */}
      <section className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 600, color: '#9B5DE5' }}>✅ Points à signaler</div>
          <span style={{ fontSize: '0.72rem', color: checksOk ? '#0A7A5A' : 'var(--text2)', fontWeight: 700 }}>
            {checksDone}/4
          </span>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 14 }}>
          Réponds Oui ou Non à chaque ligne. Si Oui, un commentaire s’ouvre.
        </p>
        {CHECK_ITEMS.map(item => {
          const val = checks[item.key] || { oui: null, comment: '' }
          const answered = typeof val.oui === 'boolean'
          return (
            <div key={item.key} style={{
              marginBottom: 12, padding: 12, borderRadius: 12,
              background: val.oui === true ? '#FFF9F0' : 'var(--bg)',
              border: `1.5px solid ${val.oui === true ? item.yesColor : (answered ? 'var(--border)' : '#FFD4A8')}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.icon} {item.label}</span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => setCheck(item.key, { oui: false, comment: '' })} style={ynBtn(val.oui === false, false)}>Non</button>
                  <button type="button" onClick={() => setCheck(item.key, { oui: true })} style={ynBtn(val.oui === true, true, item.yesColor)}>Oui</button>
                </div>
              </div>
              {val.oui === true && (
                <input
                  value={val.comment}
                  onChange={e => setCheck(item.key, { comment: e.target.value })}
                  placeholder={item.placeholder}
                  style={{ ...iStyle, marginTop: 10, background: 'white' }}
                  autoFocus
                />
              )}
            </div>
          )
        })}
      </section>

      {(!activitesOk || !scoresOk || !checksOk) && (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#CC6600', fontWeight: 700, marginBottom: 10 }}>
          Complete activités, notes et cases pour envoyer
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        style={{ width: '100%', padding: '15px', fontSize: '1rem', borderRadius: 14, opacity: canSave ? 1 : 0.5 }}
        onClick={save}
        disabled={!canSave}
      >
        {saving ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Envoyer le bilan')}
      </button>
    </div>
  )
}

function ynBtn(active, isYes, yesColor = '#CC3333') {
  return {
    padding: '8px 14px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: '0.8rem',
    border: `2px solid ${active ? (isYes ? yesColor : '#0A7A5A') : 'var(--border)'}`,
    background: active ? (isYes ? yesColor : '#0A7A5A') : 'white',
    color: active ? 'white' : 'var(--text2)',
  }
}

const backBtn = {
  width: 40, height: 40, borderRadius: 12, background: 'white',
  border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: '1.1rem',
}
const lStyle = { display: 'block', marginBottom: 5, fontWeight: 700, fontSize: '0.82rem' }
const iStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '2px solid var(--border)', fontSize: '0.88rem',
  background: 'var(--bg)', color: 'var(--text)', marginBottom: 0,
}
