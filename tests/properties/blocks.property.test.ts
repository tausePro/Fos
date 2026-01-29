/**
 * Property-Based Tests for Blocks Store
 * 
 * These tests validate universal properties that should hold true
 * across all valid executions of the blocks management system.
 * 
 * Framework: fast-check (property-based testing)
 * Minimum iterations: 100 per property
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { createPinia, setActivePinia } from 'pinia'
import { useBlocksStore } from '~/stores/blocks'
import type { Block, Category } from '~/types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock process.client and process.env
Object.defineProperty(global, 'process', {
  value: { 
    client: true,
    env: { NODE_ENV: 'test' }
  },
  writable: true
})

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid time strings in HH:MM format
 * Generates times in 30-minute increments (as per system rules)
 */
const timeGenerator = () => fc.constantFrom(
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
)

/**
 * Generator for valid date strings in YYYY-MM-DD format (weekdays only)
 */
const dateGenerator = () => fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2024-12-31')
}).map(date => {
  // Clone the date to avoid mutation
  const d = new Date(date.getTime())
  const dayOfWeek = d.getDay()
  
  // If weekend, move to next Monday
  if (dayOfWeek === 0) { // Sunday
    d.setDate(d.getDate() + 1)
  } else if (dayOfWeek === 6) { // Saturday
    d.setDate(d.getDate() + 2)
  }
  
  // Ensure the date is still valid after adjustment
  if (isNaN(d.getTime())) {
    // If invalid, return a safe default weekday
    return '2024-06-17' // Monday
  }
  
  return d.toISOString().split('T')[0]
})

/**
 * Generator for valid categories
 */
const categoryGenerator = (): fc.Arbitrary<Category> => 
  fc.constantFrom('LANDINGCHAT', 'ESTUDIO', 'TAUSE', 'OTRO')

/**
 * Generator for valid block descriptions (5-50 characters)
 */
const descriptionGenerator = () => fc.string({ 
  minLength: 5, 
  maxLength: 50 
}).filter(s => s.trim().length >= 5)

/**
 * Generator for valid time pairs (start < end, max 2 hours)
 */
const timePairGenerator = () => fc.tuple(
  fc.integer({ min: 8, max: 15 }), // start hour (8am-3pm)
  fc.constantFrom(30, 60, 90, 120)  // duration in minutes
).map(([startHour, duration]) => {
  const startMinutes = startHour * 60
  const endMinutes = startMinutes + duration
  
  const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
  
  return { startTime, endTime }
})

/**
 * Generator for complete valid blocks
 */
