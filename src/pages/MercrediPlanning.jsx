import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import '../styles/mercredis.css'

const MOMENTS = [
  { cle: 'matin', label: 'Matin' },
  { cle: 'apres-midi', label: 'Après-midi' },
]
const AGES = ['3-6', '7-11', '3-11', 'Libre']
const CLE_MOI = 'mercredi_moi'

const cle = (l) => `${l.espace_id}|${l.moment}`
const vide = (v) => (v === null || v === undefined ? '' : v)
const libelle = (m) => MOMENTS.find((x) => x.cle === m)?.label ?? m

function formatDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function MercrediPlanning() {
  const { date } = useParams()
  const { isAdmin } = useAuth()

  const [lignes, setLignes] = useState([])
  const [brouillons, setBrouillons] = useState({})
  const [equipe, setEquipe] = useState([])
  const [moi, setMoi] = useState(() => localStorage.getItem(CLE_MOI) || '')
  const [moment, setMoment] = useState('matin')
  const [toutVoir, setToutVoir] = useState(isAdmin)
  const [sales, setSales] = useState({})
  const [enCours, setEnCours] = useState({})
  const [confirme, setConfirme] = useState({})
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(null)
  const [picker, setPicker] = useState(null)

  const charger = useCallback(async () => {
    setChargement(true); setErreur(null)

    const [r1, r2] = await Promise.all([
      supabase.from('mercredi_planning').select('*').eq('date', date)
        .order('moment_rang', { ascending: true }).order('ordre', { ascending: true }),
      supabase.from('mercredi_animateurs').select('*').eq('actif', true).order('prenom'),
    ])

    if (r1.error) { setErreur(r1.error.message); setChargement(false); return }

    const init = {}
    for (const l of r1.data ?? []) {
      init[cle(l)] = {
        animateur: vide(l.animateur),
        titre: vide(l.titre),
        age_cible: vide(l.age_cible),
        materiel: vide(l.materiel),
        remarques: vide(l.remarques),
        pret: !!l.pret,
      }
    }
    setLignes(r1.data ?? [])
    setBrouillons(init)
    setEquipe(r2.error ? [] : (r2.data ?? []))
    setSales({})
    setChargement(false)
  }, [date])

  useEffect(() => { charger() }, [charger])

  function choisirMoi(prenom) {
    setMoi(prenom)
    if (prenom) localStorage.setItem(CLE_MOI, prenom)
    else localStorage.removeItem(CLE_MOI)
    if (prenom && !isAdmin) setToutVoir(false)
  }

  function modifier(k, champ, valeur) {
    setBrouillons((b) => ({ ...b, [k]: { ...b[k], [champ]: valeur } }))
    setSales((s) => ({ ...s, [k]: true }))
    setConfirme((c) => ({ ...c, [k]: false }))
  }

  async function enregistrer(ligne) {
    const k = cle(ligne)
    const b = brouillons[k]
    setEnCours((e) => ({ ...e, [k]: true })); setErreur(null)

    const { error } = await supabase.from('mercredi_propositions').upsert(
      {
        seance_id: ligne.seance_id,
        espace_id: ligne.espace_id,
        moment: ligne.moment,
        animateur: b.animateur || null,
        titre: b.titre || null,
        age_cible: b.age_cible || null,
        materiel: b.materiel || null,
        remarques: b.remarques || null,
        pret: b.pret,
      },
      { onConflict: 'seance_id,espace_id,moment' },
    )

    setEnCours((e) => ({ ...e, [k]: false }))
    if (error) { setErreur(error.message); return }

    setSales((s) => ({ ...s, [k]: false }))
    setConfirme((c) => ({ ...c, [k]: true }))
    setLignes((ls) => ls.map((l) => (cle(l) === k ? { ...l, ...b } : l)))
  }

  async function ouvrirPicker(ligne) {
    setPicker({ ligne, idees: null })
    const { data, error } = await supabase
      .from('mercredi_deja_fait').select('*').eq('espace', ligne.espace)
      .order('derniere_fois', { ascending: false }).limit(20)
    setPicker({ ligne, idees: error ? [] : (data ?? []) })
  }

  function reprendre(idee) {
    const k = cle(picker.ligne)
    setBrouillons((b) => ({
      ...b,
      [k]: { ...b[k], titre: vide(idee.titre), age_cible: vide(idee.age_cible), materiel: vide(idee.materiel) },
    }))
    setSales((s) => ({ ...s, [k]: true }))
    setConfirme((c) => ({ ...c, [k]: false }))
    setPicker(null)
  }

  const estAMoi = (l) => moi && brouillons[cle(l)]?.animateur === moi
  const mesLignes = lignes.filter(estAMoi)
  const modePerso = !!moi && !toutVoir
  const visibles = modePerso ? mesLignes : lignes.filter((l) => l.moment === moment)

  const mesPostes = MOMENTS.map((m) => ({
    ...m,
    ligne: mesLignes.find((l) => l.moment === m.cle),
  }))

  return (
    <div className="mw">
      <Link to="/mercredis" className="mw-back">Retour aux mercredis</Link>

      <div className="mw-head">
        <h1 style={{ textTransform: 'capitalize' }}>{formatDate(date)}</h1>
        <p>
          {modePerso && mesLignes.length > 0
            ? 'Voici tes fiches à remplir pour ce mercredi.'
            : 'Chaque espace a un poste le matin et un l’après-midi.'}
        </p>
      </div>

      {erreur && <div className="mw-error">{erreur}</div>}

      {equipe.length > 0 && (
        <div className="mw-moi">
          <label htmlFor="moi">Je suis</label>
          <select id="moi" value={moi} onChange={(e) => choisirMoi(e.target.value)}>
            <option value="">choisir mon prénom</option>
            {equipe.map((a) => <option key={a.id} value={a.prenom}>{a.prenom}</option>)}
          </select>

          {moi && (
            <div className="mw-mes-postes">
              {mesPostes.map((p) => (
                <div key={p.cle} className="mw-poste">
                  <span className="mw-poste-quand">{p.label}</span>
                  {p.ligne ? (
                    <span className="mw-poste-lieu" style={{ '--lieu': p.ligne.couleur }}>
                      {p.ligne.espace}
                    </span>
                  ) : (
                    <span className="mw-poste-lieu mw-sans">pas d’affectation</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {moi && mesLignes.length === 0 && !chargement && (
        <div className="mw-note">Tu n’es affecté à aucun poste ce mercredi. Vois avec le directeur.</div>
      )}

      {moi && (
        <div className="mw-actions" style={{ marginBottom: '1rem' }}>
          <button className="mw-btn mw-btn--gris mw-btn--small" onClick={() => setToutVoir((v) => !v)}>
            {modePerso ? 'Voir tous les postes' : 'Ne voir que mes postes'}
          </button>
        </div>
      )}

      {!modePerso && (
        <div className="mw-toggle">
          {MOMENTS.map((m) => (
            <button key={m.cle} aria-pressed={moment === m.cle} onClick={() => setMoment(m.cle)}>
              {m.label}
            </button>
          ))}
        </div>
      )}

      {chargement ? (
        <div className="mw-empty">Chargement…</div>
      ) : visibles.length === 0 ? (
        <div className="mw-empty">
          {modePerso ? 'Rien à remplir pour toi ce mercredi.' : 'Ce mercredi n’existe pas encore.'}
        </div>
      ) : (
        <div className="mw-cards">
          {visibles.map((ligne) => {
            const k = cle(ligne)
            const b = brouillons[k]
            if (!b) return null
            const cestMoi = estAMoi(ligne)
            return (
              <section key={k} className={`mw-card${cestMoi ? ' mw-card--moi' : ''}`}
                style={{ '--tuile': ligne.couleur }}>
                <div className="mw-card-head">
                  <div className="mw-card-head-haut">
                    <h2>{ligne.espace}</h2>
                    {cestMoi && <span className="mw-badge-moi">{libelle(ligne.moment)}</span>}
                  </div>
                  <span className="mw-sous">
                    {!cestMoi && `${libelle(ligne.moment)} · `}{ligne.espace_description}
                  </span>
                </div>

                {isAdmin ? (
                  <div className="mw-field" style={{ margin: '10px 16px 0' }}>
                    <label htmlFor={`aff-${k}`}>Animateur affecté</label>
                    <select id={`aff-${k}`} value={b.animateur}
                      onChange={(e) => modifier(k, 'animateur', e.target.value)}>
                      <option value="">personne</option>
                      {equipe.map((a) => <option key={a.id} value={a.prenom}>{a.prenom}</option>)}
                      {b.animateur && !equipe.some((a) => a.prenom === b.animateur) && (
                        <option value={b.animateur}>{b.animateur}</option>
                      )}
                    </select>
                  </div>
                ) : !cestMoi ? (
                  <div className="mw-affect">
                    <span className="mw-affect-label">Animateur</span>
                    <span className={`mw-affect-nom${b.animateur ? '' : ' mw-sans'}`}>
                      {b.animateur || 'pas encore affecté'}
                    </span>
                  </div>
                ) : null}

                <div className="mw-card-body">
                  <div className="mw-field">
                    <label htmlFor={`titre-${k}`}>On propose</label>
                    <input id={`titre-${k}`} type="text" value={b.titre}
                      placeholder="Parcours de motricité, attrape-rêves…"
                      onChange={(e) => modifier(k, 'titre', e.target.value)} />
                  </div>

                  <div className="mw-field">
                    <label htmlFor={`age-${k}`}>Âge visé</label>
                    <select id={`age-${k}`} value={b.age_cible}
                      onChange={(e) => modifier(k, 'age_cible', e.target.value)}>
                      <option value="">à préciser</option>
                      {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>

                  <div className="mw-field">
                    <label htmlFor={`mat-${k}`}>Matériel nécessaire</label>
                    <textarea id={`mat-${k}`} value={b.materiel}
                      placeholder="Tout ce qu’il faut sortir ou acheter"
                      onChange={(e) => modifier(k, 'materiel', e.target.value)} />
                  </div>

                  <div className="mw-field">
                    <label htmlFor={`rem-${k}`}>Remarques</label>
                    <textarea id={`rem-${k}`} value={b.remarques} placeholder="Facultatif"
                      onChange={(e) => modifier(k, 'remarques', e.target.value)} />
                  </div>

                  <label className="mw-check">
                    <input type="checkbox" checked={b.pret}
                      onChange={(e) => modifier(k, 'pret', e.target.checked)} />
                    Le matériel est déjà disponible
                  </label>

                  <div className="mw-actions">
                    <button className="mw-btn" onClick={() => enregistrer(ligne)}
                      disabled={!sales[k] || enCours[k]}>
                      {enCours[k] ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button className="mw-btn mw-btn--ghost mw-btn--small"
                      onClick={() => ouvrirPicker(ligne)}>
                      Reprendre une idée
                    </button>
                    {confirme[k] && <span className="mw-saved">Enregistré</span>}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      {picker && (
        <div className="mw-modal-bg" onClick={() => setPicker(null)}>
          <div className="mw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Déjà proposé en {picker.ligne.espace}</h3>
            <p>Un clic remplit la carte, tu peux ensuite tout modifier.</p>
            {picker.idees === null ? (
              <div className="mw-empty">Chargement…</div>
            ) : picker.idees.length === 0 ? (
              <div className="mw-empty">Rien encore. Cette liste se remplira au fil des mercredis.</div>
            ) : (
              picker.idees.map((idee, i) => (
                <button key={i} className="mw-idee" onClick={() => reprendre(idee)}>
                  <strong>{idee.titre}</strong>
                  <span>
                    {idee.age_cible ? `${idee.age_cible} · ` : ''}
                    {idee.nb_fois > 1 ? `${idee.nb_fois} fois · ` : ''}
                    {idee.materiel || 'pas de matériel noté'}
                  </span>
                </button>
              ))
            )}
            <div className="mw-actions" style={{ marginTop: '1rem' }}>
              <button className="mw-btn mw-btn--ghost" onClick={() => setPicker(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
