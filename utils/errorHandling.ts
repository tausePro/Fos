// Error handling utilities for Felipe OS
import type { Block, DailyPriority, ReviewEntry, UserSettings } from '~/types'

export interface StorageError {
  type: 'quota_exceeded' | 'data_corruption' | 'access_denied' | 'unknown'
  message: string
  recoverable: boolean
  data?: any
}

export interface RecoveryResult {
  success: boolean
  recoveredData?: any
  errors?: string[]
  warnings?: string[]
}

// Storage quota management
export class StorageManager {
  private static readonly STORAGE_KEYS = {
    blocks: 'felipe-os-blocks',
    priorities: 'felipe-os-priorities',
    reviews: 'felipe-os-reviews',
    settings: 'felipe-os-settings',
    focus: 'felipe-os-focus-state'
  }

  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit
  private static readonly CLEANUP_THRESHOLD = 0.8 // Clean up when 80% full

  static async checkStorageQuota(): Promise<{ available: number; used: number; percentage: number }> {
    if (!process.client) {
      return { available: 0, used: 0, percentage: 0 }
    }

    try {
      // Estimate storage usage
      let totalSize = 0
      for (const key of Object.values(this.STORAGE_KEYS)) {
        const item = localStorage.getItem(key)
        if (item) {
          totalSize += new Blob([item]).size
        }
      }

      const available = this.MAX_STORAGE_SIZE - totalSize
      const percentage = (totalSize / this.MAX_STORAGE_SIZE) * 100

      return {
        available,
        used: totalSize,
        percentage: Math.round(percentage * 100) / 100
      }
    } catch (error) {
      console.error('Error checking storage quota:', error)
      return { available: 0, used: 0, percentage: 100 }
    }
  }

  static async saveWithQuotaCheck(key: string, data: any): Promise<{ success: boolean; error?: StorageError }> {
    if (!process.client) {
      return { success: false, error: { type: 'access_denied', message: 'Not in client environment', recoverable: false } }
    }

    try {
      const serializedData = JSON.stringify(data)
      const dataSize = new Blob([serializedData]).size
      
      // Check if data would exceed quota
      const quota = await this.checkStorageQuota()
      if (quota.available < dataSize) {
        // Try to clean up old data
        const cleanupResult = await this.cleanupOldData()
        if (!cleanupResult.success) {
          return {
            success: false,
            error: {
              type: 'quota_exceeded',
              message: 'Espacio de almacenamiento insuficiente. Considera exportar datos antiguos.',
              recoverable: true,
              data: { requiredSpace: dataSize, availableSpace: quota.available }
            }
          }
        }
      }

      localStorage.setItem(key, serializedData)
      return { success: true }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        return {
          success: false,
          error: {
            type: 'quota_exceeded',
            message: 'Espacio de almacenamiento lleno. Se requiere limpieza de datos.',
            recoverable: true
          }
        }
      }

      return {
        success: false,
        error: {
          type: 'unknown',
          message: `Error al guardar datos: ${error.message}`,
          recoverable: false
        }
      }
    }
  }

  static async cleanupOldData(): Promise<{ success: boolean; cleanedItems: number; freedSpace: number }> {
    if (!process.client) {
      return { success: false, cleanedItems: 0, freedSpace: 0 }
    }

    try {
      let cleanedItems = 0
      let freedSpace = 0

      // Clean up old reviews (keep only last 90 days)
      const reviewsData = localStorage.getItem(this.STORAGE_KEYS.reviews)
      if (reviewsData) {
        const reviews: ReviewEntry[] = JSON.parse(reviewsData)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - 90)
        
        const originalSize = new Blob([reviewsData]).size
        const filteredReviews = reviews.filter(review => new Date(review.date) >= cutoffDate)
        
        if (filteredReviews.length < reviews.length) {
          const newData = JSON.stringify(filteredReviews)
          localStorage.setItem(this.STORAGE_KEYS.reviews, newData)
          
          cleanedItems += reviews.length - filteredReviews.length
          freedSpace += originalSize - new Blob([newData]).size
        }
      }

      // Clean up old blocks (keep only last 180 days)
      const blocksData = localStorage.getItem(this.STORAGE_KEYS.blocks)
      if (blocksData) {
        const blocks: Block[] = JSON.parse(blocksData)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - 180)
        
        const originalSize = new Blob([blocksData]).size
        const filteredBlocks = blocks.filter(block => new Date(block.date) >= cutoffDate)
        
        if (filteredBlocks.length < blocks.length) {
          const newData = JSON.stringify(filteredBlocks)
          localStorage.setItem(this.STORAGE_KEYS.blocks, newData)
          
          cleanedItems += blocks.length - filteredBlocks.length
          freedSpace += originalSize - new Blob([newData]).size
        }
      }

      return { success: true, cleanedItems, freedSpace }
    } catch (error) {
      console.error('Error during cleanup:', error)
      return { success: false, cleanedItems: 0, freedSpace: 0 }
    }
  }
}

