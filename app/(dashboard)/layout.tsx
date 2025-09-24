import { Metadata } from 'next'
import { AuthGuard } from '@/components/auth/auth-guard'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardProvider } from '@/components/providers/dashboard-provider'
import { DataSyncProvider } from '@/components/providers/data-sync-provider'

export const metadata: Metadata = {
  title: 'Dashboard | AccuNode AI',
  description: 'Financial risk prediction dashboard',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardProvider>
        <DataSyncProvider>
          <div className="min-h-screen">
            <DashboardHeader />
            <main className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </DataSyncProvider>
      </DashboardProvider>
    </AuthGuard>
  )
}
