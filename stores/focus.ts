import { defineStore } from 'pinia'
import type { Block } from '~/types'
import { getCurrentDate, getCurrentTime, isInRedZone, getRedZoneTimes, getRedZoneStatus } from '~/utils/timeHelpers'

interface FocusState {
  isFocusMode: boolean
  currentBlockId: string | null
  sessionStartTime: string | null
  isPaused: boolean
  pausedAt: string | null
  totalPausedTime: number // in minutes
  cellPhoneMode: boolean
  currentTimestamp: number // For reactivity
}

export const useFocusStore = defineStore('focus', {
  state: (): FocusState => ({
    isFocusMode: false,
    currentBlockId: null,
    sessionStartTime: null,
    isPaused: false,
    pausedAt: null,
    totalPausedTime: 0,
    cellPhoneMode: false,
    currentTimestamp: Date.now()
  }),

  getters: {
    // Get current active block from blocks store
    currentBlock: (state) => {
      if (!state.currentBlockId) return null
      
      const blocksStore = useBlocksStore()
      return blocksStore.blocks.find(block => block.id === state.currentBlockId) || null
    },

    // Check if currently in red zone (cell phone mode)
    isInRedZone: () => {
      const settingsStore = useSettingsStore()
      return isInRedZone(settingsStore.workStartTime)
    },

    // Get red zone times for display
    redZoneTimes: () => {
      const settingsStore = useSettingsStore()
      return getRedZoneTimes(settingsStore.workStartTime)
    },

    // Get comprehensive red zone status
    redZoneStatus: () => {
      const settingsStore = useSettingsStore()
      return getRedZoneStatus(settingsStore.workStartTime)
    },

    // Calculate elapsed time in current session
    elapsedTime: (state) => {
      if (!state.sessionStartTime) return 0
      
      // Use reactive timestamp to ensure updates
      const currentTime = state.currentTimestamp
      const start = new Date(`${getCurrentDate()}T${state.sessionStartTime}:00`)
      
      let elapsed = Math.floor((currentTime - start.getTime()) / (1000 * 60)) // minutes
      
      // Subtract paused time
      elapsed -= state.totalPausedTime
      
      // If currently paused, don't count time since pause
      if (state.isPaused && state.pausedAt) {
        const pauseStart = new Date(`${getCurrentDate()}T${state.pausedAt}:00`)
        const pausedMinutes = Math.floor((currentTime - pauseStart.getTime()) / (1000 * 60))
        elapsed -= pausedMinutes
      }
      
      return Math.max(0, elapsed)
    },

    // Calculate remaining time in current block
    remainingTime: (state) => {
      const block = state.currentBlock
      if (!block) return 0
      
      const blockDurationMinutes = calculateBlockDuration(block.startTime, block.endTime)
      const elapsed = state.elapsedTime
      
      return Math.max(0, blockDurationMinutes - elapsed)
    },

    // Calculate progress percentage
    progressPercentage: (state) => {
      const block = state.currentBlock
      if (!block) return 0
      
      const blockDurationMinutes = calculateBlockDuration(block.startTime, block.endTime)
      const elapsed = state.elapsedTime
      
      return Math.min(100, Math.round((elapsed / blockDurationMinutes) * 100))
    },

    // Check if current block is overdue
    isOverdue: (state) => {
      return state.remainingTime <= 0 && state.isFocusMode
    },

    // Get focus session summary
    sessionSummary: (state) => {
      return {
        isActive: state.isFocusMode,
        currentBlock: state.currentBlock,
        elapsedTime: state.elapsedTime,
        remainingTime: state.remainingTime,
        progress: state.progressPercentage,
        isPaused: state.isPaused,
        isOverdue: state.isOverdue,
        cellPhoneMode: state.cellPhoneMode,
        isInRedZone: state.isInRedZone
      }
    }
  },

  actions: {
    // Initialize focus store
    async initializeStore() {
      try {
        if (process.client) {
          const storedState = localStorage.getItem('felipe-os-focus-state')
          
          if (storedState) {
            const parsed = JSON.parse(storedState)
            
            // Restore state but validate current block still exists
            this.isFocusMode = parsed.isFocusMode || false
            this.currentBlockId = parsed.currentBlockId || null
            this.sessionStartTime = parsed.sessionStartTime || null
            this.isPaused = parsed.isPaused || false
            this.pausedAt = parsed.pausedAt || null
            this.totalPausedTime = parsed.totalPausedTime || 0
            this.cellPhoneMode = parsed.cellPhoneMode || false
            
            // Validate current block still exists
            if (this.currentBlockId) {
              const blocksStore = useBlocksStore()
              const block = blocksStore.blocks.find(b => b.id === this.currentBlockId)
              if (!block) {
                // Block no longer exists, exit focus mode
                await this.exitFocusMode()
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading focus state:', error)
        // Reset to default state on error
        this.$reset()
      }
    },

    // Save state to localStorage
    async saveState() {
      try {
        if (process.client) {
          const state = {
            isFocusMode: this.isFocusMode,
            currentBlockId: this.currentBlockId,
            sessionStartTime: this.sessionStartTime,
            isPaused: this.isPaused,
            pausedAt: this.pausedAt,
            totalPausedTime: this.totalPausedTime,
            cellPhoneMode: this.cellPhoneMode
          }
          localStorage.setItem('felipe-os-focus-state', JSON.stringify(state))
        }
      } catch (error) {
        console.error('Error saving focus state:', error)
      }
    },

    // Start focus mode with a specific block
    async startFocusMode(blockId?: string): Promise<{ success: boolean; error?: string }> {
      const blocksStore = useBlocksStore()
      
      // If no block specified, use current active block or next block
      let targetBlock: Block | undefined
      
      if (blockId) {
        targetBlock = blocksStore.blocks.find(b => b.id === blockId)
      } else {
        // Try to find current active block
        targetBlock = blocksStore.getCurrentActiveBlock
        
        // If no active block, get next upcoming block
        if (!targetBlock) {
          targetBlock = blocksStore.getNextBlock
        }
      }
      
      if (!targetBlock) {
        return { success: false, error: 'No block available to focus on' }
      }
      
      // Start the block if not already started
      if (!targetBlock.actualStartTime) {
        await blocksStore.startBlock(targetBlock.id)
      }
      
      this.isFocusMode = true
      this.currentBlockId = targetBlock.id
      this.sessionStartTime = getCurrentTime()
      this.isPaused = false
      this.pausedAt = null
      this.totalPausedTime = 0
      
      await this.saveState()
      return { success: true }
    },

    // Exit focus mode
    async exitFocusMode(): Promise<void> {
      this.isFocusMode = false
      this.currentBlockId = null
      this.sessionStartTime = null
      this.isPaused = false
      this.pausedAt = null
      this.totalPausedTime = 0
      
      await this.saveState()
    },

    // Pause current focus session
    async pauseSession(): Promise<void> {
      if (!this.isFocusMode || this.isPaused) return
      
      this.isPaused = true
      this.pausedAt = getCurrentTime()
      
      await this.saveState()
    },

    // Resume paused focus session
    async resumeSession(): Promise<void> {
      if (!this.isFocusMode || !this.isPaused || !this.pausedAt) return
      
      // Calculate paused duration and add to total
      const pauseStart = new Date(`${getCurrentDate()}T${this.pausedAt}:00`)
      const now = new Date()
      const pausedMinutes = Math.floor((now.getTime() - pauseStart.getTime()) / (1000 * 60))
      
      this.totalPausedTime += pausedMinutes
      this.isPaused = false
      this.pausedAt = null
      
      await this.saveState()
    },

    // Complete current block and exit focus mode
    async completeCurrentBlock(): Promise<{ success: boolean; error?: string }> {
      if (!this.currentBlockId) {
        return { success: false, error: 'No active block to complete' }
      }
      
      const blocksStore = useBlocksStore()
      const result = await blocksStore.completeBlock(this.currentBlockId)
      
      if (result.success) {
        await this.exitFocusMode()
      }
      
      return result
    },

    // Move to next block in focus mode
    async moveToNextBlock(): Promise<{ success: boolean; error?: string }> {
      const blocksStore = useBlocksStore()
      const nextBlock = blocksStore.getNextBlock
      
      if (!nextBlock) {
        await this.exitFocusMode()
        return { success: false, error: 'No more blocks for today' }
      }
      
      // Complete current block if exists
      if (this.currentBlockId) {
        await blocksStore.completeBlock(this.currentBlockId)
      }
      
      // Start next block
      return await this.startFocusMode(nextBlock.id)
    },

    // Toggle cell phone mode
    async toggleCellPhoneMode(): Promise<void> {
      this.cellPhoneMode = !this.cellPhoneMode
      await this.saveState()
    },

    // Enable cell phone mode
    async enableCellPhoneMode(): Promise<void> {
      this.cellPhoneMode = true
      await this.saveState()
    },

    // Disable cell phone mode
    async disableCellPhoneMode(): Promise<void> {
      this.cellPhoneMode = false
      await this.saveState()
    },

    // Get time until next block
    getTimeUntilNextBlock(): number {
      const blocksStore = useBlocksStore()
      const nextBlock = blocksStore.getNextBlock
      
      if (!nextBlock) return 0
      
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      
      const currentMinutes = timeToMinutes(currentTime)
      const nextBlockMinutes = timeToMinutes(nextBlock.startTime)
      
      return Math.max(0, nextBlockMinutes - currentMinutes)
    },

    // Check if should auto-start next block
    shouldAutoStartNextBlock(): boolean {
      if (this.isFocusMode) return false
      
      const timeUntilNext = this.getTimeUntilNextBlock()
      return timeUntilNext <= 5 // Auto-start if next block is within 5 minutes
    },

    // Update current timestamp for reactivity
    updateTimestamp(): void {
      this.currentTimestamp = Date.now()
    }
  }
})

// Helper functions
function calculateBlockDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  return endMinutes - startMinutes
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Auto-initialize will be handled in the component