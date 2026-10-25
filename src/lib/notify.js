import { supabase } from './supabase'

/** Crée une notification in-app (cloche). Pas de push externe. */
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

  if (error) console.error('notifyTeam', error)
  return { data, error }
}
