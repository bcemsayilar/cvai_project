import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " bytes"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2)
}

export const subscriptionPlans = {
  trial: {
    name: "Free Trial",
    limit: 1,
    features: ["1 resume enhancement", "Basic style options", "PDF download"],
  },
  monthly: {
    name: "Monthly",
    limit: 5,
    features: [
      "5 resume enhancements per month",
      "All style options",
      "PDF & DOCX downloads",
      "Resume history & storage",
    ],
  },
  annual: {
    name: "Annual",
    limit: 999, // Unlimited for practical purposes
    features: ["Unlimited resume enhancements", "All style options", "PDF & DOCX downloads", "Priority processing"],
  },
}
