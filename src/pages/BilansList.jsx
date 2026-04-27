import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function BilansList() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [bilans, setBilans] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('bilans')

  useEffect(() => { fetchBilans() }, [])

  async function fetchBilans() {
    setLoading(true)
    const { data } = await supabase.from('bilans').select('*').order('jour', { ascending: false }).order('created_at', { ascending: false })
    setBilans(data || [])
    setLoading(false)
  }

  async function deleteBilan(id) {
    if (!confirm('Supprimer ce bilan ?')) return
    await supabase.from('bilans').delete().eq('id', id)
    fetchBilans()
  }

  const grouped = bilans.reduce((acc, b) => {
    const key = b.jour
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>📋 Bilans</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>{bilans.length} bilan{bilans.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/bilans/nouveau')}>+ Bilan</button>
      </div>

      {/* Onglets directeur */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setActiveTab('bilans')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${activeTab === 'bilans' ? '#118AB2' : 'var(--border)'}`, background: activeTab === 'bilans' ? '#E8F4FF' : 'white', fontWeight: 700, fontSize: '0.85rem', color: activeTab === 'bilans' ? '#118AB2' : 'var(--text2)' }}>
            📋 Bilans
          </button>
          <button onClick={() => setActiveTab('notes')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${activeTab === 'notes' ? '#9B5DE5' : 'var(--border)'}`, background: activeTab === 'notes' ? '#f0edf8' : 'white', fontWeight: 700, fontSize: '0.85rem', color: activeTab === 'notes' ? '#9B5DE5' : 'var(--text2)' }}>
            📝 À aborder en réunion
          </button>
        </div>
      )}

      {/* Onglet notes directeur */}
      {isAdmin && activeTab === 'notes' && !loading && (
        <div>
          {bilans.filter(b => b.notes_directeur && b.notes_directeur.trim()).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📝</div>
              <p style={{ fontWeight: 700 }}>Aucune note pour l'instant</p>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Tes notes sur les bilans apparaîtront ici</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bilans.filter(b => b.notes_directeur && b.notes_directeur.trim()).map(b => (
                <div key={b.id} style={{ background: '#f0edf8', border: '1.5px solid #C084FC', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#9B5DE5' }}>👤 {b.prenom} {b.nom}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text2)', marginLeft: 'auto' }}>{new Date(b.jour).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{b.notes_directeur}</p>
                  <button onClick={() => navigate(`/bilans/${b.id}`)} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, background: '#9B5DE5', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.78rem' }}>
                    Voir le bilan →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bilans' && loading && <div className="spinner" />}
      {activeTab === 'notes' && loading && <div className="spinner" />}
      {activeTab === 'bilans' && !loading && bilans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <p style={{ fontWeight: 700 }}>Aucun bilan pour l'instant</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Clique sur "+ Bilan" pour remplir le premier</p>
        </div>
      )}

      {Object.entries(grouped).map(([jour, items]) => (
        <div key={jour} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
              📅 {new Date(jour + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(b => (
              <div key={b.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => navigate(`/bilans/${b.id}`)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {b.prenom?.charAt(0)?.toUpperCase()}{b.nom?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.prenom} {b.nom}</div>
                        <span className="tag" style={{ background: '#f0edf8', color: '#764ba2', fontSize: '0.68rem' }}>{b.tranche_age}</span>
                      </div>
                    </div>
                    {b.activites_realisees && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        🧩 {b.activites_realisees}
                      </p>
                    )}
                    {b.incidents && (
                      <p style={{ fontSize: '0.75rem', color: '#CC3333', marginTop: 4 }}>⚠️ {b.incidents.slice(0, 60)}{b.incidents.length > 60 ? '…' : ''}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {isAdmin && (
                      <button onClick={e => { e.stopPropagation(); deleteBilan(b.id) }} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '0.9rem' }}>🗑</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
