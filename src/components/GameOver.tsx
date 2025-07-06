import React, { useState, useEffect } from 'react'
import { useScore } from '../hooks/useScore'
import { useAuth } from '../contexts/AuthContext'

interface GameOverProps {
  score: number
  onRestart: () => void
  onBackToMenu: () => void
}

const GameOver: React.FC<GameOverProps> = ({ score, onRestart, onBackToMenu }) => {
  const { saveScore, getUserBestScore, saving } = useScore()
  const { user } = useAuth()
  const [bestScore, setBestScore] = useState(0)
  const [scoreSaved, setScoreSaved] = useState(false)
  const [isNewRecord, setIsNewRecord] = useState(false)

  useEffect(() => {
    const handleGameOver = async () => {
      if (user && !scoreSaved) {
        try {
          const currentBest = await getUserBestScore()
          setBestScore(currentBest)
          
          if (score > currentBest) {
            setIsNewRecord(true)
          }
          
          await saveScore(score)
          setScoreSaved(true)
        } catch (error) {
          console.error('Erro ao processar fim de jogo:', error)
        }
      }
    }

    handleGameOver()
  }, [user, score, saveScore, getUserBestScore, scoreSaved])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20 text-center">
        <div className="mb-6">
          {isNewRecord ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">NOVO RECORDE!</h2>
              <p className="text-white/70">Parabéns! Você superou seu melhor score!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
              <p className="text-white/70">Tente novamente para melhorar seu score!</p>
            </>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <div className="text-blue-300 text-sm">Score Atual</div>
            <div className="text-white text-3xl font-bold">{score}</div>
          </div>
          
          {user && (
            <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
              <div className="text-purple-300 text-sm">Seu Melhor Score</div>
              <div className="text-white text-2xl font-bold">
                {isNewRecord ? score : bestScore}
              </div>
            </div>
          )}

          {saving && (
            <div className="text-white/70 text-sm">
              Salvando score...
            </div>
          )}

          {scoreSaved && (
            <div className="text-green-300 text-sm">
              ✅ Score salvo com sucesso!
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200"
          >
            🔄 Jogar Novamente
          </button>
          
          <button
            onClick={onBackToMenu}
            className="w-full bg-white/10 text-white font-semibold py-3 px-4 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 border border-white/20"
          >
            🏠 Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOver