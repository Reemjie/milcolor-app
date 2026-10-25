const APP_ID = '62327bb6-58fb-41e4-9738-ace048ea1134'
const DISMISS_KEY = 'milcolor_push_dismissed_at'
const DISMISS_MS = 3 * 24 * 60 * 60 * 1000

function getOneSignal() {
  return typeof window !== 'undefined' ? window.OneSignal : null
}

/** Attend que le SDK OneSignal (chargé dans index.html) soit prêt. */
export function whenOneSignalReady() {
  return new Promise((resolve) => {
    if (window.OneSignal?.User) {
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
  const OneSignal = await whenOneSignalReady()
  try {
    return !!OneSignal?.Notifications?.isPushSupported?.()
  } catch {
    return false
  }
}

export async function getPushStatus() {
  const OneSignal = await whenOneSignalReady()
  const supported = !!OneSignal?.Notifications?.isPushSupported?.()
  const permission = OneSignal?.Notifications?.permissionNative
    || (typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const optedIn = !!OneSignal?.User?.PushSubscription?.optedIn
  const id = OneSignal?.User?.PushSubscription?.id || null
  return {
    supported,
    permission,
    optedIn,
    subscribed: supported && permission === 'granted' && (optedIn || !!id),
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

/** Demande l’autorisation push (slidedown + native). À appeler depuis un clic. */
export async function enablePushNotifications() {
  const OneSignal = await whenOneSignalReady()
  if (!OneSignal?.Notifications?.isPushSupported?.()) {
    return { ok: false, reason: 'unsupported' }
  }

  try {
    if (OneSignal.Slidedown?.promptPush) {
      await OneSignal.Slidedown.promptPush({ force: true })
    } else if (OneSignal.Notifications.requestPermission) {
      await OneSignal.Notifications.requestPermission()
    }
  } catch (e) {
    console.warn('OneSignal prompt error', e)
  }

  try {
    await OneSignal.User?.PushSubscription?.optIn?.()
  } catch { /* ignore */ }

  const status = await getPushStatus()
  if (status.subscribed) {
    try { localStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
    return { ok: true, status }
  }
  if (status.permission === 'denied') return { ok: false, reason: 'denied', status }
  return { ok: false, reason: 'pending', status }
}

export { getOneSignal, APP_ID }
