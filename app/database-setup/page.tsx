import { DatabaseSetup } from "@/components/database-setup"

export default function DatabaseSetupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">ResumeAI Database Setup</h1>
        <DatabaseSetup />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            After setting up the database,{" "}
            <a href="/" className="text-teal-600 hover:underline">
              return to the app
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
