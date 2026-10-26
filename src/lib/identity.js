/** Identité animateur (compte partagé) — localStorage. */

const KEY = 'milcolor_moi'

export function getIdentity() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.prenom) {
        return {
          prenom: String(parsed.prenom).trim(),
          nom: String(parsed.nom || '').trim(),
        }
      }
    }
    // Compat ancien chat
    const legacy = sessionStorage.getItem('chat_auteur') || localStorage.getItem('mercredi_moi')
    if (legacy?.trim()) return { prenom: legacy.trim(), nom: '' }
  } catch { /* ignore */ }
  return null
}

export function setIdentity({ prenom, nom = '' }) {
  const p = (prenom || '').trim()
  const n = (nom || '').trim()
  if (!p) return null
  const id = { prenom: p, nom: n }
  try {
    localStorage.setItem(KEY, JSON.stringify(id))
    sessionStorage.setItem('chat_auteur', p)
    localStorage.setItem('mercredi_moi', p)
  } catch { /* ignore */ }
  return id
}

export function clearIdentity() {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem('chat_auteur')
  } catch { /* ignore */ }
}

export function displayName(id = getIdentity()) {
  if (!id?.prenom) return ''
  return id.nom ? `${id.prenom} ${id.nom}` : id.prenom
}
