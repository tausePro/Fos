export const useNotifications = () => {
  // Detectar si estamos en Tauri
  const isTauri = process.client && typeof window !== 'undefined' && window.__TAURI__
  
  // Función para enviar notificación nativa
  const sendNotification = async (
    type: 'focus_start' | 'focus_complete' | 'zona_roja' | 'break_time' | 'session_overdue' | 'day_complete',
    customBody?: string
  ) => {
    if (!isTauri) {
      // Fallback a notificación web si no estamos en Tauri
      showWebNotification(type, customBody)
      return
    }
    
    try {
      await window.__TAURI__.core.invoke('send_notification_command', {
        notification_type: type,
        custom_body: customBody
      })
    } catch (error) {
      console.error('Error enviando notificación nativa:', error)
      // Fallback a notificación web
      showWebNotification(type, customBody)
    }
  }

  // Función para solicitar permisos de notificación
  const requestPermissions = async (): Promise<boolean> => {
    if (!isTauri) {
      // Solicitar permisos web
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      }
      return false
    }
    
    try {
      return await window.__TAURI__.core.invoke('request_notification_permissions')
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error)
      return false
    }
  }

  // Fallback para notificaciones web
  const showWebNotification = (
    type: string,
    customBody?: string
  ) => {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones')
      return
    }

    if (Notification.permission !== 'granted') {
      console.warn('Permisos de notificación no otorgados')
      return
    }

    const configs = {
      focus_start: {
        title: 'Felipe OS - Modo Enfoque',
        body: customBody || 'Sesión de enfoque iniciada. ¡A trabajar!',
        icon: '/favicon.ico'
      },
      focus_complete: {
        title: 'Felipe OS - Sesión Completada',
        body: customBody || '¡Excelente trabajo! Sesión de enfoque completada.',
        icon: '/favicon.ico'
      },
      zona_roja: {
        title: 'Felipe OS - Zona Roja Activa',
        body: customBody || 'Estás en zona roja. Modo celular activado.',
        icon: '/favicon.ico'
      },
      break_time: {
        title: 'Felipe OS - Hora del Descanso',
        body: customBody || 'Es momento de tomar un descanso. Relájate un poco.',
        icon: '/favicon.ico'
      },
      session_overdue: {
        title: 'Felipe OS - Sesión Extendida',
        body: customBody || 'Tu sesión se ha extendido más de lo planeado.',
        icon: '/favicon.ico'
      },
      day_complete: {
        title: 'Felipe OS - Día Completado',
        body: customBody || '¡Felicitaciones! Has completado todos tus bloques del día.',
        icon: '/favicon.ico'
      }
    }

    const config = configs[type as keyof typeof configs]
    if (config) {
      new Notification(config.title, {
        body: config.body,
        icon: config.icon
      })
    }
  }

  // Configurar listeners para eventos de notificación desde el backend
  const setupNotificationListeners = () => {
    if (!isTauri) return

    try {
      const { event } = window.__TAURI__

      // Listener para notificaciones enviadas
      event.listen('notification-sent', (event) => {
        console.log('Notificación enviada:', event.payload)
      })

      // Listener para mostrar notificaciones web como fallback
      event.listen('show-web-notification', (event) => {
        const { title, body, priority } = event.payload as any
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.ico'
          })
        }
      })
    } catch (error) {
      console.error('Error configurando listeners de notificación:', error)
    }
  }

  // Métodos de conveniencia para tipos específicos de notificación
  const notifyFocusStart = (blockName?: string) => {
    const customBody = blockName ? `Iniciando enfoque en: ${blockName}` : undefined
    return sendNotification('focus_start', customBody)
  }

  const notifyFocusComplete = (durationMinutes?: number) => {
    const customBody = durationMinutes 
      ? `Sesión completada en ${durationMinutes} minutos. ¡Excelente trabajo!`
      : undefined
    return sendNotification('focus_complete', customBody)
  }

  const notifyZonaRoja = () => {
    return sendNotification('zona_roja')
  }

  const notifyBreakTime = () => {
    return sendNotification('break_time')
  }

  const notifySessionOverdue = (overdueMinutes?: number) => {
    const customBody = overdueMinutes 
      ? `Tu sesión se ha extendido ${overdueMinutes} minutos más de lo planeado.`
      : undefined
    return sendNotification('session_overdue', customBody)
  }

  const notifyDayComplete = (blocksCompleted?: number) => {
    const customBody = blocksCompleted 
      ? `¡Día completado! ${blocksCompleted} bloques realizados exitosamente.`
      : undefined
    return sendNotification('day_complete', customBody)
  }

  // Test notification function
  const testNotification = async () => {
    if (!isTauri) {
      showWebNotification('focus_start', 'Prueba de notificación - ¡Funciona!')
      return
    }
    
    try {
      await window.__TAURI__.core.invoke('test_notification')
    } catch (error) {
      console.error('Error enviando notificación de prueba:', error)
      showWebNotification('focus_start', 'Prueba de notificación - ¡Funciona!')
    }
  }

  return {
    sendNotification,
    requestPermissions,
    setupNotificationListeners,
    notifyFocusStart,
    notifyFocusComplete,
    notifyZonaRoja,
    notifyBreakTime,
    notifySessionOverdue,
    notifyDayComplete,
    testNotification,
    isTauri
  }
}