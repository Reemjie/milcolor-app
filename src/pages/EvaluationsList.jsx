import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const MOMENTS = {
  avant: { label: 'Avant', color: '#118AB2', bg: '#E8F4FF' },
  pendant: { label: 'Pendant', color: '#FF9F43', bg: '#FFF3E0' },
  apres: { label: 'Après', color: '#06D6A0', bg: '#E0FBF1' },
}

export default function EvaluationsList() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [evals, setEvals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchEvals() }, [])

  async function fetchEvals() {
    setLoading(true)
    const { data } = await supabase.from('evaluations_bafa').select('*').order('stagiaire_nom').order('created_at')
    setEvals(data || [])
    setLoading(false)
  }

  async function deleteEval(id) {
    if (!confirm('Supprimer cette évaluation ?')) return
    await supabase.from('evaluations_bafa').delete().eq('id', id)
    fetchEvals()
  }

  const grouped = evals.reduce((acc, e) => {
    const key = `${e.stagiaire_prenom} ${e.stagiaire_nom}`
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  function avgScore(scores) {
    const vals = Object.values(scores || {}).filter(v => v > 0)
    if (!vals.length) return null
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>⭐ Évaluations BAFA</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>{Object.keys(grouped).length} stagiaire{Object.keys(grouped).length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/evaluations-bafa/nouvelle')}>+ Évaluation</button>
      </div>

      {loading && <div className="spinner" />}

      {!loading && evals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⭐</div>
          <p style={{ fontWeight: 700 }}>Aucune évaluation</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Les stagiaires peuvent remplir leur auto-évaluation</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/evaluations-bafa/nouvelle')}>+ Nouvelle évaluation</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(grouped).map(([stagiaire, evList]) => (
          <div key={stagiaire} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'var(--bg)', padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {stagiaire.charAt(0)}
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{stagiaire}</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['avant', 'pendant', 'apres'].map(m => {
                const ev = evList.find(e => e.moment === m)
                const mom = MOMENTS[m]
                return (
                  <div key={m} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10,
                    background: ev ? mom.bg : 'var(--bg)',
                    border: `1.5px solid ${ev ? mom.color : 'var(--border)'}`,
                    cursor: ev ? 'pointer' : 'default',
                  }} onClick={() => ev && navigate(`/evaluations-bafa/${ev.id}`)}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev ? mom.color : 'var(--border)', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: ev ? mom.color : 'var(--text2)', flex: 1 }}>{mom.label}</span>
                    {ev ? (
                      <>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: mom.color }}>{avgScore(ev.scores)}/4</span>
                        {isAdmin && <button onClick={e => { e.stopPropagation(); deleteEval(ev.id) }} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '0.85rem' }}>🗑</button>}
                      </>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Non remplie</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
