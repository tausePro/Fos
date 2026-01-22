<template>
  <div class="app-container">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="main-content">
      <div class="analytics-dashboard">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <h1>Dashboard de Analytics</h1>
            <NuxtLink to="/" class="back-btn">
              ← Dashboard
            </NuxtLink>
          </div>
          <p class="page-subtitle">
            Análisis de tu productividad y patrones de trabajo
          </p>
        </div>

        <!-- Overview Stats -->
        <div class="overview-section">
          <h2>Resumen General</h2>
          <div class="overview-grid">
            <div class="overview-card primary">
              <div class="card-icon">📊</div>
              <div class="card-content">
                <div class="card-value">{{ allTimeStats.completionRate }}%</div>
                <div class="card-label">Tasa de Completación</div>
                <div class="card-detail">{{ allTimeStats.completedBlocks }}/{{ allTimeStats.totalBlocks }} bloques</div>
              </div>
            </div>
            
            <div class="overview-card success">
              <div class="card-icon">🔥</div>
              <div class="card-content">
                <div class="card-value">{{ streakData.currentStreak }}</div>
                <div class="card-label">Racha Actual</div>
                <div class="card-detail">Días consecutivos</div>
              </div>
            </div>
            
            <div class="overview-card info">
              <div class="card-icon">📅</div>
              <div class="card-content">
                <div class="card-value">{{ allTimeStats.averageBlocksPerDay }}</div>
                <div class="card-label">Promedio Diario</div>
                <div class="card-detail">Bloques por día</div>
              </div>
            </div>
            
            <div class="overview-card warning">
              <div class="card-icon">⭐</div>
              <div class="card-content">
                <div class="card-value">{{ streakData.longestStreak }}</div>
                <div class="card-label">Mejor Racha</div>
                <div class="card-detail">Días consecutivos</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Current Week Stats -->
        <div class="week-section">
          <h2>Esta Semana</h2>
          <div class="week-grid">
            <div class="week-card">
              <div class="week-header">
                <h3>Bloques</h3>
                <div class="week-percentage">{{ currentWeekStats.completionRate }}%</div>
              </div>
              <div class="week-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${currentWeekStats.completionRate}%` }"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ currentWeekStats.completedBlocks }}/{{ currentWeekStats.totalBlocks }} completados
                </div>
              </div>
            </div>
            
            <div class="week-card">
              <div class="week-header">
                <h3>Prioridades</h3>
                <div class="week-percentage">{{ currentWeekStats.priorityCompletionRate }}%</div>
              </div>
              <div class="week-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill priority" 
                    :style="{ width: `${currentWeekStats.priorityCompletionRate}%` }"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ currentWeekStats.completedPriorities }}/{{ currentWeekStats.totalPriorities }} completadas
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Analysis -->
        <div class="category-section">
          <h2>Análisis por Categoría</h2>
          <div class="category-grid">
            <div
              v-for="category in categoryStats"
              :key="category.category"
              :class="['category-card', `category-${category.category.toLowerCase()}`]"
            >
              <div class="category-header">
                <div class="category-name">{{ category.category }}</div>
                <div class="category-rate">{{ category.completionRate }}%</div>
              </div>
              <div class="category-stats">
                <div class="stat-item">
                  <span class="stat-label">Bloques:</span>
                  <span class="stat-value">{{ category.completedBlocks }}/{{ category.totalBlocks }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Tiempo:</span>
                  <span class="stat-value">{{ Math.round(category.completedMinutes / 60) }}h</span>
                </div>
              </div>
              <div class="category-progress">
                <div class="progress-bar small">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${category.completionRate}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Productive Time Analysis -->
        <div class="time-section">
          <h2>Horarios Más Productivos</h2>
          <div class="time-slots">
            <div
              v-for="slot in productiveTimeSlots.slice(0, 6)"
              :key="slot.hour"
              class="time-slot"
            >
              <div class="time-label">{{ slot.label }}</div>
              <div class="time-bar">
                <div 
                  class="time-fill" 
                  :style="{ 
                    width: `${slot.completionRate}%`,
                    backgroundColor: getTimeSlotColor(slot.completionRate)
                  }"
                ></div>
              </div>
              <div class="time-stats">
                <span class="time-rate">{{ slot.completionRate }}%</span>
                <span class="time-count">({{ slot.totalBlocks }} bloques)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Trends -->
        <div class="trends-section">
          <h2>Tendencias Semanales</h2>
          <div class="trends-chart">
            <div class="chart-container">
              <div
                v-for="week in weeklyTrends"
                :key="week.period"
                class="trend-bar"
              >
                <div class="trend-label">{{ week.period }}</div>
                <div class="trend-column">
                  <div 
                    class="trend-fill" 
                    :style="{ 
                      height: `${Math.max(week.completionRate, 5)}%`,
                      backgroundColor: getTrendColor(week.completionRate)
                    }"
                  ></div>
                </div>
                <div class="trend-value">{{ week.completionRate }}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Focus & Energy Correlation -->
        <div v-if="focusEnergyData.totalReviews > 0" class="focus-section">
          <h2>Enfoque y Energía</h2>
          <div class="focus-grid">
            <div class="focus-card">
              <div class="focus-icon">🎯</div>
              <div class="focus-content">
                <div class="focus-value">{{ focusEnergyData.averageFocus }}/5</div>
                <div class="focus-label">Enfoque Promedio</div>
              </div>
            </div>
            
            <div class="focus-card">
              <div class="focus-icon">⚡</div>
              <div class="focus-content">
                <div class="focus-value">{{ focusEnergyData.averageEnergy }}/5</div>
                <div class="focus-label">Energía Promedio</div>
              </div>
            </div>
            
            <div class="focus-card correlation">
              <div class="focus-icon">📈</div>
              <div class="focus-content">
                <div class="focus-value">{{ focusEnergyData.correlation }}</div>
                <div class="focus-label">Estado General</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="actions-section">
          <h2>Acciones Rápidas</h2>
          <div class="actions-grid">
            <NuxtLink to="/week" class="action-card">
              <div class="action-icon">📅</div>
              <div class="action-content">
                <div class="action-title">Vista Semanal</div>
                <div class="action-description">Ver progreso día a día</div>
              </div>
            </NuxtLink>
            
            <NuxtLink to="/review" class="action-card">
              <div class="action-icon">🌙</div>
              <div class="action-content">
                <div class="action-title">Historial de Reviews</div>
                <div class="action-description">Revisiones nocturnas</div>
              </div>
            </NuxtLink>
            
            <NuxtLink to="/" class="action-card">
              <div class="action-icon">🏠</div>
              <div class="action-content">
                <div class="action-title">Dashboard Principal</div>
                <div class="action-description">Volver al inicio</div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Page metadata
