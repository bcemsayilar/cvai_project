"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function WelcomePage() {
  const router = useRouter()
  const { user, createProfileIfMissing } = useAuth()

  // Create profile if user is logged in
  useEffect(() => {
    if (user) {
      createProfileIfMissing()
    }
  }, [user, createProfileIfMissing])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">Email Verified!</CardTitle>
            <CardDescription className="text-center">
              Your account has been successfully verified. You can now use all features of ResumeAI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Thank you for confirming your email address. Your free trial has been activated, and you can now enhance
              your resume with our AI-powered tools.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/")} className="bg-teal-600 hover:bg-teal-700">
              Get Started
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
