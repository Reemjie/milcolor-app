import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const REGLES_SECURITE = [
  '🔢 Compter les enfants avant le départ ET au retour',
  '💧 Emporter de l\'eau pour tous les enfants',
  '🩺 Emporter la trousse de premiers secours',
  '📱 Avoir le téléphone chargé et le numéro du directeur',
  '🗺️ Connaître l\'itinéraire et prévenir le directeur',
  '👀 Maintenir la surveillance constante du groupe',
  '⏰ Respecter l\'heure de retour prévue',
]

export default function Sorties() {
  const { isAdmin } = useAuth()
  const [sorties, setSorties] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showRegles, setShowRegles] = useState(false)
  const [form, setForm] = useState({ activite: '', animateurs: '', enfants: '', nb_enfants: 0 })
  const [saving, setSaving] = useState(false)
  const [pendingForm, setPendingForm] = useState(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => { fetchSorties() }, [])

  useEffect(() => {
    const channel = supabase.channel('sorties_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sorties' }, () => fetchSorties())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchSorties() {
    setLoading(true)
    const { data } = await supabase.from('sorties').select('*').eq('jour', today).order('created_at', { ascending: false })
    setSorties(data || [])
    setLoading(false)
  }

  function handleSubmitForm() {
    if (!form.activite || !form.animateurs || !form.enfants) return
    setPendingForm({ ...form })
    setShowForm(false)
    setShowRegles(true)
  }

  async function confirmerDepart() {
    if (!pendingForm) return
    setSaving(true)
    await supabase.from('sorties').insert([{
      activite: pendingForm.activite,
      animateurs: pendingForm.animateurs,
      enfants: pendingForm.enfants,
      nb_enfants: pendingForm.nb_enfants,
      jour: today,
      statut: 'en_cours',
    }])
    await supabase.from('notifications').insert([{
      titre: `🚶 Sortie — ${pendingForm.activite}`,
      message: `${pendingForm.nb_enfants} enfants avec ${pendingForm.animateurs}`,
      type: 'info', lue: false, lien: '/infos-jour'
    }])
    setSaving(false)
    setShowRegles(false)
    setPendingForm(null)
    setForm({ activite: '', animateurs: '', enfants: '', nb_enfants: 0 })
    fetchSorties()
  }

  async function marquerRetour(id) {
    await supabase.from('sorties').update({ statut: 'rentre', heure_retour: new Date().toISOString() }).eq('id', id)
    fetchSorties()
  }

  async function deleteSortie(id) {
    if (!confirm('Supprimer cette sortie ?')) return
    await supabase.from('sorties').delete().eq('id', id)
    fetchSorties()
  }

  const enCours = sorties.filter(s => s.statut === 'en_cours')
  const rentres = sorties.filter(s => s.statut === 'rentre')
  const totalEnfantsdehors = enCours.reduce((a, s) => a + (s.nb_enfants || 0), 0)

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🚶 Sorties</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Groupes hors du centre</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Sortie</button>
      </div>

      {/* Compteur enfants dehors */}
      {enCours.length > 0 && (
        <div style={{ background: '#FFE8E8', border: '2px solid #FF6B6B', borderRadius: 16, padding: '16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '2rem' }}>🚨</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#CC3333' }}>{totalEnfantsdehors} enfant{totalEnfantsdehors > 1 ? 's' : ''} hors du centre</div>
            <div style={{ fontSize: '0.82rem', color: '#CC3333' }}>{enCours.length} groupe{enCours.length > 1 ? 's' : ''} en sortie</div>
          </div>
        </div>
      )}

      {loading && <div className="spinner" />}

      {/* Sorties en cours */}
      {enCours.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#CC3333', marginBottom: 10 }}>🔴 En cours</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {enCours.map(s => (
              <div key={s.id} style={{ background: '#FFE8E8', border: '2px solid #FF6B6B', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#CC3333', marginBottom: 4 }}>{s.activite}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: 2 }}>👤 {s.animateurs}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: 6 }}>👶 {s.nb_enfants} enfant{s.nb_enfants > 1 ? 's' : ''} : {s.enfants}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>
                      Départ : {new Date(s.heure_depart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => marquerRetour(s.id)} style={{ padding: '8px 12px', borderRadius: 10, background: '#E0FBF1', border: '1.5px solid #06D6A0', color: '#0A7A5A', fontWeight: 700, fontSize: '0.78rem' }}>
                      ✅ Retour
                    </button>
                    {isAdmin && <button onClick={() => deleteSortie(s.id)} style={{ padding: '6px 10px', borderRadius: 10, background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '0.85rem' }}>🗑</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sorties rentrées */}
      {rentres.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0A7A5A', marginBottom: 10 }}>✅ Rentrés</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rentres.map(s => (
              <div key={s.id} style={{ background: '#E0FBF1', border: '1.5px solid #06D6A0', borderRadius: 14, padding: '12px 16px', opacity: 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0A7A5A' }}>{s.activite}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
                      {s.nb_enfants} enfants · {s.animateurs} · retour {new Date(s.heure_retour).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => deleteSortie(s.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4 }}>🗑</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && sorties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚶</div>
          <p style={{ fontWeight: 700 }}>Aucune sortie aujourd'hui</p>
          <p style={{ fontSize: '0.85rem', marginTop: 6 }}>Clique sur "+ Sortie" pour enregistrer un groupe</p>
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>🚶 Nouvelle sortie</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <label style={lStyle}>Activité *</label>
            <input value={form.activite} onChange={e => setForm(f => ({ ...f, activite: e.target.value }))} placeholder="ex: Atelier cuisine, Sortie forêt..." style={iStyle} />
            <label style={lStyle}>Animateur(s) responsable(s) *</label>
            <input value={form.animateurs} onChange={e => setForm(f => ({ ...f, animateurs: e.target.value }))} placeholder="ex: Emma, Marion" style={iStyle} />
            <label style={lStyle}>Noms des enfants *</label>
            <textarea value={form.enfants} onChange={e => setForm(f => ({ ...f, enfants: e.target.value }))} placeholder="ex: Léo M., Manon D., Tom B..." rows={4} style={{ ...iStyle, resize: 'vertical' }} />
            <label style={lStyle}>Nombre d'enfants</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setForm(f => ({ ...f, nb_enfants: Math.max(0, f.nb_enfants - 1) }))} style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg)', border: '2px solid var(--border)', fontSize: '1.3rem', fontWeight: 700 }}>−</button>
              <span style={{ flex: 1, textAlign: 'center', fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Fredoka' }}>{form.nb_enfants}</span>
              <button onClick={() => setForm(f => ({ ...f, nb_enfants: f.nb_enfants + 1 }))} style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--orange)', border: 'none', color: 'white', fontSize: '1.3rem', fontWeight: 700 }}>+</button>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.activite || !form.animateurs || !form.enfants) ? 0.6 : 1 }}
              onClick={handleSubmitForm} disabled={!form.activite || !form.animateurs || !form.enfants}>
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* Modal règles de sécurité */}
      {showRegles && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>⚠️</div>
              <h2 style={{ fontSize: '1.3rem', color: '#CC3333' }}>Avant de partir !</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: 4 }}>Vérifie que tu as bien :</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {REGLES_SECURITE.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFF3EC', borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowRegles(false); setShowForm(true) }} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'var(--bg)', border: '2px solid var(--border)', fontWeight: 700, fontSize: '0.9rem' }}>
                ← Retour
              </button>
              <button className="btn btn-primary" style={{ flex: 2, padding: '13px', opacity: saving ? 0.6 : 1 }} onClick={confirmerDepart} disabled={saving}>
                {saving ? '⏳…' : '✅ C\'est bon, on part !'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
const lStyle = { display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }
const iStyle = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', color: 'var(--text)', marginBottom: 16 }
