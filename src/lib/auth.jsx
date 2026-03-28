import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const ANIM_PASSWORD = import.meta.env.VITE_ANIM_PASSWORD || 'milcolor2026'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'directeur2026'

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => sessionStorage.getItem('milcolor_role') || null)

  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      setRole('admin')
      sessionStorage.setItem('milcolor_role', 'admin')
      return 'admin'
    }
    if (password === ANIM_PASSWORD) {
      setRole('animateur')
      sessionStorage.setItem('milcolor_role', 'animateur')
      return 'animateur'
    }
    return null
  }

  const loginAsAnimateur = () => {
    setRole('animateur')
    sessionStorage.setItem('milcolor_role', 'animateur')
  }

  const logout = () => {
    setRole(null)
    sessionStorage.removeItem('milcolor_role')
  }

  return (
    <AuthContext.Provider value={{ role, login, loginAsAnimateur, logout, isAdmin: role === 'admin', isLoggedIn: !!role }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
