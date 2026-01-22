<template>
  <div class="app-container">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="main-content">
      <div class="weekly-view">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <h1>Vista Semanal</h1>
            <NuxtLink to="/" class="back-btn">
              ← Dashboard
            </NuxtLink>
          </div>
          
          <!-- Week Navigation -->
          <div class="week-navigation">
            <button @click="previousWeek" class="nav-btn">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div class="week-info">
              <div class="week-title">{{ weekTitle }}</div>
              <div class="week-dates">{{ weekDateRange }}</div>
            </div>
            
            <button @click="nextWeek" class="nav-btn" :disabled="isCurrentWeek">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Weekly Stats -->
        <div class="weekly-stats">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ weeklyStats.completionRate }}%</div>
              <div class="stat-label">Completación</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ weeklyStats.completedBlocks }}</div>
              <div class="stat-label">Bloques Completados</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <div class="stat-value">{{ weeklyStats.totalBlocks }}</div>
              <div class="stat-label">Bloques Planificados</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <div class="stat-value">{{ weeklyStats.prioritiesCompleted }}</div>
              <div class="stat-label">Prioridades Completadas</div>
            </div>
          </div>
        </div>

        <!-- 7-Day Grid -->
        <div class="weekly-grid">
          <div
            v-for="day in weekDays"
            :key="day.date"
            :class="[
              'day-column',
              { 'today': day.isToday },
              { 'weekend': day.isWeekend }
            ]"
          >
            <!-- Day Header -->
            <div class="day-header">
              <div class="day-name">{{ day.name }}</div>
              <div class="day-date">{{ day.displayDate }}</div>
              <div v-if="day.completion" class="day-completion">
                {{ day.completion.completed }}/{{ day.completion.total }}
              </div>
            </div>

            <!-- Day Content -->
            <div class="day-content">
              <!-- Priority -->
              <div v-if="day.priority" class="day-priority" :class="{ 'completed': day.priority.completed }">
                <div class="priority-icon">⭐</div>
                <div class="priority-text">{{ day.priority.text }}</div>
                <div v-if="day.priority.completed" class="priority-check">✓</div>
              </div>

              <!-- Blocks -->
              <div class="day-blocks">
                <div
                  v-for="block in day.blocks"
                  :key="block.id"
                  :class="[
                    'block-item',
                    `category-${block.category.toLowerCase()}`,
                    { 'completed': block.completed }
                  ]"
                >
                  <div class="block-time">{{ block.startTime }}</div>
                  <div class="block-description">{{ block.description }}</div>
                  <div v-if="block.completed" class="block-check">✓</div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-if="day.blocks.length === 0 && !day.priority" class="day-empty">
                <div class="empty-icon">📅</div>
                <div class="empty-text">Sin planificar</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Legend -->
        <div class="category-legend">
          <h3>Categorías</h3>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color category-landingchat"></div>
              <span>LANDINGCHAT</span>
            </div>
            <div class="legend-item">
              <div class="legend-color category-estudio"></div>
              <span>ESTUDIO</span>
            </div>
            <div class="legend-item">
              <div class="legend-color category-tause"></div>
              <span>TAUSE</span>
            </div>
            <div class="legend-item">
              <div class="legend-color category-otro"></div>
              <span>OTRO</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Block, DailyPriority } from '~/types'
import { formatDateForDisplay } from '~/utils/timeHelpers'

// Page metadata
useHead({
  title: 'Vista Semanal - Felipe OS',
  meta: [
    { name: 'description', content: 'Vista semanal de bloques y progreso en Felipe OS' }
  ]
})

// Initialize stores
const { blocksStore, initializeStores } = useStores()

// Reactive state
const currentWeekStart = ref(new Date())

// Set to start of current week (Sunday)
onMounted(() => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  currentWeekStart.value = startOfWeek
  
  initializeStores()
})

// Computed properties
const weekTitle = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  
  const startMonth = start.toLocaleDateString('es-ES', { month: 'long' })
  const endMonth = end.toLocaleDateString('es-ES', { month: 'long' })
  const year = start.getFullYear()
  
  if (startMonth === endMonth) {
    return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${year}`
  } else {
    return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} - ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1)} ${year}`
  }
})

const weekDateRange = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  
  const startDay = start.getDate()
  const endDay = end.getDate()
  
  return `${startDay} - ${endDay}`
})

const isCurrentWeek = computed(() => {
  const today = new Date()
  const todayStart = new Date(today)
  todayStart.setDate(today.getDate() - today.getDay())
  todayStart.setHours(0, 0, 0, 0)
  
  return currentWeekStart.value.getTime() === todayStart.getTime()
})

