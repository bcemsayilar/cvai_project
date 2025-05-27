"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

type Profile = {
  id: string
  email: string
  full_name: string | null
  subscription_type: "trial" | "monthly" | "annual"
  subscription_status: boolean
  subscription_started_at: string
  subscription_expires_at: string
  resumes_used: number
  resumes_limit: number
  created_at: string
  updated_at: string
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isError: boolean
  errorMessage: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any; data?: any }>
  signOut: () => Promise<void>
  refreshProfile: () => void
  createProfileIfMissing: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize the Supabase client synchronously
  const supabase = createSupabaseClient()

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Handle auth state changes
  useEffect(() => {
    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event)
      setSession(newSession)
      setUser(newSession?.user ?? null)

      // If we have a user but no profile, we'll fetch it in a separate effect
      if (!newSession) {
        setProfile(null)
      }

      setIsLoading(false)
    })

    // Initial session check
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        setSession(data.session)
        setUser(data.session?.user ?? null)
      } catch (error) {
        console.error("Error checking session:", error)
        setIsError(true)
        setErrorMessage(error instanceof Error ? error.message : "Failed to check session")
      } finally {
        setIsLoading(false)
      }
    }

    // Run the session check
    checkSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Fetch profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          // If profile doesn't exist, we'll create it when createProfileIfMissing is called
          console.log("Profile not found or error:", error)
          return
        }

        setProfile(data as Profile)
      } catch (error) {
        console.error("Error fetching profile:", error)
      }
    }

    fetchProfile()
  }, [user, supabase])

  // Function to refresh profile - doesn't return a promise to avoid uncached promises
  const refreshProfile = () => {
    if (!user) return

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error refreshing profile:", error)
          return
        }

        setProfile(data as Profile)
      } catch (error) {
        console.error("Error refreshing profile:", error)
      }
    }

    fetchProfile()
  }

  // Function to create profile if missing - doesn't return a promise
  const createProfileIfMissing = () => {
    if (!user) return

    const createProfile = async () => {
      try {
        // Check if profile exists first
        const { data: existingProfile, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single()

        if (!checkError && existingProfile) {
          // Profile exists, refresh it
          refreshProfile()
          return
        }

        // Use the service role client for admin operations
        // This bypasses RLS policies
        const serviceClient = createSupabaseClient()

        // Create new profile
        const { data, error } = await serviceClient.rpc("create_profile_for_user", {
          user_id: user.id,
          user_email: user.email,
        })

        if (error) {
          console.error("Error creating profile:", error)
          return
        }

        // Refresh the profile after creation
        refreshProfile()
      } catch (error) {
        console.error("Error creating profile:", error)
      }
    }

    createProfile()
  }

  const signIn = async (email: string, password: string) => {
    console.log("Attempting sign in with:", email)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    console.log("Sign in result:", error ? "Error" : "Success")
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    console.log("Attempting sign up with:", email)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    console.log("Sign up result:", error ? "Error" : "Success")
    return { error, data }
  }

  const signOut = async () => {
    console.log("Signing out")
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isError,
        errorMessage,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        createProfileIfMissing,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
