const APP_ID = '62327bb6-58fb-41e4-9738-ace048ea1134'
const DISMISS_KEY = 'milcolor_push_dismissed_at'
const DISMISS_MS = 12 * 60 * 60 * 1000

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Attend que le SDK OneSignal (chargé dans index.html) soit prêt. */
export function whenOneSignalReady() {
  return new Promise((resolve) => {
    if (window.OneSignal?.Notifications) {
      resolve(window.OneSignal)
      return
    }
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      resolve(OneSignal)
    })
  })
}

export async function isPushSupported() {
  try {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) return false
    if (!('serviceWorker' in navigator)) return false
    const OneSignal = await whenOneSignalReady()
    if (typeof OneSignal?.Notifications?.isPushSupported === 'function') {
      return !!OneSignal.Notifications.isPushSupported()
    }
    return true
  } catch {
    return false
  }
}

export async function getPushStatus() {
  const OneSignal = await whenOneSignalReady()
  const supported = await isPushSupported()
  const permission = (typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const permissionNative = OneSignal?.Notifications?.permissionNative || permission
  const optedIn = !!OneSignal?.User?.PushSubscription?.optedIn
  const id = OneSignal?.User?.PushSubscription?.id || null
  const token = OneSignal?.User?.PushSubscription?.token || null
  return {
    supported,
    permission: permissionNative || permission,
    optedIn,
    id,
    token,
    subscribed: !!(id && (permission === 'granted' || permissionNative === 'granted')),
    appId: APP_ID,
  }
}

export function wasPushPromptDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    return Date.now() - Number(raw) < DISMISS_MS
  } catch {
    return false
  }
}

export function dismissPushPrompt() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* ignore */ }
}

/**
 * Active le push. DOIT être appelé directement depuis un click
 * (pas d'await long avant requestPermission — sinon Chrome bloque).
 */
export async function enablePushNotifications() {
  // 1) Permission native IMMÉDIATEMENT (geste utilisateur)
  let permission = typeof Notification !== 'undefined' ? Notification.permission : 'default'
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch (e) {
      console.warn('Notification.requestPermission', e)
    }
  }
  if (permission === 'denied') {
    return { ok: false, reason: 'denied', status: await getPushStatus() }
  }
  if (permission !== 'granted') {
    return { ok: false, reason: 'pending', status: await getPushStatus() }
  }

  // 2) OneSignal opt-in / enregistrement player
  const OneSignal = await whenOneSignalReady()
  try {
    if (OneSignal?.Notifications?.requestPermission) {
      await OneSignal.Notifications.requestPermission(true)
    }
  } catch (e) {
    console.warn('OneSignal.requestPermission', e)
  }

  try {
    await OneSignal?.User?.PushSubscription?.optIn?.()
  } catch (e) {
    console.warn('OneSignal.optIn', e)
  }

  // 3) Attendre l'id OneSignal
  for (let i = 0; i < 20; i++) {
    const status = await getPushStatus()
    if (status.subscribed) {
      try { localStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
      return { ok: true, status }
    }
    await sleep(300)
  }

  const status = await getPushStatus()
  if (status.permission === 'denied') return { ok: false, reason: 'denied', status }
  if (status.permission === 'granted' && !status.id) {
    return { ok: false, reason: 'no_player', status }
  }
  return { ok: false, reason: 'pending', status }
}

export { APP_ID }
