import { useEffect, useState } from 'react'
import {
  dismissPushPrompt,
  enablePushNotifications,
  getPushStatus,
  isPushSupported,
  wasPushPromptDismissed,
} from '../lib/onesignal'

export default function PushPrompt() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supported = await isPushSupported()
      if (!supported || cancelled) return
      const status = await getPushStatus()
      if (cancelled) return
      if (status.subscribed) return
      if (status.permission === 'denied') return
      if (wasPushPromptDismissed()) return
      setVisible(true)
    })()
    return () => { cancelled = true }
  }, [])

  if (!visible) return null

  async function onEnable() {
    setBusy(true)
    setHint('')
    const result = await enablePushNotifications()
    setBusy(false)
    if (result.ok) {
      setVisible(false)
      return
    }
    if (result.reason === 'denied') {
      setHint('Autorisation refusée. Réactive les notifs dans les réglages du navigateur / de l’app.')
      return
    }
    if (result.reason === 'unsupported') {
      setHint('Sur iPhone : ajoute d’abord Milcolor à l’écran d’accueil (Safari → Partager), puis réessaie.')
      return
    }
    setHint('Pas encore activé. Réessaie ou vérifie les réglages de notification.')
  }

  function onLater() {
    dismissPushPrompt()
    setVisible(false)
  }

  return (
    <div style={{
      margin: '10px 12px 0',
      padding: '12px 14px',
      borderRadius: 14,
      background: '#FFF3EC',
      border: '2px solid #FF6B35',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🔔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
            Active les notifications
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: 4, lineHeight: 1.4 }}>
            Sois prévenu dès qu’un planning, une alerte ou une info est ajoutée dans l’app.
          </p>
          {hint && (
            <p style={{ fontSize: '0.75rem', color: '#CC3333', marginTop: 6, lineHeight: 1.35 }}>{hint}</p>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={onLater}
          style={{
            flex: 1, padding: '10px', borderRadius: 10, fontWeight: 700, fontSize: '0.82rem',
            background: 'white', border: '1.5px solid var(--border)', color: 'var(--text2)',
          }}
        >
          Plus tard
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={onEnable}
          style={{ flex: 1.2, padding: '10px', borderRadius: 10, opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'Activation…' : 'Activer'}
        </button>
      </div>
    </div>
  )
}
