import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import GameOver from './GameOver'

const Game: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  // Simulação simples de jogo - clique para aumentar score
  const handleClick = useCallback(() => {
    if (!gameOver && gameStarted) {
      setScore(prev => prev + 10)
    }
  }, [gameOver, gameStarted])

  // Simular fim de jogo após 30 segundos
  useEffect(() => {
    if (gameStarted && !gameOver) {
      const timer = setTimeout(() => {
        setGameOver(true)
      }, 30000) // 30 segundos

      return () => clearTimeout(timer)
    }
  }, [gameStarted, gameOver])

  const startGame = () => {
    setGameStarted(true)
    setScore(0)
    setGameOver(false)
  }

  const restartGame = () => {
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
  }

  const backToMenu = () => {
    navigate('/ranking')
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
          <div className="text-6xl mb-6">🎮</div>
          <h1 className="text-4xl font-bold text-white mb-4">Jogo de Cliques</h1>
          <p className="text-white/70 mb-8">
            Clique o máximo que conseguir em 30 segundos!<br/>
            Cada clique vale 10 pontos.
          </p>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 text-lg"
          >
            🚀 Começar Jogo
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">🎮 Jogo</h1>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
              <span className="text-white/70 text-sm">Score: </span>
              <span className="text-white font-bold text-xl">{score}</span>
            </div>
            <span className="text-white/70">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 min-h-96 flex flex-col items-center justify-center">
          <div className="mb-8">
            <div className="text-8xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-4">Clique aqui!</h2>
            <p className="text-white/70">Cada clique vale 10 pontos</p>
          </div>

          <button
            onClick={handleClick}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-8 px-12 rounded-full hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 transition-all duration-200 text-2xl transform hover:scale-105 active:scale-95"
          >
            CLIQUE AQUI!
          </button>

          <div className="mt-8 text-white/70">
            <p>Tempo restante: Aproveite cada segundo!</p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={backToMenu}
            className="bg-white/10 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 border border-white/20"
          >
            ← Voltar ao Ranking
          </button>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <GameOver
          score={score}
          onRestart={restartGame}
          onBackToMenu={backToMenu}
        />
      )}
    </div>
  )
}

export default Game