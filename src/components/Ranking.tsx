import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Score {
  id: number
  score: number
  created_at: string
  user_id: string
}

interface RankingEntry {
  user_id: string
  email: string
  best_score: number
  total_games: number
  last_played: string
}

const Ranking: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [userStats, setUserStats] = useState<RankingEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRanking = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          user_id,
          score,
          created_at
        `)
        .order('score', { ascending: false })

      if (error) throw error

      // Group by user and calculate stats
      const userStats: { [key: string]: RankingEntry } = {}
      
      for (const score of data) {
        const userId = score.user_id
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId,
            email: userId === user?.id ? (user.email || 'Você') : `Jogador ${userId.slice(0, 8)}...`,
            best_score: score.score,
            total_games: 1,
            last_played: score.created_at
          }
        } else {
          userStats[userId].best_score = Math.max(userStats[userId].best_score, score.score)
          userStats[userId].total_games += 1
          if (new Date(score.created_at) > new Date(userStats[userId].last_played)) {
            userStats[userId].last_played = score.created_at
          }
        }
      }

      const rankingEntries = Object.values(userStats).sort((a, b) => b.best_score - a.best_score)
      setRanking(rankingEntries)
    } catch (error) {
      console.error('Erro ao buscar ranking:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const fetchUserStats = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('score', { ascending: false })

      if (error) throw error

      if (data.length > 0) {
        const bestScore = Math.max(...data.map(s => s.score))
        const lastPlayed = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0].created_at

        setUserStats({
          user_id: user.id,
          email: user.email || 'Usuário',
          best_score: bestScore,
          total_games: data.length,
          last_played: lastPlayed
        })
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do usuário:', error)
    }
  }, [user])

  useEffect(() => {
    fetchRanking()
    if (user) {
      fetchUserStats()
    }
  }, [fetchRanking, fetchUserStats, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando ranking...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">🏆 Ranking</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/70">
              Olá, {user?.email}
            </span>
            <button
              onClick={signOut}
              className="bg-red-500/20 text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
            >
              Sair
            </button>
          </div>
        </div>

        {/* User Stats */}
        {userStats && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Suas Estatísticas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                <div className="text-blue-300 text-sm">Melhor Score</div>
                <div className="text-white text-2xl font-bold">{userStats.best_score}</div>
              </div>
              <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                <div className="text-green-300 text-sm">Total de Jogos</div>
                <div className="text-white text-2xl font-bold">{userStats.total_games}</div>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
                <div className="text-purple-300 text-sm">Último Jogo</div>
                <div className="text-white text-sm">{formatDate(userStats.last_played)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white">🥇 Top Jogadores</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-white/90 font-semibold">Posição</th>
                  <th className="px-6 py-4 text-left text-white/90 font-semibold">Jogador</th>
                  <th className="px-6 py-4 text-left text-white/90 font-semibold">Melhor Score</th>
                  <th className="px-6 py-4 text-left text-white/90 font-semibold">Jogos</th>
                  <th className="px-6 py-4 text-left text-white/90 font-semibold">Último Jogo</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, index) => (
                  <tr 
                    key={entry.user_id} 
                    className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                      entry.user_id === user?.id ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                        {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                        {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                        <span className="text-white font-semibold">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {entry.email}
                        {entry.user_id === user?.id && (
                          <span className="ml-2 text-blue-300 text-sm">(Você)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold text-lg">{entry.best_score}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/70">{entry.total_games}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white/70 text-sm">{formatDate(entry.last_played)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ranking.length === 0 && (
            <div className="p-8 text-center text-white/70">
              Nenhum score registrado ainda. Seja o primeiro a jogar!
            </div>
          )}
        </div>

        {/* Game Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => navigate('/game')}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 text-lg"
          >
            🎮 Jogo Simples
          </button>
          
          <button
            onClick={() => navigate('/survival')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-8 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 text-lg"
          >
            ⚔️ Sobrevivência 3D
          </button>
        </div>
      </div>
    </div>
  )
}

export default Ranking