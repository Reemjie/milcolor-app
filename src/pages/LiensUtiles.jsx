import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const CATEGORIES = [
  { id: 'reglementation', icon: '⚖️', label: 'Réglementation', color: '#9B5DE5', bg: '#f0edf8' },
  { id: 'pedagogie', icon: '📚', label: 'Pédagogie', color: '#118AB2', bg: '#E8F4FF' },
  { id: 'sante', icon: '🏥', label: 'Santé & Sécurité', color: '#CC3333', bg: '#FFE8E8' },
  { id: 'formation', icon: '🎓', label: 'Formation', color: '#0A7A5A', bg: '#E0FBF1' },
  { id: 'activites', icon: '🎨', label: 'Activités', color: '#FF6B35', bg: '#FFF3EC' },
  { id: 'general', icon: '🔗', label: 'Général', color: '#636E72', bg: '#f5f5f5' },
]

const DEFAULTS = [
  { titre: "Rôles et fonctions en ACM", url: 'https://www.jesuisanimateur.fr/fiches-pratiques/roles-fonctions-acm', description: "Les rôles de chacun dans l'équipe d'animation", categorie: 'pedagogie' },
  { titre: 'Types de séjours ACM', url: 'https://www.jesuisanimateur.fr/fiches-pratiques/types-acm/accueils-de-scoutisme', description: 'Les différents types de séjours en ACM', categorie: 'pedagogie' },
  { titre: 'Réussir vos grands jeux et animations', url: 'https://www.jesuisanimateur.fr/conseils-animation/conseils-pratiques/reussir-vos-grands-jeux-et-animations', description: 'La méthode OSAADRAFRA en 10 étapes', categorie: 'activites' },
  { titre: 'Organiser une sortie avec les enfants', url: 'https://www.jesuisanimateur.fr/conseils-animation/conseils-pratiques/organiser-une-sortie-avec-les-enfants', description: 'Conseils pratiques pour les sorties', categorie: 'pedagogie' },
  { titre: 'Encadrement et qualifications ACM', url: 'https://www.jesuisanimateur.fr/reglementation-acm/encadrement-qualifications/composition-et-qualification-equipe-encadrement', description: "Taux d'encadrement, diplômes requis", categorie: 'reglementation' },
  { titre: 'Transports et déplacements en ACM', url: 'https://www.jesuisanimateur.fr/reglementation-acm', description: 'Règles pour les sorties et transports', categorie: 'reglementation' },
  { titre: 'Activités physiques et sportives en ACM', url: 'https://www.jesuisanimateur.fr/reglementation-acm', description: 'Encadrement des APS en ACM', categorie: 'reglementation' },
  { titre: 'Médicaments en ACM', url: 'https://www.jesuisanimateur.fr/reglementation-acm/sante/medicaments', description: 'Réglementation sur les médicaments', categorie: 'sante' },
  { titre: 'Trousse de secours en ACM', url: 'https://www.jesuisanimateur.fr/reglementation-acm/sante/trousse-de-secours', description: 'Contenu réglementaire de la trousse', categorie: 'sante' },
  { titre: 'Armoire à pharmacie en ACM', url: 'https://www.jesuisanimateur.fr/reglementation-acm/sante/armoire-a-pharmacie', description: 'Réglementation armoire à pharmacie', categorie: 'sante' },
  { titre: 'Est-ce autorisé en ACM ?', url: 'https://www.jesuisanimateur.fr/reglementation-acm/divers/est-ce-autorise', description: 'Démêler le vrai du faux sur la réglementation', categorie: 'reglementation' },
  { titre: 'Accueillir une inspection en ACM', url: 'https://www.jesuisanimateur.fr/reglementation-acm/divers/accueillir-une-inspection-en-acm', description: 'Comment se préparer à une inspection', categorie: 'reglementation' },
  { titre: 'JeSuisAnimateur.fr', url: 'https://www.jesuisanimateur.fr', description: 'Site de référence pour les animateurs ACM', categorie: 'general' },
  { titre: 'Service-public.fr - ACM', url: 'https://www.service-public.fr/particuliers/vosdroits/F2253', description: 'Informations officielles ACM', categorie: 'reglementation' },
  { titre: 'BAFA-BAFD.fr', url: 'https://www.bafa-bafd.fr', description: 'Formations BAFA et BAFD', categorie: 'formation' },
]

