import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const APP_ID = Deno.env.get('ONESIGNAL_APP_ID') || '62327bb6-58fb-41e4-9738-ace048ea1134'
const REST_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') || ''
const SITE = 'https://reemjie.github.io/milcolor-app/'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    if (!REST_KEY) {
      return json({ error: 'ONESIGNAL_REST_API_KEY missing' }, 500)
    }

    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json().catch(() => ({}))
    const titre = String(body.titre || 'Milcolor').slice(0, 100)
    const message = String(body.message || titre).slice(0, 240)
    const lien = String(body.lien || '/notifications')
    const url = `${SITE}#${lien.startsWith('/') ? lien : `/${lien}`}`

    const payload = {
      app_id: APP_ID,
      included_segments: ['Subscribed Users'],
      headings: { en: titre, fr: titre },
      contents: { en: message, fr: message },
      url,
      chrome_web_icon: `${SITE}icon-192.png`,
      firefox_icon: `${SITE}icon-192.png`,
      // Évite de spammer trop fort si beaucoup d’events
      ttl: 3600 * 12,
    }

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Key ${REST_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('OneSignal error', res.status, data)
      return json({ error: 'onesignal_failed', details: data }, 502)
    }

    return json({ ok: true, id: data.id, recipients: data.recipients })
  } catch (e) {
    console.error(e)
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
