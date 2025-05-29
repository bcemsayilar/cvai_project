"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Upload, Download, CheckCircle, Lock, Sparkles, FileText, AlertTriangle, Info } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileUploader } from "@/components/file-uploader"
import { PricingSection } from "@/components/pricing-section"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { createSupabaseClient } from "@/lib/supabase"
import { ResumePreview } from "@/components/resume-preview"

export default function ResumeEnhancer() {
  const { toast } = useToast()
  const { user, profile, isLoading: isAuthLoading, createProfileIfMissing } = useAuth()
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
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [downloadFormat, setDownloadFormat] = useState<"txt" | null>(null)
  
  // Create supabase client with useRef to prevent recreation on every render
  const supabaseRef = useRef(createSupabaseClient())
  const supabase = supabaseRef.current

  // Debounce custom instructions to prevent excessive re-renders
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
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
          console.log("Resume update received:", payload.new.status)

          if (payload.new.status === "completed") {
            setIsProcessing(false)
            setIsComplete(true)
            setProcessedFilePath(payload.new.processed_file_path)
            setProcessingError(null)
            toast({
              title: "Resume enhanced successfully",
              description: "Your enhanced resume is ready to download",
            })
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
          .select("status, processed_file_path")
          .eq("id", resumeId)
          .single()

        if (error) throw error

        if (data.status === "completed") {
          setIsProcessing(false)
          setIsComplete(true)
          setProcessedFilePath(data.processed_file_path as string)
          setProcessingError(null)
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

      // Call the Supabase Edge Function to process the resume
      const { data, error } = await supabase.functions.invoke("process-resume", {
        body: {
          resumeId,
          enhancementStyles,
          customInstructions: debouncedCustomInstructions.trim() || null,
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
              .select("status, processed_file_path")
              .eq("id", resumeId)
              .single()

            if (error) throw error

            if (data.status === "completed") {
              setIsProcessing(false)
              setIsComplete(true)
              setProcessedFilePath(data.processed_file_path as string)
              setProcessingError(null)
              toast({
                title: "Resume enhanced successfully",
                description: "Your enhanced resume is ready to download",
              })
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

  // Check if user is on trial plan
  const isTrialUser = profile?.subscription_type === "trial"

  // Memoize ResumePreview props to prevent unnecessary re-renders
  const resumePreviewProps = useMemo(() => ({
    resumeId,
    originalPath: filePath,
    processedPath: processedFilePath
  }), [resumeId, filePath, processedFilePath])

  // Callback for handling custom instructions change
  const handleCustomInstructionsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomInstructions(e.target.value)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Transform Your Resume <span className="text-teal-600">Instantly</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
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
            <div className="mt-4 flex justify-center space-x-2 text-sm text-gray-500">
              <Lock className="h-4 w-4" />
              <span>Your resume stays private and secure</span>
            </div>
          </div>
        </section>

        {/* Upload & Interaction Area */}
        <section id="upload-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 sm:p-10 bg-white shadow-lg rounded-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Enhance Your Resume</h2>

              {!isAuthLoading && user && profile && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Plan: <span className="font-semibold capitalize">{profile.subscription_type}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {profile.resumes_used} of {profile.resumes_limit} resumes used
                      </p>
                    </div>
                    {profile.resumes_used >= profile.resumes_limit && (
                      <div className="flex items-center text-amber-600">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-3">1. Upload Your Resume</h3>
                  <FileUploader onFileUpload={handleFileUpload} file={file} />
                </div>

                {/* Style Selection */}
                {file && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">2. Select Enhancement Style</h3>
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Toggle
                        pressed={selectedStyles.professional}
                        onPressedChange={() => handleStyleToggle("professional")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200"
                      >
                        Professional Style
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.concise}
                        onPressedChange={() => handleStyleToggle("concise")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200"
                      >
                        Clear & Concise
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.creative}
                        onPressedChange={() => handleStyleToggle("creative")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200"
                      >
                        Clever & Artistic
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.grammarFix}
                        onPressedChange={() => handleStyleToggle("grammarFix")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200"
                      >
                        Grammar & Issue Fixes
                      </Toggle>
                      <Toggle
                        pressed={selectedStyles.styleOnly}
                        onPressedChange={() => handleStyleToggle("styleOnly")}
                        className="data-[state=on]:bg-teal-100 data-[state=on]:text-teal-900 data-[state=on]:border-teal-200"
                      >
                        Style Only (No text changes)
                      </Toggle>
                    </div>

                    <div className="mb-6">
                      <label htmlFor="custom-instructions" className="block text-sm font-medium text-gray-700 mb-1">
                        Or, describe your desired changes briefly:
                      </label>
                      <Textarea
                        id="custom-instructions"
                        placeholder="Make it suitable for a senior engineering role"
                        value={customInstructions}
                        onChange={handleCustomInstructionsChange}
                        className="min-h-[80px]"
                      />
                    </div>

                    {processingError && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{processingError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={processResume}
                      disabled={isProcessing || (profile?.resumes_used ?? 0) >= (profile?.resumes_limit ?? 0)}
                      className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Enhance My Resume
                        </>
                      )}
                    </Button>

                    {profile && profile.resumes_used >= profile.resumes_limit && (
                      <p className="mt-2 text-sm text-amber-600">
                        You've reached your plan limit. Please upgrade to process more resumes.
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
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-16 w-16 text-teal-600 animate-spin" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-teal-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Analyzing and enhancing your resume...</h2>
                <p className="text-gray-500 max-w-md">
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

        {/* Results Section */}
        {isComplete && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Your Enhanced Resume is Ready!</h2>
                <p className="text-gray-500 mt-2">Review the improvements below and download your enhanced resume.</p>
              </div>

              <Tabs defaultValue="preview" className="w-full mb-8">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="preview">Preview Changes</TabsTrigger>
                  <TabsTrigger value="download">Download Options</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="p-4 border rounded-lg">
                  <ResumePreview {...resumePreviewProps} />
                </TabsContent>
                <TabsContent value="download" className="p-6 border rounded-lg">
                  <div className="text-center space-y-6">
                    <h3 className="text-lg font-medium">Download Your Enhanced Resume</h3>
                    <p className="text-gray-500">Choose your preferred format below</p>

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
        <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Transform your resume in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Upload</h3>
                <p className="text-gray-600">Upload your existing resume in PDF, DOC, DOCX, or TXT format.</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Enhance</h3>
                <p className="text-gray-600">
                  Our AI analyzes and enhances your resume based on your selected style preferences.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">3. Download</h3>
                <p className="text-gray-600">Review the changes and download your professionally enhanced resume.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Examples Section */}
        <section id="examples" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Resume Examples</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                See how our AI transforms resumes across different industries
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">Software Engineer</h3>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-2">Before</p>
                    <div className="bg-white p-4 rounded border h-64 overflow-y-auto text-sm">
                      <p className="font-bold">John Smith</p>
                      <p>Software Developer</p>
                      <p>john.smith@email.com</p>
                      <p className="mt-2 font-bold">Experience:</p>
                      <p>Junior Developer, ABC Tech (2020-Present)</p>
                      <ul className="list-disc pl-5">
                        <li>Worked on web applications</li>
                        <li>Fixed bugs in the codebase</li>
                        <li>Helped with code reviews</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-2">After</p>
                    <div className="bg-white p-4 rounded border h-64 overflow-y-auto text-sm">
                      <p className="font-bold">John Smith</p>
                      <p>Full Stack Software Engineer</p>
                      <p>john.smith@email.com | github.com/johnsmith</p>
                      <p className="mt-2 font-bold">Professional Experience:</p>
                      <p>Software Engineer, ABC Tech (2020-Present)</p>
                      <ul className="list-disc pl-5">
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

              <div className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="text-xl font-semibold mb-4">Marketing Specialist</h3>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-2">Before</p>
                    <div className="bg-white p-4 rounded border h-64 overflow-y-auto text-sm">
                      <p className="font-bold">Jane Doe</p>
                      <p>Marketing Assistant</p>
                      <p>jane.doe@email.com</p>
                      <p className="mt-2 font-bold">Experience:</p>
                      <p>Marketing Assistant, XYZ Company (2019-Present)</p>
                      <ul className="list-disc pl-5">
                        <li>Helped with social media posts</li>
                        <li>Worked on email campaigns</li>
                        <li>Assisted with event planning</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-2">After</p>
                    <div className="bg-white p-4 rounded border h-64 overflow-y-auto text-sm">
                      <p className="font-bold">Jane Doe</p>
                      <p>Digital Marketing Specialist</p>
                      <p>jane.doe@email.com | linkedin.com/in/janedoe</p>
                      <p className="mt-2 font-bold">Professional Experience:</p>
                      <p>Digital Marketing Specialist, XYZ Company (2019-Present)</p>
                      <ul className="list-disc pl-5">
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
    </div>
  )
}
