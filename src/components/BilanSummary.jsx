import {
  SCORE_ITEMS,
  CHECK_ITEMS,
  avgScore,
  scoreColor,
  scoreComment,
  isNewFormat,
  alertFlags,
} from '../lib/bilan'

/** Aperçu compact pour listes. */
export function BilanListPreview({ b }) {
  const flags = alertFlags(b)
  const avg = avgScore(b.scores)
  return (
    <div>
      {isNewFormat(b) ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {avg != null && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 20,
              background: '#FFF3EC', color: scoreColor(avg),
            }}>
              ★ {avg}/10
            </span>
          )}
          {SCORE_ITEMS.map(i => typeof b.scores?.[i.key] === 'number' && (
            <span key={i.key} style={{ fontSize: '0.7rem', color: 'var(--text2)', fontWeight: 600 }}>
              {i.icon}{b.scores[i.key]}
            </span>
          ))}
          {flags.includes('incident') && <span style={{ fontSize: '0.7rem', color: '#CC3333', fontWeight: 700 }}>⚠️ incident</span>}
          {flags.includes('materiel') && <span style={{ fontSize: '0.7rem', color: '#CC6600', fontWeight: 700 }}>📦 matériel</span>}
          {flags.includes('surveiller') && <span style={{ fontSize: '0.7rem', color: '#118AB2', fontWeight: 700 }}>👁 suivi</span>}
        </div>
      ) : (
        <>
          {b.activites_realisees && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 6, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              🧩 {b.activites_realisees}
            </p>
          )}
          {b.incidents && (
            <p style={{ fontSize: '0.75rem', color: '#CC3333', marginTop: 4 }}>⚠️ {b.incidents.slice(0, 60)}{b.incidents.length > 60 ? '…' : ''}</p>
          )}
        </>
      )}
    </div>
  )
}

/** Détail complet (modal / page). */
export function BilanDetail({ b }) {
  if (!isNewFormat(b)) {
    return (
      <>
        {[
          { label: '🧩 Activités réalisées', val: b.activites_realisees },
          { label: '👍 Appréciées / moins bien', val: b.activites_appreciees },
          { label: '📦 Matériel manquant', val: b.materiel_manquant },
          { label: '⚠️ Difficultés', val: b.difficultes },
          { label: '🚨 Incidents', val: b.incidents },
          { label: '😊 Ambiance', val: b.ambiance },
          { label: '👁 Enfants à surveiller', val: b.enfants_surveiller },
          { label: '💡 Suggestions', val: b.suggestions_activites },
          { label: '📝 Autres remarques', val: b.autres_remarques },
        ].filter(f => f.val).map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>{f.label}</div>
            <div style={box}>{f.val}</div>
          </div>
        ))}
      </>
    )
  }

  const avg = avgScore(b.scores)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        {SCORE_ITEMS.map(i => {
          const n = b.scores?.[i.key]
          return (
            <div key={i.key} style={{
              textAlign: 'center', padding: '12px 6px', borderRadius: 12,
              background: 'var(--bg)', border: '1.5px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text2)', fontWeight: 700, marginBottom: 4 }}>{i.icon} {i.label.split(' ')[0]}</div>
              <div style={{ fontFamily: 'Fredoka', fontSize: '1.5rem', fontWeight: 700, color: scoreColor(n) }}>
                {n != null ? n : '—'}
              </div>
            </div>
          )
        })}
      </div>
      {avg != null && (
        <p style={{ textAlign: 'center', fontWeight: 800, color: scoreColor(avg), marginBottom: 12, fontFamily: 'Fredoka' }}>
          Moyenne {avg}/10
        </p>
      )}
      {SCORE_ITEMS.map(i => {
        const cmt = scoreComment(b.scores, i.key)
        if (!cmt) return null
        return (
          <div key={`c-${i.key}`} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: 4, color: 'var(--text2)' }}>
              {i.icon} {i.label} — {b.scores?.[i.key]}/10
            </div>
            <div style={box}>{cmt}</div>
          </div>
        )
      })}

      {CHECK_ITEMS.map(item => {
        const v = b.checks?.[item.key]
        if (!v) return null
        if (typeof v.oui !== 'boolean') return null
        return (
          <div key={item.key} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>
              {item.icon} {item.label.replace(' ?', '')} —{' '}
              <span style={{ color: v.oui ? item.yesColor : '#0A7A5A' }}>{v.oui ? 'Oui' : 'Non'}</span>
            </div>
            {v.oui && v.comment && <div style={box}>{v.comment}</div>}
          </div>
        )
      })}

      {b.activites_realisees && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>🧩 Activités</div>
          <div style={box}>{b.activites_realisees}</div>
        </div>
      )}
    </>
  )
}

const box = {
  fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)',
  background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', whiteSpace: 'pre-wrap',
}
