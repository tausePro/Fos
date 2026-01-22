// Composable for managing loading states across the application
interface LoadingState {
  id: string
  message: string
  progress?: number
  timestamp: number
}

const loadingStates = ref<Map<string, LoadingState>>(new Map())
const globalLoading = ref(false)

export const useLoading = () => {
  
  // Start a loading operation
  function startLoading(id: string, message: string = 'Cargando...') {
    const state: LoadingState = {
      id,
      message,
      timestamp: Date.now()
    }
    
    loadingStates.value.set(id, state)
    updateGlobalLoading()
    
    return {
      updateMessage: (newMessage: string) => updateLoadingMessage(id, newMessage),
      updateProgress: (progress: number) => updateLoadingProgress(id, progress),
      finish: () => finishLoading(id)
    }
  }
  
  // Update loading message
  function updateLoadingMessage(id: string, message: string) {
    const state = loadingStates.value.get(id)
    if (state) {
      state.message = message
      loadingStates.value.set(id, state)
    }
  }
  
  // Update loading progress
  function updateLoadingProgress(id: string, progress: number) {
    const state = loadingStates.value.get(id)
    if (state) {
      state.progress = Math.min(100, Math.max(0, progress))
      loadingStates.value.set(id, state)
    }
  }
  
  // Finish a loading operation
  function finishLoading(id: string) {
    loadingStates.value.delete(id)
    updateGlobalLoading()
  }
  
  // Update global loading state
  function updateGlobalLoading() {
    globalLoading.value = loadingStates.value.size > 0
  }
  
  // Get current loading state for a specific operation
  function getLoadingState(id: string): LoadingState | null {
    return loadingStates.value.get(id) || null
  }
  
  // Check if a specific operation is loading
  function isLoading(id: string): boolean {
    return loadingStates.value.has(id)
  }
  
  // Get all current loading operations
  function getAllLoadingStates(): LoadingState[] {
    return Array.from(loadingStates.value.values())
  }
  
  // Clear all loading states (useful for cleanup)
  function clearAllLoading() {
    loadingStates.value.clear()
    globalLoading.value = false
  }
  
  // Auto-cleanup loading states that are too old (prevent memory leaks)
  function cleanupOldLoadingStates() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    for (const [id, state] of loadingStates.value.entries()) {
      if (now - state.timestamp > maxAge) {
        console.warn(`Auto-cleaning up old loading state: ${id}`)
        loadingStates.value.delete(id)
      }
    }
    
    updateGlobalLoading()
  }
  
  // Performance monitoring
  const performanceMetrics = ref<Map<string, number>>(new Map())
  
  function startPerformanceTimer(id: string): () => number {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      performanceMetrics.value.set(id, duration)
      
      // Log slow operations
      if (duration > 2000) {
        console.warn(`Slow operation detected: ${id} took ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
  }
  
  function getPerformanceMetric(id: string): number | null {
    return performanceMetrics.value.get(id) || null
  }
  
  // Cleanup old performance metrics
  function cleanupPerformanceMetrics() {
    if (performanceMetrics.value.size > 100) {
      // Keep only the last 50 metrics
      const entries = Array.from(performanceMetrics.value.entries())
      const recent = entries.slice(-50)
      performanceMetrics.value = new Map(recent)
    }
  }
  
  // Auto-cleanup interval
  let cleanupInterval: NodeJS.Timeout | null = null
  
  function startAutoCleanup() {
    if (process.client && !cleanupInterval) {
      cleanupInterval = setInterval(() => {
        cleanupOldLoadingStates()
        cleanupPerformanceMetrics()
      }, 60000) // Every minute
    }
  }
  
  function stopAutoCleanup() {
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }
  
  // Initialize auto-cleanup on first use
  onMounted(() => {
    startAutoCleanup()
  })
  
  onUnmounted(() => {
    stopAutoCleanup()
  })
  
  return {
    // State
    globalLoading: readonly(globalLoading),
    loadingStates: readonly(loadingStates),
    
    // Loading management
    startLoading,
    updateLoadingMessage,
    updateLoadingProgress,
    finishLoading,
    getLoadingState,
    isLoading,
    getAllLoadingStates,
    clearAllLoading,
    
    // Performance monitoring
    startPerformanceTimer,
    getPerformanceMetric,
    performanceMetrics: readonly(performanceMetrics),
    
    // Cleanup
    cleanupOldLoadingStates,
    cleanupPerformanceMetrics
  }
}

// Utility function for wrapping async operations with loading
export async function withLoading<T>(
  id: string, 
  operation: () => Promise<T>, 
  message: string = 'Cargando...'
): Promise<T> {
  const { startLoading } = useLoading()
  const loading = startLoading(id, message)
  
  try {
    const result = await operation()
    loading.finish()
    return result
  } catch (error) {
    loading.finish()
    throw error
  }
}

// Utility function for operations with progress
export async function withProgressLoading<T>(
  id: string,
  operation: (updateProgress: (progress: number) => void) => Promise<T>,
  message: string = 'Procesando...'
): Promise<T> {
  const { startLoading } = useLoading()
  const loading = startLoading(id, message)
  
  try {
    const result = await operation(loading.updateProgress)
    loading.finish()
    return result
  } catch (error) {
    loading.finish()
    throw error
  }
}