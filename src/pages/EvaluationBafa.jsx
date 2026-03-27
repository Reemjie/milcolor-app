import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const CRITERES = {
  'Savoirs': [
    "Je connais la législation de sécurité",
    "Je connais les règles d'encadrement",
    "Je connais les étapes du développement de l'enfant",
    "Je connais le rythme de l'enfant",
    "Je connais des chants et des jeux",
    "Je sais ce qu'est un objectif pédagogique et son utilité",
    "Je connais les différents projets",
    "Je connais le Projet Pédagogique lié au Projet Éducatif et y adhère",
  ],
  'Savoir-être': [
    "Je développe mes capacités d'écoute",
    "Je suis présent, actif et dynamique",
    "Je suis à l'écoute des enfants",
    "Je suis organisé et je sais gérer mon rythme",
    "Je sais me remettre en cause (recul et auto-analyse)",
    "Je demande conseil et accepte les critiques",
    "Je suis en adéquation entre mes paroles et mes actes",
    "Je respecte la personnalité de chacun",
    "Je respecte les horaires et les règles de vie",
    "Je maîtrise mon vocabulaire et l'adapte au public",
    "Je me positionne en tant qu'éducateur",
    "Je suis capable de faire, faire faire et laisser faire",
    "Je prends des initiatives",
    "Je m'exprime de façon claire et je prends la parole en groupe",
    "Je sais évaluer une activité et une session",
    "Je permets à l'enfant de prendre la parole et je la prends en compte",
    "Je suis source de proposition et de créativité",
    "Je m'investis dans la vie en collectivité",
    "Je sais travailler en équipe",
  ],
  'Savoir-faire': [
    "Je propose, prépare et organise des activités de plein-air",
    "Je propose, prépare et organise des activités manuelles",
    "Je propose, prépare et organise des activités d'expression (veillées)",
    "Je sais mener des activités de plein air",
    "Je sais mener des activités d'expression",
    "Je sais mener des activités manuelles",
    "Je sais analyser et évaluer mes activités",
    "Je sais repérer et prendre en compte l'état physique et psychologique de l'enfant",
  ],
}

const MOMENTS = [
  { id: 'avant', label: 'Avant la session', color: '#118AB2', bg: '#E8F4FF' },
  { id: 'pendant', label: 'Pendant la session', color: '#FF9F43', bg: '#FFF3E0' },
  { id: 'apres', label: 'Après la session', color: '#06D6A0', bg: '#E0FBF1' },
]

const SCORES = [
  { value: 1, label: 'Pas du tout', color: '#e74c3c' },
  { value: 2, label: 'Peu', color: '#FF9F43' },
  { value: 3, label: 'Plutôt oui', color: '#118AB2' },
  { value: 4, label: 'Totalement', color: '#06D6A0' },
]

const SECTION_COLORS = {
  'Savoirs': { color: '#9B5DE5', bg: '#f0edf8' },
  'Savoir-être': { color: '#FF6B35', bg: '#FFF3EC' },
  'Savoir-faire': { color: '#06D6A0', bg: '#E0FBF1' },
}

