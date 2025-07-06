import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useScore = () => {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const saveScore = useCallback(async (score: number) => {
    if (!user) {
      throw new Error('Usuário não autenticado')
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('scores')
        .insert({
          user_id: user.id,
          score: score
        })

      if (error) throw error
      
      return true
    } catch (error) {
      console.error('Erro ao salvar score:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }, [user])

  const getUserBestScore = useCallback(async () => {
    if (!user) return 0

    try {
      const { data, error } = await supabase
        .from('scores')
        .select('score')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(1)

      if (error) throw error
      
      return data.length > 0 ? data[0].score : 0
    } catch (error) {
      console.error('Erro ao buscar melhor score:', error)
      return 0
    }
  }, [user])

  return {
    saveScore,
    getUserBestScore,
    saving
  }
}