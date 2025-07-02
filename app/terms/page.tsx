import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText, AlertTriangle, CheckCircle, XCircle, Scale } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service - ResumeAI",
  description: "Read ResumeAI's terms of service to understand your rights and responsibilities when using our AI-powered resume enhancement platform.",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
              <Scale className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Terms of <span className="text-orange-600 dark:text-orange-400">Service</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              These terms govern your use of ResumeAI and establish the rights and responsibilities for all users of our platform.
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </section>

        {/* Key Points Overview */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Key Terms Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fair Use</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use our service for legitimate resume enhancement purposes only.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Content Rights</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">You retain ownership of your resume content and personal information.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Limitations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Service availability and features may vary based on subscription tier.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Prohibited Uses</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">No spam, abuse, or misuse of our AI enhancement technology.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Terms */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">1. Acceptance of Terms</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  By accessing and using ResumeAI ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  These Terms of Service apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">2. Service Description</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  ResumeAI provides AI-powered resume enhancement services, including but not limited to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Automated resume content improvement and optimization</li>
                  <li>ATS (Applicant Tracking System) compatibility analysis</li>
                  <li>Multiple resume format generation (PDF, DOCX, LaTeX)</li>
                  <li>Style customization and professional formatting</li>
                  <li>Resume preview and editing capabilities</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">3. User Accounts and Registration</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Requirements</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                  <li>You must be at least 16 years old to create an account</li>
                  <li>You must provide accurate and complete registration information</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized use of your account</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Responsibilities</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You are responsible for all content posted and activity that occurs under your account. We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">4. Acceptable Use Policy</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Permitted Uses
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>Personal resume enhancement for job applications</li>
                      <li>Professional career development purposes</li>
                      <li>Educational and training applications</li>
                      <li>Legitimate business recruitment assistance</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                      <XCircle className="h-5 w-5 mr-2" />
                      Prohibited Uses
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>Creating false or misleading resume content</li>
                      <li>Bulk processing for commercial resale</li>
                      <li>Attempting to reverse engineer our AI models</li>
                      <li>Violating any applicable laws or regulations</li>
                      <li>Harassing or abusing our support staff</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">5. Subscription Plans and Billing</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Terms</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                  <li>Free tier includes limited resume enhancements per month</li>
                  <li>Premium subscriptions provide unlimited enhancements and additional features</li>
                  <li>Billing occurs automatically on a monthly or annual basis</li>
                  <li>You may cancel your subscription at any time through your account settings</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Refund Policy</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We offer a 30-day money-back guarantee for premium subscriptions. Refund requests must be submitted within 30 days of the initial purchase date. Free tier usage is not eligible for refunds.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Price Changes</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We reserve the right to modify subscription prices with 30 days advance notice. Existing subscribers will be notified via email and may cancel before the price change takes effect.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">6. Intellectual Property Rights</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Content</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You retain all rights to your resume content and personal information. By using our service, you grant us a limited license to process, enhance, and format your content solely for the purpose of providing our services.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Our Platform</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The ResumeAI platform, including our AI models, algorithms, software, and design, are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of our platform.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enhanced Content</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  While you own the enhanced resume content generated by our AI, we retain the right to use anonymized and aggregated data to improve our services and train our models.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">7. Disclaimers and Limitations</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Disclaimer</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        ResumeAI provides AI-generated suggestions and enhancements. You are responsible for reviewing, verifying, and approving all content before using it in job applications. We do not guarantee employment outcomes.
                      </p>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Availability</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400 mb-6">
                  <li>We aim for 99.9% uptime but cannot guarantee uninterrupted service</li>
                  <li>Planned maintenance will be announced in advance when possible</li>
                  <li>Features and capabilities may vary based on subscription tier</li>
                  <li>AI enhancement quality may vary based on input content quality</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Limitation of Liability</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  In no event shall ResumeAI be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">8. Termination</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User-Initiated Termination</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You may terminate your account at any time through your account settings. Upon termination, your access to paid features will cease, but you may retain access to free tier features if available.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service-Initiated Termination</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We may terminate or suspend your account for violations of these terms, illegal activity, or abuse of our service. We will provide notice when possible, except in cases of serious violations.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Retention After Termination</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Upon account termination, your resume data will be deleted within 30 days unless you export it beforehand. Some account information may be retained for legal compliance purposes.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">9. Changes to Terms</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes via email and platform notifications at least 30 days before they take effect.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Continued use of the service after changes are posted constitutes acceptance of the modified terms. If you do not agree to the changes, you should discontinue use of the service.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">10. Contact Information</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>Email: <a href="mailto:legal@resumeai.com" className="text-blue-600 dark:text-blue-400 hover:underline">legal@resumeai.com</a></p>
                  <p>Support: <a href="mailto:support@resumeai.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@resumeai.com</a></p>
                  <p>Mailing Address: ResumeAI Legal Department</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}