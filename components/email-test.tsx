"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"

export function EmailTest() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const sendTestEmail = async () => {
    if (!email) return

    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (error) {
        throw error
      }

      setStatus("success")
      setMessage(`Password reset email sent to ${email}. Please check your inbox (and spam folder).`)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Failed to send test email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-gray-100">Email Configuration Test</CardTitle>
        <CardDescription className="dark:text-gray-400">Test if Supabase can send emails</CardDescription>
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-gray-300">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This will send a password reset email to test if Supabase email delivery is working correctly.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={sendTestEmail} disabled={isLoading || !email} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending test email...
            </>
          ) : (
            "Send Test Email"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
