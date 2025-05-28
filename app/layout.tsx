// @ts-nocheck
import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster";
import Script from 'next/script';
import "./globals.css"

export const metadata: Metadata = {
  title: "ResumeAI - Transform Your Resume Instantly",
  description: "AI-powered resume enhancements tailored to your style and profession",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
