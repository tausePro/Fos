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
    
    <!-- Nightly Review Overlay -->
    <NightlyReview
      v-if="reviewsStore.showNightlyReview"
      :todays-blocks="todaysBlocks"
      :todays-priority="todaysPriority"
      @review-completed="handleReviewCompleted"
      @review-skipped="handleReviewSkipped"
    />
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

// Initialize stores using composable
const { focusStore, blocksStore, reviewsStore, initializeStores } = useStores()

// Get today's data
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