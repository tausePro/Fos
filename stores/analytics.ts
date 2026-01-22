import { defineStore } from 'pinia'
import type { Block, DailyPriority, ReviewEntry, Category } from '~/types'
import { getCurrentDate } from '~/utils/timeHelpers'

interface CategoryStats {
  category: Category
  totalBlocks: number
  completedBlocks: number
  completionRate: number
  totalMinutes: number
  completedMinutes: number
}

interface DailyStats {
  date: string
  totalBlocks: number
  completedBlocks: number
  completionRate: number
  priorityCompleted: boolean
  categories: CategoryStats[]
}

interface ProductiveTimeSlot {
  hour: number
  completionRate: number
  totalBlocks: number
  label: string
}

interface TrendData {
  period: string
  completionRate: number
  totalBlocks: number
  completedBlocks: number
}

export const useAnalyticsStore = defineStore('analytics', () => {
  // Dependencies
  const blocksStore = useBlocksStore()
  const reviewsStore = useReviewsStore()

  // Computed Analytics
  const allTimeStats = computed(() => {
    const allBlocks = blocksStore.blocks
    const completedBlocks = allBlocks.filter(block => block.completed)
    
    if (allBlocks.length === 0) {
      return {
        totalBlocks: 0,
        completedBlocks: 0,
        completionRate: 0,
        totalDays: 0,
        averageBlocksPerDay: 0
      }
    }

    // Get unique dates
    const uniqueDates = [...new Set(allBlocks.map(block => block.date))]
    const totalDays = uniqueDates.length
    
    return {
      totalBlocks: allBlocks.length,
      completedBlocks: completedBlocks.length,
      completionRate: Math.round((completedBlocks.length / allBlocks.length) * 100),
      totalDays,
      averageBlocksPerDay: Math.round((allBlocks.length / totalDays) * 10) / 10
    }
  })

  const categoryStats = computed((): CategoryStats[] => {
    const categories: Category[] = ['LANDINGCHAT', 'ESTUDIO', 'TAUSE', 'OTRO']
    
    return categories.map(category => {
      const categoryBlocks = blocksStore.blocks.filter(block => block.category === category)
      const completedBlocks = categoryBlocks.filter(block => block.completed)
      
      // Calculate total minutes (assuming average 90 minutes per block)
      const totalMinutes = categoryBlocks.length * 90
      const completedMinutes = completedBlocks.length * 90
      
      return {
        category,
        totalBlocks: categoryBlocks.length,
        completedBlocks: completedBlocks.length,
        completionRate: categoryBlocks.length > 0 ? Math.round((completedBlocks.length / categoryBlocks.length) * 100) : 0,
        totalMinutes,
        completedMinutes
      }
    }).filter(stat => stat.totalBlocks > 0) // Only show categories with blocks
  })

  const weeklyTrends = computed((): TrendData[] => {
    const weeks: TrendData[] = []
    const today = new Date()
    
    // Get last 8 weeks of data
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - (today.getDay() + (i * 7)))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekBlocks = blocksStore.blocks.filter(block => {
        const blockDate = new Date(block.date)
        return blockDate >= weekStart && blockDate <= weekEnd
      })
      
      const completedBlocks = weekBlocks.filter(block => block.completed)
      
      if (weekBlocks.length > 0) {
        weeks.push({
          period: `Sem ${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          totalBlocks: weekBlocks.length,
          completedBlocks: completedBlocks.length,
          completionRate: Math.round((completedBlocks.length / weekBlocks.length) * 100)
        })
      }
    }
    
    return weeks
  })

  const productiveTimeSlots = computed((): ProductiveTimeSlot[] => {
    const timeSlots: { [hour: number]: { total: number; completed: number } } = {}
    
    // Initialize time slots (8am to 5pm)
    for (let hour = 8; hour <= 17; hour++) {
      timeSlots[hour] = { total: 0, completed: 0 }
    }
    
    // Analyze blocks by start time
    blocksStore.blocks.forEach(block => {
      const startHour = parseInt(block.startTime.split(':')[0])
      if (startHour >= 8 && startHour <= 17) {
        timeSlots[startHour].total++
        if (block.completed) {
          timeSlots[startHour].completed++
        }
      }
    })
    
    // Convert to array and calculate rates
    return Object.entries(timeSlots)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        totalBlocks: data.total,
        completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        label: `${hour}:00`
      }))
      .filter(slot => slot.totalBlocks > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
  })

  const currentWeekStats = computed(() => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    const weekBlocks = blocksStore.blocks.filter(block => {
      const blockDate = new Date(block.date)
      return blockDate >= weekStart && blockDate <= weekEnd
    })
    
    const completedBlocks = weekBlocks.filter(block => block.completed)
    
    // Get priorities for the week
    const weekPriorities = getWeekPriorities(weekStart, weekEnd)
    const completedPriorities = weekPriorities.filter(p => p.completed)
    
    return {
      totalBlocks: weekBlocks.length,
      completedBlocks: completedBlocks.length,
      completionRate: weekBlocks.length > 0 ? Math.round((completedBlocks.length / weekBlocks.length) * 100) : 0,
      totalPriorities: weekPriorities.length,
      completedPriorities: completedPriorities.length,
      priorityCompletionRate: weekPriorities.length > 0 ? Math.round((completedPriorities.length / weekPriorities.length) * 100) : 0
    }
  })

  const streakData = computed(() => {
    const today = getCurrentDate()
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    
    // Get all unique dates with blocks, sorted
    const datesWithBlocks = [...new Set(blocksStore.blocks.map(block => block.date))]
      .sort((a, b) => b.localeCompare(a)) // Most recent first
    
    // Calculate current streak (consecutive days with completed blocks)
    for (const date of datesWithBlocks) {
      const dayBlocks = blocksStore.blocks.filter(block => block.date === date)
      const hasCompletedBlocks = dayBlocks.some(block => block.completed)
      
      if (hasCompletedBlocks) {
        tempStreak++
        if (date === today) {
          currentStreak = tempStreak
        }
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak
        }
        tempStreak = 0
      }
    }
    
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak
    }
    
    return {
      currentStreak,
      longestStreak,
      totalActiveDays: datesWithBlocks.length
    }
  })

  const focusEnergyCorrelation = computed(() => {
    const reviews = reviewsStore.reviews
    
    if (reviews.length === 0) {
      return {
        averageFocus: 0,
        averageEnergy: 0,
        correlation: 'Sin datos',
        totalReviews: 0
      }
    }
    
    const totalFocus = reviews.reduce((sum, review) => sum + review.focusRating, 0)
    const totalEnergy = reviews.reduce((sum, review) => sum + review.energyRating, 0)
    const averageFocus = Math.round((totalFocus / reviews.length) * 10) / 10
    const averageEnergy = Math.round((totalEnergy / reviews.length) * 10) / 10
    
    // Simple correlation analysis
    let correlation = 'Neutral'
    if (averageFocus >= 4 && averageEnergy >= 4) {
      correlation = 'Alta productividad'
    } else if (averageFocus >= 3.5 && averageEnergy >= 3.5) {
      correlation = 'Buena productividad'
    } else if (averageFocus < 3 || averageEnergy < 3) {
      correlation = 'Necesita mejora'
    }
    
    return {
      averageFocus,
      averageEnergy,
      correlation,
      totalReviews: reviews.length
    }
  })

  // Helper functions
  function getWeekPriorities(weekStart: Date, weekEnd: Date): DailyPriority[] {
    try {
      if (process.client) {
        const stored = localStorage.getItem('felipe-os-priorities')
        if (stored) {
          const priorities: DailyPriority[] = JSON.parse(stored)
          return priorities.filter(priority => {
            const priorityDate = new Date(priority.date)
            return priorityDate >= weekStart && priorityDate <= weekEnd
          })
        }
      }
    } catch (error) {
      console.error('Error loading priorities for week:', error)
    }
    return []
  }

  function getDailyStats(date: string): DailyStats {
    const dayBlocks = blocksStore.blocks.filter(block => block.date === date)
    const completedBlocks = dayBlocks.filter(block => block.completed)
    
    // Get priority for the day
    const dayPriority = getDayPriority(date)
    
    // Calculate category stats for the day
    const categories: Category[] = ['LANDINGCHAT', 'ESTUDIO', 'TAUSE', 'OTRO']
    const categoryStats = categories.map(category => {
      const categoryBlocks = dayBlocks.filter(block => block.category === category)
      const categoryCompleted = categoryBlocks.filter(block => block.completed)
      
      return {
        category,
        totalBlocks: categoryBlocks.length,
        completedBlocks: categoryCompleted.length,
        completionRate: categoryBlocks.length > 0 ? Math.round((categoryCompleted.length / categoryBlocks.length) * 100) : 0,
        totalMinutes: categoryBlocks.length * 90,
        completedMinutes: categoryCompleted.length * 90
      }
    }).filter(stat => stat.totalBlocks > 0)
    
    return {
      date,
      totalBlocks: dayBlocks.length,
      completedBlocks: completedBlocks.length,
      completionRate: dayBlocks.length > 0 ? Math.round((completedBlocks.length / dayBlocks.length) * 100) : 0,
      priorityCompleted: dayPriority?.completed || false,
      categories: categoryStats
    }
  }

  function getDayPriority(date: string): DailyPriority | null {
    try {
      if (process.client) {
        const stored = localStorage.getItem('felipe-os-priorities')
        if (stored) {
          const priorities: DailyPriority[] = JSON.parse(stored)
          return priorities.find(p => p.date === date) || null
        }
      }
    } catch (error) {
      console.error('Error loading priority for date:', date, error)
    }
    return null
  }

  return {
    // Computed analytics
    allTimeStats,
    categoryStats,
    weeklyTrends,
    productiveTimeSlots,
    currentWeekStats,
    streakData,
    focusEnergyCorrelation,
    
    // Helper functions
    getDailyStats
  }
})