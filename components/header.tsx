"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { SimpleThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin")
  const { user, profile, signOut, isLoading } = useAuth()

  const openSignIn = () => {
    setAuthModalTab("signin")
    setIsAuthModalOpen(true)
  }

  const openSignUp = () => {
    setAuthModalTab("signup")
    setIsAuthModalOpen(true)
  }

  const subscriptionNames = {
    trial: "Trial",
    monthly: "Monthly",
    annual: "Annual",
  }

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <FileText className="h-8 w-8 text-teal-600" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">ResumeAI</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex space-x-8">
                <Link href="#how-it-works" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium">
                  How It Works
                </Link>
                <Link href="#examples" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium">
                  Examples
                </Link>
                <Link href="#pricing" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium">
                  Pricing
                </Link>
              </nav>
              
              <SimpleThemeToggle />

              {isLoading ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded-md"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-4">
                      <User className="h-4 w-4 mr-2" />
                      {profile?.subscription_type && (
                        <span className="capitalize">{subscriptionNames[profile.subscription_type]}</span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {profile && (
                      <>
                        <DropdownMenuItem disabled>{profile.email}</DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          Plan: {subscriptionNames[profile.subscription_type] || "Trial"}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          Used: {profile.resumes_used} / {profile.resumes_limit} resumes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="ml-4" onClick={openSignIn}>
                    Sign In
                  </Button>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={openSignUp}>
                    Create Account
                  </Button>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <SimpleThemeToggle />
              {!isLoading && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="mr-2">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {profile && (
                      <>
                        <DropdownMenuItem disabled>{profile.email}</DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          Plan: {subscriptionNames[profile.subscription_type] || "Trial"}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                          Used: {profile.resumes_used} / {profile.resumes_limit} resumes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="#how-it-works"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#examples"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Examples
              </Link>
              <Link
                href="#pricing"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  {!isLoading && !user ? (
                    <>
                      <Button variant="outline" size="sm" className="w-full mb-2" onClick={openSignIn}>
                        Sign In
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={openSignUp}
                      >
                        Create Account
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} defaultTab={authModalTab} />
    </>
  )
}
