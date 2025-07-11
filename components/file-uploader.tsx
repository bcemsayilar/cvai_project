"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, X } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { formatFileSize } from "@/lib/utils"
import { validator_utils, sanitizer } from "@/lib/sanitization"

interface FileUploaderProps {
  onFileUpload: (file: File | null, resumeId?: string, filePath?: string) => void
  file: File | null
  shouldReset?: boolean
  onResetComplete?: () => void
}

export function FileUploader({ onFileUpload, file, shouldReset, onResetComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, profile } = useAuth()
  const { toast } = useToast()
  // Create supabase client with useRef to prevent recreation on every render
  const supabaseRef = useRef(createSupabaseClient())
  const supabase = supabaseRef.current

  // Handle external reset requests
  useEffect(() => {
    if (shouldReset && fileInputRef.current) {
      fileInputRef.current.value = ""
      if (onResetComplete) {
        onResetComplete()
      }
    }
  }, [shouldReset, onResetComplete])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    // Check if user has reached their resume limit
    if (profile && profile.resumes_used >= profile.resumes_limit) {
      toast({
        title: "Resume limit reached",
        description: `You've reached the limit for your ${profile.subscription_type} plan. Please upgrade to upload more resumes.`,
        variant: "destructive",
      })
      return
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      
      // Validate file before processing
      const validation = validator_utils.validateFileUpload(droppedFile)
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        })
        return
      }
      
      handleUpload(droppedFile)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      // Validate file before processing
      const validation = validator_utils.validateFileUpload(selectedFile)
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.error,
          variant: "destructive",
        })
        return
      }
      
      handleUpload(selectedFile)
    }
  }

  const isValidFileType = (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    return allowedTypes.includes(file.type)
  }

  const handleUpload = (file: File) => {
    if (!user) {
      // If user is not logged in, just pass the file to parent component
      onFileUpload(file)
      return
    }

    // Check if user has reached their resume limit
    if (profile && profile.resumes_used >= profile.resumes_limit) {
      toast({
        title: "Resume limit reached",
        description: `You've reached the limit for your ${profile.subscription_type} plan. Please upgrade to upload more resumes.`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    // Use an immediately invoked async function to handle the upload
    // This prevents uncached promises during rendering
    ;(async () => {
      try {
        console.log("Starting file upload process for user:", user.id)

        // First, upload the file to storage to get the path
        const fileExt = file.name.split(".").pop()
        const sanitizedFileName = sanitizer.sanitizeFileName(file.name)
        const fileName = `${Date.now()}_${sanitizedFileName}`
        const filePath = `original/${user.id}/${fileName}`

        console.log("Uploading file to path:", filePath)

        // Upload the file to storage
        const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file)

        if (uploadError) {
          console.error("Storage upload error:", uploadError)
          throw new Error(uploadError.message)
        }

        console.log("File uploaded successfully, creating resume record")

        // Now create the resume record with the file path
        const { data: resumeData, error: resumeError } = await supabase
          .from("resumes")
          .insert({
            user_id: user.id,
            original_filename: file.name,
            original_file_path: filePath, // Set the path here
            status: "uploaded",
          })
          .select()
          .single()

        if (resumeError) {
          console.error("Resume record creation error:", resumeError)
          throw new Error(resumeError.message)
        }

        console.log("Resume record created:", resumeData)

        // Notify parent component
        onFileUpload(file, String(resumeData.id), filePath)

        toast({
          title: "Resume uploaded successfully",
          description: `File: ${file.name}`,
        })
      } catch (error) {
        console.error("Upload error:", error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        })
        onFileUpload(null)
      } finally {
        setIsUploading(false)
      }
    })()
  }

  const handleRemoveFile = () => {
    onFileUpload(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            profile && profile.resumes_used >= profile.resumes_limit
              ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed"
              : isDragging 
                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-400" 
                : "border-gray-300 dark:border-gray-600 hover:border-teal-500 dark:hover:border-teal-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          } transition-colors duration-150 ease-in-out`}
          onDragOver={profile && profile.resumes_used >= profile.resumes_limit ? undefined : handleDragOver}
          onDragLeave={profile && profile.resumes_used >= profile.resumes_limit ? undefined : handleDragLeave}
          onDrop={profile && profile.resumes_used >= profile.resumes_limit ? undefined : handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex text-sm text-gray-600 dark:text-gray-300">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 focus-within:outline-none"
              >
                <span>Upload a file</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.txt"
                  disabled={isUploading || (profile && profile.resumes_used >= profile.resumes_limit)}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX or TXT up to 10MB</p>
            {isUploading && <p className="text-sm text-teal-600 dark:text-teal-400">Uploading...</p>}
            {profile && profile.resumes_used >= profile.resumes_limit && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Resume limit reached ({profile.resumes_used}/{profile.resumes_limit}). Please upgrade to upload more resumes.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <File className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{file.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}
    </div>
  )
}
