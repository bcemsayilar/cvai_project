import { createClient } from "@supabase/supabase-js"
import { envConfig } from "./env-config"

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const createSupabaseClient = () => {
  // Use validated environment variables
  const supabaseUrl = envConfig.getSupabaseUrl()
  const supabaseAnonKey = envConfig.getAnonKey()

  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Create new instance if none exists - this is synchronous
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable automatic detection of auth redirects
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null
          try {
            // Use sessionStorage instead of localStorage for better security
            return sessionStorage.getItem(key)
          } catch {
            return null
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return
          try {
            // Use sessionStorage for shorter-lived storage
            sessionStorage.setItem(key, value)
          } catch {
            // Silently fail if storage is disabled
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return
          try {
            sessionStorage.removeItem(key)
          } catch {
            // Silently fail if storage is disabled
          }
        }
      }
    },
  })

  return supabaseInstance
}

// Reset the instance (useful for testing)
export const resetSupabaseClient = () => {
  supabaseInstance = null
}