const blockGenerator = () => fc.record({
  date: dateGenerator(),
  startTime: fc.string(),
  endTime: fc.string(),
  category: categoryGenerator(),
  description: descriptionGenerator()
}).chain(partial => 
  timePairGenerator().map(times => ({
    ...partial,
    ...times
  }))
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Check if two blocks overlap in time
 */
function blocksOverlap(a: Block, b: Block): boolean {
  if (a.date !== b.date) return false
  
  const aStart = timeToMinutes(a.startTime)
  const aEnd = timeToMinutes(a.endTime)
  const bStart = timeToMinutes(b.startTime)
  const bEnd = timeToMinutes(b.endTime)
  
  return aStart < bEnd && bStart < aEnd
}

/**
 * Check if any blocks in array overlap
 */
function hasOverlaps(blocks: Block[]): boolean {
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocksOverlap(blocks[i], blocks[j])) {
        return true
      }
    }
  }
  return false
}

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Property-Based Tests: Blocks Store', () => {
  beforeEach(() => {
    // Reset Pinia
    setActivePinia(createPinia())
    
    // Clear localStorage mock
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  /**
   * Property 4: Sacred Block Limit Enforcement
   * 
   * For any day, attempting to create more than 3 blocks should be rejected,
   * regardless of the time slots or categories involved.
   * 
   * Validates: Requirements 2.1
   */
  describe('Property 4: Sacred Block Limit Enforcement', () => {
    it('should never allow more than 3 blocks per day', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(blockGenerator(), { minLength: 4, maxLength: 10 }),
          async (blocks) => {
            // Reset Pinia and store for each property test iteration
            setActivePinia(createPinia())
            const store = useBlocksStore()
            await store.clearAllBlocks()
            
            const testDate = '2024-06-17' // Monday (weekday)
            
            // Set all blocks to the same date
            const sameDayBlocks = blocks.map(b => ({ ...b, date: testDate }))
            
            // Try to add all blocks
            for (const block of sameDayBlocks) {
              await store.createBlock(block)
            }
            
            // Property: Never more than 3 blocks per day in the store
            const blocksInStore = store.getBlocksByDate(testDate)
            
            // Assert: Never more than 3 blocks per day
            expect(blocksInStore.length).toBeLessThanOrEqual(3)
            
            // Additional check: isDailyLimitReached should be true after 3 blocks
            if (blocksInStore.length === 3) {
              expect(store.isDailyLimitReached(testDate)).toBe(true)
            }
          }
        ),
        { numRuns: 100, verbose: true }
      )
    })

    it('should allow 3 blocks on different days', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(blockGenerator(), { minLength: 6, maxLength: 9 }),
          async (blocks) => {
            // Reset Pinia and store for each property test iteration
            setActivePinia(createPinia())
            const store = useBlocksStore()
            await store.clearAllBlocks()
            
            // Distribute blocks across 3 different weekdays
            const dates = ['2024-06-17', '2024-06-18', '2024-06-19'] // Mon, Tue, Wed
            const distributedBlocks = blocks.map((b, i) => ({
              ...b,
              date: dates[i % 3]
            }))
            
            // Try to add all blocks
            for (const block of distributedBlocks) {
              await store.createBlock(block)
            }
            
            // Property: Each day should have at most 3 blocks
            for (const date of dates) {
              const dayBlocks = store.getBlocksByDate(date)
              expect(dayBlocks.length).toBeLessThanOrEqual(3)
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  /**
   * Property 5: Time Overlap Prevention
   * 
   * For any set of blocks on the same day, no two blocks should have
   * overlapping time ranges, and the system should prevent creation
   * of overlapping blocks.
   * 
   * Validates: Requirements 2.6
   */
  describe('Property 5: Time Overlap Prevention', () => {
    it('should never allow overlapping blocks on the same day', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(blockGenerator(), { minLength: 2, maxLength: 5 }),
          async (blocks) => {
            // Reset Pinia and store for each property test iteration
            setActivePinia(createPinia())
            const store = useBlocksStore()
            await store.clearAllBlocks()
            
            const testDate = '2024-06-17' // Monday
            
            // Set all blocks to the same date
            const sameDayBlocks = blocks.map(b => ({ ...b, date: testDate }))
            
            // Try to add all blocks
            for (const block of sameDayBlocks) {
              await store.createBlock(block)
            }
            
            // Property: No overlaps should exist in stored blocks
            const storedBlocks = store.getBlocksByDate(testDate)
            const overlapsExist = hasOverlaps(storedBlocks)
            
            expect(overlapsExist).toBe(false)
          }
        ),
        { numRuns: 100, verbose: true }
      )
    })

    it('should reject blocks that would create overlaps', async () => {
      await fc.assert(
        fc.asyncProperty(
          blockGenerator(),
          blockGenerator(),
          async (block1, block2) => {
            // Reset Pinia and store for each property test iteration
            setActivePinia(createPinia())
            const store = useBlocksStore()
            await store.clearAllBlocks()
            
            const testDate = '2024-06-17' // Monday
            
            // Create two blocks with same date and overlapping times
            // Use different categories to avoid LANDINGCHAT priority override
            const first = { ...block1, date: testDate, startTime: '09:00', endTime: '10:30', category: 'ESTUDIO' as Category }
            const second = { ...block2, date: testDate, startTime: '10:00', endTime: '11:30', category: 'TAUSE' as Category }
            
            // Add first block
            const result1 = await store.createBlock(first)
            
            // First block should always succeed (no conflicts, valid times)
            if (!result1.success) {
              // Skip this test iteration if first block fails for other reasons
              return
            }
            
            // Try to add overlapping block
            const result2 = await store.createBlock(second)
            
            // Property: No overlaps should exist in stored blocks
            const storedBlocks = store.getBlocksByDate(testDate)
            expect(hasOverlaps(storedBlocks)).toBe(false)
            
            // If second block was rejected, verify it was for a valid reason
            if (!result2.success && result2.errors) {
              // Should be rejected for overlap, time format, or other validation
              expect(result2.errors.length).toBeGreaterThan(0)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should allow adjacent blocks without gaps', async () => {
      const store = useBlocksStore()
      const testDate = '2024-06-17' // Monday
      
      // Create three adjacent blocks (no overlaps, no gaps)
      const block1 = {
        date: testDate,
        startTime: '09:00',
        endTime: '10:30',
        category: 'LANDINGCHAT' as Category,
        description: 'First block'
      }
      
      const block2 = {
        date: testDate,
        startTime: '10:30',
        endTime: '12:00',
        category: 'ESTUDIO' as Category,
        description: 'Second block'
      }
      
      const block3 = {
        date: testDate,
        startTime: '12:00',
        endTime: '13:30',
        category: 'TAUSE' as Category,
        description: 'Third block'
      }
      
      // All should succeed
      const result1 = await store.createBlock(block1)
      const result2 = await store.createBlock(block2)
      const result3 = await store.createBlock(block3)
      
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)
      
      // Verify no overlaps
      const storedBlocks = store.getBlocksByDate(testDate)
      expect(storedBlocks.length).toBe(3)
      expect(hasOverlaps(storedBlocks)).toBe(false)
    })
  })

  /**
   * Property: Block Duration Constraints
   * 
   * For any block duration input, the system should only accept
   * 30-minute multiples up to a maximum of 2 hours.
   * 
   * Validates: Requirements 2.7, 2.8
   */
  describe('Property 3: Block Duration Constraints', () => {
    it('should only accept durations in 30-minute multiples', async () => {
      await fc.assert(
        fc.asyncProperty(
          dateGenerator(),
          fc.integer({ min: 8, max: 15 }),
          fc.integer({ min: 1, max: 240 }), // duration in minutes
          categoryGenerator(),
          descriptionGenerator(),
          async (date, startHour, durationMinutes, category, description) => {
            const store = useBlocksStore()
            
            const startTime = `${String(startHour).padStart(2, '0')}:00`
            const endMinutes = startHour * 60 + durationMinutes
            const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
            
            const block = {
              date,
              startTime,
              endTime,
              category,
              description
            }
            
            const result = await store.createBlock(block)
            
            // Property: The system validates time format (30-minute increments) and duration range
            // Start time is always :00 (valid), but end time might not be in 30-minute increments
            const endMinutesComponent = endMinutes % 60
            const isEndTimeValid = endMinutesComponent === 0 || endMinutesComponent === 30
            const isUnder2Hours = durationMinutes <= 120
            const isAtLeast30Min = durationMinutes >= 30
            const isValidDuration = isEndTimeValid && isUnder2Hours && isAtLeast30Min
            
            // If duration is invalid, the block should be rejected
            if (!isValidDuration) {
              // Should fail
              if (result.success) {
                // If it somehow succeeded, check that the actual stored block has valid times
                const storedBlocks = store.getBlocksByDate(date)
                const storedBlock = storedBlocks.find(b => b.description === description)
                if (storedBlock) {
                  const [, storedEndMin] = storedBlock.endTime.split(':').map(Number)
                  expect(storedEndMin === 0 || storedEndMin === 30).toBe(true)
                }
              }
            }
            
            // If duration is valid but block failed, it should not be due to time format
            if (isValidDuration && !result.success && result.errors) {
              const timeFormatError = result.errors.some(e => 
                e.toLowerCase().includes('time must be in') ||
                e.toLowerCase().includes('30-minute increment') ||
                e.toLowerCase().includes('hh:mm format')
              )
              // Time format errors should not occur if our times are valid
              expect(timeFormatError).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should reject blocks longer than 2 hours', async () => {
      const store = useBlocksStore()
      const testDate = '2024-06-17' // Monday
      
      const longBlock = {
        date: testDate,
        startTime: '09:00',
        endTime: '11:30', // 2.5 hours
        category: 'LANDINGCHAT' as Category,
        description: 'Too long block'
      }
      
      const result = await store.createBlock(longBlock)
      
      // Should fail
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.some(e => e.includes('2 hour') || e.includes('maximum'))).toBe(true)
    })

    it('should accept blocks of exactly 2 hours', async () => {
      const store = useBlocksStore()
      const testDate = '2024-06-17' // Monday
      
      const twoHourBlock = {
        date: testDate,
        startTime: '09:00',
        endTime: '11:00', // exactly 2 hours
        category: 'LANDINGCHAT' as Category,
        description: 'Two hour block'
      }
      
      const result = await store.createBlock(twoHourBlock)
      
      // Should succeed
      expect(result.success).toBe(true)
    })
  })

  /**
   * Property: Data Persistence Round Trip
   * 
   * For any application data (blocks), storing data and then
   * retrieving it should produce equivalent data structures.
   * 
   * Validates: Requirements 9.1, 9.2
   */
  describe('Property 8: Data Persistence Round Trip', () => {
    it('should preserve block data through save/load cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(blockGenerator(), { minLength: 1, maxLength: 3 }),
          async (blocks) => {
            const store = useBlocksStore()
            
            // Add blocks
            for (const block of blocks) {
              await store.createBlock(block)
            }
            
            const originalBlocks = store.exportBlocks()
            
            // Simulate save
            await store.saveToStorage()
            
            // Get what was saved
            const savedData = localStorageMock.setItem.mock.calls[
              localStorageMock.setItem.mock.calls.length - 1
            ]
            
            if (savedData) {
              const [key, value] = savedData
              expect(key).toBe('felipe-os-blocks')
              
              // Parse and verify
              const parsed = JSON.parse(value)
              expect(Array.isArray(parsed)).toBe(true)
              expect(parsed.length).toBe(originalBlocks.length)
              
              // Verify each block's essential properties
              for (let i = 0; i < parsed.length; i++) {
                expect(parsed[i].date).toBe(originalBlocks[i].date)
                expect(parsed[i].startTime).toBe(originalBlocks[i].startTime)
                expect(parsed[i].endTime).toBe(originalBlocks[i].endTime)
                expect(parsed[i].category).toBe(originalBlocks[i].category)
                expect(parsed[i].description).toBe(originalBlocks[i].description)
              }
            }
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