export default function LiensUtiles() {
  const { isAdmin } = useAuth()
  const [liens, setLiens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({ titre: '', url: '', description: '', categorie: 'reglementation' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchLiens() }, [])

  async function fetchLiens() {
    setLoading(true)
    const { data } = await supabase.from('liens_utiles').select('*').order('categorie').order('titre')
    setLiens(data || [])
    setLoading(false)
  }

  async function seedLiens() {
    for (const lien of DEFAULTS) {
      await supabase.from('liens_utiles').insert([lien])
      await supabase.from('notifications').insert([{ titre: `🔗 Nouveau lien — ${lien.titre}`, message: lien.description || lien.url, type: 'info', lue: false }])
    }
    fetchLiens()
  }

  async function saveLien() {
    if (!form.titre || !form.url) return
    setSaving(true)
    let url = form.url.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    await supabase.from('notifications').insert([{ titre: `🔗 Nouveau lien — ${form.titre}`, message: form.description || url, type: 'info', lue: false }])
    await supabase.from('liens_utiles').insert([{ ...form, url }])
    setSaving(false)
    setShowForm(false)
    setForm({ titre: '', url: '', description: '', categorie: 'reglementation' })
    fetchLiens()
  }

  async function deleteLien(id) {
    if (!confirm('Supprimer ce lien ?')) return
    await supabase.from('liens_utiles').delete().eq('id', id)
    fetchLiens()
  }

  const filtered = filterCat === 'all' ? liens : liens.filter(l => l.categorie === filterCat)
  const grouped = filtered.reduce((acc, l) => {
    if (!acc[l.categorie]) acc[l.categorie] = []
    acc[l.categorie].push(l)
    return acc
  }, {})

  return (
    <div className="page-enter" style={{ padding: '20px 16px', paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem' }}>🔗 Liens utiles</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Ressources pour les animateurs</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Ajouter</button>}
      </div>

      {!loading && liens.length === 0 && isAdmin && (
        <div style={{ textAlign: 'center', padding: '20px', marginBottom: 16, background: '#E8F4FF', borderRadius: 14 }}>
          <p style={{ fontWeight: 700, color: '#118AB2', marginBottom: 10 }}>📥 Importer les liens ressources-acm.fr ?</p>
          <button onClick={seedLiens} style={{ padding: '10px 20px', borderRadius: 10, background: '#118AB2', color: 'white', fontWeight: 700, fontSize: '0.85rem', border: 'none' }}>
            Importer les liens par défaut
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        <button onClick={() => setFilterCat('all')} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: "2px solid " + (filterCat === 'all' ? 'var(--orange)' : 'var(--border)'), background: filterCat === 'all' ? 'var(--orange)' : 'white', color: filterCat === 'all' ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.75rem' }}>
          Tout ({liens.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = liens.filter(l => l.categorie === cat.id).length
          if (count === 0) return null
          return (
            <button key={cat.id} onClick={() => setFilterCat(cat.id)} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: "2px solid " + (filterCat === cat.id ? cat.color : 'var(--border)'), background: filterCat === cat.id ? cat.bg : 'white', color: filterCat === cat.id ? cat.color : 'var(--text)', fontWeight: 700, fontSize: '0.75rem' }}>
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {loading && <div className="spinner" />}

      {!loading && liens.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔗</div>
          <p style={{ fontWeight: 700 }}>Aucun lien pour l'instant</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {CATEGORIES.map(cat => {
          const items = grouped[cat.id]
          if (!items?.length) return null
          return (
            <div key={cat.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: cat.color }}>{cat.label}</span>
                <div style={{ flex: 1, height: 1, background: cat.color, opacity: 0.2 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(lien => (
                  <div key={lien.id} style={{ background: cat.bg, border: "1.5px solid " + cat.color + "40", borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: cat.color, marginBottom: 2 }}>{lien.titre}</div>
                        {lien.description && <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4 }}>{lien.description}</p>}
                        <a href={lien.url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '7px 14px', borderRadius: 8, background: cat.color, color: 'white', fontWeight: 700, fontSize: '0.78rem', textDecoration: 'none' }}>
                          🌐 Ouvrir
                        </a>
                      </div>
                      {isAdmin && (
                        <button onClick={() => deleteLien(lien.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', opacity: 0.4, fontSize: '1rem', flexShrink: 0 }}>🗑</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 24, padding: '24px 20px', width: '100%', maxWidth: 480, maxHeight: '85dvh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.3rem' }}>🔗 Nouveau lien</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Catégorie</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setForm(f => ({ ...f, categorie: cat.id }))} style={{ padding: '10px 8px', borderRadius: 10, border: "2px solid " + (form.categorie === cat.id ? cat.color : 'var(--border)'), background: form.categorie === cat.id ? cat.bg : 'white', fontWeight: 700, fontSize: '0.78rem', color: form.categorie === cat.id ? cat.color : 'var(--text)' }}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Titre *</label>
            <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} placeholder="ex: Légifrance" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', marginBottom: 16 }} />
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>URL *</label>
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="ex: https://www.legifrance.gouv.fr" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', marginBottom: 16 }} />
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="ex: Textes de loi sur les ACM..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)', marginBottom: 16, resize: 'vertical' }} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', opacity: (!form.titre || !form.url || saving) ? 0.6 : 1 }}
              onClick={saveLien} disabled={!form.titre || !form.url || saving}>
              {saving ? '⏳…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
