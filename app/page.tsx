import type { Metadata } from "next"
import ResumeEnhancer from "@/components/resume-enhancer"
import { ensureStorageBucketExists } from "@/lib/storage-utils"

export const metadata: Metadata = {
  title: "ResumeAI - Transform Your Resume Instantly",
  description: "AI-powered resume enhancements tailored to your style and profession",
}

// This is a server component, so we can run initialization code here
export default async function Home() {
  // We can't directly call this in a server component, but in a real app
  // you would set up the bucket during deployment or first run
  // For now, we'll rely on the client-side check in the FileUploader component
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <ResumeEnhancer />
    </div>
  )
}
