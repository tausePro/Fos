export const useSystemTray = () => {
  const router = useRouter()
  
  // Detectar si estamos en Tauri de forma segura
  const isTauri = process.client && typeof window !== 'undefined' && window.__TAURI__
  
  // Solo acceder a stores si estamos en el cliente
  const getStores = () => {
    if (process.client) {
      return useStores()
    }
    return null
  }

  // Función para actualizar el status del tray desde el frontend
  const updateTrayStatus = async (status: 'Inactive' | 'Active' | 'ZonaRoja' | 'Break') => {
    if (!isTauri) return
    
    try {
      // Usar la API de Tauri directamente desde window.__TAURI__
      await window.__TAURI__.core.invoke('update_tray_status', { status })
    } catch (error) {
      console.error('Error actualizando status del tray:', error)
    }
  }

  // Configurar listeners para eventos del system tray
  const setupTrayListeners = async () => {
    if (!isTauri) return

    const stores = getStores()
    if (!stores) return

    const { focusStore } = stores

    try {
      // Usar la API de eventos de Tauri directamente
      const { event } = window.__TAURI__

      // Listener para toggle focus mode
      await event.listen('menu-focus-toggle', () => {
        console.log('Toggle focus mode desde system tray')
        if (focusStore.isActive) {
          focusStore.stopFocus()
        } else {
          focusStore.startFocus()
        }
      })

      // Listener para zona roja
      await event.listen('menu-zona-roja', () => {
        console.log('Zona roja desde system tray')
        focusStore.startZonaRoja()
      })

      // Listener para tomar descanso
      await event.listen('menu-take-break', () => {
        console.log('Tomar descanso desde system tray')
        focusStore.takeBreak()
      })

      // Listener para navegar a configuración
      await event.listen('navigate-to-settings', () => {
        console.log('Navegar a configuración desde system tray')
        router.push('/settings')
      })

      // Listener para cambios de status del tray
      await event.listen('tray-status-changed', (event) => {
        console.log('Status del tray cambió:', event.payload)
      })

      // Listener para actualizaciones de status del tray
      await event.listen('tray-status-updated', (event) => {
        console.log('Status del tray actualizado:', event.payload)
      })
    } catch (error) {
      console.error('Error configurando listeners del tray:', error)
    }
  }

  // Función para sincronizar el status del tray con el estado actual del focus
  const syncTrayWithFocusState = () => {
    if (!isTauri) return

    const stores = getStores()
    if (!stores) return

    const { focusStore } = stores
    const status = focusStore.getCurrentTrayStatus()
    updateTrayStatus(status)
  }

  // Configurar watchers para sincronización automática
  const setupAutoSync = () => {
    if (!isTauri) return

    const stores = getStores()
    if (!stores) return

    const { focusStore } = stores

    // Watch para cambios en el estado de focus
    watch(() => focusStore.isFocusMode, () => {
      syncTrayWithFocusState()
    })

    // Watch para cambios en el estado de pausa
    watch(() => focusStore.isPaused, () => {
      syncTrayWithFocusState()
    })

    // Watch para cambios en el modo celular
    watch(() => focusStore.cellPhoneMode, () => {
      syncTrayWithFocusState()
    })

    // Watch para cambios en zona roja (cada minuto)
    const checkRedZone = () => {
      const currentStatus = focusStore.getCurrentTrayStatus()
      updateTrayStatus(currentStatus)
    }

    // Verificar zona roja cada minuto
    setInterval(checkRedZone, 60000)
  }

  return {
    updateTrayStatus,
    setupTrayListeners,
    syncTrayWithFocusState,
    setupAutoSync,
    isTauri
  }
}