export default function EvaluationBafa() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const isEdit = !!id && id !== 'nouvelle'

  const [step, setStep] = useState(0)
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [moment, setMoment] = useState('avant')
  const [scores, setScores] = useState({})
  const [objectifsDebut, setObjectifsDebut] = useState('')
  const [objectifsEval, setObjectifsEval] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('Savoirs')

  useEffect(() => { if (isEdit) fetchEval() }, [id])

  async function fetchEval() {
    setLoading(true)
    const { data } = await supabase.from('evaluations_bafa').select('*').eq('id', id).single()
    if (data) {
      setNom(data.stagiaire_nom)
      setPrenom(data.stagiaire_prenom)
      setMoment(data.moment)
      setScores(data.scores || {})
      setObjectifsDebut(data.objectifs_debut || '')
      setObjectifsEval(data.objectifs_evaluation || '')
    }
    setLoading(false)
  }

  function setScore(critere, val) { setScores(s => ({ ...s, [critere]: val })) }
  function getScore(critere) { return scores[critere] || 0 }
  function totalFilled() { return Object.values(CRITERES).flat().filter(c => scores[c] > 0).length }
  function totalCriteres() { return Object.values(CRITERES).flat().length }

  async function save() {
    if (!nom || !prenom) return
    setSaving(true)
    const payload = {
      stagiaire_nom: nom.trim().toUpperCase(),
      stagiaire_prenom: prenom.trim(),
      moment, scores,
      objectifs_debut: objectifsDebut,
      objectifs_evaluation: objectifsEval,
      updated_at: new Date().toISOString(),
    }
    if (isEdit) {
      await supabase.from('evaluations_bafa').update(payload).eq('id', id)
    } else {
      await supabase.from('evaluations_bafa').insert([payload])
    }
    setSaving(false)
    navigate('/evaluations-bafa')
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-enter" style={{ paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 0' }}>
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/evaluations-bafa')} style={{ width: 40, height: 40, borderRadius: 12, background: 'white', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.3rem' }}>⭐ Évaluation BAFA</h1>
          {nom && <p style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>{prenom} {nom} · {MOMENTS.find(m => m.id === moment)?.label}</p>}
        </div>
        {step === 1 && <div style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 700 }}>{totalFilled()}/{totalCriteres()}</div>}
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '12px 16px', alignItems: 'center' }}>
        {['Infos', 'Critères', 'Objectifs'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: i < 2 ? 1 : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= i ? 'var(--orange)' : 'var(--border)', color: step >= i ? 'white' : 'var(--text2)', fontWeight: 700, fontSize: '0.78rem', flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: step >= i ? 'var(--orange)' : 'var(--text2)' }}>{s}</span>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i ? 'var(--orange)' : 'var(--border)', borderRadius: 2 }} />}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        {step === 0 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={lStyle}>Prénom *</label>
                <input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Emma" style={iStyle} />
              </div>
              <div>
                <label style={lStyle}>Nom *</label>
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="DUPONT" style={iStyle} />
              </div>
            </div>
            <label style={lStyle}>Moment de l'évaluation</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {MOMENTS.map(m => (
                <button key={m.id} onClick={() => setMoment(m.id)} style={{ padding: '14px 16px', borderRadius: 14, border: `2px solid ${moment === m.id ? m.color : 'var(--border)'}`, background: moment === m.id ? m.bg : 'white', textAlign: 'left', fontWeight: 700, fontSize: '0.95rem', color: moment === m.id ? m.color : 'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  {m.label}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '15px', opacity: (!nom || !prenom) ? 0.6 : 1 }} onClick={() => setStep(1)} disabled={!nom || !prenom}>Suivant →</button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {Object.keys(CRITERES).map(s => {
                const sc = SECTION_COLORS[s]
                const filled = CRITERES[s].filter(c => scores[c] > 0).length
                return (
                  <button key={s} onClick={() => setActiveSection(s)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 20, border: `2px solid ${activeSection === s ? sc.color : 'var(--border)'}`, background: activeSection === s ? sc.bg : 'white', color: activeSection === s ? sc.color : 'var(--text)', fontWeight: 700, fontSize: '0.78rem' }}>
                    {s} ({filled}/{CRITERES[s].length})
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
              {SCORES.map(s => (
                <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: s.color }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text2)', fontWeight: 600 }}>{s.value} — {s.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {CRITERES[activeSection].map((critere, i) => {
                const score = getScore(critere)
                const sc = SECTION_COLORS[activeSection]
                return (
                  <div key={i} style={{ background: score > 0 ? sc.bg : 'white', border: `1.5px solid ${score > 0 ? sc.color : 'var(--border)'}`, borderRadius: 12, padding: '12px 14px' }}>
                    <p style={{ fontSize: '0.85rem', lineHeight: 1.4, marginBottom: 10, fontWeight: score > 0 ? 700 : 400 }}>{critere}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {SCORES.map(s => (
                        <button key={s.value} onClick={() => setScore(critere, s.value)} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${score === s.value ? s.color : 'var(--border)'}`, background: score === s.value ? s.color : 'white', color: score === s.value ? 'white' : 'var(--text2)', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.15s' }}>{s.value}</button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '15px' }} onClick={() => setStep(2)}>Suivant → Objectifs</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ background: '#E8F4FF', border: '2px solid #74B9FF', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#118AB2', marginBottom: 8 }}>📊 {totalFilled()}/{totalCriteres()} critères évalués</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(CRITERES).map(([section, crites]) => {
                  const filled = crites.filter(c => scores[c] > 0)
                  const avg = filled.length > 0 ? (filled.reduce((a, c) => a + scores[c], 0) / filled.length).toFixed(1) : '-'
                  const sc = SECTION_COLORS[section]
                  return (
                    <div key={section} style={{ background: sc.bg, borderRadius: 10, padding: '8px 12px', flex: 1 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: sc.color }}>{section}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: sc.color, fontFamily: 'Fredoka' }}>{avg}/4</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <label style={lStyle}>Objectifs fixés en début de stage</label>
            <textarea value={objectifsDebut} onChange={e => setObjectifsDebut(e.target.value)} placeholder="Quels sont les objectifs personnels fixés au départ ?" rows={4} style={{ ...iStyle, resize: 'vertical', marginBottom: 16 }} />
            <label style={lStyle}>Évaluation des objectifs</label>
            <textarea value={objectifsEval} onChange={e => setObjectifsEval(e.target.value)} placeholder="Comment s'est passée la progression vers ces objectifs ?" rows={4} style={{ ...iStyle, resize: 'vertical', marginBottom: 20 }} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '15px', opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
              {saving ? '⏳ Enregistrement…' : '💾 Soumettre l\'évaluation'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)' }
