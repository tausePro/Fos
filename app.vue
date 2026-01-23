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
    } else {
      console.log('Running in web mode - system tray disabled')
    }
    
    console.log('App initialized successfully')
  } catch (error) {
    console.error('Error initializing app:', error)
  }
})
</script>