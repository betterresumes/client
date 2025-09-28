import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication | AccuNode',
  description: 'Secure login and registration for AccuNode platform',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-bricolage font-bold mb-4">
                AccuNode
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Enterprise-grade financial default risk prediction powered by advanced machine learning
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-blue-100">94.2% prediction accuracy</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-blue-100">Multi-tenant secure architecture</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-blue-100">Real-time risk assessment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
