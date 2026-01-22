<template>
  <div class="app-container">
    <!-- Loading State -->
    <div v-if="isInitializing" class="loading-container">
      <LoadingSpinner 
        size="large" 
        message="Inicializando Felipe OS..." 
        variant="inline"
      />
    </div>
    
    <!-- Main App Content -->
    <div v-else>
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
      
      <!-- Nightly Review Overlay -->
      <NightlyReview
        v-if="reviewsStore.showNightlyReview"
        :todays-blocks="todaysBlocks"
        :todays-priority="todaysPriority"
        @review-completed="handleReviewCompleted"
        @review-skipped="handleReviewSkipped"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewEntry } from '~/types'
import { getCurrentDate } from '~/utils/timeHelpers'

// Page metadata
useHead({
  title: 'Felipe OS - Anti-Procrastination Dashboard',
  meta: [
    { name: 'description', content: 'Personal productivity dashboard for Felipe' }
  ]
})

// Stores (already initialized by app.vue)
const { focusStore, blocksStore, reviewsStore } = useStores()

// Loading state
const isInitializing = ref(true)

// Get today's data (computed to be reactive)
const today = getCurrentDate()
const todaysBlocks = computed(() => blocksStore.getBlocksByDate(today))
const todaysPriority = computed(() => {
  try {
    if (process.client) {
      const stored = localStorage.getItem('felipe-os-priorities')
      if (stored) {
        const priorities = JSON.parse(stored)
        return priorities.find((p: any) => p.date === today) || null
      }
    }
  } catch (error) {
    console.error('Error loading today\'s priority:', error)
  }
  return null
})

// Review handlers
async function handleReviewCompleted(review: ReviewEntry) {
  const result = await reviewsStore.saveReview(review)
  
  if (result.success) {
    console.log('Review saved successfully')
  } else {
    alert(`Error al guardar la revisión: ${result.error}`)
  }
}

function handleReviewSkipped() {
  reviewsStore.dismissNightlyReview()
}

// Wait for stores to be ready
onMounted(async () => {
  // Wait a bit to ensure stores are initialized
  await nextTick()
  
  // Check if stores are ready
  const checkStoresReady = () => {
    return !blocksStore.loading && !reviewsStore.error
  }
  
  // Wait for stores to be ready or timeout after 3 seconds
  const maxWait = 3000
  const startTime = Date.now()
  
  while (!checkStoresReady() && (Date.now() - startTime) < maxWait) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  isInitializing.value = false
  console.log('Page ready, stores initialized')
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f8fafc;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
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

/* Performance optimizations */
.content-section {
  contain: layout style;
}

/* Reduce layout shifts */
.app-container {
  contain: layout;
}
</style>