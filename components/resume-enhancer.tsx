"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Upload, Download, CheckCircle, Lock, Sparkles, FileText, AlertTriangle, Info } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileUploader } from "@/components/file-uploader"
import { PricingSection } from "@/components/pricing-section"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { createSupabaseClient } from "@/lib/supabase"
import { ResumePreview } from "@/components/resume-preview"
import { ATSScoreDisplay } from "@/components/ats-score-display"
import { ATSAnalyzerModal } from "@/components/ats-analyzer-modal"

interface ATSScore {
  keywordMatch: number
  formatScore: number
  contentQuality: number
  readabilityScore: number
  structureScore: number
  overallScore: number
  recommendations: string[]
}

export default function ResumeEnhancer() {
  const { toast } = useToast()
  const { user, profile, session, isLoading: isAuthLoading, createProfileIfMissing } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [customInstructions, setCustomInstructions] = useState("")
  const [debouncedCustomInstructions, setDebouncedCustomInstructions] = useState("")
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [processedFilePath, setProcessedFilePath] = useState<string | null>(null)
  const [selectedStyles, setSelectedStyles] = useState({
    professional: true,
    concise: false,
    creative: false,
    grammarFix: true,
    styleOnly: false,
  })
  const [resumeFormat, setResumeFormat] = useState<"visual" | "ats">("visual")
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [downloadFormat, setDownloadFormat] = useState<"txt" | null>(null)
  const [atsScoreOriginal, setAtsScoreOriginal] = useState<ATSScore | null>(null)
  const [atsScoreEnhanced, setAtsScoreEnhanced] = useState<ATSScore | null>(null)
  const [isATSModalOpen, setIsATSModalOpen] = useState(false)
  const [shouldResetFileUploader, setShouldResetFileUploader] = useState(false)
  const [isResetConfirmDialogOpen, setIsResetConfirmDialogOpen] = useState(false)
  
  // Create supabase client with useRef to prevent recreation on every render
  const supabaseRef = useRef(createSupabaseClient())
  const supabase = supabaseRef.current

  // Debounce custom instructions to prevent excessive re-renders
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Auto-reset timer ref
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedCustomInstructions(customInstructions)
    }, 300) // 300ms debounce
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [customInstructions])

  // Reference to track subscription
  const channelRef = useRef<any>(null)

  // Check if user is logged in but profile is missing
  useEffect(() => {
    if (user && !profile && !isAuthLoading) {
      console.log("User logged in but profile missing, creating profile")
      createProfileIfMissing()
    }
  }, [user, profile, isAuthLoading, createProfileIfMissing])

  // Set up and clean up real-time subscription
  useEffect(() => {
    if (!resumeId || !user) return

    console.log("Setting up real-time subscription for resume:", resumeId)

    // Clean up any existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create new subscription
    const channel = supabase
      .channel(`resume_${resumeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "resumes",
          filter: `id=eq.${resumeId}`,
        },
        (payload) => {

          if (payload.new.status === "completed") {
            setIsProcessing(false)
            setIsComplete(true)
            setProcessedFilePath(payload.new.processed_file_path)
            setProcessingError(null)
            
            // Set ATS scores if available
            if (payload.new.ats_score_original) {
              setAtsScoreOriginal(payload.new.ats_score_original as ATSScore)
            }
            if (payload.new.ats_score_enhanced) {
              setAtsScoreEnhanced(payload.new.ats_score_enhanced as ATSScore)
            }
            
            toast({
              title: "Resume enhanced successfully",
              description: "Your enhanced resume is ready to download",
            })
            
            // Start auto-reset timer for better UX
            startAutoResetTimer()
          } else if (payload.new.status === "failed") {
            setIsProcessing(false)
            setProcessingError("Resume enhancement failed. Please try again.")
            toast({
              title: "Resume enhancement failed",
              description: "There was an error processing your resume. Please try again.",
              variant: "destructive",
            })
          }
        },
      )
      .subscribe()

    // Store the channel reference
    channelRef.current = channel

    // Check the current status in case we missed an update
    const checkCurrentStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("resumes")
          .select("status, processed_file_path, ats_score_original, ats_score_enhanced")
          .eq("id", resumeId)
          .single()

        if (error) throw error

        if (data.status === "completed") {
          setIsProcessing(false)
          setIsComplete(true)
          setProcessedFilePath(data.processed_file_path as string)
          setProcessingError(null)
          
          // Set ATS scores if available
          if (data.ats_score_original) {
            setAtsScoreOriginal(data.ats_score_original as ATSScore)
          }
          if (data.ats_score_enhanced) {
            setAtsScoreEnhanced(data.ats_score_enhanced as ATSScore)
          }
        } else if (data.status === "failed") {
          setIsProcessing(false)
          setProcessingError("Resume enhancement failed. Please try again.")
        }
      } catch (error) {
        console.error("Error checking resume status:", error)
      }
    }

    // Check status after 5 seconds in case real-time updates aren't working
    const statusCheckTimeout = setTimeout(checkCurrentStatus, 5000)

    return () => {
      // Clean up subscription and timeout
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
      clearTimeout(statusCheckTimeout)
    }
  }, [resumeId, user, supabase])

  const handleFileUpload = useCallback((uploadedFile: File | null, newResumeId?: string, newFilePath?: string) => {
    setFile(uploadedFile)
    if (newResumeId) setResumeId(newResumeId)
    if (newFilePath) setFilePath(newFilePath)

    // Reset states when a new file is uploaded
    setIsComplete(false)
    setIsProcessing(false)
    setProcessedFilePath(null)
    setProcessingError(null)
    setAtsScoreOriginal(null)
    setAtsScoreEnhanced(null)
  }, [])

  const handleStyleToggle = useCallback((style: keyof typeof selectedStyles) => {
    if (style === "styleOnly") {
      // If styleOnly is toggled on, turn off grammarFix
      setSelectedStyles(prev => ({
        ...prev,
        styleOnly: !prev.styleOnly,
        grammarFix: !prev.styleOnly ? false : prev.grammarFix,
      }))
    } else if (style === "grammarFix") {
      // If grammarFix is toggled on, turn off styleOnly
      setSelectedStyles(prev => ({
        ...prev,
        grammarFix: !prev.grammarFix,
        styleOnly: !prev.grammarFix ? false : prev.styleOnly,
      }))
    } else {
      // For professional, concise, and creative styles
      // Only one of these can be active at a time
      if (style === "professional" || style === "concise" || style === "creative") {
        setSelectedStyles(prev => ({
          ...prev,
          professional: style === "professional",
          concise: style === "concise",
          creative: style === "creative",
        }))
      }
    }
  }, [])

  const processResume = async () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (!file || !resumeId) {
      toast({
        title: "No file selected",
        description: "Please upload your resume first",
        variant: "destructive",
      })
      return
    }

    // Check if user has reached their resume limit
    if (profile && profile.resumes_used >= profile.resumes_limit) {
      toast({
        title: "Resume limit reached",
        description: `You've reached the limit for your ${profile.subscription_type} plan. Please upgrade to process more resumes.`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingError(null)

    // Get selected enhancement styles as an array
    const enhancementStyles = Object.entries(selectedStyles)
      .filter(([_, isSelected]) => isSelected)
      .map(([style]) => style)

    try {
      console.log("Calling process-resume function with styles:", enhancementStyles)
      console.log("Resume format selected:", resumeFormat)

      // Call the Supabase Edge Function to process the resume
      const { data, error } = await supabase.functions.invoke("process-resume", {
        body: {
          resumeId,
          enhancementStyles,
          customInstructions: debouncedCustomInstructions.trim() || null,
          resumeFormat,
        },
      })

      if (error) {
        console.error("Edge function error:", error)
        throw new Error(error.message)
      }

      if (!data.success) {
        console.error("Process resume failed:", data.error)
        throw new Error(data.error || "Failed to process resume")
      }

      console.log("Process resume function called successfully")

      // The processing status will be updated via the real-time subscription
      // But we'll set a timeout to check the status in case real-time updates aren't working
      setTimeout(async () => {
        if (isProcessing) {
          try {
            const { data, error } = await supabase
              .from("resumes")
              .select("status, processed_file_path, ats_score_original, ats_score_enhanced")
              .eq("id", resumeId)
              .single()

            if (error) throw error

            if (data.status === "completed") {
              setIsProcessing(false)
              setIsComplete(true)
              setProcessedFilePath(data.processed_file_path as string)
              setProcessingError(null)
              
              // Set ATS scores if available
              if (data.ats_score_original) {
                setAtsScoreOriginal(data.ats_score_original as ATSScore)
              }
              if (data.ats_score_enhanced) {
                setAtsScoreEnhanced(data.ats_score_enhanced as ATSScore)
              }
              
              toast({
                title: "Resume enhanced successfully",
                description: "Your enhanced resume is ready to download",
              })
              
              // Start auto-reset timer for better UX
              startAutoResetTimer()
            } else if (data.status === "failed") {
              setIsProcessing(false)
              setProcessingError("Resume enhancement failed. Please try again.")
              toast({
                title: "Resume enhancement failed",
                description: "There was an error processing your resume. Please try again.",
                variant: "destructive",
              })
            }
          } catch (error) {
            console.error("Error checking resume status:", error)
          }
        }
      }, 10000) // Check after 10 seconds
    } catch (error) {
      console.error("Processing error:", error)
      setIsProcessing(false)
      setProcessingError(error instanceof Error ? error.message : String(error))
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      })
    }
  }

  const openATSAnalyzer = () => {
    if (!user) {
      setIsAuthModalOpen(true)
      return
    }

    if (!file || !resumeId) {
      toast({
        title: "No file uploaded",
        description: "Please upload your resume first",
        variant: "destructive",
      })
      return
    }

    setIsATSModalOpen(true)
  }

  const handleATSAnalysisComplete = (score: ATSScore) => {
    setAtsScoreOriginal(score)
  }

  const resetUploadScreen = useCallback(() => {
    // Reset all states to initial values for a fresh upload experience
    setFile(null)
    setResumeId(null)
    setFilePath(null)
    setIsComplete(false)
    setIsProcessing(false)
    setProcessedFilePath(null)
    setProcessingError(null)
    setAtsScoreOriginal(null)
    setAtsScoreEnhanced(null)
    
    // Reset style selections to default
    setSelectedStyles({
      professional: true,
      concise: false,
      creative: false,
      grammarFix: true,
      styleOnly: false,
    })
    
    // Reset format to default
    setResumeFormat("visual")
    
    // Clear custom instructions
    setCustomInstructions("")
    setDebouncedCustomInstructions("")
    
    // Clear any auto-reset timer
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current)
      autoResetTimerRef.current = null
    }
    
    // Trigger FileUploader reset
    setShouldResetFileUploader(true)
    
    // Close confirmation dialog
    setIsResetConfirmDialogOpen(false)
    
    // Scroll to upload section for better UX
    document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })
    
    toast({
      title: "Ready for new upload",
      description: "Upload screen has been reset for your next resume",
    })
  }, [toast])

  const openResetConfirmDialog = useCallback(() => {
    setIsResetConfirmDialogOpen(true)
  }, [])

  const handleFileUploaderResetComplete = useCallback(() => {
    setShouldResetFileUploader(false)
  }, [])

  const startAutoResetTimer = useCallback(() => {
    // Clear any existing timer
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current)
    }
    
    // Set a timer to show auto-reset suggestion after 2 minutes
    autoResetTimerRef.current = setTimeout(() => {
      toast({
        title: "Upload another resume?",
        description: "Click 'Upload & Enhance Another Resume' button to start fresh",
        duration: 10000, // Show for 10 seconds
      })
    }, 120000) // 2 minutes
  }, [toast])

  // Cleanup auto-reset timer on component unmount
  useEffect(() => {
    return () => {
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current)
      }
    }
  }, [])

  const downloadResume = async (format: "txt") => {
    if (!processedFilePath || !resumeId || format !== "txt") return;

    setIsDownloading(true);
    setDownloadFormat(format);

    try {
      console.log("Downloading TXT file from:", processedFilePath);
      const { data, error } = await supabase.storage.from("resumes").download(processedFilePath);

      if (error) {
        console.error("Download error:", error);
        throw new Error(error.message);
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enhanced-resume.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Resume downloaded",
        description: `Your enhanced resume has been downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // PDF download function for confirmation dialog
  const downloadEnhancedPDF = useCallback(async () => {
    if (!resumeId) {
      toast({
        title: "Download failed",
        description: "No resume ID available for PDF download.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Generating PDF...",
        description: "Your enhanced resume is being prepared for download.",
      })

      // Check if it's ATS format (LaTeX) or Visual format
      if (resumeFormat === "ats") {
        // For ATS format, use the latex-to-pdf API
        const response = await fetch('/api/latex-to-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({ resumeId, isPreview: false }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(`Download failed: ${errorData.error || response.statusText}`)
        }

        const result = await response.json()
        if (result.success && result.pdfBuffer) {
          // Convert base64 to blob and download using browser-native methods
          const base64Data = result.pdfBuffer.replace(/^data:application\/pdf;base64,/, '')
          const byteCharacters = atob(base64Data)
          const byteNumbers = Array.from(byteCharacters, c => c.charCodeAt(0))
          const byteArray = new Uint8Array(byteNumbers)
          const pdfBlob = new Blob([byteArray], { type: 'application/pdf' })
          const downloadUrl = URL.createObjectURL(pdfBlob)

          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `enhanced-resume-${new Date().toISOString().split('T')[0]}.pdf`
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)

          toast({
            title: "Download Complete",
            description: "Your enhanced resume has been downloaded successfully.",
          })
        } else {
          throw new Error('PDF generation failed')
        }
      } else {
        // For Visual format, use the download-pdf API
        const response = await fetch('/api/download-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({ resumeId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'PDF generation failed' }))
          throw new Error(errorData.error)
        }

        const blob = await response.blob()
        const downloadUrl = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `enhanced-resume-${new Date().toISOString().split('T')[0]}.pdf`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)

        toast({
          title: "Download Complete",
          description: "Your enhanced resume has been downloaded successfully.",
        })
      }
    } catch (error) {
      console.error('PDF download error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error'
      toast({
        title: "Download Failed",
        description: `Could not download the enhanced resume: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }, [resumeId, resumeFormat, session?.access_token, toast])

  // Check if user has premium access (monthly or annual subscription)
  const isPremium = profile?.subscription_type === "monthly" || profile?.subscription_type === "annual"

  // Memoize ResumePreview props to prevent unnecessary re-renders
  const resumePreviewProps = useMemo(() => ({
    resumeId,
    originalPath: filePath,
    processedPath: processedFilePath,
    atsScoreOriginal,
    atsScoreEnhanced,
    isPremium
  }), [resumeId, filePath, processedFilePath, atsScoreOriginal, atsScoreEnhanced, isPremium])

  // Callback for handling custom instructions change
  const handleCustomInstructionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInstructions(e.target.value)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Transform Your Resume <span className="text-teal-600 dark:text-teal-400">Instantly</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              AI-powered resume enhancements tailored to your style and profession
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                className="rounded-md px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Resume
              </Button>
            </div>
            <div className="mt-4 flex justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Lock className="h-4 w-4" />
              <span>Your resume stays private and secure</span>
            </div>
          </div>
        </section>

        {/* Upload & Interaction Area */}
        <section id="upload-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 sm:p-10 bg-white dark:bg-gray-900 shadow-lg rounded-xl border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Enhance Your Resume</h2>

              {!isAuthLoading && user && profile && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Plan: <span className="font-semibold capitalize">{profile.subscription_type}</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {profile.resumes_used} of {profile.resumes_limit} resumes used
                      </p>
                    </div>
                    {profile.resumes_used >= profile.resumes_limit && (
                      <div className="flex items-center text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Limit reached</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* File Upload */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">1. Upload Your Resume</h3>
                  <FileUploader 
                    onFileUpload={handleFileUpload} 
                    file={file} 
                    shouldReset={shouldResetFileUploader}
                    onResetComplete={handleFileUploaderResetComplete}
                  />
                </div>

                {/* Resume Format Selection */}
                {file && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">2. Choose Resume Format</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          resumeFormat === "visual" 
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-400" 
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setResumeFormat("visual")}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            resumeFormat === "visual" 
                              ? "border-teal-500 bg-teal-500" 
                              : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {resumeFormat === "visual" && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">Visual Design</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Beautiful, modern layout for presentations</p>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          resumeFormat === "ats" 
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400" 
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                        onClick={() => setResumeFormat("ats")}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            resumeFormat === "ats" 
                              ? "border-blue-500 bg-blue-500" 
                              : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {resumeFormat === "ats" && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">ATS Optimized</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Clean LaTeX format for applicant tracking systems</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Style Selection */}
                {file && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">3. Select Enhancement Style</h3>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Toggle
                        pressed={selectedStyles.professional}
                        onPressedChange={() => handleStyleToggle("professional")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200 dark:data-[state=on]:bg-teal-900 dark:data-[state=on]:text-teal-100 dark:data-[state=on]:border-teal-800 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        Professional Style
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.concise}
                        onPressedChange={() => handleStyleToggle("concise")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200 dark:data-[state=on]:bg-teal-900 dark:data-[state=on]:text-teal-100 dark:data-[state=on]:border-teal-800 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        Clear & Concise
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.creative}
                        onPressedChange={() => handleStyleToggle("creative")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200 dark:data-[state=on]:bg-teal-900 dark:data-[state=on]:text-teal-100 dark:data-[state=on]:border-teal-800 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        Clever & Artistic
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.grammarFix}
                        onPressedChange={() => handleStyleToggle("grammarFix")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200 dark:data-[state=on]:bg-teal-900 dark:data-[state=on]:text-teal-100 dark:data-[state=on]:border-teal-800 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        Grammar & Issue Fixes
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.styleOnly}
                        onPressedChange={() => handleStyleToggle("styleOnly")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200 dark:data-[state=on]:bg-teal-900 dark:data-[state=on]:text-teal-100 dark:data-[state=on]:border-teal-800 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        Style Only (No text changes)
                      </Toggle>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="custom-instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Or, describe your desired changes briefly:
                      </label>
                      <Textarea
                        id="custom-instructions"
                        placeholder="Make it suitable for a senior engineering role"
                        value={customInstructions}
                        onChange={handleCustomInstructionsChange}
                        className="min-h-[80px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </div>

                    {processingError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{processingError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-4">
                      <Button
                        onClick={processResume}
                        disabled={isProcessing || isComplete || (profile?.resumes_used ?? 0) >= (profile?.resumes_limit ?? 0)}
                        className={`w-full ${isComplete ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} text-white`}
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isComplete ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Enhancement Complete
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Enhance My Resume
                          </>
                        )}
                      </Button>

                      {/* Reset Button - Only show when enhancement is complete */}
                      {isComplete && (
                        <Button
                          onClick={openResetConfirmDialog}
                          variant="outline"
                          className="w-full border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950 hover:border-teal-300 dark:hover:border-teal-700 text-teal-700 dark:text-teal-300"
                          size="lg"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Enhance Another Resume
                        </Button>
                      )}

                      <Button
                        onClick={openATSAnalyzer}
                        disabled={!user || (profile ? profile.ats_analyses_used >= profile.ats_analyses_limit : false)}
                        variant="outline"
                        className="w-full border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50 text-gray-900 dark:text-white"
                        size="lg"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Analyze ATS Compatibility
                        {profile && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            {profile.ats_analyses_used || 0}/{profile.ats_analyses_limit || 5}
                          </span>
                        )}
                      </Button>
                    </div>

                    {profile && profile.resumes_used >= profile.resumes_limit && (
                      <p className="mt-2 text-sm text-amber-600">
                        You've reached your plan limit. Please upgrade to process more resumes.
                      </p>
                    )}

                    {profile && profile.ats_analyses_used >= profile.ats_analyses_limit && (
                      <p className="mt-2 text-sm text-amber-600">
                        You've reached your ATS analysis limit ({profile.ats_analyses_limit} analyses). Please upgrade for more analyses.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* Processing & Preview Section */}
        {isProcessing && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-16 w-16 text-teal-600 dark:text-teal-400 animate-spin" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analyzing and enhancing your resume...</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                  Our AI is analyzing your resume to enhance the content and create a custom design based on your
                  selected preferences.
                </p>
                <Alert className="max-w-md">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This process typically takes 15-30 seconds. You'll be notified when it's complete.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </section>
        )}

        {/* ATS Analysis Results (standalone) */}
        {!isComplete && atsScoreOriginal && !isProcessing && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">ATS Analysis Complete!</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Here's how your resume performs with Applicant Tracking Systems.</p>
              </div>

              {/* ATS Score Display */}
              <div className="mb-8">
                <ATSScoreDisplay 
                  originalScore={atsScoreOriginal}
                />
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Want to improve your ATS score? Try our AI-powered resume enhancement!
                </p>
                <Button
                  onClick={processResume}
                  disabled={isProcessing || (profile?.resumes_used ?? 0) >= (profile?.resumes_limit ?? 0)}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance My Resume
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        {isComplete && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-2 bg-green-100 dark:bg-green-900 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Enhanced Resume is Ready!</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Review the improvements below and download your enhanced resume.</p>
                
                {/* Reset Button for New Upload */}
                <div className="mt-6">
                  <Button
                    onClick={openResetConfirmDialog}
                    variant="outline"
                    className="border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950 hover:border-teal-300 dark:hover:border-teal-700 text-teal-700 dark:text-teal-300"
                    size="lg"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Enhance Another Resume
                  </Button>
                </div>
              </div>

              {/* ATS Score Display */}
              {(atsScoreOriginal || atsScoreEnhanced) && (
                <div className="mb-8">
                  <ATSScoreDisplay 
                    originalScore={atsScoreOriginal || undefined}
                    enhancedScore={atsScoreEnhanced || undefined}
                  />
                </div>
              )}

              <Tabs defaultValue="preview" className="w-full mb-8">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger value="preview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-700 dark:text-gray-300">Preview Changes</TabsTrigger>
                  <TabsTrigger value="download" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-700 dark:text-gray-300">Download Options</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  <ResumePreview {...resumePreviewProps} />
                </TabsContent>
                <TabsContent value="download" className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  <div className="text-center space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Download Your Enhanced Resume</h3>
                    <p className="text-gray-500 dark:text-gray-400">Choose your preferred format below</p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => downloadResume("txt")}
                        disabled={isDownloading}
                        className="w-full sm:w-auto"
                        size="lg"
                      >
                        {isDownloading && downloadFormat === "txt" ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading Text...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Download as Text
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How It Works</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Transform your resume in three simple steps, plus get ATS compatibility insights
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">1. Upload</h3>
                <p className="text-gray-600 dark:text-gray-400">Upload your existing resume in PDF, DOC, DOCX, or TXT format.</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">2. Analyze</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get instant ATS compatibility scoring to see how recruiters' systems will read your resume.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">3. Enhance</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our AI analyzes and enhances your resume based on your selected style preferences.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">4. Download</h3>
                <p className="text-gray-600 dark:text-gray-400">Review the changes and download your professionally enhanced resume.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Examples</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                See how our AI transforms resumes across different industries
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Software Engineer</h3>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Before</p>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 h-64 overflow-y-auto text-sm">
                      <p className="font-bold text-gray-900 dark:text-white">John Smith</p>
                      <p className="text-gray-700 dark:text-gray-300">Software Developer</p>
                      <p className="text-gray-700 dark:text-gray-300">john.smith@email.com</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-white">Experience:</p>
                      <p className="text-gray-700 dark:text-gray-300">Junior Developer, ABC Tech (2020-Present)</p>
                      <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                        <li>Worked on web applications</li>
                        <li>Fixed bugs in the codebase</li>
                        <li>Helped with code reviews</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">After</p>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 h-64 overflow-y-auto text-sm">
                      <p className="font-bold text-gray-900 dark:text-white">John Smith</p>
                      <p className="text-gray-700 dark:text-gray-300">Full Stack Software Engineer</p>
                      <p className="text-gray-700 dark:text-gray-300">john.smith@email.com | github.com/johnsmith</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-white">Professional Experience:</p>
                      <p className="text-gray-700 dark:text-gray-300">Software Engineer, ABC Tech (2020-Present)</p>
                      <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                        <li>
                          Engineered responsive web applications using React.js, resulting in 30% improvement in user
                          engagement
                        </li>
                        <li>Implemented robust error handling processes, reducing critical bugs by 45%</li>
                        <li>Collaborated in agile teams to deliver features with 98% quality assurance pass rate</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Marketing Specialist</h3>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Before</p>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 h-64 overflow-y-auto text-sm">
                      <p className="font-bold text-gray-900 dark:text-white">Jane Doe</p>
                      <p className="text-gray-700 dark:text-gray-300">Marketing Assistant</p>
                      <p className="text-gray-700 dark:text-gray-300">jane.doe@email.com</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-white">Experience:</p>
                      <p className="text-gray-700 dark:text-gray-300">Marketing Assistant, XYZ Company (2019-Present)</p>
                      <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                        <li>Helped with social media posts</li>
                        <li>Worked on email campaigns</li>
                        <li>Assisted with event planning</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">After</p>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700 h-64 overflow-y-auto text-sm">
                      <p className="font-bold text-gray-900 dark:text-white">Jane Doe</p>
                      <p className="text-gray-700 dark:text-gray-300">Digital Marketing Specialist</p>
                      <p className="text-gray-700 dark:text-gray-300">jane.doe@email.com | linkedin.com/in/janedoe</p>
                      <p className="mt-2 font-bold text-gray-900 dark:text-white">Professional Experience:</p>
                      <p className="text-gray-700 dark:text-gray-300">Digital Marketing Specialist, XYZ Company (2019-Present)</p>
                      <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                        <li>
                          Developed and executed social media strategies that increased follower engagement by 45%
                        </li>
                        <li>
                          Created targeted email marketing campaigns achieving 28% open rates, exceeding industry
                          average by 10%
                        </li>
                        <li>Coordinated 5 major product launch events, resulting in 35% increase in brand awareness</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />
      </main>

      <Footer />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultTab="signin" />
      
      <ATSAnalyzerModal
        isOpen={isATSModalOpen}
        onClose={() => setIsATSModalOpen(false)}
        resumeId={resumeId}
        filePath={filePath}
        onAnalysisComplete={handleATSAnalysisComplete}
      />

      {/* Reset Confirmation Dialog */}
      <Dialog open={isResetConfirmDialogOpen} onOpenChange={setIsResetConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Don't forget your enhanced resume!
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Make sure to download your enhanced resume before uploading a new one. 
              You'll lose access to this enhanced version once you start a new enhancement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={downloadEnhancedPDF}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Enhanced Resume First
            </Button>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsResetConfirmDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={resetUploadScreen}
              variant="destructive"
              className="flex-1"
            >
              Continue Without Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
