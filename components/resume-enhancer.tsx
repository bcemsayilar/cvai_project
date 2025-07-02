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

  // Reset scroll position on initial load
  useEffect(() => {
    // Scroll to top on component mount to ensure page starts at the beginning
    window.scrollTo(0, 0)
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
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-teal-900/20 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-teal-100 to-blue-100 dark:from-teal-900/30 dark:to-blue-900/30 rounded-2xl mb-8 shadow-lg backdrop-blur-sm border border-teal-200 dark:border-teal-800">
                <Sparkles className="h-10 w-10 text-teal-600 dark:text-teal-400" />
              </div>
              
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-6xl md:text-7xl lg:text-8xl leading-tight">
                Transform Your Resume
                <br />
                <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-teal-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Instantly
                </span>
              </h1>
              
              <p className="mt-8 max-w-4xl mx-auto text-xl text-gray-600 dark:text-gray-300 sm:text-2xl leading-relaxed">
                AI-powered resume enhancements tailored to your style and profession. 
                <span className="block mt-2 text-lg text-gray-500 dark:text-gray-400">
                  Get past ATS systems, impress recruiters, and land your dream job.
                </span>
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button
                  size="lg"
                  className="group relative rounded-2xl px-12 py-6 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative flex items-center">
                    <Upload className="mr-3 h-6 w-6" />
                    Start Enhancing Now
                  </div>
                </Button>
                
                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">Free to try</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium">100% Secure</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium">AI-Powered</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">98%</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">ATS Compatible</div>
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Pass automated screening</div>
              </div>
              
              <div className="text-center p-8 rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">15s</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Average Time</div>
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Lightning-fast processing</div>
              </div>
              
              <div className="text-center p-8 rounded-3xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">10K+</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">Success Stories</div>
                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">Professionals enhanced</div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Trusted by professionals at</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Google</span>
                </div>
                <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Microsoft</span>
                </div>
                <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Amazon</span>
                </div>
                <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Meta</span>
                </div>
                <div className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">Apple</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upload & Interaction Area */}
        <section id="upload-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-teal-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-teal-100 to-blue-100 dark:from-teal-900/30 dark:to-blue-900/30 rounded-full mb-6">
                <Upload className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Enhance Your <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">Resume</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Upload your resume and watch our AI transform it into a professional, ATS-optimized masterpiece in seconds
              </p>
            </div>

            <Card className="p-8 sm:p-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-2xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-300">

              {!isAuthLoading && user && profile && (
                <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-2xl border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{user.email?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          <span className="capitalize">{profile.subscription_type}</span> Plan
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((profile.resumes_used / profile.resumes_limit) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {profile.resumes_used}/{profile.resumes_limit}
                          </span>
                        </div>
                      </div>
                    </div>
                    {profile.resumes_used >= profile.resumes_limit && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Limit Reached</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-10">
                {/* File Upload */}
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      1
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Upload Your Resume</h3>
                      <p className="text-gray-600 dark:text-gray-400">Support for PDF, DOC, DOCX, and TXT formats</p>
                    </div>
                  </div>
                  <FileUploader 
                    onFileUpload={handleFileUpload} 
                    file={file} 
                    shouldReset={shouldResetFileUploader}
                    onResetComplete={handleFileUploaderResetComplete}
                  />
                </div>

                {/* Resume Format Selection */}
                {file && (
                  <div className="relative">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        2
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Choose Resume Format</h3>
                        <p className="text-gray-600 dark:text-gray-400">Select the best format for your needs</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div 
                        className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          resumeFormat === "visual" 
                            ? "border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 dark:border-teal-400 shadow-lg" 
                            : "border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 bg-white dark:bg-gray-800"
                        }`}
                        onClick={() => setResumeFormat("visual")}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            resumeFormat === "visual" 
                              ? "border-teal-500 bg-teal-500" 
                              : "border-gray-300 dark:border-gray-600 group-hover:border-teal-400"
                          }`}>
                            {resumeFormat === "visual" && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Sparkles className={`h-5 w-5 ${resumeFormat === "visual" ? "text-teal-600 dark:text-teal-400" : "text-gray-400 group-hover:text-teal-500"}`} />
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Visual Design</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Beautiful, modern layout perfect for presentations and networking</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs rounded-full">Modern Design</span>
                              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">Eye-catching</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          resumeFormat === "ats" 
                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-400 shadow-lg" 
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800"
                        }`}
                        onClick={() => setResumeFormat("ats")}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            resumeFormat === "ats" 
                              ? "border-blue-500 bg-blue-500" 
                              : "border-gray-300 dark:border-gray-600 group-hover:border-blue-400"
                          }`}>
                            {resumeFormat === "ats" && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className={`h-5 w-5 ${resumeFormat === "ats" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-blue-500"}`} />
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">ATS Optimized</h4>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Clean LaTeX format optimized for applicant tracking systems</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">ATS-Friendly</span>
                              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">98% Pass Rate</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Style Selection */}
                {file && (
                  <div className="relative">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        3
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Select Enhancement Style</h3>
                        <p className="text-gray-600 dark:text-gray-400">Choose how our AI should improve your resume</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                      <Toggle
                        pressed={selectedStyles.professional}
                        onPressedChange={() => handleStyleToggle("professional")}
                        className="h-auto p-4 data-[state=on]:bg-gradient-to-r data-[state=on]:from-teal-50 data-[state=on]:to-blue-50 data-[state=on]:text-teal-900 data-[state=on]:border-teal-300 dark:data-[state=on]:from-teal-900/20 dark:data-[state=on]:to-blue-900/20 dark:data-[state=on]:text-teal-100 dark:data-[state=on]:border-teal-600 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-teal-200 dark:hover:border-teal-700 transition-all duration-300 rounded-xl"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-sm">✨ Professional Style</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Corporate-friendly language</div>
                        </div>
                      </Toggle>
                      
                      <Toggle
                        pressed={selectedStyles.concise}
                        onPressedChange={() => handleStyleToggle("concise")}
                        className="h-auto p-4 data-[state=on]:bg-gradient-to-r data-[state=on]:from-blue-50 data-[state=on]:to-indigo-50 data-[state=on]:text-blue-900 data-[state=on]:border-blue-300 dark:data-[state=on]:from-blue-900/20 dark:data-[state=on]:to-indigo-900/20 dark:data-[state=on]:text-blue-100 dark:data-[state=on]:border-blue-600 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 rounded-xl"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-sm">🎯 Clear & Concise</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Easy-to-read format</div>
                        </div>
                      </Toggle>
                      
                      <Toggle
                        pressed={selectedStyles.creative}
                        onPressedChange={() => handleStyleToggle("creative")}
                        className="h-auto p-4 data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-50 data-[state=on]:to-pink-50 data-[state=on]:text-purple-900 data-[state=on]:border-purple-300 dark:data-[state=on]:from-purple-900/20 dark:data-[state=on]:to-pink-900/20 dark:data-[state=on]:text-purple-100 dark:data-[state=on]:border-purple-600 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-300 rounded-xl"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-sm">🎨 Clever & Artistic</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dynamic creative language</div>
                        </div>
                      </Toggle>
                      
                      <Toggle
                        pressed={selectedStyles.grammarFix}
                        onPressedChange={() => handleStyleToggle("grammarFix")}
                        className="h-auto p-4 data-[state=on]:bg-gradient-to-r data-[state=on]:from-green-50 data-[state=on]:to-emerald-50 data-[state=on]:text-green-900 data-[state=on]:border-green-300 dark:data-[state=on]:from-green-900/20 dark:data-[state=on]:to-emerald-900/20 dark:data-[state=on]:text-green-100 dark:data-[state=on]:border-green-600 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-green-200 dark:hover:border-green-700 transition-all duration-300 rounded-xl"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-sm">🔧 Grammar & Issue Fixes</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Correct errors & improve readability</div>
                        </div>
                      </Toggle>
                      
                      <Toggle
                        pressed={selectedStyles.styleOnly}
                        onPressedChange={() => handleStyleToggle("styleOnly")}
                        className="h-auto p-4 data-[state=on]:bg-gradient-to-r data-[state=on]:from-orange-50 data-[state=on]:to-yellow-50 data-[state=on]:text-orange-900 data-[state=on]:border-orange-300 dark:data-[state=on]:from-orange-900/20 dark:data-[state=on]:to-yellow-900/20 dark:data-[state=on]:text-orange-100 dark:data-[state=on]:border-orange-600 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-orange-200 dark:hover:border-orange-700 transition-all duration-300 rounded-xl sm:col-span-2 lg:col-span-1"
                      >
                        <div className="text-left">
                          <div className="font-semibold text-sm">🎨 Style Only</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format improvements only</div>
                        </div>
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
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-teal-100 dark:bg-teal-900/30 rounded-full mb-6">
                <Sparkles className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Transform Your Resume in <span className="text-teal-600 dark:text-teal-400">4 Simple Steps</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                From upload to download in under 30 seconds. Our AI-powered system analyzes, enhances, and optimizes your resume for maximum impact.
              </p>
            </div>

            {/* Process Flow */}
            <div className="relative mb-16">
              {/* Connection Lines */}
              <div className="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
                <div className="flex justify-between items-center px-24">
                  <div className="w-24 h-0.5 bg-gradient-to-r from-teal-300 to-blue-300"></div>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-blue-300 to-teal-300"></div>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-teal-300 to-green-300"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Step 1: Upload */}
                <div className="relative group">
                  <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transform group-hover:scale-105 transition-all duration-300 hover:shadow-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:from-teal-600 group-hover:to-teal-700 transition-all duration-300">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Upload Your Resume</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Drag & drop or select your resume file. We support PDF, DOC, DOCX, and TXT formats with secure, encrypted processing.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1">
                      <span className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs rounded-full">PDF</span>
                      <span className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs rounded-full">DOC</span>
                      <span className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs rounded-full">DOCX</span>
                      <span className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs rounded-full">TXT</span>
                    </div>
                  </div>
                </div>

                {/* Step 2: Analyze */}
                <div className="relative group">
                  <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transform group-hover:scale-105 transition-all duration-300 hover:shadow-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">ATS Analysis</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Get instant ATS compatibility scoring and see how recruitment systems will parse your resume.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Keyword optimization
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Format compatibility
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Structure analysis
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Enhance */}
                <div className="relative group">
                  <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transform group-hover:scale-105 transition-all duration-300 hover:shadow-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:from-teal-600 group-hover:to-emerald-600 transition-all duration-300">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">AI Enhancement</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Advanced AI rewrites your content for maximum impact. Choose from professional, creative, or concise styles.
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                        Content optimization
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                        Grammar & style fixes
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                        Impact quantification
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Download */}
                <div className="relative group">
                  <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transform group-hover:scale-105 transition-all duration-300 hover:shadow-xl">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300">
                      <Download className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Download & Apply</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Get your enhanced resume in multiple formats. Visual for presentations, ATS-optimized for applications.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1">
                      <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">Visual PDF</span>
                      <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">ATS PDF</span>
                      <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">DOCX</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats and Trust Indicators */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">15-30s</div>
                  <div className="text-gray-600 dark:text-gray-400">Average processing time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">98%</div>
                  <div className="text-gray-600 dark:text-gray-400">ATS compatibility rate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">256-bit</div>
                  <div className="text-gray-600 dark:text-gray-400">SSL encryption</div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-12">
              <Button
                size="lg"
                className="rounded-xl px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Upload className="mr-2 h-5 w-5" />
                Try It Now - It's Free
              </Button>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                No credit card required • Your data stays private • Instant results
              </p>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Real Resume <span className="text-blue-600 dark:text-blue-400">Transformations</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                See how our AI transforms ordinary resumes into compelling professional profiles that get noticed by recruiters
              </p>
            </div>

            <div className="space-y-12">
              {/* Software Engineer Example */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Software Engineer</h3>
                      <p className="text-blue-100 mt-1">Frontend Developer → Senior Full Stack Engineer</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-blue-100">ATS Score Improvement</div>
                      <div className="text-3xl font-bold">62% → 94%</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Before */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          Before Enhancement
                        </h4>
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-full">
                          Needs Work
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 h-80 overflow-y-auto">
                        <div className="space-y-3 text-sm">
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-white">John Smith</h5>
                            <p className="text-gray-600 dark:text-gray-400">Software Developer</p>
                            <p className="text-gray-600 dark:text-gray-400">john.smith@email.com</p>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Experience:</h6>
                            <div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">Junior Developer, ABC Tech (2020-Present)</p>
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                <li>Worked on web applications</li>
                                <li>Fixed bugs in the codebase</li>
                                <li>Helped with code reviews</li>
                                <li>Attended team meetings</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-1">Skills:</h6>
                            <p className="text-gray-600 dark:text-gray-400">JavaScript, HTML, CSS</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        <span>Lacks impact, metrics, and technical specificity</span>
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          After Enhancement
                        </h4>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                          Interview Ready
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 h-80 overflow-y-auto">
                        <div className="space-y-3 text-sm">
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-white">John Smith</h5>
                            <p className="text-gray-700 dark:text-gray-300 font-semibold">Senior Full Stack Software Engineer</p>
                            <p className="text-gray-600 dark:text-gray-400">john.smith@email.com | github.com/johnsmith | linkedin.com/in/johnsmith</p>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Professional Experience:</h6>
                            <div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">Senior Software Engineer, ABC Tech (2020-Present)</p>
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                <li>Engineered responsive web applications using React.js and Node.js, resulting in 30% improvement in user engagement and 25% faster load times</li>
                                <li>Implemented comprehensive error handling and monitoring systems, reducing critical production bugs by 45% and improving system reliability</li>
                                <li>Led code review processes for a team of 8 developers, maintaining 98% quality assurance pass rate and mentoring 3 junior developers</li>
                                <li>Architected and deployed microservices infrastructure using Docker and AWS, supporting 10k+ daily active users</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-1">Technical Skills:</h6>
                            <p className="text-gray-600 dark:text-gray-400">JavaScript (ES6+), TypeScript, React.js, Node.js, Python, AWS, Docker, PostgreSQL, MongoDB, Git, CI/CD</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>Quantified achievements, technical depth, leadership experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Improvement Highlights */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Key Improvements:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Quantified Impact</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Added specific metrics and percentages</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Technical Depth</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Detailed tech stack and frameworks</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Leadership Stories</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Mentoring and team collaboration</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Specialist Example */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">Marketing Specialist</h3>
                      <p className="text-purple-100 mt-1">Marketing Assistant → Senior Digital Marketing Manager</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-purple-100">ATS Score Improvement</div>
                      <div className="text-3xl font-bold">58% → 91%</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Before */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                          Before Enhancement
                        </h4>
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-full">
                          Generic
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 h-80 overflow-y-auto">
                        <div className="space-y-3 text-sm">
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-white">Jane Doe</h5>
                            <p className="text-gray-600 dark:text-gray-400">Marketing Assistant</p>
                            <p className="text-gray-600 dark:text-gray-400">jane.doe@email.com</p>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Experience:</h6>
                            <div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">Marketing Assistant, XYZ Company (2019-Present)</p>
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                <li>Helped with social media posts</li>
                                <li>Worked on email campaigns</li>
                                <li>Assisted with event planning</li>
                                <li>Created marketing materials</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-1">Skills:</h6>
                            <p className="text-gray-600 dark:text-gray-400">Social Media, Email Marketing</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        <span>Vague responsibilities, no measurable results</span>
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          After Enhancement
                        </h4>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                          Results-Driven
                        </span>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-800 h-80 overflow-y-auto">
                        <div className="space-y-3 text-sm">
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-white">Jane Doe</h5>
                            <p className="text-gray-700 dark:text-gray-300 font-semibold">Senior Digital Marketing Manager</p>
                            <p className="text-gray-600 dark:text-gray-400">jane.doe@email.com | linkedin.com/in/janedoe | portfolio.janedoe.com</p>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-2">Professional Experience:</h6>
                            <div>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">Senior Digital Marketing Manager, XYZ Company (2019-Present)</p>
                              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                                <li>Developed and executed comprehensive social media strategies across 5 platforms, increasing follower engagement by 45% and driving 200% growth in qualified leads</li>
                                <li>Created and optimized targeted email marketing campaigns for 50k+ subscribers, achieving 28% open rates (10% above industry average) and generating $2.3M in revenue</li>
                                <li>Planned and executed 12 major product launch events, resulting in 35% increase in brand awareness and 150% boost in event attendance year-over-year</li>
                                <li>Led cross-functional marketing team of 4, implementing data-driven strategies that improved campaign ROI by 60%</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-1">Core Competencies:</h6>
                            <p className="text-gray-600 dark:text-gray-400">Digital Marketing Strategy, Content Marketing, SEO/SEM, Marketing Automation (HubSpot, Mailchimp), Google Analytics, A/B Testing, Lead Generation</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>Revenue impact, team leadership, data-driven results</span>
                      </div>
                    </div>
                  </div>

                  {/* Improvement Highlights */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Key Improvements:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Revenue Focus</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Added specific dollar amounts and ROI</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Scale & Scope</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Audience size and platform details</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Strategic Thinking</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Cross-functional leadership and data analysis</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Resume?</h3>
                <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
                  Join thousands of professionals who've enhanced their resumes and landed their dream jobs
                </p>
                <Button
                  size="lg"
                  className="rounded-xl px-8 py-4 bg-white hover:bg-gray-100 text-teal-600 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => document.getElementById("upload-section")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Start Your Transformation
                </Button>
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
