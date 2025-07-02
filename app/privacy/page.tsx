import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Lock, Eye, FileText, Server, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy - ResumeAI",
  description: "Learn how ResumeAI protects your personal information and resume data with industry-leading security practices.",
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Privacy <span className="text-blue-600 dark:text-blue-400">Policy</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Your privacy is fundamental to our service. Learn how we protect, use, and manage your personal information.
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </section>

        {/* Quick Overview */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Privacy at a Glance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Lock className="h-8 w-8 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Encrypted Storage</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">All resume data is encrypted at rest and in transit using industry-standard protocols.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Selling</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">We never sell, rent, or share your personal information with third parties for marketing.</p>
              </div>
              
              <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <Server className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Minimal Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">We only collect the information necessary to provide our resume enhancement services.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Policy */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none dark:prose-invert">
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Information We Collect</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Email address (for account creation and communication)</li>
                  <li>Password (encrypted and never stored in plain text)</li>
                  <li>Account preferences and settings</li>
                  <li>Subscription and billing information (processed securely through Stripe)</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resume Data</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Original resume content you upload for enhancement</li>
                  <li>Enhanced resume content generated by our AI</li>
                  <li>Customization preferences and style selections</li>
                  <li>ATS analysis results and recommendations</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Usage Information</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Service usage patterns and feature interactions</li>
                  <li>Technical log data (IP addresses, browser types, timestamps)</li>
                  <li>Performance metrics to improve our AI models</li>
                  <li>Support communications and feedback</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-12">How We Use Your Information</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Service Delivery</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>Process and enhance your resumes</li>
                      <li>Provide ATS analysis and recommendations</li>
                      <li>Generate downloadable resume formats</li>
                      <li>Maintain your account and preferences</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Service Improvement</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>Train and improve our AI models</li>
                      <li>Develop new features and capabilities</li>
                      <li>Monitor service performance and reliability</li>
                      <li>Analyze usage patterns for optimization</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-12">Data Security & Protection</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Encryption
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      All data is encrypted using AES-256 encryption at rest and TLS 1.3 in transit. Resume content is stored in encrypted database fields with additional application-level encryption.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                      Access Controls
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Strict access controls ensure only authorized personnel can access systems. All access is logged and monitored for security compliance.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Server className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                      Infrastructure
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Hosted on enterprise-grade cloud infrastructure with regular security audits, automated backups, and 99.9% uptime guarantees.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
                      Data Retention
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Resume data is retained only as long as necessary for service delivery. You can delete your data at any time through your account settings.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-12">Your Rights & Controls</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Eye className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Access & Portability</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View, download, or export all your personal data and resume content at any time through your account dashboard.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Correction & Updates</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Update your account information and resume content directly through the platform interface.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Users className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Deletion & Opt-out</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delete your account and all associated data permanently through account settings, or contact support for assistance.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-12">Cookies & Tracking</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We use essential cookies to maintain your session and provide core functionality. Optional analytics cookies help us understand usage patterns to improve our service.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Essential Cookies</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>Authentication and session management</li>
                      <li>Security and fraud prevention</li>
                      <li>Core platform functionality</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Analytics Cookies (Optional)</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>Usage analytics and performance monitoring</li>
                      <li>Feature usage and user experience insights</li>
                      <li>Service optimization data</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 mt-12">Contact & Updates</h2>
              
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We may update this privacy policy periodically to reflect changes in our practices or applicable laws. We'll notify users of significant changes via email or platform notifications.
                </p>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Questions or Concerns?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact our privacy team at <a href="mailto:privacy@resumeai.com" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@resumeai.com</a> or through our support system for any privacy-related questions or requests.
                  </p>
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