useHead({
  title: 'Analytics Dashboard - Felipe OS',
  meta: [
    { name: 'description', content: 'Dashboard de analytics y estadísticas de productividad en Felipe OS' }
  ]
})

// Initialize stores
const { analyticsStore, initializeStores } = useStores()

// Computed properties from analytics store
const allTimeStats = computed(() => analyticsStore.allTimeStats)
const categoryStats = computed(() => analyticsStore.categoryStats)
const weeklyTrends = computed(() => analyticsStore.weeklyTrends)
const productiveTimeSlots = computed(() => analyticsStore.productiveTimeSlots)
const currentWeekStats = computed(() => analyticsStore.currentWeekStats)
const streakData = computed(() => analyticsStore.streakData)
const focusEnergyData = computed(() => analyticsStore.focusEnergyCorrelation)

// Helper functions
function getTimeSlotColor(rate: number): string {
  if (rate >= 80) return '#10b981' // Green
  if (rate >= 60) return '#3b82f6' // Blue
  if (rate >= 40) return '#f59e0b' // Orange
  return '#ef4444' // Red
}

function getTrendColor(rate: number): string {
  if (rate >= 75) return '#10b981' // Green
  if (rate >= 50) return '#3b82f6' // Blue
  if (rate >= 25) return '#f59e0b' // Orange
  return '#ef4444' // Red
}

