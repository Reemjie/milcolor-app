const APP_ID = '62327bb6-58fb-41e4-9738-ace048ea1134'
const DISMISS_KEY = 'milcolor_push_dismissed_at'
const DISMISS_MS = 12 * 60 * 60 * 1000 // 12h

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
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
  const token = OneSignal?.User?.PushSubscription?.token || null
  return {
    supported,
    permission,
    optedIn,
    id,
    token,
    // Un vrai abonnement OneSignal = un id de subscription
    subscribed: supported && permission === 'granted' && !!id,
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

export function resetPushPromptDismiss() {
  try { localStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
}

/** Demande l’autorisation push. À appeler depuis un clic utilisateur. */
export async function enablePushNotifications() {
  const OneSignal = await whenOneSignalReady()
  if (!OneSignal?.Notifications?.isPushSupported?.()) {
    return { ok: false, reason: 'unsupported' }
  }

  try {
    // Slidedown soft prompt (peut être no-op si déjà vu)
    if (OneSignal.Slidedown?.promptPush) {
      await OneSignal.Slidedown.promptPush({ force: true })
    }
  } catch (e) {
    console.warn('OneSignal slidedown', e)
  }

  try {
    // Prompt natif navigateur
    if (OneSignal.Notifications?.requestPermission) {
      await OneSignal.Notifications.requestPermission(true)
    }
  } catch (e) {
    console.warn('OneSignal requestPermission', e)
  }

  try {
    await OneSignal.User?.PushSubscription?.optIn?.()
  } catch (e) {
    console.warn('OneSignal optIn', e)
  }

  // Attendre que OneSignal enregistre le player (sinon id reste null)
  for (let i = 0; i < 12; i++) {
    const status = await getPushStatus()
    if (status.subscribed) {
      try { localStorage.removeItem(DISMISS_KEY) } catch { /* ignore */ }
      return { ok: true, status }
    }
    if (status.permission === 'denied') {
      return { ok: false, reason: 'denied', status }
    }
    await sleep(400)
  }

  const status = await getPushStatus()
  if (status.permission === 'denied') return { ok: false, reason: 'denied', status }
  if (status.permission === 'granted' && !status.id) {
    return { ok: false, reason: 'no_player', status }
  }
  return { ok: false, reason: 'pending', status }
}

export { APP_ID }
