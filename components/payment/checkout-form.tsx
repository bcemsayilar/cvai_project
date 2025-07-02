"use client"

import { useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { getStripe, PRICING_PLANS, formatPrice, PricingPlan } from '@/lib/stripe'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface CheckoutFormProps {
  clientSecret: string
  plan: PricingPlan
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ clientSecret, plan, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)

  const selectedPlan = PRICING_PLANS[plan]

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?plan=${plan}`,
      },
    })

    if (error) {
      onError(error.message || 'An error occurred')
      setIsLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {selectedPlan.name}
            <span className="text-2xl font-bold text-teal-600">
              {formatPrice(selectedPlan.price)}
            </span>
          </CardTitle>
          <CardDescription>
            {selectedPlan.duration_days} days access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{selectedPlan.features.resumes} Resume Enhancements</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{selectedPlan.features.ats_analyses} ATS Analyses</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Edit & Customize</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>PDF & DOCX Export</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <PaymentElement />
        
        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            `Pay ${formatPrice(selectedPlan.price)}`
          )}
        </Button>
      </div>
    </form>
  )
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: PricingPlan
}

export function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const { user } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingIntent, setIsCreatingIntent] = useState(false)

  const stripePromise = getStripe()

  const createPaymentIntent = async () => {
    if (!user) {
      setError('You must be logged in to make a purchase')
      return
    }

    // Check if Stripe is configured
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setError('Payment system is not configured yet. Please contact support.')
      return
    }

    setIsCreatingIntent(true)
    setError(null)

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsCreatingIntent(false)
    }
  }

  const handleSuccess = () => {
    onClose()
    // Refresh the page to update user profile
    window.location.reload()
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {!clientSecret ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Ready to upgrade to {PRICING_PLANS[plan].name}?
              </p>
              <Button
                onClick={createPaymentIntent}
                disabled={isCreatingIntent}
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700"
                size="lg"
              >
                {isCreatingIntent ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing checkout...</span>
                  </div>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                clientSecret={clientSecret}
                plan={plan}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}