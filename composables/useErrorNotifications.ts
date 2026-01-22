// Composable for managing error notifications globally
import type { StorageError } from '~/utils/errorHandling'

interface ErrorNotification {
  id: string
  type: 'quota_exceeded' | 'data_corruption' | 'access_denied' | 'unknown'
  title: string
  message: string
  action: string
  recoverable: boolean
  timestamp: number
}

const notifications = ref<ErrorNotification[]>([])
const currentNotification = ref<ErrorNotification | null>(null)

export const useErrorNotifications = () => {
  
  function showNotification(error: StorageError, context: string = '') {
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

    const notification: ErrorNotification = {
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: error.type,
      title: messages[error.type].title,
      message: messages[error.type].message,
      action: messages[error.type].action,
      recoverable: error.recoverable,
      timestamp: Date.now()
    }

    // Add to notifications list
    notifications.value.push(notification)
    
    // Set as current notification if none is showing
    if (!currentNotification.value) {
      currentNotification.value = notification
    }

    // Auto-remove from list after 30 seconds
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === notification.id)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    }, 30000)

    return notification
  }

  function dismissCurrent() {
    if (currentNotification.value) {
      const currentId = currentNotification.value.id
      
      // Remove from notifications list
      const index = notifications.value.findIndex(n => n.id === currentId)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
      
      // Show next notification if any
      currentNotification.value = notifications.value.length > 0 ? notifications.value[0] : null
    }
  }

  async function retryLastOperation() {
    try {
      // Try to retry saving for all stores that might be using fallback
      const { blocksStore, settingsStore, reviewsStore } = useStores()
      
      const results = await Promise.allSettled([
        blocksStore.retrySave(),
        settingsStore.retrySave ? settingsStore.retrySave() : Promise.resolve({ success: true, message: 'N/A' }),
        // Reviews store doesn't have retrySave, but we can try to reload
        reviewsStore.loadReviews()
      ])

      let successCount = 0
      let errors: string[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const storeNames = ['Bloques', 'Configuración', 'Revisiones']
          if (index < 2 && result.value.success) {
            successCount++
          } else if (index < 2 && !result.value.success) {
            errors.push(`${storeNames[index]}: ${result.value.message}`)
          }
        } else {
          errors.push(`Error en store ${index}: ${result.reason}`)
        }
      })

      if (successCount > 0) {
        showNotification({
          type: 'data_corruption',
          message: `Se sincronizaron ${successCount} stores exitosamente`,
          recoverable: false
        }, 'Retry Operation')
      }

      if (errors.length > 0) {
        showNotification({
          type: 'unknown',
          message: `Algunos stores no se pudieron sincronizar: ${errors.join(', ')}`,
          recoverable: true
        }, 'Retry Operation')
      }

      dismissCurrent()
    } catch (error) {
      console.error('Error in retryLastOperation:', error)
    }
  }

  async function cleanupOldData() {
    try {
      const { blocksStore } = useStores()
      
      const result = await blocksStore.forceCleanup()
      
      if (result.success) {
        showNotification({
          type: 'data_corruption',
          message: result.message,
          recoverable: false
        }, 'Cleanup Operation')
      } else {
        showNotification({
          type: 'unknown',
          message: result.message,
          recoverable: true
        }, 'Cleanup Operation')
      }
    } catch (error) {
      showNotification({
        type: 'unknown',
        message: `Error durante la limpieza: ${error}`,
        recoverable: true
      }, 'Cleanup Operation')
    }

    dismissCurrent()
  }

  function clearAllNotifications() {
    notifications.value = []
    currentNotification.value = null
  }

  // Get storage status for all stores
  async function getGlobalStorageStatus() {
    try {
      const { blocksStore, settingsStore, reviewsStore } = useStores()
      
      const blocksStatus = await blocksStore.getStorageStatus()
      
      return {
        quota: blocksStatus.quota,
        stores: {
          blocks: {
            usingFallback: blocksStatus.usingFallback,
            lastSync: blocksStatus.lastSync,
            canSave: blocksStatus.canSave
          },
          settings: {
            usingFallback: settingsStore.usingFallback,
            canSave: true // Settings are small, usually no issues
          },
          reviews: {
            usingFallback: reviewsStore.usingFallback,
            canSave: blocksStatus.canSave // Same quota applies
          }
        },
        overallHealth: !blocksStatus.usingFallback && !settingsStore.usingFallback && !reviewsStore.usingFallback
      }
    } catch (error) {
      console.error('Error getting global storage status:', error)
      return {
        quota: { available: 0, used: 0, percentage: 0 },
        stores: {
          blocks: { usingFallback: false, lastSync: null, canSave: true },
          settings: { usingFallback: false, canSave: true },
          reviews: { usingFallback: false, canSave: true }
        },
        overallHealth: true
      }
    }
  }

  return {
    // State
    notifications: readonly(notifications),
    currentNotification: readonly(currentNotification),
    
    // Actions
    showNotification,
    dismissCurrent,
    retryLastOperation,
    cleanupOldData,
    clearAllNotifications,
    getGlobalStorageStatus
  }
}