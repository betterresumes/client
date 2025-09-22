'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleContextType {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextType | undefined>(undefined)

function useCollapsible() {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible')
  }
  return context
}

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (isOpen: boolean) => void
  children: React.ReactNode
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open = false, onOpenChange, children }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open)

    React.useEffect(() => {
      setIsOpen(open)
    }, [open])

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        setIsOpen(newOpen)
        onOpenChange?.(newOpen)
      },
      [onOpenChange]
    )

    return (
      <CollapsibleContext.Provider value={{ isOpen, onOpenChange: handleOpenChange }}>
        <div ref={ref}>{children}</div>
      </CollapsibleContext.Provider>
    )
  }
)
Collapsible.displayName = 'Collapsible'

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { isOpen, onOpenChange } = useCollapsible()

  return (
    <button
      ref={ref}
      onClick={(e) => {
        onOpenChange(!isOpen)
        onClick?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { isOpen } = useCollapsible()

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
