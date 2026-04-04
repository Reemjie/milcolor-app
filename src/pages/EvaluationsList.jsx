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
  const [loading, setLoading] = useState(false)
  const [searchNom, setSearchNom] = useState('')
  const [searchPrenom, setSearchPrenom] = useState('')
  const [searchPin, setSearchPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [searched, setSearched] = useState(false)
  const [myEvals, setMyEvals] = useState([])

  useEffect(() => { if (isAdmin) fetchEvals() }, [isAdmin])

  async function fetchEvals() {
    setLoading(true)
    const { data } = await supabase.from('evaluations_bafa').select('*').order('stagiaire_nom').order('created_at')
    setEvals(data || [])
    setLoading(false)
  }

  async function searchMyEvals() {
    if (!searchNom || !searchPrenom || searchPin.length < 4) return
    setLoading(true)
    setPinError(false)
    const { data } = await supabase.from('evaluations_bafa').select('*')
      .ilike('stagiaire_nom', `%${searchNom.trim()}%`)
      .ilike('stagiaire_prenom', `%${searchPrenom.trim()}%`)
      .eq('pin', searchPin.trim())
      .order('created_at')
    if (!data || data.length === 0) {
      setPinError(true)
      setLoading(false)
      return
    }
    setMyEvals(data)
    setSearched(true)
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
          {isAdmin && <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>{Object.keys(grouped).length} stagiaire{Object.keys(grouped).length > 1 ? 's' : ''}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/evaluations-bafa/nouvelle')}>+ Évaluation</button>
      </div>

      {loading && <div className="spinner" />}

      {/* Espace animateur */}
      {!isAdmin && !searched && (
        <div style={{ background: 'white', borderRadius: 16, padding: '24px 20px', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 12 }}>⭐</div>
          <p style={{ textAlign: 'center', fontWeight: 700, marginBottom: 4 }}>Retrouve ton évaluation</p>
          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 16 }}>Entre ton nom et prénom pour accéder à tes auto-évaluations</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.82rem' }}>Prénom</label>
              <input value={searchPrenom} onChange={e => setSearchPrenom(e.target.value)} placeholder="ex: Emma"
                style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.82rem' }}>Nom</label>
              <input value={searchNom} onChange={e => setSearchNom(e.target.value)} placeholder="ex: DUPONT"
                style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)' }} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.82rem' }}>Code PIN</label>
            <input value={searchPin} onChange={e => { setSearchPin(e.target.value.replace(/\D/g,'').slice(0,4)); setPinError(false) }}
              placeholder="4 chiffres" maxLength={4} inputMode="numeric"
              style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: `2px solid ${pinError ? '#e74c3c' : 'var(--border)'}`, fontSize: '1.1rem', background: 'var(--bg)', letterSpacing: '0.3em', textAlign: 'center' }}
              onKeyDown={e => e.key === 'Enter' && searchMyEvals()} />
            {pinError && <p style={{ color: '#e74c3c', fontSize: '0.78rem', marginTop: 4 }}>⚠️ PIN incorrect ou nom introuvable</p>}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', padding: '13px', opacity: (!searchNom || !searchPrenom || searchPin.length < 4) ? 0.6 : 1 }}
            onClick={searchMyEvals} disabled={!searchNom || !searchPrenom || searchPin.length < 4}>
            🔍 Voir mes évaluations
          </button>
        </div>
      )}

      {/* Résultats animateur */}
      {!isAdmin && searched && (
        <div>
          <button onClick={() => { setSearched(false); setMyEvals([]) }} style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '7px 14px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 16 }}>← Retour</button>
          {myEvals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <p style={{ fontWeight: 700 }}>Aucune évaluation trouvée</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['avant', 'pendant', 'apres'].map(m => {
                const ev = myEvals.find(e => e.moment === m)
                const mom = MOMENTS[m]
                return (
                  <div key={m} style={{ background: ev ? mom.bg : 'var(--bg)', border: `1.5px solid ${ev ? mom.color : 'var(--border)'}`, borderRadius: 14, padding: '14px 16px', cursor: ev ? 'pointer' : 'default' }}
                    onClick={() => ev && navigate(`/evaluations-bafa/${ev.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev ? mom.color : 'var(--border)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: ev ? mom.color : 'var(--text2)', flex: 1 }}>{mom.label}</span>
                      {ev ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: mom.color }}>Voir →</span>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); navigate('/evaluations-bafa/nouvelle') }} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--orange)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.75rem' }}>+ Remplir</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Liste directeur */}
      {isAdmin && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {evals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>⭐</div>
              <p style={{ fontWeight: 700 }}>Aucune évaluation</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/evaluations-bafa/nouvelle')}>+ Nouvelle évaluation</button>
            </div>
          )}
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
                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: ev ? mom.bg : 'var(--bg)', border: `1.5px solid ${ev ? mom.color : 'var(--border)'}`, cursor: ev ? 'pointer' : 'default' }}
                      onClick={() => ev && navigate(`/evaluations-bafa/${ev.id}`)}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev ? mom.color : 'var(--border)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: ev ? mom.color : 'var(--text2)', flex: 1 }}>{mom.label}</span>
                      {ev ? (
                        <>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: mom.color }}>{avgScore(ev.scores)}/4</span>
                          <button onClick={e => { e.stopPropagation(); deleteEval(ev.id) }} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '0.85rem' }}>🗑</button>
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
      )}
    </div>
  )
}
