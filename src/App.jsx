import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Accueil from './pages/Accueil'
import Plannings from './pages/Plannings'
import JourneeType from './pages/JourneeType'
import Objectifs from './pages/Objectifs'
import SessionEnCours from './pages/SessionEnCours'
import BanqueAnimations from './pages/BanqueAnimations'
import ActiviteForm from './pages/ActiviteForm'
import AnimationsRapides from './pages/AnimationsRapides'
import Chat from './pages/Chat'
import Documents from './pages/Documents'
import Urgences from './pages/Urgences'
import Materiel from './pages/Materiel'
import Notifications from './pages/Notifications'
import GrandsJeux from './pages/GrandsJeux'
import InfosEnfants from './pages/InfosEnfants'
import InfosJour from './pages/InfosJour'
import EvaluationBafa from './pages/EvaluationBafa'
import LiensUtiles from './pages/LiensUtiles'
import Sorties from './pages/Sorties'
import InfosSorties from './pages/InfosSorties'
import EvaluationsList from './pages/EvaluationsList'
import Bilan from './pages/Bilan'
import ListeMateriel from './pages/ListeMateriel'
import BilansList from './pages/BilansList'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/accueil" replace />} />
        <Route path="accueil" element={<Accueil />} />
        <Route path="plannings" element={<Plannings />} />
        <Route path="journee-type" element={<JourneeType />} />
        <Route path="objectifs" element={<Objectifs />} />
        <Route path="session" element={<SessionEnCours />} />
        <Route path="banque" element={<BanqueAnimations />} />
        <Route path="banque/nouvelle" element={<ActiviteForm />} />
        <Route path="banque/:id" element={<ActiviteForm />} />
        <Route path="rapides" element={<AnimationsRapides />} />
        <Route path="chat" element={<Chat />} />
        <Route path="documents" element={<Documents />} />
        <Route path="urgences" element={<Urgences />} />
        <Route path="materiel" element={<Materiel />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="grands-jeux" element={<GrandsJeux />} />
        <Route path="infos-enfants" element={<InfosEnfants />} />
        <Route path="infos-jour" element={<InfosJour />} />
        <Route path="evaluations-bafa" element={<EvaluationsList />} />
        <Route path="evaluations-bafa/nouvelle" element={<EvaluationBafa />} />
        <Route path="evaluations-bafa/:id" element={<EvaluationBafa />} />
        <Route path="liens-utiles" element={<LiensUtiles />} />
        <Route path="sorties" element={<Sorties />} />
        <Route path="infos-sorties" element={<InfosSorties />} />
        <Route path="bilans" element={<BilansList />} />
        <Route path="bilans/nouveau" element={<Bilan />} />
        <Route path="bilans/:id" element={<Bilan />} />
        <Route path="materiel-session" element={<ListeMateriel />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
// This is a marker - do not edit
