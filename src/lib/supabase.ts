import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      scores: {
        Row: {
          id: number
          user_id: string
          score: number
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          score: number
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          score?: number
          created_at?: string
        }
      }
      enemies: {
        Row: {
          id: number
          name: string
          status: any
          image_url: string | null
        }
        Insert: {
          id?: number
          name: string
          status: any
          image_url?: string | null
        }
        Update: {
          id?: number
          name?: string
          status?: any
          image_url?: string | null
        }
      }
    }
  }
}