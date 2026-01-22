<template>
  <div class="app-container">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="main-content">
      <!-- One Thing Section -->
      <section class="content-section">
        <DailyPriority />
      </section>
      
      <!-- Sacred Blocks Section -->
      <section class="content-section">
        <SacredBlocks />
      </section>
      
      <!-- Action Buttons -->
      <section class="content-section">
        <ActionButtons />
      </section>
    </main>
    
    <!-- Focus Mode Overlay -->
    <FocusMode v-if="focusStore.isFocusMode" />
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'Felipe OS - Anti-Procrastination Dashboard',
  meta: [
    { name: 'description', content: 'Personal productivity dashboard for Felipe' }
  ]
})

// Initialize stores using composable
const { focusStore, initializeStores } = useStores()

// Initialize stores on mount
onMounted(async () => {
  console.log('Page mounted, initializing stores...')
  await initializeStores()
  console.log('Stores initialization complete')
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f8fafc;
}

.main-content {
  max-width: 1024px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.content-section {
  margin-bottom: 2rem;
}

.content-section:last-child {
  margin-bottom: 0;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem 0.75rem;
  }
  
  .content-section {
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0.75rem 0.5rem;
  }
  
  .content-section {
    margin-bottom: 1rem;
  }
}
</style>