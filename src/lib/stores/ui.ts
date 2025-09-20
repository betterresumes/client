import { create } from 'zustand'

interface UIState {
  // Sidebar state
  sidebarOpen: boolean
  sidebarCollapsed: boolean

  // Modal state
  modals: Record<string, boolean>

  // Loading states
  globalLoading: boolean
  loadingStates: Record<string, boolean>

  // Theme
  theme: 'light' | 'dark' | 'system'

  // Notifications/Toasts
  notifications: Notification[]

  // Search
  globalSearch: string
  searchResults: any[]
  searchLoading: boolean

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapse: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
  closeAllModals: () => void

  setGlobalLoading: (loading: boolean) => void
  setLoading: (key: string, loading: boolean) => void
  clearAllLoading: () => void

  setTheme: (theme: 'light' | 'dark' | 'system') => void

  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  setGlobalSearch: (search: string) => void
  setSearchResults: (results: any[]) => void
  setSearchLoading: (loading: boolean) => void
  clearSearch: () => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  modals: {},
  globalLoading: false,
  loadingStates: {},
  theme: 'system',
  notifications: [],
  globalSearch: '',
  searchResults: [],
  searchLoading: false,

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

  // Modal actions
  openModal: (modalId: string) => set((state) => ({
    modals: { ...state.modals, [modalId]: true }
  })),

  closeModal: (modalId: string) => set((state) => ({
    modals: { ...state.modals, [modalId]: false }
  })),

  toggleModal: (modalId: string) => set((state) => ({
    modals: { ...state.modals, [modalId]: !state.modals[modalId] }
  })),

  closeAllModals: () => set({ modals: {} }),

  // Loading actions
  setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),

  setLoading: (key: string, loading: boolean) => set((state) => ({
    loadingStates: { ...state.loadingStates, [key]: loading }
  })),

  clearAllLoading: () => set({ globalLoading: false, loadingStates: {} }),

  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = { ...notification, id }

    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }))

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id)
      }, notification.duration || 5000)
    }
  },

  removeNotification: (id: string) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  clearNotifications: () => set({ notifications: [] }),

  // Search actions
  setGlobalSearch: (search: string) => set({ globalSearch: search }),

  setSearchResults: (results: any[]) => set({ searchResults: results }),

  setSearchLoading: (loading: boolean) => set({ searchLoading: loading }),

  clearSearch: () => set({
    globalSearch: '',
    searchResults: [],
    searchLoading: false
  }),
}))

// Helper hooks
export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useUIStore()

  const showSuccess = (title: string, message?: string) => {
    addNotification({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    addNotification({ type: 'error', title, message, duration: 0 })
  }

  const showWarning = (title: string, message?: string) => {
    addNotification({ type: 'warning', title, message })
  }

  const showInfo = (title: string, message?: string) => {
    addNotification({ type: 'info', title, message })
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

export const useLoading = () => {
  const { globalLoading, loadingStates, setGlobalLoading, setLoading, clearAllLoading } = useUIStore()

  const isLoading = (key?: string) => {
    if (!key) return globalLoading
    return loadingStates[key] || false
  }

  return {
    globalLoading,
    loadingStates,
    setGlobalLoading,
    setLoading,
    clearAllLoading,
    isLoading,
  }
}
