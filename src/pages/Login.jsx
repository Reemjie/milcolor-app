import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginAsAnimateur } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      const role = login(password)
      if (role) {
        navigate('/', { replace: true })
      } else {
        setError('Mot de passe incorrect')
        setLoading(false)
      }
    }, 400)
  }

  const enterAsAnimateur = () => {
    loginAsAnimateur()
    navigate('/', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #FFF9F0 0%, #FFE8D6 100%)',
      padding: '24px',
    }}>
      {/* Logo / Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <img src="/milcolor-app/icon-512.png" alt="Milcolor App" style={{
          width: 100, height: 100,
          borderRadius: 24,
          margin: '0 auto 16px',
          display: 'block',
          boxShadow: '0 8px 24px rgba(255,107,53,0.35)',
        }} />
        <h1 style={{ fontSize: '2rem', color: 'var(--orange)', fontFamily: 'Fredoka' }}>Milcolor App</h1>
        <p style={{ color: 'var(--text2)', marginTop: 6, fontSize: '0.95rem' }}>
          L'espace des animateurs
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{
        background: 'white',
        borderRadius: 24,
        padding: '32px 28px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: '0.9rem' }}>
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Entrez le mot de passe…"
          autoComplete="current-password"
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 12,
            border: `2px solid ${error ? '#FF4444' : 'var(--border)'}`,
            fontSize: '1rem',
            marginBottom: 8,
            transition: 'border-color 0.2s',
            background: 'var(--bg)',
          }}
          onFocus={e => { if(!error) e.target.style.borderColor = 'var(--orange)' }}
          onBlur={e => { if(!error) e.target.style.borderColor = 'var(--border)' }}
        />
        {error && (
          <p style={{ color: '#FF4444', fontSize: '0.82rem', marginBottom: 12 }}>
            ⚠️ {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="btn btn-primary"
          style={{
            width: '100%',
            marginTop: 8,
            padding: '14px',
            fontSize: '1rem',
            borderRadius: 12,
            opacity: loading || !password ? 0.6 : 1,
          }}
        >
          {loading ? '⏳ Connexion…' : '🚀 Accéder à l\'app'}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 12 }}>ou</p>
        <button onClick={enterAsAnimateur} style={{ background: 'none', border: '2px solid var(--border)', borderRadius: 12, padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text2)', cursor: 'pointer', width: '100%', maxWidth: 380 }}>
          🎨 Accéder en tant qu'animateur
        </button>
      </div>
      <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text2)', textAlign: 'center' }}>
        Milcolor · Centre de loisirs
      </p>
    </div>
  )
}
