import { defineStore } from 'pinia'
import type { Block, Category } from '~/types'
import { VALIDATION_RULES } from '~/types'
import { validateBlock, validateBlockWithPriority } from '~/utils/validationHelpers'
import { getCurrentDate } from '~/utils/timeHelpers'
import { StorageManager, DataRecovery, ErrorNotification, SessionFallback } from '~/utils/errorHandling'

interface BlocksState {
  blocks: Block[]
  loading: boolean
  error: string | null
  usingFallback: boolean
  lastSyncTime: string | null
}

export const useBlocksStore = defineStore('blocks', {
  state: (): BlocksState => ({
    blocks: [],
    loading: false,
    error: null,
    usingFallback: false,
    lastSyncTime: null
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
      const { startLoading } = useLoading()
      const loading = startLoading('blocks-init', 'Cargando bloques...')
      
      this.loading = true
      this.error = null
      this.usingFallback = false
      
      try {
        if (process.client) {
          console.log('Client-side, loading from localStorage')
          
          // Check storage quota first
          loading.updateMessage('Verificando espacio de almacenamiento...')
          const quota = await StorageManager.checkStorageQuota()
          console.log('Storage quota:', quota)
          
          if (quota.percentage > 90) {
            console.warn('Storage nearly full, attempting cleanup...')
            loading.updateMessage('Limpiando datos antiguos...')
            const cleanup = await StorageManager.cleanupOldData()
            if (cleanup.success) {
              console.log(`Cleaned up ${cleanup.cleanedItems} items, freed ${cleanup.freedSpace} bytes`)
            }
          }
          
          loading.updateMessage('Cargando datos de bloques...')
          const storedBlocks = localStorage.getItem('felipe-os-blocks')
          
          if (storedBlocks) {
            try {
              const rawData = JSON.parse(storedBlocks)
              loading.updateMessage('Validando datos...')
              const recovery = DataRecovery.validateBlocks(rawData)
              
              if (recovery.success) {
                this.blocks = recovery.recoveredData || []
                console.log('Loaded blocks from storage:', this.blocks.length)
                
                if (recovery.warnings?.length) {
                  console.warn('Data recovery warnings:', recovery.warnings)
                  ErrorNotification.show({
                    type: 'data_corruption',
                    message: `Se recuperaron ${this.blocks.length} bloques con ${recovery.warnings.length} advertencias`,
                    recoverable: true
                  }, 'Blocks Store')
                }
              } else {
                console.error('Failed to recover blocks data:', recovery.errors)
                this.error = 'Error al recuperar datos de bloques'
                this.blocks = []
              }
            } catch (parseError) {
              console.error('Failed to parse blocks data:', parseError)
              ErrorNotification.show({
                type: 'data_corruption',
                message: 'Datos de bloques corruptos, iniciando con datos vacíos',
                recoverable: false
              }, 'Blocks Store')
              this.blocks = []
            }
          } else {
            console.log('No blocks found in storage')
            this.blocks = []
          }
          
          this.lastSyncTime = new Date().toISOString()
        } else {
          console.log('Server-side, skipping localStorage')
        }
      } catch (error) {
        console.error('Error loading blocks from storage:', error)
        this.error = 'Failed to load blocks from storage'
        
        // Try to use session fallback
        if (SessionFallback.has('felipe-os-blocks')) {
          console.log('Using session fallback data')
          this.blocks = SessionFallback.get('felipe-os-blocks') || []
          this.usingFallback = true
        } else {
          this.blocks = []
        }
        
        ErrorNotification.show({
          type: 'access_denied',
          message: 'No se puede acceder al almacenamiento, usando datos de sesión',
          recoverable: true
        }, 'Blocks Store')
      } finally {
        this.loading = false
        loading.finish()
        console.log('Blocks store initialized, total blocks:', this.blocks.length)
      }
    },

    // Save blocks to localStorage
    async saveToStorage() {
      try {
        if (process.client) {
          console.log('Saving blocks to storage:', this.blocks.length)
          
          const saveResult = await StorageManager.saveWithQuotaCheck('felipe-os-blocks', this.blocks)
          
          if (saveResult.success) {
            console.log('Blocks saved successfully')
            this.lastSyncTime = new Date().toISOString()
            this.error = null
            this.usingFallback = false
          } else {
            console.error('Failed to save blocks:', saveResult.error)
            this.error = saveResult.error?.message || 'Error al guardar bloques'
            
            // Save to session fallback
            SessionFallback.set('felipe-os-blocks', this.blocks)
            this.usingFallback = true
            
            ErrorNotification.show(saveResult.error!, 'Blocks Store')
          }
        }
      } catch (error) {
        console.error('Error saving blocks to storage:', error)
        this.error = 'Failed to save blocks to storage'
        
        // Always save to session fallback as last resort
        SessionFallback.set('felipe-os-blocks', this.blocks)
        this.usingFallback = true
        
        ErrorNotification.show({
          type: 'unknown',
          message: `Error inesperado al guardar: ${error}`,
          recoverable: true
        }, 'Blocks Store')
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
        
        // Re-validate daily limit after removing conflicting blocks
        const dailyBlocksAfterRemoval = this.blocks.filter(b => b.date === blockData.date)
        if (dailyBlocksAfterRemoval.length >= VALIDATION_RULES.MAX_BLOCKS_PER_DAY) {
          console.log('Daily limit reached after removing conflicting blocks')
          return {
            success: false,
            errors: [`Maximum ${VALIDATION_RULES.MAX_BLOCKS_PER_DAY} blocks allowed per day`],
            warnings: validation.warnings
          }
        }
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
    completeBlock(blockId: string): { success: boolean; error?: string } {
      console.log('completeBlock called with blockId:', blockId)
      const block = this.blocks.find(b => b.id === blockId)
      if (!block) {
        console.error('Block not found:', blockId)
        return { success: false, error: 'Block not found' }
      }
      
      console.log('Block found:', block)
      const now = new Date()
      block.actualEndTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      block.completed = true
      
      console.log('Block updated:', block)
      
      try {
        this.saveToStorage()
        console.log('saveToStorage completed successfully')
        return { success: true }
      } catch (error) {
        console.error('Error in saveToStorage:', error)
        return { success: false, error: `Error saving: ${error.message}` }
      }
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
    },

    // Get storage status for user information
    async getStorageStatus(): Promise<{
      quota: { available: number; used: number; percentage: number }
      usingFallback: boolean
      lastSync: string | null
      canSave: boolean
    }> {
      const quota = await StorageManager.checkStorageQuota()
      return {
        quota,
        usingFallback: this.usingFallback,
        lastSync: this.lastSyncTime,
        canSave: quota.percentage < 95
      }
    },

    // Force cleanup of old data
    async forceCleanup(): Promise<{ success: boolean; message: string }> {
      try {
        const cleanup = await StorageManager.cleanupOldData()
        if (cleanup.success) {
          return {
            success: true,
            message: `Limpieza completada: ${cleanup.cleanedItems} elementos eliminados, ${Math.round(cleanup.freedSpace / 1024)}KB liberados`
          }
        } else {
          return {
            success: false,
            message: 'No se pudo completar la limpieza automática'
          }
        }
      } catch (error) {
        return {
          success: false,
          message: `Error durante la limpieza: ${error}`
        }
      }
    },

    // Retry saving with fallback options
    async retrySave(): Promise<{ success: boolean; message: string }> {
      if (this.usingFallback) {
        try {
          // Try to save from session fallback to localStorage
          const saveResult = await StorageManager.saveWithQuotaCheck('felipe-os-blocks', this.blocks)
          
          if (saveResult.success) {
            this.usingFallback = false
            this.lastSyncTime = new Date().toISOString()
            this.error = null
            return {
              success: true,
              message: 'Datos sincronizados exitosamente con el almacenamiento local'
            }
          } else {
            return {
              success: false,
              message: saveResult.error?.message || 'No se pudo sincronizar con el almacenamiento local'
            }
          }
        } catch (error) {
          return {
            success: false,
            message: `Error al reintentar guardado: ${error}`
          }
        }
      } else {
        return {
          success: true,
          message: 'Los datos ya están sincronizados'
        }
      }
    },

    // Validate current data integrity
    async validateDataIntegrity(): Promise<{ isValid: boolean; issues: string[]; fixed: number }> {
      const issues: string[] = []
      let fixed = 0

      // Check for duplicate IDs
      const ids = new Set()
      const duplicates: Block[] = []
      
      for (const block of this.blocks) {
        if (ids.has(block.id)) {
          duplicates.push(block)
        } else {
          ids.add(block.id)
        }
      }

      if (duplicates.length > 0) {
        issues.push(`${duplicates.length} bloques duplicados encontrados`)
        // Remove duplicates
        this.blocks = this.blocks.filter((block, index, arr) => 
          arr.findIndex(b => b.id === block.id) === index
        )
        fixed += duplicates.length
      }

      // Check for invalid dates
      const invalidDates = this.blocks.filter(block => 
        !/^\d{4}-\d{2}-\d{2}$/.test(block.date)
      )

      if (invalidDates.length > 0) {
        issues.push(`${invalidDates.length} bloques con fechas inválidas`)
      }

      // Check for invalid times
      const invalidTimes = this.blocks.filter(block => 
        !/^\d{2}:\d{2}$/.test(block.startTime) || !/^\d{2}:\d{2}$/.test(block.endTime)
      )

      if (invalidTimes.length > 0) {
        issues.push(`${invalidTimes.length} bloques con horarios inválidos`)
      }

      // Save if we fixed anything
      if (fixed > 0) {
        await this.saveToStorage()
      }

      return {
        isValid: issues.length === 0,
        issues,
        fixed
      }
    }
  }
})

// Auto-initialize will be handled in the component