// Data validation and recovery
export class DataRecovery {
  static validateBlocks(data: any): RecoveryResult {
    const errors: string[] = []
    const warnings: string[] = []
    let recoveredData: Block[] = []

    if (!Array.isArray(data)) {
      return {
        success: false,
        errors: ['Los datos de bloques no tienen el formato correcto']
      }
    }

    for (const item of data) {
      try {
        // Validate required fields
        if (!item.id || typeof item.id !== 'string') {
          warnings.push(`Bloque sin ID válido ignorado`)
          continue
        }

        if (!item.date || !item.startTime || !item.endTime || !item.category || !item.description) {
          warnings.push(`Bloque ${item.id} tiene campos faltantes, ignorado`)
          continue
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          warnings.push(`Bloque ${item.id} tiene fecha inválida, ignorado`)
          continue
        }

        // Validate time format
        if (!/^\d{2}:\d{2}$/.test(item.startTime) || !/^\d{2}:\d{2}$/.test(item.endTime)) {
          warnings.push(`Bloque ${item.id} tiene formato de hora inválido, ignorado`)
          continue
        }

        // Validate category
        if (!['LANDINGCHAT', 'ESTUDIO', 'TAUSE', 'OTRO'].includes(item.category)) {
          warnings.push(`Bloque ${item.id} tiene categoría inválida, corrigiendo a OTRO`)
          item.category = 'OTRO'
        }

        // Ensure boolean fields
        item.completed = Boolean(item.completed)

        recoveredData.push(item as Block)
      } catch (error) {
        warnings.push(`Error procesando bloque: ${error}`)
      }
    }

    return {
      success: true,
      recoveredData,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  static validatePriorities(data: any): RecoveryResult {
    const warnings: string[] = []
    let recoveredData: DailyPriority[] = []

    if (!Array.isArray(data)) {
      return {
        success: false,
        errors: ['Los datos de prioridades no tienen el formato correcto']
      }
    }

    for (const item of data) {
      try {
        if (!item.date || !item.text) {
          warnings.push('Prioridad con datos faltantes ignorada')
          continue
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          warnings.push('Prioridad con fecha inválida ignorada')
          continue
        }

        if (item.text.length > 100) {
          warnings.push('Prioridad truncada a 100 caracteres')
          item.text = item.text.substring(0, 100)
        }

        item.completed = Boolean(item.completed)
        recoveredData.push(item as DailyPriority)
      } catch (error) {
        warnings.push(`Error procesando prioridad: ${error}`)
      }
    }

    return {
      success: true,
      recoveredData,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  static validateReviews(data: any): RecoveryResult {
    const warnings: string[] = []
    let recoveredData: ReviewEntry[] = []

    if (!Array.isArray(data)) {
      return {
        success: false,
        errors: ['Los datos de revisiones no tienen el formato correcto']
      }
    }

    for (const item of data) {
      try {
        if (!item.date) {
          warnings.push('Revisión sin fecha ignorada')
          continue
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
          warnings.push('Revisión con fecha inválida ignorada')
          continue
        }

        // Validate and fix ratings
        item.focusRating = Math.max(1, Math.min(5, Number(item.focusRating) || 3))
        item.energyRating = Math.max(1, Math.min(5, Number(item.energyRating) || 3))
        item.completedBlocks = Math.max(0, Number(item.completedBlocks) || 0)
        item.totalBlocks = Math.max(0, Number(item.totalBlocks) || 0)

        // Ensure strings
        item.reflectionNotes = String(item.reflectionNotes || '')
        item.improvements = String(item.improvements || '')

        recoveredData.push(item as ReviewEntry)
      } catch (error) {
        warnings.push(`Error procesando revisión: ${error}`)
      }
    }

    return {
      success: true,
      recoveredData,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  static validateSettings(data: any): RecoveryResult {
    const warnings: string[] = []
    const defaultSettings: UserSettings = {
      workStartTime: '08:00',
      workEndTime: '17:00',
      weekendBlocking: true,
      cellPhoneMode: false
    }

    if (!data || typeof data !== 'object') {
      return {
        success: true,
        recoveredData: defaultSettings,
        warnings: ['Configuración corrupta, usando valores por defecto']
      }
    }

    const recoveredData: UserSettings = { ...defaultSettings }

    // Validate work times
    if (data.workStartTime && /^\d{2}:\d{2}$/.test(data.workStartTime)) {
      recoveredData.workStartTime = data.workStartTime
    } else if (data.workStartTime) {
      warnings.push('Hora de inicio inválida, usando 08:00')
    }

    if (data.workEndTime && /^\d{2}:\d{2}$/.test(data.workEndTime)) {
      recoveredData.workEndTime = data.workEndTime
    } else if (data.workEndTime) {
      warnings.push('Hora de fin inválida, usando 17:00')
    }

    // Validate boolean settings
    if (typeof data.weekendBlocking === 'boolean') {
      recoveredData.weekendBlocking = data.weekendBlocking
    }

    if (typeof data.cellPhoneMode === 'boolean') {
      recoveredData.cellPhoneMode = data.cellPhoneMode
    }

    return {
      success: true,
      recoveredData,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }
}

// User-friendly error messages
export class ErrorNotification {
  static show(error: StorageError, context: string = '') {
    const messages = {
      quota_exceeded: {
        title: '⚠️ Espacio de Almacenamiento Lleno',
        message: 'Felipe OS ha alcanzado el límite de almacenamiento. Se han limpiado datos antiguos automáticamente.',
        action: 'Considera exportar tus datos históricos para liberar espacio.'
      },
      data_corruption: {
        title: '🔧 Datos Recuperados',
        message: 'Se detectaron algunos datos corruptos que fueron reparados automáticamente.',
        action: 'Revisa tus bloques y configuración para asegurar que todo esté correcto.'
      },
      access_denied: {
        title: '🚫 Error de Acceso',
        message: 'No se puede acceder al almacenamiento local.',
        action: 'Verifica que tu navegador permita el almacenamiento local.'
      },
      unknown: {
        title: '❌ Error Inesperado',
        message: error.message || 'Ocurrió un error inesperado.',
        action: 'Si el problema persiste, intenta recargar la página.'
      }
    }

    const notification = messages[error.type]
    
    // Console logging for development
    console.group(`${notification.title} ${context ? `(${context})` : ''}`)
    console.warn(notification.message)
    console.info(notification.action)
    if (error.data) {
      console.debug('Datos adicionales:', error.data)
    }
    console.groupEnd()

    // Try to use the global notification system if available
    if (process.client && window.nuxtApp) {
      try {
        // This will be available after the app is mounted
        const { showNotification } = useErrorNotifications()
        showNotification(error, context)
      } catch (e) {
        // Fallback to console if composable not available
        console.warn('Global notification system not available, using console fallback')
      }
    }

    // Return structured notification for direct use
    return {
      type: error.type,
      title: notification.title,
      message: notification.message,
      action: notification.action,
      recoverable: error.recoverable
    }
  }
}

// Session fallback for when localStorage fails
export class SessionFallback {
  private static sessionData: Map<string, any> = new Map()

  static set(key: string, value: any): void {
    this.sessionData.set(key, value)
  }

  static get(key: string): any {
    return this.sessionData.get(key)
  }

  static remove(key: string): void {
    this.sessionData.delete(key)
  }

  static clear(): void {
    this.sessionData.clear()
  }

  static has(key: string): boolean {
    return this.sessionData.has(key)
  }

  static getAll(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [key, value] of this.sessionData.entries()) {
      result[key] = value
    }
    return result
  }
}