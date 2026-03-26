import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

const CATS = [
  { id: 'general', label: '💬 Général', color: '#118AB2', bg: '#E8F4FF' },
  { id: 'bilan', label: '📊 Bilan', color: '#06D6A0', bg: '#E0FBF1' },
  { id: 'urgent', label: '🚨 Urgent', color: '#FF4444', bg: '#FFE8E8' },
  { id: 'idee', label: '💡 Idée', color: '#FF9F43', bg: '#FFF3E0' },
]

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Chat() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [auteur, setAuteur] = useState(sessionStorage.getItem('chat_auteur') || '')
  const [texte, setTexte] = useState('')
  const [cat, setCat] = useState('general')
  const [showAuteur, setShowAuteur] = useState(!sessionStorage.getItem('chat_auteur'))
  const [filterCat, setFilterCat] = useState('all')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    const channel = supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remarques' }, () => fetchMessages()).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function fetchMessages() {
    setLoading(true)
    const { data } = await supabase.from('remarques').select('*').order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  async function sendMessage() {
    if (!texte.trim() || !auteur.trim()) return
    setSending(true)
    sessionStorage.setItem('chat_auteur', auteur)
    await supabase.from('remarques').insert([{ auteur: auteur.trim(), contenu: texte.trim(), categorie: cat, date_journee: new Date().toISOString().slice(0, 10) }])
    setTexte('')
    setSending(false)
    fetchMessages()
  }

  async function deleteMessage(id) {
    if (!confirm('Supprimer ce message ?')) return
    await supabase.from('remarques').delete().eq('id', id)
    fetchMessages()
  }

  const filtered = filterCat === 'all' ? messages : messages.filter(m => m.categorie === filterCat)

  if (showAuteur) {
    return (
      <div className="page-enter" style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>💬</div>
        <h2 style={{ marginBottom: 8 }}>Comment tu t'appelles ?</h2>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: 24, textAlign: 'center' }}>Ton prénom apparaîtra sur tes messages</p>
        <input value={auteur} onChange={e => setAuteur(e.target.value)} placeholder="ex: Emma" style={{ width: '100%', maxWidth: 300, padding: '14px 16px', borderRadius: 12, border: '2px solid var(--border)', fontSize: '1rem', textAlign: 'center', marginBottom: 16 }} onKeyDown={e => e.key === 'Enter' && auteur && setShowAuteur(false)} />
        <button className="btn btn-primary" style={{ padding: '12px 32px', opacity: !auteur ? 0.6 : 1 }} onClick={() => { sessionStorage.setItem('chat_auteur', auteur); setShowAuteur(false) }} disabled={!auteur}>
          C'est parti 🚀
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 130px)' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>💬 Chat & remarques</h1>
            <button onClick={() => setShowAuteur(true)} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--text2)', padding: 0, cursor: 'pointer' }}>
              👤 {auteur} · changer
            </button>
          </div>

        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          <button onClick={() => setFilterCat('all')} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: `2px solid ${filterCat === 'all' ? 'var(--orange)' : 'var(--border)'}`, background: filterCat === 'all' ? 'var(--orange)' : 'white', color: filterCat === 'all' ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.72rem' }}>Tout</button>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setFilterCat(c.id)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, border: `2px solid ${filterCat === c.id ? c.color : 'var(--border)'}`, background: filterCat === c.id ? c.color : 'white', color: filterCat === c.id ? 'white' : 'var(--text)', fontWeight: 700, fontSize: '0.72rem' }}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {loading && <div className="spinner" />}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>💬</div>
            <p>Pas encore de messages. Sois le premier !</p>
          </div>
        )}
        {filtered.map(m => {
          const c = CATS.find(x => x.id === m.categorie) || CATS[0]
          const isMe = m.auteur === auteur
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, marginBottom: 12, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: isMe ? 'var(--orange)' : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                {m.auteur?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ maxWidth: '75%' }}>
                {!isMe && <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text2)', marginBottom: 3, paddingLeft: 4 }}>{m.auteur}</div>}
                <div style={{ background: isMe ? 'var(--orange)' : 'white', color: isMe ? 'white' : 'var(--text)', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '10px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  {m.categorie !== 'general' && <div style={{ display: 'inline-block', background: isMe ? 'rgba(255,255,255,0.2)' : c.bg, color: isMe ? 'white' : c.color, borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, marginBottom: 4 }}>{c.label}</div>}
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.4, margin: 0 }}>{m.contenu}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text2)' }}>{timeAgo(m.created_at)}</span>
                  {(isMe || isAdmin) && <button onClick={() => deleteMessage(m.id)} style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--text2)', opacity: 0.5, cursor: 'pointer', padding: 0 }}>🗑</button>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px 12px', background: 'white', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto' }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 20, border: `1.5px solid ${cat === c.id ? c.color : 'var(--border)'}`, background: cat === c.id ? c.bg : 'white', color: cat === c.id ? c.color : 'var(--text2)', fontWeight: 700, fontSize: '0.68rem' }}>{c.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Écris un message…"
            style={{ flex: 1, padding: '11px 14px', borderRadius: 22, border: '2px solid var(--border)', fontSize: '0.9rem', background: 'var(--bg)' }}
          />
          <button onClick={sendMessage} disabled={!texte.trim() || sending} style={{ width: 44, height: 44, borderRadius: '50%', background: texte.trim() ? 'var(--orange)' : 'var(--border)', border: 'none', color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {sending ? '⏳' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
