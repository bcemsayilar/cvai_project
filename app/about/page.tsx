import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FileText, Users, Award, Target, Heart, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "About ResumeAI - Transform Your Career with AI",
  description: "Learn about ResumeAI's mission to help professionals create outstanding resumes using advanced AI technology.",
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center p-2 bg-teal-100 dark:bg-teal-900/30 rounded-full mb-6">
              <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              About <span className="text-teal-600 dark:text-teal-400">ResumeAI</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              We're on a mission to democratize career success by making professional resume enhancement accessible to everyone through cutting-edge AI technology.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                Every professional deserves a resume that truly represents their potential. We believe that career opportunities shouldn't be limited by writing skills or design expertise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 border border-teal-200 dark:border-teal-800">
                <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Accessibility</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Making professional resume enhancement accessible to job seekers at all career levels, regardless of their writing experience.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Innovation</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Leveraging the latest advances in AI to provide personalized, industry-specific resume enhancements that get results.
                </p>
              </div>

              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Empowerment</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Empowering individuals to confidently pursue their career goals with resumes that showcase their true potential.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
            </div>

            <div className="prose prose-lg mx-auto dark:prose-invert">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                ResumeAI was born from a simple observation: talented professionals were missing out on opportunities because their resumes didn't effectively communicate their value. We saw brilliant engineers, creative marketers, and skilled managers struggle to translate their achievements into compelling resume content.
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Our founders, with backgrounds in AI research and career development, recognized that artificial intelligence could bridge this gap. By combining natural language processing with deep understanding of recruitment practices, we created a solution that transforms ordinary resumes into powerful career tools.
              </p>
              
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Today, ResumeAI has helped thousands of professionals across various industries enhance their resumes, leading to increased interview rates and career advancement. We continue to evolve our technology, ensuring that our users always have access to the most effective resume optimization tools available.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Values</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                These core principles guide everything we do at ResumeAI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">User-Centric Design</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Every feature we build is designed with our users' success in mind. We prioritize simplicity, effectiveness, and user experience in everything we create.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Quality Excellence</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We maintain the highest standards in AI accuracy, content quality, and technical reliability to ensure consistently outstanding results.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Privacy & Security</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your resume data is precious. We implement enterprise-grade security measures and maintain strict privacy standards to protect your information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Continuous Innovation</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      We constantly evolve our AI models and features based on user feedback and the latest advances in natural language processing technology.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Built by Career Experts</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
              Our team combines decades of experience in artificial intelligence, career development, and recruitment to deliver the most effective resume enhancement platform available.
            </p>
            
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">15+</div>
                  <div className="text-gray-600 dark:text-gray-400">Years of AI Research</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">10k+</div>
                  <div className="text-gray-600 dark:text-gray-400">Resumes Enhanced</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">95%</div>
                  <div className="text-gray-600 dark:text-gray-400">User Satisfaction</div>
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