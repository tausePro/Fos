import { defineStore } from 'pinia'
import type { ReviewEntry } from '~/types'
import { getCurrentDate } from '~/utils/timeHelpers'

export const useReviewsStore = defineStore('reviews', () => {
  // State
  const reviews = ref<ReviewEntry[]>([])
  const showNightlyReview = ref(false)
  const hasCompletedTodaysReview = ref(false)

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
          const parsedReviews = JSON.parse(stored)
          reviews.value = Array.isArray(parsedReviews) ? parsedReviews : []
        }
        
        // Check if today's review is completed
        const today = getCurrentDate()
        const todaysReview = reviews.value.find(r => r.date === today)
        hasCompletedTodaysReview.value = !!todaysReview
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      reviews.value = []
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

        // Save to localStorage
        localStorage.setItem('felipe-os-reviews', JSON.stringify(reviews.value))
        
        // Mark today's review as completed
        if (review.date === getCurrentDate()) {
          hasCompletedTodaysReview.value = true
          showNightlyReview.value = false
        }

        return { success: true }
      }
      
      return { success: false, error: 'Not in client environment' }
    } catch (error) {
      console.error('Error saving review:', error)
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