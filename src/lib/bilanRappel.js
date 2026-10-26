/** Rappel bilan du jour — stocké en local (compte animateur partagé). */

const PREFIX = 'milcolor_bilan_rappel_'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function isBilanRappelDismissed() {
  try {
    return localStorage.getItem(PREFIX + todayKey()) === '1'
  } catch {
    return false
  }
}

export function dismissBilanRappel() {
  try {
    localStorage.setItem(PREFIX + todayKey(), '1')
  } catch { /* ignore */ }
}

/** Afficher le rappel à partir de 15h (fin de journée ACM). */
export function shouldShowBilanRappel(now = new Date()) {
  if (now.getHours() < 15) return false
  return !isBilanRappelDismissed()
}
