"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, X } from "lucide-react"
import { createSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatFileSize } from "@/lib/utils"

interface FileUploaderProps {
  onFileUpload: (file: File | null, resumeId?: string, filePath?: string) => void
  file: File | null
}

export function FileUploader({ onFileUpload, file }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  // Create supabase client with useRef to prevent recreation on every render
  const supabaseRef = useRef(createSupabaseClient())
  const supabase = supabaseRef.current

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (isValidFileType(droppedFile)) {
        handleUpload(droppedFile)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (isValidFileType(selectedFile)) {
        handleUpload(selectedFile)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOC, DOCX, or TXT file.",
          variant: "destructive",
        })
      }
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

    setIsUploading(true)

    // Use an immediately invoked async function to handle the upload
    // This prevents uncached promises during rendering
    ;(async () => {
      try {
        console.log("Starting file upload process for user:", user.id)

        // First, upload the file to storage to get the path
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
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
            isDragging ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-teal-500 hover:bg-gray-50"
          } transition-colors duration-150 ease-in-out`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-gray-100 rounded-full">
              <Upload className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none"
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
                  disabled={isUploading}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX or TXT up to 10MB</p>
            {isUploading && <p className="text-sm text-teal-600">Uploading...</p>}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-200 rounded-full">
              <File className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}
    </div>
  )
}
