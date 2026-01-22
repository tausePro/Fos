import { defineStore } from 'pinia'
import type { Block, Category } from '~/types'
import { VALIDATION_RULES } from '~/types'
import { validateBlock, validateBlockWithPriority } from '~/utils/validationHelpers'
import { getCurrentDate } from '~/utils/timeHelpers'

interface BlocksState {
  blocks: Block[]
  loading: boolean
  error: string | null
}

export const useBlocksStore = defineStore('blocks', {
  state: (): BlocksState => ({
    blocks: [],
    loading: false,
    error: null
  }),

  getters: {
    // Get blocks for a specific date
    getBlocksByDate: (state) => (date: string): Block[] => {
      return state.blocks
        .filter(block => block.date === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    },

    // Get today's blocks
    getTodaysBlocks: (state) => {
      const today = getCurrentDate()
      return state.blocks
        .filter(block => block.date === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    },

    // Get blocks for current week
    getWeekBlocks: (state) => (weekStart: string): Block[] => {
      const weekDates: string[] = []
      const start = new Date(weekStart + 'T00:00:00')
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        weekDates.push(date.toISOString().split('T')[0])
      }
      
      return state.blocks.filter(block => weekDates.includes(block.date))
    },

    // Check if daily limit is reached
    isDailyLimitReached: (state) => (date: string): boolean => {
      const dailyBlocks = state.blocks.filter(block => block.date === date)
      return dailyBlocks.length >= VALIDATION_RULES.MAX_BLOCKS_PER_DAY
    },

    // Get completed blocks count for a date
    getCompletedCount: (state) => (date: string): number => {
      return state.blocks.filter(block => 
        block.date === date && block.completed
      ).length
    },

    // Get total blocks count for a date
    getTotalCount: (state) => (date: string): number => {
      return state.blocks.filter(block => block.date === date).length
    },

    // Get completion rate for a date
    getCompletionRate: (state) => (date: string): number => {
      const total = state.blocks.filter(block => block.date === date).length
      const completed = state.blocks.filter(block => 
        block.date === date && block.completed
      ).length
      
      return total > 0 ? Math.round((completed / total) * 100) : 0
    },

    // Get current active block (if any)
    getCurrentActiveBlock: (state) => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const today = getCurrentDate()
      
      return state.blocks.find(block => 
        block.date === today &&
        block.startTime <= currentTime &&
        block.endTime > currentTime &&
        !block.completed
      )
    },

    // Get next upcoming block
    getNextBlock: (state) => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const today = getCurrentDate()
      
      return state.blocks
        .filter(block => 
          block.date === today &&
          block.startTime > currentTime &&
          !block.completed
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime))[0]
    }
  },

  actions: {
    // Initialize store with data from localStorage
    async initializeStore() {
      console.log('Initializing blocks store...')
      this.loading = true
      this.error = null
      
      try {
        // Check if we're in the browser
        if (process.client) {
          console.log('Client-side, loading from localStorage')
          const storedBlocks = localStorage.getItem('felipe-os-blocks')
          
          if (storedBlocks) {
            this.blocks = JSON.parse(storedBlocks)
            console.log('Loaded blocks from storage:', this.blocks.length)
          } else {
            console.log('No blocks found in storage')
          }
        } else {
          console.log('Server-side, skipping localStorage')
        }
      } catch (error) {
        console.error('Error loading blocks from storage:', error)
        this.error = 'Failed to load blocks from storage'
      } finally {
        this.loading = false
        console.log('Blocks store initialized, total blocks:', this.blocks.length)
      }
    },

    // Save blocks to localStorage
    async saveToStorage() {
      try {
        if (process.client) {
          console.log('Saving blocks to storage:', this.blocks.length)
          localStorage.setItem('felipe-os-blocks', JSON.stringify(this.blocks))
          console.log('Blocks saved successfully')
        }
      } catch (error) {
        console.error('Error saving blocks to storage:', error)
        this.error = 'Failed to save blocks to storage'
      }
    },

    // Create a new block
    async createBlock(
      blockData: Omit<Block, 'id' | 'completed'>, 
      allowTimeBoundaryOverride = false
    ): Promise<{ 
      success: boolean; 
      errors?: string[]; 
      warnings?: string[];
      requiresOverride?: boolean;
    }> {
      console.log('createBlock called with:', blockData, 'allowOverride:', allowTimeBoundaryOverride)
      this.error = null
      
      // Use enhanced validation with LANDINGCHAT priority and time boundaries
      console.log('Validating block with priority and boundaries against existing blocks:', this.blocks.length)
      const validation = validateBlockWithPriority(this.blocks, blockData, false, allowTimeBoundaryOverride)
      console.log('Enhanced validation result:', validation)
      
      if (!validation.isValid) {
        console.log('Validation failed:', validation.errors)
        return { 
          success: false, 
          errors: validation.errors, 
          warnings: validation.warnings,
          requiresOverride: validation.requiresOverride
        }
      }
      
      // Handle conflict resolution if needed
      if (validation.conflictResolution?.conflictResolution === 'override') {
        console.log('Resolving LANDINGCHAT conflict by moving lower priority blocks')
        
        // Remove conflicting lower priority blocks
        const conflictingIds = validation.conflictResolution.conflictingBlocks?.map((b: Block) => b.id) || []
        this.blocks = this.blocks.filter(block => !conflictingIds.includes(block.id))
        
        console.log('Removed conflicting blocks:', conflictingIds.length)
      }
      
      // Create the block
      const newBlock: Block = {
        ...blockData,
        id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        completed: false
      }
      
      console.log('Creating new block:', newBlock)
      
      this.blocks.push(newBlock)
      await this.saveToStorage()
      
      console.log('Block created successfully, total blocks:', this.blocks.length)
      return { 
        success: true, 
        warnings: validation.warnings?.length ? validation.warnings : undefined 
      }
    },

    // Update an existing block
    async updateBlock(blockId: string, updates: Partial<Omit<Block, 'id'>>): Promise<{ success: boolean; errors?: string[] }> {
      this.error = null
      
      const blockIndex = this.blocks.findIndex(block => block.id === blockId)
      if (blockIndex === -1) {
        return { success: false, errors: ['Block not found'] }
      }
      
      const currentBlock = this.blocks[blockIndex]
      const updatedBlockData = { ...currentBlock, ...updates }
      
      // If updating time/date/description, validate
      if (updates.startTime || updates.endTime || updates.date || updates.description) {
        const validation = validateBlock(
          this.blocks.filter(b => b.id !== blockId), 
          updatedBlockData, 
          true
        )
        if (!validation.isValid) {
          return { success: false, errors: validation.errors }
        }
      }
      
      this.blocks[blockIndex] = updatedBlockData
      await this.saveToStorage()
      
      return { success: true }
    },

    // Delete a block
    async deleteBlock(blockId: string): Promise<{ success: boolean; error?: string }> {
      this.error = null
      
      const blockIndex = this.blocks.findIndex(block => block.id === blockId)
      if (blockIndex === -1) {
        return { success: false, error: 'Block not found' }
      }
      
      this.blocks.splice(blockIndex, 1)
      await this.saveToStorage()
      
      return { success: true }
    },

    // Toggle block completion
    async toggleBlockCompletion(blockId: string): Promise<{ success: boolean; error?: string }> {
      const block = this.blocks.find(b => b.id === blockId)
      if (!block) {
        return { success: false, error: 'Block not found' }
      }
      
      block.completed = !block.completed
      
      // Set actual times when completing
      if (block.completed && !block.actualStartTime) {
        const now = new Date()
        block.actualEndTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      }
      
      await this.saveToStorage()
      return { success: true }
    },

    // Start a block (set actual start time)
    async startBlock(blockId: string): Promise<{ success: boolean; error?: string }> {
      const block = this.blocks.find(b => b.id === blockId)
      if (!block) {
        return { success: false, error: 'Block not found' }
      }
      
      const now = new Date()
      block.actualStartTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      await this.saveToStorage()
      return { success: true }
    },

    // Complete a block (set actual end time and mark as completed)
    async completeBlock(blockId: string): Promise<{ success: boolean; error?: string }> {
      const block = this.blocks.find(b => b.id === blockId)
      if (!block) {
        return { success: false, error: 'Block not found' }
      }
      
      const now = new Date()
      block.actualEndTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      block.completed = true
      
      await this.saveToStorage()
      return { success: true }
    },

    // Get blocks by category
    getBlocksByCategory(category: Category, dateRange?: { start: string; end: string }): Block[] {
      let filteredBlocks = this.blocks.filter(block => block.category === category)
      
      if (dateRange) {
        filteredBlocks = filteredBlocks.filter(block => 
          block.date >= dateRange.start && block.date <= dateRange.end
        )
      }
      
      return filteredBlocks.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })
    },

    // Clear all blocks (for testing/reset)
    async clearAllBlocks(): Promise<void> {
      this.blocks = []
      await this.saveToStorage()
    },

    // Import blocks from backup
    async importBlocks(blocks: Block[]): Promise<{ success: boolean; error?: string }> {
      try {
        // Validate all blocks before importing
        for (const block of blocks) {
          const validation = validateBlock([], block)
          if (!validation.isValid) {
            return { 
              success: false, 
              error: `Invalid block data: ${validation.errors.join(', ')}` 
            }
          }
        }
        
        this.blocks = blocks
        await this.saveToStorage()
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          error: 'Failed to import blocks' 
        }
      }
    },

    // Export blocks for backup
    exportBlocks(): Block[] {
      return [...this.blocks]
    }
  }
})

// Auto-initialize will be handled in the component