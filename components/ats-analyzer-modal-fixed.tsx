"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Target, TrendingUp, Lightbulb, CheckCircle, FileText, Sparkles, AlertTriangle } from "lucide-react"
import { ATSScoreDisplay } from "@/components/ats-score-display"
import { createSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface ATSScore {
  keywordMatch: number
  formatScore: number
  contentQuality: number
  readabilityScore: number
  structureScore: number
  overallScore: number
  recommendations: string[]
}

interface ATSAnalyzerModalProps {
  isOpen: boolean
  onClose: () => void
  resumeId: string | null
  filePath: string | null
  onAnalysisComplete?: (score: ATSScore) => void
}

export function ATSAnalyzerModal({ 
  isOpen, 
  onClose, 
  resumeId, 
  filePath, 
  onAnalysisComplete 
}: ATSAnalyzerModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null)
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'extracting' | 'analyzing' | 'complete'>('idle')
  
  const { toast } = useToast()
  const { user, profile, refreshProfile } = useAuth()
  const supabase = createSupabaseClient()

  const analyzeATSScore = async () => {
    if (!resumeId || !filePath) {
      toast({
        title: "No file uploaded",
        description: "Please upload your resume first",
        variant: "destructive",
      })
      return
    }

    // Check if user has reached their ATS analysis limit
    if (profile && profile.ats_analyses_used >= profile.ats_analyses_limit) {
      toast({
        title: "ATS analysis limit reached",
        description: `You've reached the limit of ${profile.ats_analyses_limit} ATS analyses. Please upgrade your plan for more analyses.`,
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisStep('extracting')

    try {
      console.log("Starting ATS analysis for resume:", resumeId)

      // Download the original resume file first
      const { data: fileData, error: fileError } = await supabase.storage
        .from("resumes")
        .download(filePath!)

      if (fileError || !fileData) {
        throw new Error("Failed to download resume file for ATS analysis")
      }

      setAnalysisStep('analyzing')

      // Extract text from the file
      let resumeText = ""
      
      if (fileData.type === "text/plain") {
        resumeText = await fileData.text()
      } else {
        // For non-text files, get the processed version
        const { data: resumeData, error: resumeError } = await supabase
          .from("resumes")
          .select("processed_file_path")
          .eq("id", resumeId)
          .single()

        if (resumeError || !resumeData?.processed_file_path) {
          throw new Error("Please enhance your resume first to enable ATS analysis for this file type")
        }

        // Get the processed text version
        const { data: processedFileData, error: processedFileError } = await supabase.storage
          .from("resumes")
          .download(resumeData.processed_file_path as string)

        if (processedFileError || !processedFileData) {
          throw new Error("Failed to get text content for ATS analysis")
        }

        resumeText = await processedFileData.text()
      }

      if (!resumeText || resumeText.trim() === "") {
        throw new Error("No text content found in resume file")
      }

      console.log("Calling ATS analyzer function...")

      // Call the standalone ATS analyzer function
      const { data, error } = await supabase.functions.invoke("ats-analyzer", {
        body: {
          resumeText: resumeText.trim(),
        },
      })

      if (error) {
        console.error("ATS analyzer function error:", error)
        throw new Error(error.message || "ATS analysis failed")
      }

      if (!data.success || !data.analysis) {
        console.error("ATS analysis failed:", data.error)
        throw new Error(data.error || "Failed to analyze ATS score")
      }

      console.log("ATS analysis completed successfully:", data.analysis)

      const analysisResult = data.analysis as ATSScore
      setAtsScore(analysisResult)
      setAnalysisStep('complete')
      
      // Increment user's ATS analysis usage count
      if (profile) {
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              ats_analyses_used: (profile.ats_analyses_used || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq("id", profile.id)

          if (profileError) {
            console.error("Failed to update ATS usage count:", profileError)
          } else {
            console.log("Successfully incremented ATS usage count")
            // Refresh the profile context to update the UI
            refreshProfile?.()
          }
        } catch (error) {
          console.error("Error updating ATS usage count:", error)
        }
      }
      
      // Call the completion callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult)
      }

      toast({
        title: "ATS Analysis Complete",
        description: `Your resume scored ${analysisResult.overallScore}/100 for ATS compatibility`,
      })

    } catch (error) {
      console.error("ATS analysis error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze ATS score"
      setAnalysisError(errorMessage)
      setAnalysisStep('idle')
      toast({
        title: "ATS Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getAnalysisStepText = () => {
    switch (analysisStep) {
      case 'extracting':
        return "Extracting text from your resume..."
      case 'analyzing':
        return "Analyzing ATS compatibility..."
      case 'complete':
        return "Analysis complete!"
      default:
        return "Ready to analyze"
    }
  }

  const handleClose = () => {
    if (!isAnalyzing) {
      setAtsScore(null)
      setAnalysisError(null)
      setAnalysisStep('idle')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            ATS Compatibility Analyzer
          </DialogTitle>
          <DialogDescription>
            Get detailed insights into how well your resume performs with Applicant Tracking Systems (ATS).
            Our AI analyzer evaluates your resume across 5 key criteria used by modern ATS platforms.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Analysis Status */}
          {!atsScore && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  How ATS Analysis Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Keyword Matching</span>
                    </div>
                    <p className="text-muted-foreground ml-6">Analyzes relevant industry keywords and skills</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Format Compatibility</span>
                    </div>
                    <p className="text-muted-foreground ml-6">Checks ATS-friendly formatting and structure</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Content Quality</span>
                    </div>
                    <p className="text-muted-foreground ml-6">Evaluates achievements and quantified results</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium">Actionable Insights</span>
                    </div>
                    <p className="text-muted-foreground ml-6">Provides specific improvement recommendations</p>
                  </div>
                </div>

                {analysisError && (
                  <Alert variant="destructive">
                    <AlertTitle>Analysis Error</AlertTitle>
                    <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={analyzeATSScore}
                    disabled={isAnalyzing || !resumeId}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {getAnalysisStepText()}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze My Resume
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {atsScore && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Analysis Complete!</h3>
                <p className="text-gray-600 mt-2">Here's how your resume performs with ATS systems</p>
              </div>

              <ATSScoreDisplay originalScore={atsScore} />

              <div className="flex justify-center gap-4">
                <Button 
                  onClick={() => setAtsScore(null)} 
                  variant="outline"
                  disabled={isAnalyzing}
                >
                  Analyze Again
                </Button>
                <Button onClick={handleClose} variant="default">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
