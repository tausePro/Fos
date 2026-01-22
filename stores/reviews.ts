import { defineStore } from 'pinia'
import type { ReviewEntry } from '~/types'
import { getCurrentDate } from '~/utils/timeHelpers'
import { StorageManager, DataRecovery, ErrorNotification, SessionFallback } from '~/utils/errorHandling'

export const useReviewsStore = defineStore('reviews', () => {
  // State
  const reviews = ref<ReviewEntry[]>([])
  const showNightlyReview = ref(false)
  const hasCompletedTodaysReview = ref(false)
  const usingFallback = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const getTodaysReview = computed(() => {
    const today = getCurrentDate()
    return reviews.value.find(review => review.date === today)
  })

  const getReviewsByDateRange = computed(() => {
    return (startDate: string, endDate: string) => {
      return reviews.value.filter(review => 
        review.date >= startDate && review.date <= endDate
      ).sort((a, b) => b.date.localeCompare(a.date))
    }
  })

  const getWeeklyStats = computed(() => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    
    const weekReviews = reviews.value.filter(review => {
      const reviewDate = new Date(review.date)
      return reviewDate >= weekStart && reviewDate <= today
    })

    if (weekReviews.length === 0) {
      return {
        averageFocus: 0,
        averageEnergy: 0,
        totalCompletedBlocks: 0,
        totalBlocks: 0,
        completionRate: 0,
        reviewCount: 0
      }
    }

    const totalFocus = weekReviews.reduce((sum, r) => sum + r.focusRating, 0)
    const totalEnergy = weekReviews.reduce((sum, r) => sum + r.energyRating, 0)
    const totalCompleted = weekReviews.reduce((sum, r) => sum + r.completedBlocks, 0)
    const totalBlocks = weekReviews.reduce((sum, r) => sum + r.totalBlocks, 0)

    return {
      averageFocus: Math.round((totalFocus / weekReviews.length) * 10) / 10,
      averageEnergy: Math.round((totalEnergy / weekReviews.length) * 10) / 10,
      totalCompletedBlocks: totalCompleted,
      totalBlocks: totalBlocks,
      completionRate: totalBlocks > 0 ? Math.round((totalCompleted / totalBlocks) * 100) : 0,
      reviewCount: weekReviews.length
    }
  })

  const shouldShowNightlyReview = computed(() => {
    if (hasCompletedTodaysReview.value) return false
    
    const now = new Date()
    const currentHour = now.getHours()
    
    // Show after 8pm (20:00)
    return currentHour >= 20
  })

  // Actions
  async function loadReviews() {
    try {
      if (process.client) {
        const stored = localStorage.getItem('felipe-os-reviews')
        if (stored) {
          try {
            const rawData = JSON.parse(stored)
            const recovery = DataRecovery.validateReviews(rawData)
            
            if (recovery.success) {
              reviews.value = recovery.recoveredData || []
              
              if (recovery.warnings?.length) {
                console.warn('Reviews recovery warnings:', recovery.warnings)
                ErrorNotification.show({
                  type: 'data_corruption',
                  message: `Se recuperaron ${reviews.value.length} revisiones con ${recovery.warnings.length} correcciones`,
                  recoverable: true
                }, 'Reviews Store')
              }
            } else {
              console.error('Failed to recover reviews:', recovery.errors)
              reviews.value = []
              error.value = 'Error al recuperar revisiones'
            }
          } catch (parseError) {
            console.error('Failed to parse reviews:', parseError)
            reviews.value = []
            ErrorNotification.show({
              type: 'data_corruption',
              message: 'Datos de revisiones corruptos, iniciando vacío',
              recoverable: true
            }, 'Reviews Store')
          }
        } else {
          reviews.value = []
        }
        
        // Check if today's review is completed
        const today = getCurrentDate()
        const todaysReview = reviews.value.find(r => r.date === today)
        hasCompletedTodaysReview.value = !!todaysReview
        usingFallback.value = false
        error.value = null
      }
    } catch (loadError) {
      console.error('Error loading reviews:', loadError)
      error.value = 'Error al cargar revisiones'
      
      // Try session fallback
      if (SessionFallback.has('felipe-os-reviews')) {
        reviews.value = SessionFallback.get('felipe-os-reviews') || []
        usingFallback.value = true
      } else {
        reviews.value = []
      }
      
      ErrorNotification.show({
        type: 'access_denied',
        message: 'Error al cargar revisiones, usando datos de sesión',
        recoverable: true
      }, 'Reviews Store')
    }
  }

  async function saveReview(review: ReviewEntry): Promise<{ success: boolean; error?: string }> {
    try {
      if (process.client) {
        // Update or add review
        const existingIndex = reviews.value.findIndex(r => r.date === review.date)
        
        if (existingIndex >= 0) {
          reviews.value[existingIndex] = review
        } else {
          reviews.value.push(review)
        }

        // Sort by date (newest first)
        reviews.value.sort((a, b) => b.date.localeCompare(a.date))

        // Save to localStorage with error handling
        const saveResult = await StorageManager.saveWithQuotaCheck('felipe-os-reviews', reviews.value)
        
        if (saveResult.success) {
          // Mark today's review as completed
          if (review.date === getCurrentDate()) {
            hasCompletedTodaysReview.value = true
            showNightlyReview.value = false
          }
          
          usingFallback.value = false
          error.value = null
          return { success: true }
        } else {
          // Save to session fallback
          SessionFallback.set('felipe-os-reviews', reviews.value)
          usingFallback.value = true
          error.value = saveResult.error?.message || 'Error al guardar revisión'
          
          ErrorNotification.show(saveResult.error!, 'Reviews Store')
          
          return { 
            success: false, 
            error: saveResult.error?.message || 'Error al guardar la revisión' 
          }
        }
      }
      
      return { success: false, error: 'Not in client environment' }
    } catch (saveError) {
      console.error('Error saving review:', saveError)
      error.value = 'Error inesperado al guardar revisión'
      
      // Always save to session fallback
      SessionFallback.set('felipe-os-reviews', reviews.value)
      usingFallback.value = true
      
      ErrorNotification.show({
        type: 'unknown',
        message: `Error al guardar revisión: ${saveError}`,
        recoverable: true
      }, 'Reviews Store')
      
      return { success: false, error: 'Error al guardar la revisión' }
    }
  }

  function triggerNightlyReview() {
    if (!hasCompletedTodaysReview.value) {
      showNightlyReview.value = true
    }
  }

  function dismissNightlyReview() {
    showNightlyReview.value = false
    // Mark as completed for today (skipped)
    hasCompletedTodaysReview.value = true
  }

  function resetDailyState() {
    // Called when a new day starts
    hasCompletedTodaysReview.value = false
    showNightlyReview.value = false
  }

  // Auto-check for nightly review every minute
  let nightlyCheckInterval: NodeJS.Timeout | null = null

  function startNightlyCheck() {
    if (process.client && !nightlyCheckInterval) {
      nightlyCheckInterval = setInterval(() => {
        if (shouldShowNightlyReview.value && !showNightlyReview.value) {
          triggerNightlyReview()
        }
      }, 60000) // Check every minute
    }
  }

  function stopNightlyCheck() {
    if (nightlyCheckInterval) {
      clearInterval(nightlyCheckInterval)
      nightlyCheckInterval = null
    }
  }

  // Initialize on store creation
  onMounted(() => {
    loadReviews()
    startNightlyCheck()
  })

  onUnmounted(() => {
    stopNightlyCheck()
  })

  return {
    // State
    reviews: readonly(reviews),
    showNightlyReview: readonly(showNightlyReview),
    hasCompletedTodaysReview: readonly(hasCompletedTodaysReview),
    usingFallback: readonly(usingFallback),
    error: readonly(error),
    
    // Getters
    getTodaysReview,
    getReviewsByDateRange,
    getWeeklyStats,
    shouldShowNightlyReview,
    
    // Actions
    loadReviews,
    saveReview,
    triggerNightlyReview,
    dismissNightlyReview,
    resetDailyState,
    startNightlyCheck,
    stopNightlyCheck
  }
})