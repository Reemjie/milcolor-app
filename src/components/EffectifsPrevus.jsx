import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
const GRID = 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr)'

const pad = n => String(n).padStart(2, '0')
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

function startOfWeek(base) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  const dow = d.getDay()
  if (dow === 6) return addDays(d, 2)
  if (dow === 0) return addDays(d, 1)
  return addDays(d, -(dow - 1))
}

export default function EffectifsPrevus() {
  const { isAdmin } = useAuth()
  const [monday, setMonday] = useState(() => startOfWeek(new Date()))
  const [rows, setRows] = useState({})
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  const days = [0, 1, 2, 3, 4].map(i => addDays(monday, i))
  const from = iso(days[0])
  const to = iso(days[4])
  const todayIso = iso(new Date())
  const semaineLabel = days[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  useEffect(() => { fetchRows() }, [from])

  async function fetchRows() {
    const { data } = await supabase.from('effectifs_prevus').select('*').gte('jour', from).lte('jour', to)
    const map = {}
    ;(data || []).forEach(r => { map[r.jour] = r })
    setRows(map)
  }

  function changeWeek(delta) {
    setEditing(false)
    setMonday(m => addDays(m, delta * 7))
  }

  function startEdit() {
    const d = {}
    days.forEach(day => {
      const k = iso(day)
      const r = rows[k]
      d[k] = { nb_35: r ? String(r.nb_35) : '', nb_611: r ? String(r.nb_611) : '' }
    })
    setDraft(d)
    setEditing(true)
  }

  function setField(k, field, value) {
    const clean = value.replace(/\D/g, '').slice(0, 3)
    setDraft(prev => ({ ...prev, [k]: { ...prev[k], [field]: clean } }))
  }

  async function save() {
    setSaving(true)
    const upserts = []
    const vides = []
    days.forEach(day => {
      const k = iso(day)
      const v = draft[k] || {}
      const a = v.nb_35 || ''
      const b = v.nb_611 || ''
      if (a === '' && b === '') vides.push(k)
      else upserts.push({ jour: k, nb_35: parseInt(a || '0', 10), nb_611: parseInt(b || '0', 10), updated_at: new Date().toISOString() })
    })
    if (upserts.length > 0) {
      const { error } = await supabase.from('effectifs_prevus').upsert(upserts, { onConflict: 'jour' })
      if (error) { setSaving(false); alert('Erreur : ' + error.message); return }
    }
    if (vides.length > 0) await supabase.from('effectifs_prevus').delete().in('jour', vides)
    if (upserts.length > 0) {
      await supabase.from('notifications').insert([{ titre: '📊 Effectifs prévus mis à jour', message: 'Semaine du ' + semaineLabel, type: 'info', lue: false, lien: '/infos-enfants' }])
    }
    setSaving(false)
    setEditing(false)
    fetchRows()
  }

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: 'var(--shadow)', border: '2px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Fredoka', fontSize: '1.1rem', fontWeight: 600 }}>📅 Effectifs journaliers prévus</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 2 }}>Enfants inscrits par jour</div>
        </div>
        {isAdmin && !editing && (
          <button onClick={startEdit} style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text2)', flexShrink: 0 }}>
            ✏️ Modifier
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => changeWeek(-1)} style={navStyle}>‹</button>
        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text2)' }}>Semaine du {semaineLabel}</span>
        <button onClick={() => changeWeek(1)} style={navStyle}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 6, padding: '0 6px 6px', fontSize: '0.7rem', fontWeight: 700, textAlign: 'center' }}>
        <div />
        <div style={{ color: '#FF6B9D' }}>3-5 ans</div>
        <div style={{ color: '#9B5DE5' }}>6-11 ans</div>
        <div style={{ color: 'var(--orange)' }}>Total</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {days.map((day, i) => {
          const k = iso(day)
          const r = rows[k]
          const v = editing
            ? (draft[k] || { nb_35: '', nb_611: '' })
            : { nb_35: r ? String(r.nb_35) : '', nb_611: r ? String(r.nb_611) : '' }
          const rempli = v.nb_35 !== '' || v.nb_611 !== ''
          const total = rempli ? parseInt(v.nb_35 || '0', 10) + parseInt(v.nb_611 || '0', 10) : '–'
          const isToday = k === todayIso
          return (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: GRID, gap: 6, alignItems: 'center', padding: '8px 6px', borderRadius: 10, background: isToday ? '#FFF3EC' : 'transparent', border: isToday ? '1.5px solid var(--orange)' : '1.5px solid transparent' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{JOURS[i]} {day.getDate()}/{pad(day.getMonth() + 1)}</div>
              {editing ? (
                <>
                  <input value={v.nb_35} onChange={e => setField(k, 'nb_35', e.target.value)} inputMode="numeric" placeholder="–" style={inputStyle} />
                  <input value={v.nb_611} onChange={e => setField(k, 'nb_611', e.target.value)} inputMode="numeric" placeholder="–" style={inputStyle} />
                </>
              ) : (
                <>
                  <div style={{ ...cellStyle, background: '#FBEAF0', color: '#FF6B9D' }}>{rempli ? (v.nb_35 || '0') : '–'}</div>
                  <div style={{ ...cellStyle, background: '#f0edf8', color: '#9B5DE5' }}>{rempli ? (v.nb_611 || '0') : '–'}</div>
                </>
              )}
              <div style={{ textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 700, color: 'var(--orange)' }}>{total}</div>
            </div>
          )
        })}
      </div>

      {editing && (
        <>
          <p style={{ fontSize: '0.72rem', color: 'var(--text2)', marginTop: 10 }}>Laisse les deux cases vides pour un jour non concerné.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => setEditing(false)} style={{ flex: 1, padding: 11, borderRadius: 10, background: 'var(--bg)', border: '2px solid var(--border)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>Annuler</button>
            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex: 2, padding: 11, opacity: saving ? 0.6 : 1 }}>
              {saving ? '⏳…' : '💾 Enregistrer'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const navStyle = { width: 36, height: 36, borderRadius: 10, background: 'var(--bg)', border: '1.5px solid var(--border)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const cellStyle = { borderRadius: 8, padding: '8px 4px', textAlign: 'center', fontFamily: 'Fredoka', fontSize: '1.05rem', fontWeight: 700 }
const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 4px', borderRadius: 8, border: '2px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', textAlign: 'center', fontSize: '1rem', fontWeight: 700 }
