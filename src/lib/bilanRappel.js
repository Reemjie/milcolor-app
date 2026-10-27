/** Rappel bilan du jour — disparaît seulement si l’animateur a déjà envoyé le sien. */

import { getIdentity } from './identity'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function norm(s) {
  return (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Soft-hide jusqu’à la prochaine ouverture d’app (session). */
export function snoozeBilanRappel() {
  try {
    sessionStorage.setItem('milcolor_bilan_snooze_' + todayKey(), '1')
  } catch { /* ignore */ }
}

export function isBilanRappelSnoozed() {
  try {
    return sessionStorage.getItem('milcolor_bilan_snooze_' + todayKey()) === '1'
  } catch {
    return false
  }
}

/**
 * true si après 15h et aucun bilan du jour pour le prénom de l’identité.
 */
export async function shouldShowBilanRappel(supabase, now = new Date()) {
  if (now.getHours() < 15) return false
  if (isBilanRappelSnoozed()) return false

  const id = getIdentity()
  if (!id?.prenom) return true

  const today = todayKey()
  const { data } = await supabase
    .from('bilans')
    .select('id, prenom')
    .eq('jour', today)
    .limit(80)

  const mine = (data || []).some(b => norm(b.prenom) === norm(id.prenom))
  return !mine
}

/** Après envoi réussi — plus de snooze utile, le check DB suffit. */
export function dismissBilanRappel() {
  try {
    sessionStorage.setItem('milcolor_bilan_snooze_' + todayKey(), '1')
  } catch { /* ignore */ }
}
