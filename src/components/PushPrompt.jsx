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
  const [okMsg, setOkMsg] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supported = await isPushSupported()
      if (!supported || cancelled) return
      const status = await getPushStatus()
      if (cancelled) return
      // Seulement si OneSignal a bien un subscription id
      if (status.subscribed) return
      if (status.permission === 'denied') {
        setHint('Notifications bloquées par le navigateur. Autorise-les pour reemjie.github.io dans les réglages.')
        setVisible(true)
        return
      }
      if (wasPushPromptDismissed()) return
      setVisible(true)
    })()
    return () => { cancelled = true }
  }, [])

  if (!visible) return null

  async function onEnable() {
    setBusy(true)
    setHint('')
    setOkMsg('')
    const result = await enablePushNotifications()
    setBusy(false)
    if (result.ok) {
      setOkMsg(`Activé ✓ (${String(result.status?.id || '').slice(0, 8)}…)`)
      setTimeout(() => setVisible(false), 1500)
      return
    }
    if (result.reason === 'denied') {
      setHint('Autorisation refusée. Réactive les notifs pour reemjie.github.io dans les réglages du navigateur.')
      return
    }
    if (result.reason === 'unsupported') {
      setHint('Sur iPhone : Safari → Partager → Sur l’écran d’accueil, puis rouvre l’icône Milcolor et réessaie.')
      return
    }
    if (result.reason === 'no_player') {
      setHint('Permission OK mais OneSignal n’a pas enregistré l’appareil. Ferme tous les onglets Milcolor, rouvre, puis réessaie.')
      return
    }
    setHint('Pas encore activé. Réessaie après avoir accepté la popup du navigateur.')
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
          {okMsg && (
            <p style={{ fontSize: '0.75rem', color: '#0A7A5A', marginTop: 6, lineHeight: 1.35 }}>{okMsg}</p>
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
