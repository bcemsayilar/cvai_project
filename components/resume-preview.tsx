// @ts-nocheck
"use client"
import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Download, FileText, Loader2, PenTool, Moon, Sun, BarChart3 } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { ATSScoreDisplay } from "./ats-score-display"
import { ResumePdfDocument } from "./resume-pdf-document"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface ATSScore {
  keywordMatch: number
  formatScore: number
  contentQuality: number
  readabilityScore: number
  structureScore: number
  overallScore: number
  recommendations: string[]
}

// Import builder components


interface ResumePreviewProps {
  resumeId?: string | null
  originalPath?: string | null
  processedPath?: string | null
  atsScoreOriginal?: ATSScore | null
  atsScoreEnhanced?: ATSScore | null
}

export interface ResumeContent {
  name?: string
  title?: string
  contact?: {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string; // Added github based on typical resume social links
    twitter?: string; // Added twitter
    website?: string; // Added website
    // Add other contact/social fields as needed
  }
  objective?: string
  summary?: string
  experience?: Array<{
    position?: string
    company?: string
    location?: string
    dates?: string
    highlights?: string[]
    tags?: string[];
  }>
  education?: Array<{
    degree?: string
    institution?: string
    location?: string
    dates?: string
    details?: string[]
  }>
  skills?: string[]
  certifications?: string[]
  languages?: string[]
  references?: Array<{
    name?: string
    position?: string
    company?: string
    contact?: string
  }>
  projects?: Array<{
     name?: string;
     description?: string;
     link?: string;
     // Add other project fields
  }>;
  tools?: string[]; // Added tools based on the image
  // Add other top-level sections as needed based on Groq output
}

export interface ResumeDesign {
  colorScheme: {
    background: string
    textPrimary: string
    textSecondary: string
    accent: string
  }
  typography: {
    headingFont: string
    bodyFont: string
    headingSize: string
    bodySize: string
  }
  layout: string
  style?: string
  layers?: Array<{
    area: string
    background?: string
    backgroundGradient?: {
      from: string
      to: string
      direction: string
    }
    shadow?: string
    borderRadius?: string
    padding?: string
    margin?: string
  }>
  pdfLayout?: {
    pageSize: string
    orientation: string
    margins: {
      top: number
      bottom: number
      left: number
      right: number
    }
  }
}

type ResumePreviewData = {
  content?: ResumeContent
  design?: ResumeDesign
}

// For TypeScript/JSX errors, ensure tsconfig.json has: "jsx": "react-jsx"
// and install @types/react if not present: pnpm add -D @types/react

