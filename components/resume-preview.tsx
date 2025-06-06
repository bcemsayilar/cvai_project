// @ts-nocheck
"use client"
import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Download, FileText, Loader2, Moon, Sun, BarChart3 } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { ATSScoreDisplay } from "./ats-score-display"
import { ResumePdfDocument } from "./resume-pdf-document"
import { convertLatexDataToReactPdf, extractDataFromLatex } from "@/lib/latex-generator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"

// Buffer polyfill for browser environment
import { Buffer } from 'buffer';

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
  const [originalResume, setOriginalResume] = useState<string>("")
  const [resumePreviewData, setResumePreviewData] = useState<ResumePreviewData | null>(null)
  const [resumePreviewError, setResumePreviewError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [atsScoreOriginal, setAtsScoreOriginal] = useState<ATSScore | null>(propAtsScoreOriginal || null)
  const [atsScoreEnhanced, setAtsScoreEnhanced] = useState<ATSScore | null>(propAtsScoreEnhanced || null)
  const [isLatexFormat, setIsLatexFormat] = useState<boolean>(false)
  const [latexPdfUrl, setLatexPdfUrl] = useState<string | null>(null)
  const [isLoadingLatexPdf, setIsLoadingLatexPdf] = useState<boolean>(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false)
  
  // Persist LaTeX PDF URL in sessionStorage to prevent loss on navigation
  useEffect(() => {
    if (resumeId && latexPdfUrl) {
      sessionStorage.setItem(`latex-pdf-${resumeId}`, latexPdfUrl);
    }
  }, [resumeId, latexPdfUrl]);

  // Restore LaTeX PDF URL from sessionStorage on component mount
  useEffect(() => {
    if (resumeId && isLatexFormat) {
      const savedPdfUrl = sessionStorage.getItem(`latex-pdf-${resumeId}`);
      if (savedPdfUrl && !latexPdfUrl) {
        setLatexPdfUrl(savedPdfUrl);
      }
    }
  }, [resumeId, isLatexFormat, latexPdfUrl]);
  const { toast } = useToast()
  const { session } = useAuth();
  const accessToken = session?.access_token;

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
          // Don't show error for LaTeX format - it's expected to not have resume_preview_json
          if (!processedPath?.endsWith('.tex')) {
            setResumePreviewData(null);
            setResumePreviewError("Resume preview data is missing or empty. Please try enhancing again.");
          }
        }

        // Set ATS scores if available
        if (resume.ats_score_original) {
          setAtsScoreOriginal(resume.ats_score_original as ATSScore);
        }
        if (resume.ats_score_enhanced) {
          setAtsScoreEnhanced(resume.ats_score_enhanced as ATSScore);
        }

        // Detect if the processed file is LaTeX format
        if (processedPath && processedPath.endsWith('.tex')) {
          setIsLatexFormat(true);
          
          // Check for cached PDF URL first
          const cachedPdfUrl = sessionStorage.getItem(`latex-pdf-${resumeId}`);
          if (cachedPdfUrl && !latexPdfUrl) {
            setLatexPdfUrl(cachedPdfUrl);
          }
          
          // For LaTeX format, we'll display it properly using the LaTeX-to-PDF API
          // Set a placeholder that indicates this is a LaTeX resume
          setResumePreviewData({ 
            content: {
              name: "ATS-Optimized Resume",
              title: "LaTeX format detected - generating preview...",
              contact: {},
              experience: [],
              education: [],
              skills: []
            },
            design: {
              layout: { columns: 1 },
              colors: { accent: '#000000', textPrimary: '#000000' }
            }
          });
        } else {
          setIsLatexFormat(false);
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
  }, [resumeId, originalPath, processedPath])// Removed supabase from dependency array

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

  const downloadEnhancedTxtFile = async () => {
    if (!processedPath) {
      toast({
        title: "Enhanced resume not available",
        description: "No enhanced resume file found.",
        variant: "destructive",
      });
      return;
    }

    // For LaTeX format, look for the companion .txt file
    let txtPath = processedPath;
    if (processedPath.endsWith('.tex')) {
      txtPath = processedPath.replace('.tex', '.txt');
    }

    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .download(txtPath);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "enhanced_resume.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Enhanced text file downloaded",
        description: "Your enhanced resume has been downloaded as a text file.",
      });
    } catch (error) {
      console.error("Error downloading enhanced text file:", error);
      toast({
        title: "Download failed",
        description: "Could not download the enhanced text file.",
        variant: "destructive",
      });
    }
  };

  // Memoize the PDF document with deeper dependency checking to prevent unnecessary re-renders
  const pdfDocument = useMemo(() => {
    if (!resumePreviewData?.content) return null;
    return <ResumePdfDocument resumeData={resumePreviewData} mode={isDarkMode ? 'dark' : 'light'} />;
  }, [
    resumePreviewData?.content?.name,
    resumePreviewData?.content?.title, 
    resumePreviewData?.content?.experience,
    resumePreviewData?.content?.education,
    resumePreviewData?.content?.skills,
    resumePreviewData?.design,
    isDarkMode
  ]);

  // Memoize the download document separately to avoid re-creating for downloads
  const downloadDocument = useMemo(() => {
    if (!resumePreviewData?.content) return null;
    return <ResumePdfDocument resumeData={resumePreviewData} mode={isDarkMode ? 'dark' : 'light'} />;
  }, [
    resumePreviewData?.content?.name,
    resumePreviewData?.content?.title, 
    resumePreviewData?.content?.experience,
    resumePreviewData?.content?.education,
    resumePreviewData?.content?.skills,
    resumePreviewData?.design,
    isDarkMode
  ]);

  // Memoize the download filename
  const downloadFileName = useMemo(() => {
    return `${resumePreviewData?.content?.name || 'resume'}.pdf`;
  }, [resumePreviewData?.content?.name]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const renderResumePreview = () => {
     // For LaTeX format, show the actual LaTeX-compiled PDF
     if (isLatexFormat) {
       if (isLoadingLatexPdf) {
         return (
           <div className="flex items-center justify-center h-full min-h-[400px] p-8">
             <div className="text-center space-y-4 max-w-md">
               <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
                 <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 dark:text-white">ATS Optimized Format</h3>
               <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                 Generating LaTeX PDF preview...
               </p>
             </div>
           </div>
         );
       }

       if (latexPdfUrl) {
         return (
           <div className="w-full" style={{ height: '80vh', minHeight: '600px' }}>
             <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
               <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-sm">
                 <FileText size={16} />
                 <span className="font-medium">ATS-Optimized LaTeX Resume</span>
               </div>
               <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                 This is your professionally compiled LaTeX resume optimized for ATS systems.
               </p>
             </div>
             <div className="h-full min-h-[600px] w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
               <iframe 
                 src={latexPdfUrl}
                 className="w-full h-full min-h-[520px]"
                 title="ATS-Optimized Resume Preview"
                 style={{ border: 'none' }}
               />
             </div>
           </div>
         );
       }

       // Fallback if PDF generation failed
       return (
         <div className="flex items-center justify-center h-full min-h-[400px] p-8">
           <div className="text-center space-y-4 max-w-md">
             <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto">
               <FileText className="w-8 h-8 text-amber-600 dark:text-amber-400" />
             </div>
             <h3 className="text-lg font-medium text-gray-900 dark:text-white">ATS Optimized Format</h3>
             <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
               LaTeX PDF preview is not available. The resume is in ATS-optimized LaTeX format.
             </p>
             <button 
               onClick={loadLatexPdfPreview}
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
             >
               Retry Preview
             </button>
           </div>
         </div>
       );
     }

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
             key={`pdf-viewer-${resumeId}-${isDarkMode}`}
           >
             {pdfDocument}
           </PDFViewer>
            </div>
     );
  };

  // Function to load LaTeX PDF preview with proper error handling
  const loadLatexPdfPreview = useCallback(async () => {
    if (!resumeId || !isLatexFormat) return;
    setIsLoadingLatexPdf(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch('/api/latex-to-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          resumeId,
          isPreview: true
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`LaTeX PDF generation failed: ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success && result.pdfData) {
        setLatexPdfUrl(result.pdfData);
      } else {
        throw new Error(result.error || 'PDF generation returned no data');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error loading LaTeX PDF preview:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Preview Error",
        description: `Could not load LaTeX PDF preview: ${errorMessage}`,
        variant: "destructive",
      });
      
      // Reset PDF URL on error
      setLatexPdfUrl(null);
    } finally {
      setIsLoadingLatexPdf(false);
    }
  }, [resumeId, isLatexFormat, toast, accessToken]);

  // Handle ATS PDF download with proper error handling
  const handleATSPdfDownload = useCallback(async () => {
    if (isDownloadingPdf) return; // Prevent multiple downloads
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for download
    
    setIsDownloadingPdf(true);
    
    try {
      // Show loading state
      toast({
        title: "Generating PDF...",
        description: "Your ATS-optimized resume is being prepared for download.",
      });

      // Try the new blob-based download method first
      try {
        const response = await fetch('/api/latex-to-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ resumeId, isPreview: false }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Download request failed' }));
          throw new Error(`Download failed: ${errorData.error || response.statusText}`);
        }
        
        const result = await response.json();
        if (result.success && result.pdfBuffer) {
          // Convert base64 to blob and download directly - no URL opening
          const base64Data = result.pdfBuffer.replace(/^data:application\/pdf;base64,/, '');
          const binaryData = Buffer.from(base64Data, 'base64');
          const pdfBlob = new Blob([binaryData], { type: 'application/pdf' });
          const downloadUrl = URL.createObjectURL(pdfBlob);
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `ats-optimized-resume-${new Date().toISOString().split('T')[0]}.pdf`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the object URL
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
          
          toast({
            title: "Download Complete",
            description: "Your ATS-optimized resume has been downloaded successfully.",
          });
          return; // Success, exit function
        }
      } catch (primaryError) {
        console.warn('Primary download method failed, trying fallback:', primaryError);
        
        // Fallback to direct API download
        const fallbackUrl = `/api/download-pdf`;
        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ resumeId }),
        });

        if (fallbackResponse.ok) {
          const blob = await fallbackResponse.blob();
          const downloadUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `ats-optimized-resume-${new Date().toISOString().split('T')[0]}.pdf`;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
          
          toast({
            title: "Download Complete",
            description: "Your ATS-optimized resume has been downloaded successfully.",
          });
          return; // Success, exit function
        }
        
        throw primaryError; // If fallback also fails, throw the original error
      }
      
      throw new Error('PDF generation failed');
      
    } catch (error) {
      console.error('Download error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error';
      toast({
        title: "Download Failed",
        description: `Could not download the ATS-optimized resume: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [resumeId, accessToken, toast, isDownloadingPdf]);

  // Load LaTeX PDF when component mounts and it's a LaTeX format
  useEffect(() => {
    if (isLatexFormat && resumeId) {
      loadLatexPdfPreview();
    }
  }, [isLatexFormat, resumeId, loadLatexPdfPreview]);

  // Remove renderATSView function since ATS analysis is now standalone


  return (
    <Card className="w-full h-full min-h-[800px] overflow-hidden flex flex-col dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {isLatexFormat ? "ATS-Optimized Resume" : "Resume Preview"}
          </h3>
          
          {/* Warning Message */}
          {resumePreviewError && (
            <div className="text-yellow-600 dark:text-yellow-400 flex items-center space-x-1">
              <AlertTriangle size={18} />
              <span className="text-sm">{resumePreviewError}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
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

          {/* Download PDF Button */}
          {(resumePreviewData?.content || isLatexFormat) && (
            <>
              {isLatexFormat ? (
                <Button
                  className="flex items-center space-x-2"
                  onClick={handleATSPdfDownload}
                  disabled={isDownloadingPdf}
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Download size={18} />
                  )}
                  <span>{isDownloadingPdf ? 'Downloading...' : 'Download ATS PDF'}</span>
                </Button>
              ) : (
                <PDFDownloadLink
                  document={downloadDocument}
                  fileName={downloadFileName}
                  key={`pdf-download-${resumeId}-${isDarkMode}`}
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
            </>
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
            <div className="h-full">
              {renderResumePreview()}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
})