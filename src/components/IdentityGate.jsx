import { useState, useEffect } from 'react'
import { getIdentity, setIdentity } from '../lib/identity'

/** Modal « Qui es-tu ? » — obligatoire si aucune identité. */
export default function IdentityGate({ open, onClose, onSaved, canCancel = true }) {
  const existing = getIdentity()
  const [prenom, setPrenom] = useState(existing?.prenom || '')
  const [nom, setNom] = useState(existing?.nom || '')

  useEffect(() => {
    if (open) {
      const cur = getIdentity()
      setPrenom(cur?.prenom || '')
      setNom(cur?.nom || '')
    }
  }, [open])

  if (!open) return null

  function save() {
    const id = setIdentity({ prenom, nom })
    if (!id) return
    onSaved?.(id)
    onClose?.()
  }

  const mustStay = !existing?.prenom || !canCancel

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '28px 22px',
        width: '100%', maxWidth: 360, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontSize: '2.4rem', textAlign: 'center', marginBottom: 8 }}>👋</div>
        <h2 style={{ textAlign: 'center', fontSize: '1.25rem', marginBottom: 6 }}>Qui es-tu ?</h2>
        <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: '0.82rem', marginBottom: 20, lineHeight: 1.4 }}>
          Ton prénom sert pour les bilans et les infos du jour.
        </p>
        <label style={label}>Prénom *</label>
        <input
          value={prenom}
          onChange={e => setPrenom(e.target.value)}
          placeholder="Emma"
          autoFocus
          style={input}
          onKeyDown={e => e.key === 'Enter' && prenom.trim() && save()}
        />
        <label style={label}>Nom</label>
        <input
          value={nom}
          onChange={e => setNom(e.target.value)}
          placeholder="Dupont"
          style={input}
          onKeyDown={e => e.key === 'Enter' && prenom.trim() && save()}
        />
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', padding: 14, marginTop: 8, opacity: prenom.trim() ? 1 : 0.5 }}
          disabled={!prenom.trim()}
          onClick={save}
        >
          C’est parti
        </button>
        {!mustStay && (
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', marginTop: 10, padding: 10, border: 'none',
              background: 'none', color: 'var(--text2)', fontWeight: 700, fontSize: '0.82rem',
            }}
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}

const label = { display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: 5 }
const input = {
  width: '100%', padding: '12px 14px', borderRadius: 12, marginBottom: 12,
  border: '2px solid var(--border)', fontSize: '1rem', background: 'var(--bg)',
}
