import { CheckCircle, Sparkles, Crown, Star, Zap } from "lucide-react"

export function PricingSection() {
  return (
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
            Simple, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Choose the perfect plan for your career goals. Start free, upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Free Trial</h3>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$0</span>
                <span className="text-xl text-gray-500 dark:text-gray-400 ml-2">forever</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Perfect for testing our AI</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">3 resume enhancements</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Basic ATS analysis</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">PDF download</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-teal-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Standard support</span>
              </li>
            </ul>

            <button className="w-full py-4 px-6 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-2xl font-semibold hover:from-teal-100 hover:to-emerald-100 dark:hover:from-teal-900/30 dark:hover:to-emerald-900/30 transition-all duration-300">
              Start Free Trial
            </button>
          </div>

          {/* Monthly Plan - Popular */}
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border-2 border-purple-500 dark:border-purple-400 p-8 transform scale-105 z-10">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ MOST POPULAR
              </div>
            </div>

            <div className="text-center mb-8 pt-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Monthly</h3>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">$9.99</span>
                <span className="text-xl text-gray-500 dark:text-gray-400 ml-2">/month</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Ideal for active job seekers</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited enhancements</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Advanced ATS analysis</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">All download formats</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Visual resume editor</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Resume history & storage</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-purple-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Priority email support</span>
              </li>
            </ul>

            <button className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              Get Started Now
            </button>

            <div className="text-center mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">30-day money-back guarantee</span>
            </div>
          </div>

          {/* Annual Plan */}
          <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-2xl transition-all duration-300">
            <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              SAVE 33%
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Premium Annual</h3>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">$79.99</span>
                <span className="text-xl text-gray-500 dark:text-gray-400 ml-2">/year</span>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">$119.88</span>
                <span className="text-sm text-green-600 dark:text-green-400 ml-2 font-semibold">Save $39.89</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Best value for career professionals</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Unlimited enhancements</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Advanced ATS analysis</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">All download formats</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Visual resume editor</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Resume history & storage</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Priority support</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 font-semibold">🎯 Career coaching session</span>
              </li>
            </ul>

            <button className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              Get Annual Plan
            </button>

            <div className="text-center mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Billed annually • 30-day refund</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Can I cancel anytime?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Yes, you can cancel your subscription at any time. No questions asked.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Do you offer refunds?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">We offer a 30-day money-back guarantee for all premium plans.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">What payment methods do you accept?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">We accept all major credit cards and PayPal through Stripe's secure payment processing.</p>
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">How does the free trial work?</h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Create an account and get 3 free resume enhancements. No credit card required.</p>
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
              <span className="text-gray-600 dark:text-gray-400 font-medium">10,000+ Enhanced Resumes</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">4.9/5 User Rating</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-gray-600 dark:text-gray-400 font-medium">Enterprise Security</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}