// Initialize on mount
onMounted(async () => {
  await initializeStores()
})
</script>
<style scoped>
.analytics-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.header-content h1 {
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

.page-subtitle {
  color: #64748b;
  font-size: 1rem;
  margin: 0;
}

/* Section Headers */
h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
}

/* Overview Section */
.overview-section {
  margin-bottom: 3rem;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.overview-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  overflow: hidden;
}

.overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.overview-card.primary::before { background: #3b82f6; }
.overview-card.success::before { background: #10b981; }
.overview-card.info::before { background: #6366f1; }
.overview-card.warning::before { background: #f59e0b; }

.card-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.card-label {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.card-detail {
  font-size: 0.875rem;
  color: #64748b;
}

/* Week Section */
.week-section {
  margin-bottom: 3rem;
}

.week-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.week-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.week-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.week-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.week-percentage {
  font-size: 1.5rem;
  font-weight: 800;
  color: #3b82f6;
}

.week-progress {
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar.small {
  height: 8px;
  border-radius: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.3s ease;
  border-radius: inherit;
}

.progress-fill.priority {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-text {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Category Section */
.category-section {
  margin-bottom: 3rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.category-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  border-left: 4px solid;
}

.category-card.category-landingchat { border-left-color: #10b981; }
.category-card.category-estudio { border-left-color: #3b82f6; }
.category-card.category-tause { border-left-color: #f59e0b; }
.category-card.category-otro { border-left-color: #64748b; }

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.category-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.category-rate {
  font-size: 1.25rem;
  font-weight: 800;
  color: #3b82f6;
}

.category-stats {
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

/* Time Section */
.time-section {
  margin-bottom: 3rem;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.time-slot {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.time-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.time-bar {
  width: 100%;
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.time-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.time-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-rate {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.time-count {
  font-size: 0.75rem;
  color: #64748b;
}

/* Trends Section */
.trends-section {
  margin-bottom: 3rem;
}

.trends-chart {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.chart-container {
  display: flex;
  align-items: end;
  gap: 1rem;
  height: 200px;
  padding: 1rem 0;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.trend-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
}

.trend-column {
  flex: 1;
  width: 100%;
  max-width: 40px;
  background: #f1f5f9;
  border-radius: 4px;
  display: flex;
  align-items: end;
  margin-bottom: 0.5rem;
}

.trend-fill {
  width: 100%;
  border-radius: 4px;
  transition: height 0.3s ease;
  min-height: 4px;
}

.trend-value {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
}

/* Focus Section */
.focus-section {
  margin-bottom: 3rem;
}

.focus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.focus-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.focus-card.correlation {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border-color: #10b981;
}

.focus-icon {
  font-size: 2rem;
  line-height: 1;
}

.focus-content {
  flex: 1;
}

.focus-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.focus-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Actions Section */
.actions-section {
  margin-bottom: 2rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.action-icon {
  font-size: 2rem;
  line-height: 1;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.action-description {
  font-size: 0.875rem;
  color: #64748b;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .week-grid {
    grid-template-columns: 1fr;
  }
  
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .time-slots {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .focus-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .chart-container {
    height: 150px;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
  
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .time-slots {
    grid-template-columns: 1fr;
  }
  
  .overview-card {
    padding: 1.5rem;
    flex-direction: column;
    text-align: center;
  }
  
  .card-value {
    font-size: 1.75rem;
  }
  
  .trends-chart {
    padding: 1rem;
  }
  
  .chart-container {
    height: 120px;
  }
}
</style>