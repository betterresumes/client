'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [isClient, setIsClient] = useState(false)

  // Prevent hydration mismatch by ensuring client-side only rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Immediate redirect - no loading state, no delays
    if (isAuthenticated) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, router, isClient])

  // Don't render anything until client is ready - prevents hydration mismatch
  if (!isClient) {
    return null
  }

  // Return null - no UI should be shown during redirect
  return null
}
