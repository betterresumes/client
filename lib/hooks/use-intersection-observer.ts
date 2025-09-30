import { useEffect, useRef } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  rootMargin?: string
  root?: Element | null
  enabled?: boolean
}

export function useIntersectionObserver(
  target: React.RefObject<Element | null>,
  onIntersect: () => void,
  {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    enabled = true,
  }: UseIntersectionObserverOptions = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!enabled || !target.current) return

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect()
          }
        })
      },
      {
        threshold,
        rootMargin,
        root,
      }
    )

    // Start observing
    observerRef.current.observe(target.current)

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [target, onIntersect, threshold, rootMargin, root, enabled])

  // Return disconnect function for manual cleanup
  return () => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
  }
}
