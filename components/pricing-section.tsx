export function PricingSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Simple, Transparent Pricing</h2>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Choose the plan that works best for you</p>
      </div>

      <div className="mt-12 max-w-5xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Free Trial */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Free Trial</h3>
            <div className="mt-4 flex items-baseline text-gray-900 dark:text-white">
              <span className="text-4xl font-extrabold tracking-tight">$0</span>
              <span className="ml-1 text-xl font-semibold">/one-time</span>
            </div>
            <p className="mt-5 text-gray-500 dark:text-gray-400 text-sm">Perfect for trying out our service</p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">1 resume enhancement</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Basic style options</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">PDF download</p>
              </li>
            </ul>

            <div className="mt-8">
              <button
                type="button"
                className="w-full bg-teal-50 dark:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800 rounded-md py-2 px-4 text-sm font-medium hover:bg-teal-100 dark:hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-900"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>

        {/* Monthly Plan */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border-2 border-teal-500 dark:border-teal-400 transform scale-105 z-10">
          <div className="p-6">
            <div className="absolute top-0 right-0 -mt-1 -mr-1 px-3 py-1 bg-teal-500 dark:bg-teal-600 text-white text-xs font-medium rounded-bl-lg">
              POPULAR
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Monthly</h3>
            <div className="mt-4 flex items-baseline text-gray-900 dark:text-white">
              <span className="text-4xl font-extrabold tracking-tight">$9.99</span>
              <span className="ml-1 text-xl font-semibold">/month</span>
            </div>
            <p className="mt-5 text-gray-500 dark:text-gray-400 text-sm">Perfect for job seekers</p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">5 resume enhancements per month</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">All style options</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">PDF & DOCX downloads</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Resume history & storage</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-teal-600 dark:text-teal-400">NEW:</span> Visual resume editor
                </p>
              </li>
            </ul>

            <div className="mt-8">
              <button
                type="button"
                className="w-full bg-teal-600 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-gray-900"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Annual Plan */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Annual</h3>
            <div className="mt-4 flex items-baseline text-gray-900 dark:text-white">
              <span className="text-4xl font-extrabold tracking-tight">$79.99</span>
              <span className="ml-1 text-xl font-semibold">/year</span>
            </div>
            <p className="mt-5 text-gray-500 dark:text-gray-400 text-sm">Save 33% with annual billing</p>

            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Unlimited resume enhancements</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">All style options</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">PDF & DOCX downloads</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Resume history & storage</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">Priority support</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-500 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <p className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium text-gray-800 dark:text-gray-200">NEW:</span> Visual resume editor
                </p>
              </li>
            </ul>

            <div className="mt-8">
              <button
                type="button"
                className="w-full bg-gray-800 dark:bg-gray-700 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