export const ResumePreview = memo(function ResumePreview({ 
  resumeId, 
  originalPath, 
  processedPath, 
  atsScoreOriginal: propAtsScoreOriginal, 
  atsScoreEnhanced: propAtsScoreEnhanced 
}: ResumePreviewProps) {
  // State definitions
  const [viewMode, setViewMode] = useState<"preview" | "text" | "json">("preview")
  const [originalResume, setOriginalResume] = useState<string>("")
  const [resumePreviewData, setResumePreviewData] = useState<ResumePreviewData | null>(null)
  const [resumePreviewError, setResumePreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("preview")
  const [atsScoreOriginal, setAtsScoreOriginal] = useState<ATSScore | null>(propAtsScoreOriginal || null)
  const [atsScoreEnhanced, setAtsScoreEnhanced] = useState<ATSScore | null>(propAtsScoreEnhanced || null)
  const { toast } = useToast()
  
  // Create supabase client with useRef to prevent recreation on every render
  const supabaseRef = useRef(createSupabaseClient())
  const supabase = supabaseRef.current

  // Update ATS scores when props change
  useEffect(() => {
    setAtsScoreOriginal(propAtsScoreOriginal || null)
    setAtsScoreEnhanced(propAtsScoreEnhanced || null)
  }, [propAtsScoreOriginal, propAtsScoreEnhanced])

  useEffect(() => {
    const fetchResumeData = async () => {
      if (!resumeId) {
        setIsLoading(false)
        setResumePreviewError("No resume ID provided.")
        return
      }

      setIsLoading(true);
      setResumePreviewError(null);

      try {
        const { data: resume, error: resumeError } = await supabase
          .from("resumes")
          .select("*")
          .eq("id", resumeId)
          .single();

        if (resumeError) {
          console.error("Error fetching resume:", resumeError);
          setResumePreviewError("Error fetching resume from database.");
          // throw resumeError; // Removed throwing error to prevent breaking the process
        }

        if (!resume) {
          setResumePreviewError("No resume data found in database.");
          setResumePreviewData(null);
          return;
        }

        let previewJson = resume.resume_preview_json;
        if (typeof previewJson === "string") {
          try {
            previewJson = JSON.parse(previewJson);
          } catch (e) {
            setResumePreviewError("Resume preview JSON is malformed. Please try enhancing again or contact support.");
            previewJson = null;
          }
        }

        // Loosened: accept any object for previewJson, add checks for nested structure
        if (previewJson && typeof previewJson === "object") {
           // Prioritize nested structure if it exists
           const content = previewJson.content || previewJson.sections; // Check 'sections' as well for content
           const design = previewJson.design;

          if (content) {
             setResumePreviewData({ content, design }); // Set content and design together
             // Removed incomplete data check here as the PDF component handles variations
          } else {
             // If no 'content' or 'sections', assume it might be the flat structure
             setResumePreviewData({ content: previewJson as ResumeContent, design: previewJson.design });
             // Add a generic warning if the expected structure isn't found
             if (!previewJson.name && !previewJson.sections) { // Check for a key from flat structure
                  setResumePreviewError("Resume data structure is unexpected. Preview may be incomplete.");
             }
          }


        } else {
          setResumePreviewData(null);
          setResumePreviewError("Resume preview data is missing or empty. Please try enhancing again.");
        }

        // Set ATS scores if available
        if (resume.ats_score_original) {
          setAtsScoreOriginal(resume.ats_score_original as ATSScore);
        }
        if (resume.ats_score_enhanced) {
          setAtsScoreEnhanced(resume.ats_score_enhanced as ATSScore);
        }

        if (originalPath) {
          const { data: originalData, error: originalError } = await supabase.storage
            .from("resumes")
            .download(originalPath);

          if (originalError) {
            console.error("Error downloading original resume:", originalError);
            // Do not set original resume error, just log it
          }

          if (originalData) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setOriginalResume(reader.result as string);
            };
            reader.readAsText(originalData);
          }
        }

      } catch (error) {
        console.error("Failed to fetch and process resume data:", error);
        // Only set generic error if no specific error was set during data fetching
        if (!resumePreviewError) { // Avoid overwriting a more specific error
           setResumePreviewError("An unexpected error occurred while loading resume data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumeData();
  }, [resumeId, originalPath]) // Removed supabase from dependency array

  const downloadTxtFile = async () => {
    if (originalResume) {
      const blob = new Blob([originalResume], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "original_resume.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      toast({
        title: "No original resume available",
        description: "Could not download the original text file.",
        variant: "destructive",
      });
    }
  };

  // Memoize the PDF document to prevent unnecessary re-renders
  const pdfDocument = useMemo(() => {
    if (!resumePreviewData?.content) return null;
    return <ResumePdfDocument resumeData={resumePreviewData} mode={isDarkMode ? 'dark' : 'light'} />;
  }, [resumePreviewData, isDarkMode]);

  // Memoize the download filename
  const downloadFileName = useMemo(() => {
    return `${resumePreviewData?.content?.name || 'resume'}.pdf`;
  }, [resumePreviewData?.content?.name]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const renderResumePreview = () => {
     if (!resumePreviewData || !resumePreviewData.content) {
        return <p>No preview data available.</p>;
     }

     // Use PDFViewer to display the ResumePdfDocument component with proper sizing
    return (
         <div className="w-full" style={{ height: '80vh', minHeight: '600px' }}>
           <PDFViewer 
             width="100%"
             height="100%"
             style={{ 
               border: 'none',
               height: '80vh',
               minHeight: '600px'
             }}
             key={`pdf-viewer-${resumeId}-${isDarkMode}`} // Add key to prevent unnecessary re-renders
           >
             {pdfDocument}
           </PDFViewer>
            </div>
     );
  };

  const renderTextView = () => {
    return originalResume ? (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-mono text-sm">
        {originalResume}
                  </div>
    ) : (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400 font-mono text-sm">
        No original text content available.
      </div>
    )
  }

  const renderJsonView = () => {
    return resumePreviewData ? (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-mono text-sm">
        {JSON.stringify(resumePreviewData, null, 2)}
      </div>
    ) : (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-gray-600 dark:text-gray-400 font-mono text-sm">
        No JSON preview data available.
      </div>
    )
  }

  // Remove renderATSView function since ATS analysis is now standalone


  return (
    <Card className="w-full h-full min-h-[800px] overflow-hidden flex flex-col dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center p-4 border-b dark:border-gray-700">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="dark:bg-gray-800">
            <TabsTrigger value="preview" className="dark:data-[state=active]:bg-gray-700">Preview</TabsTrigger>
            <TabsTrigger value="text" className="dark:data-[state=active]:bg-gray-700">Original Text</TabsTrigger>
            <TabsTrigger value="json" className="dark:data-[state=active]:bg-gray-700">JSON Data</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center space-x-4">
           {/* Warning Message - Keep for now as data might be incomplete */}
            {resumePreviewError && activeTab === "preview" && (
              <div className="text-yellow-600 dark:text-yellow-400 flex items-center space-x-1">
                <AlertTriangle size={18} />
                <span>{resumePreviewError}</span>
              </div>
            )}

           {/* Compare ATS Scores Button - Only show if both scores exist */}
            {atsScoreOriginal && atsScoreEnhanced && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">
                    <BarChart3 size={18} />
                    <span>Compare ATS Scores</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="dark:text-gray-100">ATS Score Comparison</DialogTitle>
                  </DialogHeader>
                  <ATSScoreDisplay 
                    originalScore={atsScoreOriginal} 
                    enhancedScore={atsScoreEnhanced} 
                  />
                </DialogContent>
              </Dialog>
            )}

           {/* Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
               <Sun size={18} className="text-gray-500 dark:text-gray-400"/>
               <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} id="dark-mode" />
               <Moon size={18} className="text-gray-500 dark:text-gray-400"/>
            </div>

          {/* Download PDF Button (using react-pdf/renderer) */}
          {/* Only show if resumePreviewData exists and has content */}
          {pdfDocument && (
             <PDFDownloadLink
                document={pdfDocument}
                fileName={downloadFileName}
                key={`pdf-download-${resumeId}-${isDarkMode}`} // Add key to prevent unnecessary re-renders
             >
                {({ blob, url, loading, error }) => (
                   <Button
                      className="flex items-center space-x-2"
                      disabled={loading}
                   >
                      {loading ? (
                         <Loader2 className="animate-spin" size={18} />
                      ) : (
                         <Download size={18} />
                      )}
                      <span>{loading ? 'Generating PDF...' : 'Download PDF'}</span>
                   </Button>
                )}
             </PDFDownloadLink>
          )}


          {/* Download Original Text Button */}
           {originalResume && (
            <Button
                className="flex items-center space-x-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                onClick={downloadTxtFile}
                variant="outline"
             >
                <FileText size={18} />
                <span>Download Text</span>
              </Button>
            )}

        </div>
      </div>
      <div className="flex-grow overflow-hidden" style={{ minHeight: '700px' }}>
        <div className="h-full overflow-y-auto">
            {isLoading ? (
              <div className="space-y-4 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
                  </div>
        ) : (
          <>
            {resumePreviewError && activeTab !== "json" && (
               // Moved the error message here to be part of the content area
              <div className="text-yellow-600 dark:text-yellow-400 flex items-center space-x-1 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md mb-4 mx-4">
                <AlertTriangle size={18} />
                <span>{resumePreviewError}</span>
              </div>
            )}
            <div className={activeTab === "preview" ? "h-full" : "p-4"}>
              {activeTab === "preview" && renderResumePreview()}
              {activeTab === "text" && renderTextView()}
              {activeTab === "json" && renderJsonView()}
            </div>
          </>
        )}
        </div>
      </div>
    </Card>
  )
})