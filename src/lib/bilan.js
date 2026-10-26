/** Schéma du bilan rapide (notes /10 + oui/non). */

export const SCORE_ITEMS = [
  { key: 'ambiance', label: 'Ambiance du groupe', icon: '😊' },
  { key: 'activites', label: 'Activités', icon: '🧩' },
  { key: 'deroulement', label: 'Déroulement de la journée', icon: '⏱' },
]

export const CHECK_ITEMS = [
  { key: 'incident', label: 'Incident à signaler ?', icon: '⚠️', yesColor: '#CC3333', placeholder: 'Que s’est-il passé ?' },
  { key: 'materiel', label: 'Matériel manquant ?', icon: '📦', yesColor: '#CC6600', placeholder: 'Quoi / combien ?' },
  { key: 'surveiller', label: 'Enfant(s) à surveiller ?', icon: '👁', yesColor: '#118AB2', placeholder: 'Qui / pourquoi ?' },
  { key: 'suggestion', label: 'Idée pour demain ?', icon: '💡', yesColor: '#9B5DE5', placeholder: 'Ta proposition…' },
]

export function emptyScoreComments() {
  return { ambiance: '', activites: '', deroulement: '' }
}

export function emptyScores() {
  return { ambiance: null, activites: null, deroulement: null, comments: emptyScoreComments() }
}

export function scoreComment(scores, key) {
  return (scores?.comments?.[key] || '').trim()
}

/** Normalise un objet scores issu de la DB (anciens sans comments). */
export function normalizeScores(raw) {
  const base = emptyScores()
  if (!raw || typeof raw !== 'object') return base
  SCORE_ITEMS.forEach(i => {
    if (typeof raw[i.key] === 'number') base[i.key] = raw[i.key]
  })
  base.comments = { ...emptyScoreComments(), ...(raw.comments || {}) }
  return base
}

export function emptyChecks() {
  return {
    incident: { oui: null, comment: '' },
    materiel: { oui: null, comment: '' },
    surveiller: { oui: null, comment: '' },
    suggestion: { oui: null, comment: '' },
  }
}

/** Toutes les cases ont été répondues (Oui ou Non). */
export function checksComplete(checks) {
  return CHECK_ITEMS.every(i => typeof checks?.[i.key]?.oui === 'boolean')
}

export function avgScore(scores) {
  const vals = SCORE_ITEMS.map(i => scores?.[i.key]).filter(v => typeof v === 'number')
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

export function scoreColor(n) {
  if (n == null) return 'var(--text2)'
  if (n >= 8) return '#0A7A5A'
  if (n >= 5) return '#CC6600'
  return '#CC3333'
}

/** Remplit les anciennes colonnes texte pour compat liste / recherche. */
export function legacyFromStructured({ scores, checks, activites_realisees }) {
  const c = { ...emptyChecks(), ...(checks || {}) }
  Object.keys(c).forEach(k => {
    c[k] = { oui: c[k]?.oui === true, comment: c[k]?.comment || '' }
  })
  const noteLine = (key) => {
    if (scores?.[key] == null) return ''
    const cmt = scoreComment(scores, key)
    return cmt ? `${scores[key]}/10 — ${cmt}` : `${scores[key]}/10`
  }
  return {
    ambiance: noteLine('ambiance'),
    activites_appreciees: noteLine('activites'),
    difficultes: noteLine('deroulement'),
    activites_realisees: activites_realisees || '',
    incidents: c.incident.oui ? (c.incident.comment || 'Oui') : '',
    materiel_manquant: c.materiel.oui ? (c.materiel.comment || 'Oui') : '',
    enfants_surveiller: c.surveiller.oui ? (c.surveiller.comment || 'Oui') : '',
    suggestions_activites: c.suggestion.oui ? (c.suggestion.comment || 'Oui') : '',
    autres_remarques: '',
  }
}

export function isNewFormat(b) {
  return !!(b?.scores && Object.keys(b.scores).length) || !!(b?.checks && Object.keys(b.checks).length)
}

export function alertFlags(b) {
  const flags = []
  if (isNewFormat(b)) {
    const c = b.checks || {}
    if (c.incident?.oui === true) flags.push('incident')
    if (c.materiel?.oui === true) flags.push('materiel')
    if (c.surveiller?.oui === true) flags.push('surveiller')
    const avg = avgScore(b.scores)
    if (avg != null && avg <= 4) flags.push('score_bas')
  } else {
    if (b.incidents) flags.push('incident')
    if (b.materiel_manquant) flags.push('materiel')
    if (b.enfants_surveiller) flags.push('surveiller')
  }
  return flags
}
