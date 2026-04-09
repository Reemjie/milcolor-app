import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Accueil() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [alertes, setAlertes] = useState([])

  useEffect(() => {
    async function fetchAlertes() {
      const { data: msgs } = await supabase.from('remarques').select('*').eq('categorie', 'urgent').order('created_at', { ascending: false }).limit(5)
      const { data: notifs } = await supabase.from('notifications').select('*').eq('lue', false).order('created_at', { ascending: false }).limit(3)
      const all = [
        ...(msgs || []).map(m => ({ ...m, _type: 'chat' })),
        ...(notifs || []).map(n => ({ ...n, _type: 'notif' })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAlertes(all)
    }
    fetchAlertes()
  }, [])
  const [notifs, setNotifs] = useState([])
  const [bilans, setBilans] = useState([])
  const [bilanOuvert, setBilanOuvert] = useState(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    fetchNotifs()
    fetchAlertes()
    if (isAdmin) fetchBilans()
  }, [isAdmin])

  async function fetchBilans() {
    const { data } = await supabase.from('bilans').select('*').order('jour', { ascending: false }).order('created_at', { ascending: false }).limit(20)
    setBilans(data || [])
  }

  async function saveNote(id) {
    setSavingNote(true)
    await supabase.from('bilans').update({ notes_directeur: note }).eq('id', id)
    setSavingNote(false)
    setBilanOuvert(null)
    fetchBilans()
  }

  async function deleteBilan(id) {
    if (!confirm('Supprimer ce bilan ?')) return
    await supabase.from('bilans').delete().eq('id', id)
    setBilanOuvert(null)
    fetchBilans()
  }

  async function fetchNotifs() {
    const { data } = await supabase.from('notifications').select('*').eq('lue', false).order('created_at', { ascending: false }).limit(3)
    setNotifs(data || [])
  }

  async function fetchAlertes() {
    const { data } = await supabase.from('materiel').select('*').eq('statut', 'alerte').order('created_at', { ascending: false }).limit(2)
    setAlertes(data || [])
  }

  const now = new Date()
  const heure = now.getHours()
  const salut = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir'
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const quickActions = [
    { icon: '📅', label: 'Planning\nsemaine',   to: '/plannings',    color: '#06D6A0', bg: '#E0FBF1' },
    { icon: '🎨', label: 'Animations',           to: '/session',      color: '#9B5DE5', bg: '#f0edf8' },
    { icon: '🎯', label: 'Objectifs\nsession',  to: '/objectifs',    color: '#CC6600', bg: '#FFF3E0' },
    { icon: '🎪', label: 'Grands\njeux',            to: '/grands-jeux',  color: '#9B5DE5', bg: '#f0edf8' },
    { icon: '📋', label: 'Bilans\njournée',      to: '/bilans',       color: '#118AB2', bg: '#E8F4FF' },
    { icon: '👶', label: 'Infos\nenfants',      to: '/infos-enfants', color: '#FF6B9D', bg: '#FBEAF0' },
  ]

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem' }}>{salut} 👋</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2, textTransform: 'capitalize' }}>{dateStr}</p>
      </div>

      {/* Alertes urgentes */}
      {alertes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {alertes.map(a => (
            <div key={a.id} onClick={() => navigate('/materiel')} style={{
              background: '#FFF3E0', border: '2px solid #FF9F43',
              borderRadius: 14, padding: '12px 16px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <span style={{ fontSize: '1.3rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#CC6600' }}>Alerte matériel</div>
                <div style={{ fontSize: '0.78rem', color: '#CC6600' }}>{a.nom}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications */}
      {notifs.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {notifs.map(n => (
            <div key={n.id} onClick={() => navigate('/notifications')} style={{
              background: n.type === 'urgent' ? '#FFE8E8' : '#E8F4FF',
              border: `2px solid ${n.type === 'urgent' ? '#FF6B6B' : '#74B9FF'}`,
              borderRadius: 14, padding: '12px 16px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <span style={{ fontSize: '1.3rem' }}>{n.type === 'urgent' ? '🚨' : '🔔'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{n.titre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text2)', fontWeight: 700 }}>Accès rapide</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {quickActions.map(a => (
            <button key={a.to} onClick={() => navigate(a.to)} style={{
              background: a.bg, border: 'none', borderRadius: 14,
              padding: '16px 8px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6, cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.95)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '1.6rem' }}>{a.icon}</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: a.color, textAlign: 'center', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bilans directeur */}
      {isAdmin && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', color: 'var(--text2)', fontWeight: 700 }}>📋 Bilans des animateurs</h2>
            <button onClick={() => navigate('/bilans')} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange)', background: 'none', border: 'none' }}>Tous →</button>
          </div>
          {bilans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', background: 'white', borderRadius: 14, color: 'var(--text2)', fontSize: '0.85rem' }}>
              Aucun bilan pour l'instant
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bilans.slice(0, 5).map(b => (
                <div key={b.id} onClick={() => { setBilanOuvert(b); setNote(b.notes_directeur || '') }}
                  style={{ background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow)', cursor: 'pointer', border: b.notes_directeur ? '2px solid var(--green)' : '2px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                        {b.prenom?.charAt(0)}{b.nom?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.prenom} {b.nom}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>
                          {new Date(b.jour + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {b.tranche_age}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {b.notes_directeur && <span style={{ fontSize: '0.7rem', background: '#E0FBF1', color: '#0A7A5A', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✏️ Noté</span>}
                      <span style={{ color: 'var(--text2)', fontSize: '1rem' }}>›</span>
                    </div>
                  </div>
                  {b.incidents && <p style={{ marginTop: 8, fontSize: '0.75rem', color: '#CC3333' }}>⚠️ {b.incidents.slice(0, 80)}{b.incidents.length > 80 ? '…' : ''}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal bilan */}
      {bilanOuvert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setBilanOuvert(null)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem' }}>📋 {bilanOuvert.prenom} {bilanOuvert.nom}</h2>
              <button onClick={() => setBilanOuvert(null)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: 16 }}>
              📅 {new Date(bilanOuvert.jour + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {bilanOuvert.tranche_age}
            </p>

            {[
              { label: '🧩 Activités réalisées', val: bilanOuvert.activites_realisees },
              { label: '👍 Appréciées / moins bien', val: bilanOuvert.activites_appreciees },
              { label: '📦 Matériel manquant', val: bilanOuvert.materiel_manquant },
              { label: '⚠️ Difficultés', val: bilanOuvert.difficultes },
              { label: '🚨 Incidents', val: bilanOuvert.incidents },
              { label: '😊 Ambiance', val: bilanOuvert.ambiance },
              { label: '👁 Enfants à surveiller', val: bilanOuvert.enfants_surveiller },
              { label: '💡 Suggestions activités', val: bilanOuvert.suggestions_activites },
              { label: '📝 Autres remarques', val: bilanOuvert.autres_remarques },
            ].filter(f => f.val).map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text)', background: 'var(--bg)', borderRadius: 10, padding: '10px 12px', whiteSpace: 'pre-wrap' }}>{f.val}</div>
              </div>
            ))}

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 8 }}>✏️ Mes notes (bilan fin de semaine)</label>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Points importants à aborder en bilan de fin de semaine…"
                rows={4} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.88rem', lineHeight: 1.5, resize: 'vertical', background: 'var(--bg)', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => saveNote(bilanOuvert.id)} disabled={savingNote}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'var(--green)', color: 'white', fontWeight: 700, fontSize: '0.88rem', border: 'none', opacity: savingNote ? 0.6 : 1 }}>
                  {savingNote ? '⏳…' : '💾 Enregistrer la note'}
                </button>
                <button onClick={() => deleteBilan(bilanOuvert.id)}
                  style={{ padding: '12px 16px', borderRadius: 10, background: '#fff0f0', border: '1.5px solid #f5c6cb', color: '#e74c3c', fontWeight: 700, fontSize: '0.88rem' }}>
                  🗑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Évaluations BAFA — visible par tous */}
      <button onClick={() => navigate('/evaluations-bafa')} style={{
        background: '#f0edf8', border: '2px solid #9B5DE5',
        borderRadius: 14, padding: '14px 16px', width: '100%',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
      }}>
        <span style={{ fontSize: '1.5rem' }}>⭐</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#9B5DE5' }}>Évaluations BAFA</div>
          <div style={{ fontSize: '0.78rem', color: '#9B5DE5' }}>{isAdmin ? 'Voir toutes les évaluations' : 'Mon auto-évaluation'}</div>
        </div>
      </button>

      <button onClick={() => navigate('/liens-utiles')} style={{ background: '#E8F4FF', border: '2px solid #118AB2', borderRadius: 14, padding: '14px 16px', width: '100%', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: '1.5rem' }}>🔗</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#118AB2' }}>Liens utiles</div>
          <div style={{ fontSize: '0.78rem', color: '#118AB2' }}>Réglementation, pédagogie, ressources</div>
        </div>
      </button>

      {/* Boutons urgences / objectifs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => navigate('/urgences')} style={{
          background: '#FFE8E8', border: '2px solid #FF6B6B',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1.5rem' }}>🚨</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#CC3333' }}>Sécurité & urgences</div>
            <div style={{ fontSize: '0.78rem', color: '#CC3333' }}>Numéros et procédures d'urgence</div>
          </div>
        </button>

        {alertes.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '1.1rem' }}>🚨</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#CC3333' }}>Alertes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertes.map(a => (
              <div key={a.id} style={{ background: '#FFE8E8', border: '1.5px solid #FF6B6B', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{a._type === 'notif' ? '🔔' : '🚨'}</span>
                  <div style={{ flex: 1 }}>
                    {a._type === 'notif' && <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#CC3333', marginBottom: 2 }}>{a.titre}</div>}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.4 }}>{a._type === 'notif' ? a.message : a.contenu}</p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: 4 }}>
                      {a._type === 'chat' && a.auteur && <span>👤 {a.auteur} · </span>}
                      {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      </div>
    </div>
  )
}
