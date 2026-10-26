import { useNavigate } from 'react-router-dom'
import { avgScore, alertFlags, scoreColor } from '../lib/bilan'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function norm(s) {
  return (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Vue directeur : bilans du jour — reçus, alertes, manquants (si équipe connue).
 * @param {object[]} bilans - tous les bilans (filtrés côté parent ou ici)
 * @param {object[]} [equipe] - mercredi_animateurs { prenom }
 */
export default function BilanJourDirecteur({ bilans = [], equipe = [], onOpen, showAllLink = true }) {
  const navigate = useNavigate()
  const today = todayISO()
  const duJour = bilans.filter(b => b.jour === today)
  const withAlert = duJour.filter(b => alertFlags(b).length > 0)

  const submittedPrenoms = new Set(duJour.map(b => norm(b.prenom)).filter(Boolean))
  const manquants = (equipe || [])
    .map(a => a.prenom)
    .filter(p => p && !submittedPrenoms.has(norm(p)))

  return (
    <div style={{
      marginBottom: 16, padding: 16, borderRadius: 16,
      background: 'white', border: '2px solid #118AB2', boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: '1.05rem', color: '#118AB2' }}>
            📋 Bilans du jour
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 2, textTransform: 'capitalize' }}>
            {new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <span style={{
          fontFamily: 'Fredoka', fontWeight: 800, fontSize: '1.1rem',
          color: duJour.length ? '#0A7A5A' : '#CC6600',
        }}>
          {duJour.length}
          {equipe.length > 0 ? `/${equipe.length}` : ''}
        </span>
      </div>

      {duJour.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 10 }}>
          Aucun bilan reçu pour l’instant.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {duJour.map(b => {
            const flags = alertFlags(b)
            const avg = avgScore(b.scores)
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => (onOpen ? onOpen(b) : navigate(`/bilans/${b.id}`))}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 12,
                  border: flags.includes('incident') ? '1.5px solid #FF6B6B' : '1.5px solid var(--border)',
                  background: flags.includes('incident') ? '#FFF5F5' : 'var(--bg)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{b.prenom} {b.nom}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>{b.tranche_age}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {avg != null && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: scoreColor(avg) }}>★ {avg}/10</span>
                  )}
                  {flags.includes('incident') && <span style={{ fontSize: '0.7rem', color: '#CC3333', fontWeight: 700 }}>⚠️ incident</span>}
                  {flags.includes('materiel') && <span style={{ fontSize: '0.7rem', color: '#CC6600', fontWeight: 700 }}>📦 matériel</span>}
                  {flags.includes('surveiller') && <span style={{ fontSize: '0.7rem', color: '#118AB2', fontWeight: 700 }}>👁 suivi</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {withAlert.length > 0 && (
        <p style={{ fontSize: '0.78rem', color: '#CC3333', fontWeight: 700, marginBottom: 8 }}>
          {withAlert.length} bilan{withAlert.length > 1 ? 's' : ''} avec alerte
        </p>
      )}

      {equipe.length > 0 && (
        <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {manquants.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#0A7A5A', fontWeight: 700 }}>✓ Toute l’équipe a rendu</p>
          ) : (
            <>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#CC6600', marginBottom: 6 }}>
                Pas encore rendu ({manquants.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {manquants.map(p => (
                  <span key={p} style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                    background: '#FFF3E0', color: '#CC6600',
                  }}>{p}</span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showAllLink && (
        <button
          type="button"
          onClick={() => navigate('/bilans')}
          style={{
            width: '100%', marginTop: 12, padding: 10, borderRadius: 10,
            border: '1.5px solid var(--border)', background: 'var(--bg)',
            fontWeight: 700, fontSize: '0.82rem', color: 'var(--text2)',
          }}
        >
          Tous les bilans →
        </button>
      )}
    </div>
  )
}
