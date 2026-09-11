import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import '../styles/mercredis.css'

const MOMENTS = [
  { cle: 'matin', label: 'Matin' },
  { cle: 'apres-midi', label: 'Après-midi' },
]

const AUJOURDHUI = () => new Date().toISOString().slice(0, 10)

function formatDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function dansCombien(iso) {
  const j = Math.round((new Date(iso + 'T12:00:00') - new Date().setHours(12, 0, 0, 0)) / 86400000)
  if (j <= 0) return "c'est aujourd'hui"
  if (j === 1) return 'demain'
  return `dans ${j} jours`
}

const initiales = (p) => (p ? p.trim().slice(0, 2).toUpperCase() : '')

function prochainsMercredis(n) {
  const dates = []
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  while (d.getDay() !== 3) d.setDate(d.getDate() + 1)
  for (let i = 0; i < n; i++) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 7)
  }
  return dates
}

export default function Mercredis() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [seances, setSeances] = useState([])
  const [tableau, setTableau] = useState([])
  const [equipe, setEquipe] = useState([])
  const [moment, setMoment] = useState('matin')
  const [nouveau, setNouveau] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [ajout, setAjout] = useState(false)

  const charger = useCallback(async () => {
    setErreur(null)
    const today = AUJOURDHUI()

    const [r1, r2] = await Promise.all([
      supabase.from('mercredi_suivi').select('*').order('date', { ascending: true }),
      supabase.from('mercredi_animateurs').select('*').eq('actif', true).order('prenom'),
    ])

    if (r1.error) { setErreur(r1.error.message); setChargement(false); return }
    const liste = r1.data ?? []
    setSeances(liste)
    setEquipe(r2.error ? [] : (r2.data ?? []))

    const prochaine = liste.find((s) => s.date >= today)
    if (prochaine) {
      const { data } = await supabase
        .from('mercredi_planning').select('*')
        .eq('date', prochaine.date)
        .order('moment_rang', { ascending: true })
        .order('ordre', { ascending: true })
      setTableau(data ?? [])
    } else setTableau([])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function ajouterProchains() {
    setAjout(true); setErreur(null)
    const lignes = prochainsMercredis(8).map((date) => ({ date }))
    const { error } = await supabase
      .from('mercredi_seances').upsert(lignes, { onConflict: 'date', ignoreDuplicates: true })
    if (error) setErreur(error.message); else await charger()
    setAjout(false)
  }

  async function ajouterAnimateur(e) {
    e.preventDefault()
    const prenom = nouveau.trim()
    if (!prenom) return
    setNouveau('')
    const { error } = await supabase
      .from('mercredi_animateurs').upsert({ prenom, actif: true }, { onConflict: 'prenom' })
    if (error) setErreur(error.message); else charger()
  }

  async function retirerAnimateur(id) {
    await supabase.from('mercredi_animateurs').update({ actif: false }).eq('id', id)
    charger()
  }

  const today = AUJOURDHUI()
  const aVenir = seances.filter((s) => s.date >= today)
  const suivants = aVenir.slice(1)
  const passes = seances.filter((s) => s.date < today).reverse()
  const prochaine = aVenir[0]

  const tuiles = tableau.filter((t) => t.moment === moment)
  const remplies = tuiles.filter((t) => t.renseigne).length
  const aAcheter = tuiles.filter((t) => t.renseigne && !t.pret).length
  const sansAnimateur = tuiles.filter((t) => !t.animateur).length

  return (
    <div className="mw">
      <div className="mw-head">
        <h1>Les mercredis</h1>
        <p>Chacun prépare le poste où il est affecté, avant le vendredi qui précède.</p>
      </div>

      {erreur && <div className="mw-error">{erreur}</div>}

      {chargement ? (
        <div className="mw-empty">Chargement…</div>
      ) : (
        <>
          {prochaine && (
            <div className="mw-board">
              <div className="mw-board-top">
                <div>
                  <div className="mw-board-date">{formatDate(prochaine.date)}</div>
                  <div className="mw-board-quand">{dansCombien(prochaine.date)}</div>
                </div>
                <button className="mw-btn" onClick={() => navigate(`/mercredis/${prochaine.date}`)}>
                  Préparer
                </button>
              </div>

              <div className="mw-toggle">
                {MOMENTS.map((m) => (
                  <button key={m.cle} aria-pressed={moment === m.cle} onClick={() => setMoment(m.cle)}>
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="mw-grid">
                {tuiles.map((t) => (
                  <div key={t.espace_id} className="mw-tuile" style={{ '--tuile': t.couleur }}>
                    <div className="mw-tuile-espace">{t.espace}</div>

                    <div className="mw-tuile-anim">
                      <span className={`mw-pastille${t.animateur ? '' : ' mw-pastille--vide'}`}>
                        {t.animateur ? initiales(t.animateur) : '?'}
                      </span>
                      <span className={t.animateur ? '' : 'mw-sans'}>
                        {t.animateur || 'personne d’affecté'}
                      </span>
                    </div>

                    <div className={`mw-tuile-titre${t.titre ? '' : ' mw-sans'}`}>
                      {t.titre || 'Rien de prévu pour l’instant'}
                    </div>

                    <div className="mw-tuile-bas">
                      {t.age_cible && <span className="mw-tag">{t.age_cible}</span>}
                      {t.renseigne && (t.pret
                        ? <span className="mw-tag mw-tag--ok">Matériel prêt</span>
                        : <span className="mw-tag mw-tag--warn">Matériel à prévoir</span>)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mw-board-bas">
                <span className="mw-board-etat">
                  <b>{remplies}</b> sur {tuiles.length} postes remplis
                  {sansAnimateur > 0 && ` · ${sansAnimateur} sans animateur`}
                  {aAcheter > 0 && ` · ${aAcheter} à acheter`}
                </span>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="mw-equipe">
              <h2>L’équipe du mercredi</h2>
              <div className="mw-chips">
                {equipe.length === 0 && (
                  <span className="mw-board-etat">Ajoutez les prénoms pour pouvoir affecter les postes.</span>
                )}
                {equipe.map((a) => (
                  <span key={a.id} className="mw-chip">
                    {a.prenom}
                    <button onClick={() => retirerAnimateur(a.id)} title="Retirer">✕</button>
                  </span>
                ))}
              </div>
              <form onSubmit={ajouterAnimateur} className="mw-actions">
                <div className="mw-field" style={{ flex: 1, minWidth: 160 }}>
                  <input type="text" value={nouveau} placeholder="Prénom"
                    onChange={(e) => setNouveau(e.target.value)} />
                </div>
                <button type="submit" className="mw-btn mw-btn--ghost" disabled={!nouveau.trim()}>
                  Ajouter
                </button>
              </form>
            </div>
          )}

          {suivants.length > 0 && (
            <>
              <h2 className="mw-section-titre">Les mercredis suivants</h2>
              <div className="mw-list">
                {suivants.map((s) => (
                  <Link key={s.seance_id} to={`/mercredis/${s.date}`} className="mw-item">
                    <span className="mw-item-date">{formatDate(s.date)}</span>
                    <span className="mw-item-etat">
                      <b>{s.renseignes}</b>/{s.postes_a_preparer} postes
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {isAdmin && (
            <div className="mw-actions" style={{ marginBottom: '2rem' }}>
              <button className="mw-btn mw-btn--gris" onClick={ajouterProchains} disabled={ajout}>
                {ajout ? 'Ajout en cours…' : 'Ajouter les 8 prochains mercredis'}
              </button>
            </div>
          )}

          {passes.length > 0 && (
            <>
              <h2 className="mw-section-titre">Déjà passés</h2>
              <div className="mw-list">
                {passes.slice(0, 8).map((s) => (
                  <Link key={s.seance_id} to={`/mercredis/${s.date}`} className="mw-item mw-item--passe">
                    <span className="mw-item-date">{formatDate(s.date)}</span>
                    <span className="mw-item-etat">{s.renseignes} postes remplis</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {seances.length === 0 && (
            <div className="mw-empty">
              Aucun mercredi pour l’instant.{isAdmin ? ' Ajoutez les prochains pour commencer.' : ''}
            </div>
          )}
        </>
      )}
    </div>
  )
}