const weekDays = computed(() => {
  const days = []
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const today = new Date().toISOString().split('T')[0]
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(currentWeekStart.value.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Get blocks for this day
    const dayBlocks = blocksStore.getBlocksByDate(dateStr)
    
    // Get priority for this day
    const dayPriority = getDayPriority(dateStr)
    
    // Calculate completion
    const completedBlocks = dayBlocks.filter(block => block.completed).length
    const totalBlocks = dayBlocks.length
    
    days.push({
      name: dayNames[i],
      date: dateStr,
      displayDate: date.getDate().toString(),
      isToday: dateStr === today,
      isWeekend: i === 0 || i === 6, // Sunday or Saturday
      blocks: dayBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      priority: dayPriority,
      completion: totalBlocks > 0 ? { completed: completedBlocks, total: totalBlocks } : null
    })
  }
  
  return days
})

const weeklyStats = computed(() => {
  const allBlocks = weekDays.value.flatMap(day => day.blocks)
  const allPriorities = weekDays.value.map(day => day.priority).filter(Boolean)
  
  const completedBlocks = allBlocks.filter(block => block.completed).length
  const totalBlocks = allBlocks.length
  const completedPriorities = allPriorities.filter(priority => priority?.completed).length
  
  return {
    completedBlocks,
    totalBlocks,
    completionRate: totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0,
    prioritiesCompleted: completedPriorities
  }
})

// Methods
function getDayPriority(date: string): DailyPriority | null {
  try {
    if (process.client) {
      const stored = localStorage.getItem('felipe-os-priorities')
      if (stored) {
        const priorities: DailyPriority[] = JSON.parse(stored)
        return priorities.find(p => p.date === date) || null
      }
    }
  } catch (error) {
    console.error('Error loading priority for date:', date, error)
  }
  return null
}

function previousWeek() {
  const newStart = new Date(currentWeekStart.value)
  newStart.setDate(newStart.getDate() - 7)
  currentWeekStart.value = newStart
}

function nextWeek() {
  if (!isCurrentWeek.value) {
    const newStart = new Date(currentWeekStart.value)
    newStart.setDate(newStart.getDate() + 7)
    currentWeekStart.value = newStart
  }
}
</script>

<style scoped>
.weekly-view {
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
  margin-bottom: 1.5rem;
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

/* Week Navigation */
.week-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.nav-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.nav-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

.week-info {
  text-align: center;
}

.week-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.week-dates {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* Weekly Stats */
.weekly-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
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
  font-size: 1.75rem;
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

/* 7-Day Grid */
.weekly-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.day-column {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.day-column.today {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.day-column.weekend {
  background: #f8fafc;
}

.day-header {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
}

.day-column.today .day-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.day-name {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.day-date {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.day-completion {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 600;
}

.day-content {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Priority */
.day-priority {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  padding: 0.75rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  position: relative;
}

.day-priority.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.priority-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.priority-text {
  flex: 1;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-check {
  font-size: 1rem;
  flex-shrink: 0;
}

/* Blocks */
.day-blocks {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.block-item {
  padding: 0.75rem;
  border-radius: 8px;
  border-left: 4px solid;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  position: relative;
}

.block-item.completed {
  opacity: 0.7;
  background: #f8fafc;
}

.block-item.category-landingchat {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.block-item.category-estudio {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.block-item.category-tause {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
}

.block-item.category-otro {
  border-left-color: #64748b;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.block-time {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-weight: 700;
  color: #374151;
  flex-shrink: 0;
  min-width: 35px;
}

.block-description {
  flex: 1;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-check {
  color: #10b981;
  font-weight: 700;
  flex-shrink: 0;
}

/* Empty State */
.day-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #94a3b8;
  text-align: center;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.875rem;
  font-weight: 500;
}

/* Category Legend */
.category-legend {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.category-legend h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.legend-items {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-color.category-landingchat {
  background: #10b981;
}

.legend-color.category-estudio {
  background: #3b82f6;
}

.legend-color.category-tause {
  background: #f59e0b;
}

.legend-color.category-otro {
  background: #64748b;
}

/* Mobile Responsive */
@media (max-width: 1024px) {
  .weekly-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .day-column {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .weekly-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .weekly-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .week-navigation {
    gap: 1rem;
  }
  
  .legend-items {
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .weekly-grid {
    grid-template-columns: 1fr;
  }
  
  .weekly-stats {
    grid-template-columns: 1fr;
  }
  
  .day-column {
    min-height: 250px;
  }
  
  .week-navigation {
    padding: 1rem;
  }
  
  .week-title {
    font-size: 1.25rem;
  }
}
</style>