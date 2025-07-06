import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Ranking from './components/Ranking'
import Game from './components/Game'
import SurvivalGame from './components/SurvivalGame'
import Auth from './components/Auth'

const AppContent: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/ranking" replace />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route path="/game" element={<Game />} />
        <Route path="/survival" element={<SurvivalGame />} />
      </Routes>
    </Router>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App