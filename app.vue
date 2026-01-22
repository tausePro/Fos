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
    console.log('App initialized successfully')
  } catch (error) {
    console.error('Error initializing app:', error)
  }
})
</script>