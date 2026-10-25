import { supabase } from './supabase'

/**
 * Crée une notif in-app + envoie un push OneSignal à toute l’équipe.
 * Ne bloque jamais l’UI si le push échoue.
 */
export async function notifyTeam({ titre, message = '', type = 'info', lien = null }) {
  const row = {
    titre,
    message: message || null,
    type: type || 'info',
    lue: false,
    lien: lien || null,
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert([row])
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('notifyTeam insert', error)
    return { data: null, error }
  }

  // Fire-and-forget push
  supabase.functions.invoke('send-push', {
    body: {
      titre,
      message: message || '',
      type: type || 'info',
      lien: lien || '/notifications',
    },
  }).then(({ error: pushError }) => {
    if (pushError) console.warn('send-push', pushError.message || pushError)
  }).catch((e) => console.warn('send-push', e))

  return { data, error: null }
}
