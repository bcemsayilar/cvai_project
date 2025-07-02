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
    job_hunt_2w: "2W Hunt",
    premium_1m: "Premium",
    job_seeker_3m: "3M Seeker",
  }

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-blue-400 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                </div>
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">ResumeAI</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-2">
                <Link href="#how-it-works" className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300 group">
                  How It Works
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </Link>
                <Link href="#examples" className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300 group">
                  Examples
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </Link>
                <Link href="#pricing" className="relative px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300 group">
                  Pricing
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </Link>
              </nav>
              
              <SimpleThemeToggle />

              {isLoading ? (
                <div className="h-9 w-20 bg-gray-200 animate-pulse rounded-md"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-600 transition-all duration-300">
                      <div className="w-6 h-6 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center mr-2">
                        <User className="h-3 w-3 text-white" />
                      </div>
                      {profile?.subscription_type && (
                        <span className="capitalize font-medium">{subscriptionNames[profile.subscription_type]}</span>
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
                <div className="flex items-center space-x-3 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300" 
                    onClick={openSignIn}
                  >
                    Sign In
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
                    onClick={openSignUp}
                  >
                    Create Account
                  </Button>
                </div>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <SimpleThemeToggle />
              {!isLoading && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="mr-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                      <div className="w-5 h-5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-white" />
                      </div>
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
          <div className="md:hidden bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="px-4 pt-4 pb-3 space-y-2">
              <Link
                href="#how-it-works"
                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#examples"
                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Examples
              </Link>
              <Link
                href="#pricing"
                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-300"
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
