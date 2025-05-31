"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Database } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export function DatabaseSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const { user, createProfileIfMissing } = useAuth()
  const supabase = createSupabaseClient()

  const createProfilesTable = async () => {
    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      // Check if profiles table exists
      const { error: checkError } = await supabase.from("profiles").select("count").limit(1)

      if (!checkError) {
        setStatus("success")
        setMessage("Profiles table already exists!")
        setIsLoading(false)
        return
      }

      // Create profiles table
      const { error } = await supabase.rpc("create_profiles_table")

      if (error) {
        console.error("Error creating profiles table:", error)
        setStatus("error")
        setMessage(`Failed to create profiles table: ${error.message}`)
        return
      }

      setStatus("success")
      setMessage("Profiles table created successfully!")

      // If user is logged in, create their profile
      if (user) {
        await createProfileIfMissing()
      }
    } catch (error) {
      console.error("Error:", error)
      setStatus("error")
      setMessage(`An error occurred: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-gray-100">
          <Database className="h-5 w-5 dark:text-gray-400" />
          Database Setup
        </CardTitle>
        <CardDescription className="dark:text-gray-400">Create the necessary database tables for the ResumeAI application</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <Alert className="mb-4 dark:bg-green-900/20 dark:border-green-400/50">
            <CheckCircle className="h-4 w-4 dark:text-green-400" />
            <AlertTitle className="dark:text-green-400">Success</AlertTitle>
            <AlertDescription className="dark:text-green-300">{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert variant="destructive" className="mb-4 dark:bg-red-900/20 dark:border-red-400/50">
            <XCircle className="h-4 w-4 dark:text-red-400" />
            <AlertTitle className="dark:text-red-400">Error</AlertTitle>
            <AlertDescription className="dark:text-red-300">{message}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This will create the necessary database tables for the ResumeAI application. You need to run this once to set
          up the database.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={createProfilesTable} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up database...
            </>
          ) : (
            "Create Database Tables"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
