import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'directeur@milcolor.app'
const ANIM_EMAIL = import.meta.env.VITE_ANIM_EMAIL || 'animateur@milcolor.app'

function roleFromUser(user) {
  if (!user) return null
  const meta = user.app_metadata?.role || user.user_metadata?.role
  if (meta === 'admin' || meta === 'animateur') return meta
  if (user.email === ADMIN_EMAIL) return 'admin'
  if (user.email === ANIM_EMAIL) return 'animateur'
  return 'animateur'
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Ancien auth client-side — ne plus l'utiliser
    try { sessionStorage.removeItem('milcolor_role') } catch { /* ignore */ }

    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setRole(roleFromUser(session?.user))
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setRole(roleFromUser(session?.user))
      setReady(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  /** Mot de passe seul : tente directeur puis animateur (comptes Supabase Auth). */
  const login = async (password) => {
    const attempts = [
      { email: ADMIN_EMAIL, role: 'admin' },
      { email: ANIM_EMAIL, role: 'animateur' },
    ]

    for (const attempt of attempts) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: attempt.email,
        password,
      })
      if (!error && data.session) {
        const resolved = roleFromUser(data.user) || attempt.role
        setRole(resolved)
        return resolved
      }
    }
    return null
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{
      role,
      login,
      logout,
      ready,
      isAdmin: role === 'admin',
      isLoggedIn: !!role,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
