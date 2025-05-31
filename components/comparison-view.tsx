"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createSupabaseClient } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { FileText, Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ComparisonViewProps {
  resumeId?: string | null
  originalPath?: string | null
  processedPath?: string | null
}

export function ComparisonView({ resumeId, originalPath, processedPath }: ComparisonViewProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "diff">("side-by-side")
  const [originalResume, setOriginalResume] = useState<string>("")
  const [enhancedResume, setEnhancedResume] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchResumeContent = async () => {
      if (!originalPath || !processedPath) {
        // If paths are not provided, use sample data
        setOriginalResume(sampleOriginalResume)
        setEnhancedResume(sampleEnhancedResume)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        console.log("Fetching original resume from:", originalPath)
        // Fetch original resume
        const { data: originalData, error: originalError } = await supabase.storage
          .from("resumes")
          .download(originalPath)

        if (originalError) {
          console.error("Error fetching original resume:", originalError)
          throw originalError
        }

        console.log("Fetching processed resume from:", processedPath)
        // Fetch processed resume
        const { data: processedData, error: processedError } = await supabase.storage
          .from("resumes")
          .download(processedPath)

        if (processedError) {
          console.error("Error fetching processed resume:", processedError)
          throw processedError
        }

        // Convert blobs to text
        const originalText = await originalData.text()
        const processedText = await processedData.text()

        setOriginalResume(originalText)
        setEnhancedResume(processedText)
        console.log("Resume content fetched successfully")
      } catch (error) {
        console.error("Error fetching resume content:", error)
        // Fall back to sample data
        setOriginalResume(sampleOriginalResume)
        setEnhancedResume(sampleEnhancedResume)
        toast({
          title: "Error loading resume content",
          description: "Using sample data instead",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchResumeContent()
  }, [originalPath, processedPath, supabase, toast])

  const downloadTxtFile = async () => {
    if (!processedPath) return

    try {
      console.log("Downloading TXT file from:", processedPath)
      const { data, error } = await supabase.storage.from("resumes").download(processedPath)

      if (error) {
        console.error("Download error:", error)
        throw error
      }

      // Create a download link
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = "enhanced-resume.txt"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Resume Downloaded",
        description: "Your enhanced resume has been downloaded as TXT",
      })
    } catch (error) {
      console.error("Error downloading TXT:", error)
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  const renderDiffView = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-5/6" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      )
    }

    // Simple highlighting of differences (this is just a basic example)
    const originalLines = originalResume.split("\n")
    const enhancedLines = enhancedResume.split("\n")

    // Find some differences to highlight (very simplified)
    const diffLines = []

    // Add some sample diff lines for demonstration
    diffLines.push(
      <div key="diff-1" className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 line-through p-1 mb-1">
        Junior Developer, ABC Tech
      </div>,
    )
    diffLines.push(
      <div key="diff-2" className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-1 mb-3">
        Software Engineer, ABC Tech
      </div>,
    )
    diffLines.push(
      <div key="diff-3" className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 line-through p-1 mb-1">
        - Worked on web applications using React
      </div>,
    )
    diffLines.push(
      <div key="diff-4" className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-1 mb-1">
        • Engineered responsive web applications using React.js, resulting in 30% improvement in user engagement
      </div>,
    )

    return <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600 text-sm font-mono whitespace-pre-wrap">{diffLines}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "side-by-side" | "diff")}>
          <TabsList className="dark:bg-gray-800">
            <TabsTrigger value="side-by-side" className="dark:data-[state=active]:bg-gray-700">Side by Side</TabsTrigger>
            <TabsTrigger value="diff" className="dark:data-[state=active]:bg-gray-700">Changes View</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex space-x-2">
          <Button onClick={downloadTxtFile} disabled={isLoading || !processedPath} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download TXT
          </Button>
        </div>
      </div>

      {viewMode === "side-by-side" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 dark:bg-gray-900 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Original Resume</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600 h-[400px] overflow-y-auto text-sm font-mono whitespace-pre-wrap">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                originalResume
              )}
            </div>
          </Card>

          <Card className="p-4 dark:bg-gray-900 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Enhanced Resume</h3>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600 h-[400px] overflow-y-auto text-sm font-mono whitespace-pre-wrap">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
                enhancedResume
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-4 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Changes Made</h3>
          <div className="h-[400px] overflow-y-auto">{renderDiffView()}</div>
        </Card>
      )}

      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">AI Enhancement Summary</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 mr-2">
              1
            </span>
            <span>Professional title upgraded for better industry alignment</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 mr-2">
              2
            </span>
            <span>Added quantifiable achievements with metrics where possible</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 mr-2">
              3
            </span>
            <span>Expanded technical skills section with relevant technologies</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 mr-2">
              4
            </span>
            <span>Improved formatting with bullet points and consistent styling</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

// Sample resume content for demonstration
const sampleOriginalResume = `
JOHN DOE
Software Developer
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

EXPERIENCE

Junior Developer, ABC Tech
June 2020 - Present
- Worked on web applications using React
- Fixed bugs in the codebase
- Participated in code reviews

Intern, XYZ Solutions
Jan 2020 - May 2020
- Assisted senior developers
- Learned about software development lifecycle

EDUCATION

Bachelor of Science in Computer Science
University of Technology, 2020

SKILLS

Programming: JavaScript, HTML, CSS
Frameworks: React
Tools: Git, VS Code
`

const sampleEnhancedResume = `
JOHN DOE
Full Stack Software Engineer
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe | github.com/johndoe

PROFESSIONAL EXPERIENCE

Software Engineer, ABC Tech
June 2020 - Present
• Engineered responsive web applications using React.js, resulting in 30% improvement in user engagement
• Implemented robust error handling and debugging processes, reducing critical bugs by 45%
• Collaborated in agile development teams to deliver features on time with 98% quality assurance pass rate
• Optimized application performance, decreasing load times by 25%

Software Engineering Intern, XYZ Solutions
January 2020 - May 2020
• Developed and maintained code for in-house applications using JavaScript and React
• Collaborated with senior engineers to implement new features and fix existing issues
• Participated in daily stand-ups and sprint planning meetings

EDUCATION

Bachelor of Science in Computer Science
University of Technology, 2020
• GPA: 3.8/4.0
• Relevant Coursework: Data Structures, Algorithms, Web Development, Database Systems

TECHNICAL SKILLS

• Languages: JavaScript (ES6+), TypeScript, HTML5, CSS3, SQL
• Frameworks/Libraries: React.js, Node.js, Express.js, Redux
• Tools & Platforms: Git, GitHub, VS Code, Jira, AWS
• Methodologies: Agile/Scrum, CI/CD, Test-Driven Development
`
