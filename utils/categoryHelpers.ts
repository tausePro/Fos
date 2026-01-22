import type { Category, Block } from '~/types'
import { CATEGORY_COLORS, CATEGORY_PRIORITIES } from '~/types'

/**
 * Get the color for a category
 */
export function getCategoryColor(category: Category): string {
  return CATEGORY_COLORS[category]
}

/**
 * Get the priority level for a category (lower number = higher priority)
 */
export function getCategoryPriority(category: Category): number {
  return CATEGORY_PRIORITIES[category]
}

/**
 * Get all categories sorted by priority
 */
export function getCategoriesByPriority(): Category[] {
  return Object.keys(CATEGORY_PRIORITIES)
    .sort((a, b) => CATEGORY_PRIORITIES[a as Category] - CATEGORY_PRIORITIES[b as Category]) as Category[]
}

/**
 * Get category display name with proper formatting
 */
export function getCategoryDisplayName(category: Category): string {
  switch (category) {
    case 'LANDINGCHAT':
      return 'LandingChat'
    case 'ESTUDIO':
      return 'Estudio'
    case 'TAUSE':
      return 'Tause'
    case 'OTRO':
      return 'Otro'
    default:
      return category
  }
}

/**
 * Get Tailwind CSS classes for category styling
 */
export function getCategoryClasses(category: Category): {
  bg: string
  text: string
  border: string
  hover: string
} {
  switch (category) {
    case 'LANDINGCHAT':
      return {
        bg: 'bg-green-500',
        text: 'text-green-700',
        border: 'border-green-500',
        hover: 'hover:bg-green-600'
      }
    case 'ESTUDIO':
      return {
        bg: 'bg-blue-500',
        text: 'text-blue-700',
        border: 'border-blue-500',
        hover: 'hover:bg-blue-600'
      }
    case 'TAUSE':
      return {
        bg: 'bg-orange-500',
        text: 'text-orange-700',
        border: 'border-orange-500',
        hover: 'hover:bg-orange-600'
      }
    case 'OTRO':
      return {
        bg: 'bg-gray-500',
        text: 'text-gray-700',
        border: 'border-gray-500',
        hover: 'hover:bg-gray-600'
      }
    default:
      return {
        bg: 'bg-gray-500',
        text: 'text-gray-700',
        border: 'border-gray-500',
        hover: 'hover:bg-gray-600'
      }
  }
}

/**
 * Sort blocks by category priority (LANDINGCHAT first)
 */
export function sortBlocksByPriority(blocks: Block[]): Block[] {
  return [...blocks].sort((a, b) => {
    const priorityA = getCategoryPriority(a.category)
    const priorityB = getCategoryPriority(b.category)
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // If same priority, sort by start time
    return a.startTime.localeCompare(b.startTime)
  })
}

/**
 * Check if LANDINGCHAT can be scheduled (has priority)
 */
export function canScheduleLandingChat(blocks: Block[], date: string): boolean {
  const dailyBlocks = blocks.filter(block => block.date === date)
  
  // LANDINGCHAT always has priority, so it can be scheduled if there's space
  return dailyBlocks.length < 3
}

/**
 * Find optimal time slot for LANDINGCHAT block
 */
export function findOptimalLandingChatSlot(
  blocks: Block[], 
  date: string, 
  duration: number = 90
): { startTime: string; endTime: string } | null {
  const dailyBlocks = blocks
    .filter(block => block.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Try to schedule in the morning first (LANDINGCHAT priority)
  const workStart = 8 * 60 // 8:00 AM in minutes
  const workEnd = 17 * 60 // 5:00 PM in minutes
  
  // Check if we can fit before the first block
  if (dailyBlocks.length === 0) {
    const startMinutes = workStart
    const endMinutes = startMinutes + duration
    
    if (endMinutes <= workEnd) {
      return {
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(endMinutes)
      }
    }
  }
  
  // Check gaps between blocks
  for (let i = 0; i < dailyBlocks.length - 1; i++) {
    const currentBlockEnd = timeToMinutes(dailyBlocks[i].endTime)
    const nextBlockStart = timeToMinutes(dailyBlocks[i + 1].startTime)
    const gapDuration = nextBlockStart - currentBlockEnd
    
    if (gapDuration >= duration) {
      return {
        startTime: minutesToTime(currentBlockEnd),
        endTime: minutesToTime(currentBlockEnd + duration)
      }
    }
  }
  
  // Check after the last block
  if (dailyBlocks.length > 0) {
    const lastBlockEnd = timeToMinutes(dailyBlocks[dailyBlocks.length - 1].endTime)
    const endMinutes = lastBlockEnd + duration
    
    if (endMinutes <= workEnd) {
      return {
        startTime: minutesToTime(lastBlockEnd),
        endTime: minutesToTime(endMinutes)
      }
    }
  }
  
  return null
}

/**
 * Get statistics for categories
 */
export function getCategoryStats(blocks: Block[]): Record<Category, {
  total: number
  completed: number
  completionRate: number
}> {
  const stats: Record<Category, { total: number; completed: number; completionRate: number }> = {
    LANDINGCHAT: { total: 0, completed: 0, completionRate: 0 },
    ESTUDIO: { total: 0, completed: 0, completionRate: 0 },
    TAUSE: { total: 0, completed: 0, completionRate: 0 },
    OTRO: { total: 0, completed: 0, completionRate: 0 }
  }
  
  blocks.forEach(block => {
    stats[block.category].total++
    if (block.completed) {
      stats[block.category].completed++
    }
  })
  
  // Calculate completion rates
  Object.keys(stats).forEach(category => {
    const cat = category as Category
    if (stats[cat].total > 0) {
      stats[cat].completionRate = Math.round((stats[cat].completed / stats[cat].total) * 100)
    }
  })
  
  return stats
}

// Helper function (imported from timeHelpers)
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}