"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Loader2, Key } from "lucide-react"
import { EmailTest } from "@/components/email-test"
import Link from "next/link"
import { createSupabaseClient } from "@/lib/supabase"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("storage")
  const [groqStatus, setGroqStatus] = useState<"idle" | "success" | "error">("idle")
  const [groqMessage, setGroqMessage] = useState("")
  const [isTestingGroq, setIsTestingGroq] = useState(false)

  const setupStorage = async () => {
    setIsLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      const response = await fetch("/api/setup-storage")
      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message)
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to set up storage")
      }
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const testGroqApiKey = async () => {
    setIsTestingGroq(true)
    setGroqStatus("idle")
    setGroqMessage("")

    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.functions.invoke("test-groq-api", {
        body: { test: true },
      })

      if (error) {
        setGroqStatus("error")
        setGroqMessage(`Error: ${error.message}`)
        return
      }

      if (data.success) {
        setGroqStatus("success")
        setGroqMessage("Groq API key is valid and working!")
      } else {
        setGroqStatus("error")
        setGroqMessage(data.error || "Failed to validate Groq API key")
      }
    } catch (error) {
      setGroqStatus("error")
      setGroqMessage(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsTestingGroq(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">ResumeAI Setup</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>

          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle>Storage Setup</CardTitle>
                <CardDescription>Create the necessary storage buckets for ResumeAI</CardDescription>
              </CardHeader>
              <CardContent>
                {status === "success" && (
                  <Alert className="mb-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                {status === "error" && (
                  <Alert variant="destructive" className="mb-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                <p className="text-sm text-gray-500 mb-4">
                  This will create the necessary storage buckets for the ResumeAI application. You need to run this once
                  to set up the storage.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={setupStorage} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up storage...
                    </>
                  ) : (
                    "Create Storage Buckets"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <EmailTest />
          </TabsContent>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Test your Groq API key configuration</CardDescription>
              </CardHeader>
              <CardContent>
                {groqStatus === "success" && (
                  <Alert className="mb-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{groqMessage}</AlertDescription>
                  </Alert>
                )}

                {groqStatus === "error" && (
                  <Alert variant="destructive" className="mb-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{groqMessage}</AlertDescription>
                  </Alert>
                )}

                <p className="text-sm text-gray-500 mb-4">
                  This will test if your Groq API key is correctly configured and working. Make sure you have set the
                  GROQ_API_KEY environment variable in your Supabase project.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={testGroqApiKey} disabled={isTestingGroq} className="w-full">
                  {isTestingGroq ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Groq API...
                    </>
                  ) : (
                    <>
                      <Key className="mr-2 h-4 w-4" />
                      Test Groq API Key
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            After completing setup,{" "}
            <Link href="/" className="text-teal-600 hover:underline">
              return to the app
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
