import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HelpCircle, Search, Book, MessageCircle, FileText, Upload, Sparkles, Download, CreditCard, Settings, Lock, AlertCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Help Center - ResumeAI",
  description: "Find answers to common questions about ResumeAI's resume enhancement features, billing, and technical support.",
}

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
              <HelpCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Help <span className="text-green-600 dark:text-green-400">Center</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Find answers to common questions, learn how to use ResumeAI effectively, and get the support you need.
            </p>
          </div>
        </section>

        {/* Quick Help Categories */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Quick Help</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow cursor-pointer">
                <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Getting Started</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Learn how to upload and enhance your first resume</p>
              </div>
              
              <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow cursor-pointer">
                <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Features</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Understanding our AI enhancement capabilities</p>
              </div>
              
              <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow cursor-pointer">
                <CreditCard className="h-8 w-8 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Billing & Plans</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Subscription plans, billing, and payment questions</p>
              </div>
              
              <div className="p-6 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow cursor-pointer">
                <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Managing your account and preferences</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
              
              <AccordionItem value="item-1" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold">How do I upload my resume?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>Uploading your resume is simple and secure:</p>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Click the "Upload Your Resume" button on the main page</li>
                      <li>Drag and drop your file or click to browse your computer</li>
                      <li>We support PDF, DOC, DOCX, and TXT formats up to 10MB</li>
                      <li>Your file will be processed and ready for enhancement in seconds</li>
                    </ol>
                    <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                      <strong>Tip:</strong> For best results, upload a well-formatted resume with clear section headers and consistent formatting.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-semibold">What AI enhancements are available?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>Our AI offers several enhancement styles:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Professional Style:</strong> Formal, corporate-friendly language and structure</li>
                      <li><strong>Clear & Concise:</strong> Simplified, easy-to-read format with bullet points</li>
                      <li><strong>Creative & Artistic:</strong> Dynamic language for creative industries</li>
                      <li><strong>Grammar & Issue Fixes:</strong> Corrects errors and improves readability</li>
                      <li><strong>Style Only:</strong> Formatting improvements without content changes</li>
                    </ul>
                    <p>You can also provide custom instructions for specific requirements or preferences.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold">What is ATS analysis and why do I need it?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>ATS (Applicant Tracking System) analysis helps ensure your resume gets past automated screening:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Keyword Optimization:</strong> Identifies missing industry-relevant keywords</li>
                      <li><strong>Format Compatibility:</strong> Ensures ATS systems can properly parse your resume</li>
                      <li><strong>Structure Analysis:</strong> Checks for proper section organization</li>
                      <li><strong>Readability Score:</strong> Evaluates overall clarity and flow</li>
                    </ul>
                    <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <strong>Important:</strong> 75% of resumes are filtered out by ATS before reaching human recruiters. Our analysis helps you beat the bots!
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="font-semibold">What download formats are available?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>We offer multiple download formats to meet different needs:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Visual Format:</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>PDF with modern design</li>
                          <li>Professional formatting</li>
                          <li>Perfect for networking and presentations</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">ATS Format:</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Clean LaTeX-generated PDF</li>
                          <li>Optimized for ATS systems</li>
                          <li>Best for online job applications</li>
                        </ul>
                      </div>
                    </div>
                    <p>Both formats also include DOCX and text versions for maximum compatibility.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-semibold">What are the differences between Free and Premium plans?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-4 text-gray-600 dark:text-gray-400">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Free Plan</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>3 resume enhancements per month</li>
                          <li>Basic ATS analysis</li>
                          <li>Standard download formats</li>
                          <li>Community support</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Premium Plan</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Unlimited resume enhancements</li>
                          <li>Advanced ATS analysis with detailed recommendations</li>
                          <li>Premium templates and designs</li>
                          <li>Resume editing and customization tools</li>
                          <li>Priority email support</li>
                          <li>Export to multiple professional formats</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="font-semibold">Is my resume data secure and private?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>Yes, we take your privacy and security very seriously:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Encryption:</strong> All data is encrypted at rest and in transit using industry-standard protocols</li>
                      <li><strong>No Selling:</strong> We never sell, rent, or share your personal information with third parties</li>
                      <li><strong>Secure Storage:</strong> Your resumes are stored on enterprise-grade cloud infrastructure</li>
                      <li><strong>Access Control:</strong> Only you have access to your resume content and personal data</li>
                      <li><strong>Data Deletion:</strong> You can delete your data permanently at any time</li>
                    </ul>
                    <p className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      <strong>Privacy Guarantee:</strong> Your resume content is used only to provide our services and is never used for marketing or shared with employers without your explicit consent.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="font-semibold">What if I'm not satisfied with the enhancement results?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-3 text-gray-600 dark:text-gray-400">
                    <p>We're committed to your satisfaction. Here's what you can do:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Try Different Styles:</strong> Experiment with different enhancement styles to find what works best</li>
                      <li><strong>Custom Instructions:</strong> Provide specific feedback in the custom instructions field</li>
                      <li><strong>Re-enhance:</strong> Premium users can re-enhance their resumes unlimited times</li>
                      <li><strong>Contact Support:</strong> Our team can provide personalized guidance and tips</li>
                      <li><strong>30-Day Guarantee:</strong> Premium subscribers get a full refund within 30 days if not satisfied</li>
                    </ul>
                    <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <strong>Pro Tip:</strong> The quality of enhancement often depends on the quality and completeness of your original resume. Consider adding more details about your achievements before enhancing.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Still Need Help?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you succeed.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                <MessageCircle className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Email Support</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get detailed help via email. We typically respond within 24 hours.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <a href="mailto:support@resumeai.com" className="flex items-center justify-center w-full">
                    Contact Support
                  </a>
                </Button>
              </div>
              
              <div className="p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <Book className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Documentation</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Browse our comprehensive guides and tutorials for detailed instructions.
                </p>
                <Button variant="outline" className="w-full border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                  View Documentation
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Premium Support Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Priority</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Faster response times</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Personal</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">One-on-one assistance</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">Expert</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Career guidance included</div>
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