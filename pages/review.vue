<template>
  <div class="app-container">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="main-content">
      <div class="reviews-page">
        <div class="page-header">
          <h1>Historial de Revisiones</h1>
          <NuxtLink to="/" class="back-btn">
            ← Volver al Dashboard
          </NuxtLink>
        </div>

        <!-- Weekly Stats -->
        <div class="stats-section">
          <h2>Estadísticas de la Semana</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-content">
                <div class="stat-value">{{ weeklyStats.averageFocus }}/5</div>
                <div class="stat-label">Enfoque Promedio</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">⚡</div>
              <div class="stat-content">
                <div class="stat-value">{{ weeklyStats.averageEnergy }}/5</div>
                <div class="stat-label">Energía Promedio</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">✅</div>
              <div class="stat-content">
                <div class="stat-value">{{ weeklyStats.completionRate }}%</div>
                <div class="stat-label">Tasa de Completación</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">{{ weeklyStats.reviewCount }}/7</div>
                <div class="stat-label">Revisiones Completadas</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div class="reviews-section">
          <h2>Revisiones Recientes</h2>
          
          <div v-if="recentReviews.length === 0" class="empty-state">
            <div class="empty-icon">🌙</div>
            <h3>No hay revisiones aún</h3>
            <p>Las revisiones nocturnas aparecerán aquí después de las 8pm</p>
          </div>

          <div v-else class="reviews-list">
            <div
              v-for="review in recentReviews"
              :key="review.date"
              class="review-card"
            >
              <div class="review-header">
                <div class="review-date">
                  {{ formatDateForDisplay(review.date) }}
                </div>
                <div class="review-completion">
                  {{ review.completedBlocks }}/{{ review.totalBlocks }} bloques
                </div>
              </div>

              <div class="review-ratings">
                <div class="rating-item">
                  <span class="rating-label">Enfoque:</span>
                  <div class="rating-stars">
                    <span v-for="star in 5" :key="`focus-${star}`" class="star">
                      {{ star <= review.focusRating ? '⭐' : '☆' }}
                    </span>
                  </div>
                </div>
                <div class="rating-item">
                  <span class="rating-label">Energía:</span>
                  <div class="rating-stars">
                    <span v-for="star in 5" :key="`energy-${star}`" class="star">
                      {{ star <= review.energyRating ? '⚡' : '☆' }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="review.reflectionNotes" class="review-notes">
                <h4>Lo que funcionó bien:</h4>
                <p>{{ review.reflectionNotes }}</p>
              </div>

              <div v-if="review.improvements" class="review-improvements">
                <h4>Áreas de mejora:</h4>
                <p>{{ review.improvements }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { formatDateForDisplay } from '~/utils/timeHelpers'

// Page metadata
useHead({
  title: 'Historial de Revisiones - Felipe OS',
  meta: [
    { name: 'description', content: 'Historial de revisiones nocturnas y estadísticas de productividad' }
  ]
})

// Initialize stores
const { reviewsStore, initializeStores } = useStores()

// Computed properties
const weeklyStats = computed(() => reviewsStore.getWeeklyStats)
const recentReviews = computed(() => {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const startDate = thirtyDaysAgo.toISOString().split('T')[0]
  const endDate = new Date().toISOString().split('T')[0]
  
  return reviewsStore.getReviewsByDateRange(startDate, endDate)
})

// Initialize on mount
onMounted(async () => {
  await initializeStores()
})
</script>

<style scoped>
.reviews-page {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.back-btn {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
}

.stats-section {
  margin-bottom: 3rem;
}

.stats-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
  line-height: 1;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.reviews-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #64748b;
  margin: 0;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.review-date {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.review-completion {
  font-size: 0.875rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.review-ratings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.rating-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  min-width: 60px;
}

.rating-stars {
  display: flex;
  gap: 0.125rem;
}

.star {
  font-size: 0.875rem;
}

.review-notes,
.review-improvements {
  margin-bottom: 1rem;
}

.review-notes:last-child,
.review-improvements:last-child {
  margin-bottom: 0;
}

.review-notes h4,
.review-improvements h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.review-notes p,
.review-improvements p {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  background: #f9fafb;
  padding: 0.75rem;
  border-radius: 8px;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .review-ratings {
    grid-template-columns: 1fr;
  }
  
  .review-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
}
</style>