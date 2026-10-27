/** Lectures de notifications — locales à l’appareil (tablette partagée). */

const KEY = 'milcolor_notifs_lues'

function readSet() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function writeSet(set) {
  try {
    // garder les 200 plus récents pour limiter la taille
    const arr = [...set].slice(-200)
    localStorage.setItem(KEY, JSON.stringify(arr))
  } catch { /* ignore */ }
}

export function isNotifReadLocal(id) {
  return readSet().has(id)
}

export function markNotifReadLocal(id) {
  if (!id) return
  const set = readSet()
  set.add(id)
  writeSet(set)
}

export function markNotifsReadLocal(ids) {
  const set = readSet()
  ;(ids || []).forEach(id => id && set.add(id))
  writeSet(set)
}

export function countUnreadLocal(notifs) {
  const set = readSet()
  return (notifs || []).filter(n => n?.id && !set.has(n.id)).length
}

export function withLocalRead(notifs) {
  const set = readSet()
  return (notifs || []).map(n => ({ ...n, lue_locale: set.has(n.id) }))
}
