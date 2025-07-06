import { createClient } from '@supabase/supabase-js'

// Use the global supabaseClient from index.html to avoid conflicts
declare global {
  interface Window {
    supabaseClient: any
  }
}

// Use the shared client from index.html if available, otherwise create a new one
export const supabase = window.supabaseClient || createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

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