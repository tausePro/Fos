<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <NuxtPage />
  </div>
</template>

<script setup>
// Initialize stores when the app starts
const { initializeStores } = useStores()

onMounted(async () => {
  try {
    await initializeStores()
    
    // Inicializar system tray si estamos en Tauri
    const { setupTrayListeners, syncTrayWithFocusState, setupAutoSync, isTauri } = useSystemTray()
    
    if (isTauri) {
      await setupTrayListeners()
      setupAutoSync()
      syncTrayWithFocusState()
      console.log('System tray initialized with auto-sync')
      
      // Inicializar notificaciones
      const { setupNotificationListeners, requestPermissions } = useNotifications()
      setupNotificationListeners()
      
      // Solicitar permisos de notificación
      try {
        const granted = await requestPermissions()
        console.log('Notification permissions:', granted ? 'granted' : 'denied')
      } catch (error) {
        console.error('Error requesting notification permissions:', error)
      }
      
      console.log('Notifications initialized')
    } else {
      console.log('Running in web mode - system tray and native notifications disabled')
    }
    
    console.log('App initialized successfully')
  } catch (error) {
    console.error('Error initializing app:', error)
  }
})
</script>