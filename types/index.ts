// Core data models for Felipe OS

export type Category = 'LANDINGCHAT' | 'ESTUDIO' | 'TAUSE' | 'OTRO'

export interface Block {
  id: string
  date: string           // YYYY-MM-DD format
  startTime: string      // HH:MM format (24h)
  endTime: string        // HH:MM format (24h)
  category: Category
  description: string    // Max 50 characters
  completed: boolean
  actualStartTime?: string
  actualEndTime?: string
}

export interface DailyPriority {
  date: string           // YYYY-MM-DD format
  text: string          // Max 100 characters
  completed: boolean
}

export interface ReviewEntry {
  date: string           // YYYY-MM-DD format
  focusRating: number    // 1-5 scale
  energyRating: number   // 1-5 scale
  completedBlocks: number
  totalBlocks: number
  reflectionNotes: string
  improvements: string
}

export interface UserSettings {
  workStartTime: string  // HH:MM format
  workEndTime: string    // HH:MM format (default 17:00)
  weekendBlocking: boolean
  cellPhoneMode: boolean
}

export interface StorageSchema {
  version: string        // Semantic versioning
  lastUpdated: string   // ISO timestamp
  data: {
    blocks: Block[]
    priorities: DailyPriority[]
    reviews: ReviewEntry[]
    settings: UserSettings
  }
}

// Validation schemas
export const VALIDATION_RULES = {
  PRIORITY_MAX_LENGTH: 100,
  BLOCK_DESCRIPTION_MAX_LENGTH: 50,
  MAX_BLOCKS_PER_DAY: 3,
  MIN_BLOCK_DURATION_MINUTES: 30,
  MAX_BLOCK_DURATION_MINUTES: 120,
  WORK_END_TIME: '17:00' // 5pm cutoff
} as const

// Category colors for UI
export const CATEGORY_COLORS = {
  LANDINGCHAT: '#10B981', // Green
  ESTUDIO: '#3B82F6',     // Blue
  TAUSE: '#F59E0B',       // Orange
  OTRO: '#6B7280'         // Gray
} as const

// Category priorities for scheduling
export const CATEGORY_PRIORITIES = {
  LANDINGCHAT: 1,
  ESTUDIO: 2,
  TAUSE: 3,
  OTRO: 4
} as const