import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const SECTIONS = [
  { id: 'projet_peda', icon: '📚', label: 'Projet pédagogique', color: 'var(--green)', bg: '#E0FBF1', placeholder: 'Décris ici le projet pédagogique...' },
  { id: 'attentes', icon: '🎯', label: 'Attentes du directeur', color: 'var(--orange)', bg: '#FFF3EC', placeholder: 'Exprime ici tes attentes envers les animateurs...' },
  { id: 'infos_pratiques', icon: 'ℹ️', label: 'Infos pratiques', color: 'var(--blue)', bg: '#E8F4FF', placeholder: 'Horaires, contacts utiles, procédures...' },
]

export default function Documents() {
  const { isAdmin } = useAuth()
  const [docs, setDocs] = useState({})
  const [loading, setLoading] = useState(true)
  const [editSection, setEditSection] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)
  const [pdfs, setPdfs] = useState([])

  useEffect(() => { fetchDocs(); fetchPdfs() }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*')
    const map = {}
    ;(data || []).forEach(d => { map[d.section_id] = d })
    setDocs(map)
    setLoading(false)
  }

  async function fetchPdfs() {
    const { data } = await supabase.storage.from('documents').list('pdfs', { sortBy: { column: 'created_at', order: 'desc' } })
    setPdfs(data || [])
  }

  async function uploadPdf(e) {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return
    setUploading(true)
    const filename = `pdfs/${Date.now()}_${file.name}`
    await supabase.storage.from('documents').upload(filename, file)
    setUploading(false)
    fetchPdfs()
    e.target.value = ''
  }

  async function deletePdf(name) {
    if (!confirm(`Supprimer "${name}" ?`)) return
    await supabase.storage.from('documents').remove([`pdfs/${name}`])
    fetchPdfs()
  }

  function getPdfUrl(name) {
    const { data } = supabase.storage.from('documents').getPublicUrl(`pdfs/${name}`)
    return data.publicUrl
  }

  async function saveDoc() {
    setSaving(true)
    const existing = docs[editSection]
    if (existing) {
      await supabase.from('documents').update({ contenu: editContent, updated_at: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabase.from('documents').insert([{ section_id: editSection, contenu: editContent }])
    }
    setSaving(false)
    setEditSection(null)
    fetchDocs()
  }

  const section = SECTIONS.find(s => s.id === activeSection)
  const doc = docs[activeSection]

  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.6rem' }}>📁 Documents</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>Projet pédagogique & ressources</p>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', borderRadius: 14,
            border: `2px solid ${activeSection === s.id ? s.color : 'var(--border)'}`,
            background: activeSection === s.id ? s.bg : 'white',
            textAlign: 'left', transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: activeSection === s.id ? s.color : 'var(--text)' }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 2 }}>
                {docs[s.id] ? `Mis à jour ${new Date(docs[s.id].updated_at || docs[s.id].created_at).toLocaleDateString('fr-FR')}` : 'Non renseigné'}
              </div>
            </div>
            <span style={{ color: 'var(--text2)' }}>›</span>
          </button>
        ))}

        {/* PDF section tab */}
        <button onClick={() => setActiveSection('pdfs')} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: 14,
          border: `2px solid ${activeSection === 'pdfs' ? '#9B5DE5' : 'var(--border)'}`,
          background: activeSection === 'pdfs' ? '#f0edf8' : 'white',
          textAlign: 'left', transition: 'all 0.2s',
        }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>📄</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: activeSection === 'pdfs' ? '#9B5DE5' : 'var(--text)' }}>Documents PDF</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 2 }}>{pdfs.length} fichier{pdfs.length > 1 ? 's' : ''}</div>
          </div>
          <span style={{ color: 'var(--text2)' }}>›</span>
        </button>
      </div>

      {/* Content */}
      {loading ? <div className="spinner" /> : (
        <>
          {/* Text sections */}
          {activeSection !== 'pdfs' && section && (
            <div className="card" style={{ overflow: 'visible' }}>
              <div style={{
                background: section.bg, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: '16px 16px 0 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.4rem' }}>{section.icon}</span>
                  <span style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', fontWeight: 600, color: section.color }}>{section.label}</span>
                </div>
                {isAdmin && (
                  <button onClick={() => { setEditSection(activeSection); setEditContent(doc?.contenu || '') }} style={{
                    background: 'white', border: `1.5px solid ${section.color}`,
                    borderRadius: 8, padding: '6px 14px',
                    fontWeight: 700, fontSize: '0.8rem', color: section.color,
                  }}>✏️ Modifier</button>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                {doc?.contenu ? (
                  <div style={{ fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{doc.contenu}</div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{section.icon}</div>
                    <p style={{ fontWeight: 700 }}>Pas encore de contenu</p>
                    {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Clique sur "Modifier" pour rédiger</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF section */}
          {activeSection === 'pdfs' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ background: '#f0edf8', padding: '16px 20px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', fontWeight: 600, color: '#9B5DE5' }}>📄 Documents PDF</span>
                {isAdmin && (
                  <label style={{
                    background: 'white', border: '1.5px solid #9B5DE5',
                    borderRadius: 8, padding: '6px 14px',
                    fontWeight: 700, fontSize: '0.8rem', color: '#9B5DE5', cursor: 'pointer',
                  }}>
                    {uploading ? '⏳ Upload…' : '+ Ajouter un PDF'}
                    <input type="file" accept="application/pdf" onChange={uploadPdf} style={{ display: 'none' }} disabled={uploading} />
                  </label>
                )}
              </div>

              <div style={{ padding: '16px' }}>
                {pdfs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📄</div>
                    <p style={{ fontWeight: 700 }}>Aucun PDF pour l'instant</p>
                    {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Clique sur "+ Ajouter un PDF"</p>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pdfs.map(pdf => (
                      <div key={pdf.name} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12,
                        border: '1.5px solid var(--border)', background: 'var(--bg)',
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: '#f0edf8', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.3rem', flexShrink: 0,
                        }}>📄</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pdf.name.replace(/^\d+_/, '')}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: 2 }}>
                            {pdf.metadata?.size ? `${Math.round(pdf.metadata.size / 1024)} Ko` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <a href={getPdfUrl(pdf.name)} target="_blank" rel="noreferrer" style={{
                            padding: '7px 12px', borderRadius: 8,
                            background: '#9B5DE5', color: 'white',
                            fontWeight: 700, fontSize: '0.78rem',
                            textDecoration: 'none',
                          }}>👁 Ouvrir</a>
                          {isAdmin && (
                            <button onClick={() => deletePdf(pdf.name)} style={{
                              padding: '7px 10px', borderRadius: 8,
                              background: '#fff0f0', border: '1.5px solid #f5c6cb',
                              color: '#e74c3c', fontWeight: 700, fontSize: '0.78rem',
                            }}>🗑</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editSection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setEditSection(null)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px', width: '100%', height: '90dvh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.2rem' }}>
                {SECTIONS.find(s => s.id === editSection)?.icon} {SECTIONS.find(s => s.id === editSection)?.label}
              </h2>
              <button onClick={() => setEditSection(null)} style={{ background: 'var(--bg)', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700 }}>✕</button>
            </div>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              placeholder={SECTIONS.find(s => s.id === editSection)?.placeholder}
              style={{ flex: 1, width: '100%', padding: '14px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '0.9rem', lineHeight: 1.6, resize: 'none', background: 'var(--bg)' }} />
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', marginTop: 12, opacity: saving ? 0.6 : 1 }}
              onClick={saveDoc} disabled={saving}>
              {saving ? '⏳ Enregistrement…' : '💾 Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
