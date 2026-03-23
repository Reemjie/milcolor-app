import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Plannings from './pages/Plannings'
import Activites from './pages/Activites'
import ActiviteForm from './pages/ActiviteForm'
import Remarques from './pages/Remarques'
import Documents from './pages/Documents'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/plannings" replace />} />
        <Route path="plannings" element={<Plannings />} />
        <Route path="activites" element={<Activites />} />
        <Route path="activites/nouvelle" element={<ActiviteForm />} />
        <Route path="activites/:id" element={<ActiviteForm />} />
        <Route path="remarques" element={<Remarques />} />
        <Route path="documents" element={<Documents />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
