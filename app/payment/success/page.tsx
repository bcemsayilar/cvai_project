"use client"

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PRICING_PLANS, PricingPlan } from '@/lib/stripe'
import { useAuth } from '@/contexts/auth-context'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') as PricingPlan
  const [isLoading, setIsLoading] = useState(true)
  const { refreshProfile } = useAuth()

  useEffect(() => {
    // Refresh profile to get updated subscription data
    refreshProfile()
    setIsLoading(false)
  }, [refreshProfile])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  // Stripe key yoksa demo mode'da çalış
  const selectedPlan = plan && PRICING_PLANS[plan] ? PRICING_PLANS[plan] : null
  const isDemoMode = !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isDemoMode && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                🚧 Demo Mode: Stripe entegrasyonu henüz aktif değil
              </p>
            </div>
          )}
          
          {selectedPlan && (
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isDemoMode ? "Demo plan özellikler:" : "You now have access to:"}
              </p>
              <div className="grid grid-cols-1 gap-2 mt-4">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{selectedPlan.features.resumes} Resume Enhancements</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{selectedPlan.features.ats_analyses} ATS Analyses</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Edit & Customize Features</span>
                </div>
              </div>
            </div>
          )}

          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Your account has been upgraded successfully. You can now start enhancing your resumes!
            </p>
            
            <div className="space-y-2">
              <Button asChild className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700">
                <Link href="/">
                  Start Enhancing Resumes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link href="/#pricing">
                  View All Plans
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading component for Suspense fallback
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}