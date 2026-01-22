import { defineStore } from 'pinia'
import type { UserSettings } from '~/types'
import { StorageManager, DataRecovery, ErrorNotification, SessionFallback } from '~/utils/errorHandling'

interface SettingsState extends UserSettings {
  loading: boolean
  error: string | null
  usingFallback: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  workStartTime: '08:00',
  workEndTime: '17:00',
  weekendBlocking: true,
  cellPhoneMode: false
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    ...DEFAULT_SETTINGS,
    loading: false,
    error: null,
    usingFallback: false
  }),

  getters: {
    // Get work hours in minutes
    workStartMinutes: (state) => {
      const [hours, minutes] = state.workStartTime.split(':').map(Number)
      return hours * 60 + minutes
    },

    workEndMinutes: (state) => {
      const [hours, minutes] = state.workEndTime.split(':').map(Number)
      return hours * 60 + minutes
    },

    // Calculate total work hours per day
    totalWorkHours: (state) => {
      const startMinutes = state.workStartMinutes
      const endMinutes = state.workEndMinutes
      const totalMinutes = endMinutes - startMinutes
      return Math.round((totalMinutes / 60) * 10) / 10 // Round to 1 decimal
    },

    // Check if current time is within work hours
    isWithinWorkHours: (state) => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      return currentMinutes >= state.workStartMinutes && currentMinutes <= state.workEndMinutes
    },

    // Get remaining work time for today
    remainingWorkTime: (state) => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      
      if (currentMinutes >= state.workEndMinutes) {
        return { hours: 0, minutes: 0, isAfterWork: true }
      }
      
      if (currentMinutes < state.workStartMinutes) {
        // Before work starts
        const totalWorkMinutes = state.workEndMinutes - state.workStartMinutes
        return {
          hours: Math.floor(totalWorkMinutes / 60),
          minutes: totalWorkMinutes % 60,
          isAfterWork: false
        }
      }
      
      // During work hours
      const remainingMinutes = state.workEndMinutes - currentMinutes
      return {
        hours: Math.floor(remainingMinutes / 60),
        minutes: remainingMinutes % 60,
        isAfterWork: false
      }
    },

    // Check if it's currently a weekend
    isWeekend: () => {
      const now = new Date()
      const day = now.getDay()
      return day === 0 || day === 6 // Sunday or Saturday
    },

    // Check if weekend blocking is active and it's weekend
    isWeekendBlocked: (state) => {
      return state.weekendBlocking && state.isWeekend
    },

    // Get settings summary for display
    settingsSummary: (state) => {
      return {
        workHours: `${state.workStartTime} - ${state.workEndTime}`,
        totalHours: state.totalWorkHours,
        weekendBlocking: state.weekendBlocking,
        cellPhoneMode: state.cellPhoneMode,
        isWithinWorkHours: state.isWithinWorkHours,
        remainingTime: state.remainingWorkTime
      }
    }
  },

  actions: {
    // Initialize settings from localStorage
    async initializeStore() {
      this.loading = true
      this.error = null
      this.usingFallback = false
      
      try {
        if (process.client) {
          const storedSettings = localStorage.getItem('felipe-os-settings')
          
          if (storedSettings) {
            try {
              const rawData = JSON.parse(storedSettings)
              const recovery = DataRecovery.validateSettings(rawData)
              
              if (recovery.success && recovery.recoveredData) {
                // Apply recovered settings
                Object.assign(this, recovery.recoveredData)
                
                if (recovery.warnings?.length) {
                  console.warn('Settings recovery warnings:', recovery.warnings)
                  ErrorNotification.show({
                    type: 'data_corruption',
                    message: `Configuración recuperada con ${recovery.warnings.length} correcciones`,
                    recoverable: true
                  }, 'Settings Store')
                }
              } else {
                console.error('Failed to recover settings:', recovery.errors)
                Object.assign(this, DEFAULT_SETTINGS)
              }
            } catch (parseError) {
              console.error('Failed to parse settings:', parseError)
              Object.assign(this, DEFAULT_SETTINGS)
              ErrorNotification.show({
                type: 'data_corruption',
                message: 'Configuración corrupta, usando valores por defecto',
                recoverable: true
              }, 'Settings Store')
            }
          } else {
            // No settings found, use defaults
            Object.assign(this, DEFAULT_SETTINGS)
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        this.error = 'Failed to load settings'
        
        // Try session fallback
        if (SessionFallback.has('felipe-os-settings')) {
          const fallbackSettings = SessionFallback.get('felipe-os-settings')
          Object.assign(this, fallbackSettings)
          this.usingFallback = true
        } else {
          Object.assign(this, DEFAULT_SETTINGS)
        }
        
        ErrorNotification.show({
          type: 'access_denied',
          message: 'Error al cargar configuración, usando valores por defecto',
          recoverable: true
        }, 'Settings Store')
      } finally {
        this.loading = false
      }
    },

    // Save settings to localStorage
    async saveSettings() {
      try {
        if (process.client) {
          const settings: UserSettings = {
            workStartTime: this.workStartTime,
            workEndTime: this.workEndTime,
            weekendBlocking: this.weekendBlocking,
            cellPhoneMode: this.cellPhoneMode
          }
          
          const saveResult = await StorageManager.saveWithQuotaCheck('felipe-os-settings', settings)
          
          if (saveResult.success) {
            this.error = null
            this.usingFallback = false
          } else {
            this.error = saveResult.error?.message || 'Error al guardar configuración'
            
            // Save to session fallback
            SessionFallback.set('felipe-os-settings', settings)
            this.usingFallback = true
            
            ErrorNotification.show(saveResult.error!, 'Settings Store')
          }
        }
      } catch (error) {
        console.error('Error saving settings:', error)
        this.error = 'Failed to save settings'
        
        // Save to session fallback
        const settings: UserSettings = {
          workStartTime: this.workStartTime,
          workEndTime: this.workEndTime,
          weekendBlocking: this.weekendBlocking,
          cellPhoneMode: this.cellPhoneMode
        }
        SessionFallback.set('felipe-os-settings', settings)
        this.usingFallback = true
        
        ErrorNotification.show({
          type: 'unknown',
          message: `Error al guardar configuración: ${error}`,
          recoverable: true
        }, 'Settings Store')
      }
    },

    // Update work start time
    async updateWorkStartTime(time: string): Promise<{ success: boolean; error?: string }> {
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(time)) {
        return { success: false, error: 'Invalid time format. Use HH:MM format.' }
      }
      
      // Ensure start time is before end time
      const startMinutes = timeToMinutes(time)
      const endMinutes = timeToMinutes(this.workEndTime)
      
      if (startMinutes >= endMinutes) {
        return { success: false, error: 'Start time must be before end time.' }
      }
      
      this.workStartTime = time
      await this.saveSettings()
      return { success: true }
    },

    // Update work end time
    async updateWorkEndTime(time: string): Promise<{ success: boolean; error?: string }> {
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(time)) {
        return { success: false, error: 'Invalid time format. Use HH:MM format.' }
      }
      
      // Ensure end time is after start time
      const startMinutes = timeToMinutes(this.workStartTime)
      const endMinutes = timeToMinutes(time)
      
      if (endMinutes <= startMinutes) {
        return { success: false, error: 'End time must be after start time.' }
      }
      
      // Warn if end time is after 17:00 (5pm)
      if (endMinutes > timeToMinutes('17:00')) {
        console.warn('Work end time is after 5pm - this may affect work-life balance')
      }
      
      this.workEndTime = time
      await this.saveSettings()
      return { success: true }
    },

    // Toggle weekend blocking
    async toggleWeekendBlocking(): Promise<void> {
      this.weekendBlocking = !this.weekendBlocking
      await this.saveSettings()
    },

    // Enable weekend blocking
    async enableWeekendBlocking(): Promise<void> {
      this.weekendBlocking = true
      await this.saveSettings()
    },

    // Disable weekend blocking
    async disableWeekendBlocking(): Promise<void> {
      this.weekendBlocking = false
      await this.saveSettings()
    },

    // Toggle cell phone mode
    async toggleCellPhoneMode(): Promise<void> {
      this.cellPhoneMode = !this.cellPhoneMode
      await this.saveSettings()
      
      // Also update focus store
      const focusStore = useFocusStore()
      if (this.cellPhoneMode) {
        await focusStore.enableCellPhoneMode()
      } else {
        await focusStore.disableCellPhoneMode()
      }
    },

    // Reset to default settings
    async resetToDefaults(): Promise<void> {
      Object.assign(this, DEFAULT_SETTINGS)
      await this.saveSettings()
    },

    // Validate work hours don't conflict with existing blocks
    async validateWorkHoursChange(newStartTime: string, newEndTime: string): Promise<{ 
      isValid: boolean; 
      conflictingBlocks?: any[];
      warnings?: string[] 
    }> {
      const blocksStore = useBlocksStore()
      const startMinutes = timeToMinutes(newStartTime)
      const endMinutes = timeToMinutes(newEndTime)
      
      // Find blocks that would be outside new work hours
      const conflictingBlocks = blocksStore.blocks.filter(block => {
        const blockStartMinutes = timeToMinutes(block.startTime)
        const blockEndMinutes = timeToMinutes(block.endTime)
        
        return blockStartMinutes < startMinutes || blockEndMinutes > endMinutes
      })
      
      const warnings: string[] = []
      
      if (endMinutes > timeToMinutes('17:00')) {
        warnings.push('Work end time is after 5pm - consider work-life balance')
      }
      
      if (endMinutes - startMinutes > 9 * 60) { // More than 9 hours
        warnings.push('Work day is longer than 9 hours - consider shorter days')
      }
      
      return {
        isValid: conflictingBlocks.length === 0,
        conflictingBlocks: conflictingBlocks.length > 0 ? conflictingBlocks : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      }
    },

    // Get time until work starts (if before work hours)
    getTimeUntilWorkStarts(): number {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      
      if (currentMinutes >= this.workStartMinutes) {
        return 0 // Work has already started
      }
      
      return this.workStartMinutes - currentMinutes
    },

    // Check if time is valid for scheduling
    isValidSchedulingTime(time: string, date?: string): { 
      isValid: boolean; 
      reason?: string 
    } {
      const timeMinutes = timeToMinutes(time)
      
      // Check work hours
      if (timeMinutes < this.workStartMinutes || timeMinutes > this.workEndMinutes) {
        return {
          isValid: false,
          reason: `Time is outside work hours (${this.workStartTime} - ${this.workEndTime})`
        }
      }
      
      // Check weekend blocking if date provided
      if (date && this.weekendBlocking) {
        const dateObj = new Date(date + 'T00:00:00')
        const day = dateObj.getDay()
        if (day === 0 || day === 6) {
          return {
            isValid: false,
            reason: 'Weekend blocking is enabled'
          }
        }
      }
      
      return { isValid: true }
    },

    // Retry saving with fallback recovery
    async retrySave(): Promise<{ success: boolean; message: string }> {
      if (this.usingFallback) {
        try {
          const settings: UserSettings = {
            workStartTime: this.workStartTime,
            workEndTime: this.workEndTime,
            weekendBlocking: this.weekendBlocking,
            cellPhoneMode: this.cellPhoneMode
          }
          
          const saveResult = await StorageManager.saveWithQuotaCheck('felipe-os-settings', settings)
          
          if (saveResult.success) {
            this.usingFallback = false
            this.error = null
            return {
              success: true,
              message: 'Configuración sincronizada exitosamente'
            }
          } else {
            return {
              success: false,
              message: saveResult.error?.message || 'No se pudo sincronizar la configuración'
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
          message: 'La configuración ya está sincronizada'
        }
      }
    }
  }
})

// Helper function
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Auto-initialize will be handled in the component