"use client"

import { useState } from "react"
import { CheckCircle, Sparkles, Crown, Star, Zap, Timer } from "lucide-react"
import { PaymentModal } from "@/components/payment/checkout-form"
import { PRICING_PLANS, formatPrice, PricingPlan } from "@/lib/stripe"
import { useAuth } from "@/contexts/auth-context"

export function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const { user, profile } = useAuth()

  // Stripe aktif mi kontrolü
  const isStripeConfigured = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

  const handlePlanSelect = (plan: PricingPlan) => {
    if (!user) {
      alert("Please sign in to purchase a plan")
      return
    }
    
    if (!isStripeConfigured) {
      alert("🚧 Demo Mode: Payment system is not configured yet")
      return
    }
    
    setSelectedPlan(plan)
    setIsPaymentModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsPaymentModalOpen(false)
    setSelectedPlan(null)
  }

  return (
    <>
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tr from-blue-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full mb-6">
              <Crown className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Job-Focused <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Choose the perfect duration for your job hunt. No long-term commitments, just results.
            </p>
            
            {!isStripeConfigured && (
              <div className="mt-6 mx-auto max-w-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-center text-yellow-800 dark:text-yellow-200">
                  🚧 <strong>Demo Mode:</strong> Payment system is being configured. Plans are shown for preview only.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Trial Plan */}
            <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Free Trial</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">$0</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Test our AI</p>
              </div>

              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">1 enhancement</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">1 ATS analysis</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-teal-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">PDF download</span>
                </li>
              </ul>

              <button 
                disabled
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-xl font-semibold transition-all duration-300 cursor-not-allowed opacity-75"
              >
                Current Plan
              </button>
            </div>

            {/* 2-Week Job Hunt */}
            <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-3xl shadow-xl border border-orange-200 dark:border-orange-700 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Timer className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">2-Week Hunt</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                    {formatPrice(PRICING_PLANS.job_hunt_2w.price)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Quick sprint</p>
              </div>

              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">10 enhancements</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">25 ATS analyses</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Edit & customize</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">All formats</span>
                </li>
              </ul>

              <button
                onClick={() => handlePlanSelect('job_hunt_2w')}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Hunt
              </button>
            </div>

            {/* 1-Month Premium - Popular */}
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-purple-500 dark:border-purple-400 p-6 transform scale-105 z-10">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                  ⭐ MOST POPULAR
                </div>
              </div>

              <div className="text-center mb-6 pt-2">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Premium Month</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatPrice(PRICING_PLANS.premium_1m.price)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Perfect balance</p>
              </div>

              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">25 enhancements</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">50 ATS analyses</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Edit & customize</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">All formats</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                </li>
              </ul>

              <button
                onClick={() => handlePlanSelect('premium_1m')}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Go Premium
              </button>
            </div>

            {/* 3-Month Job Seeker */}
            <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                SAVE 17%
              </div>

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">3-Month Seeker</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {formatPrice(PRICING_PLANS.job_seeker_3m.price)}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 line-through">$59.97</span>
                  <span className="text-xs text-green-600 dark:text-green-400 ml-1 font-semibold">Save $10</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Best value</p>
              </div>

              <ul className="space-y-3 mb-6 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">75 enhancements</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">150 ATS analyses</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Edit & customize</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">All formats</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Priority support</span>
                </li>
              </ul>

              <button
                onClick={() => handlePlanSelect('job_seeker_3m')}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Best Value
              </button>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Why time-limited plans?</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Job searching is time-sensitive. Our plans are designed around typical job hunt durations, saving you money.</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What happens after my plan expires?</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">You keep access to all your enhanced resumes but can't create new ones. Reactivate anytime!</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Can I upgrade my plan?</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Yes! Upgrade anytime and we'll credit your remaining time toward the new plan.</p>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Do you offer refunds?</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">We offer a 7-day money-back guarantee for all paid plans. No questions asked.</p>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-medium">2,500+ Job Seekers Helped</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-medium">4.8/5 Success Rating</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-gray-600 dark:text-gray-400 font-medium">Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleCloseModal}
          plan={selectedPlan}
        />
      )}
    </>
  )
}