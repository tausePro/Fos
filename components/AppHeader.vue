<template>
  <header>
    <div class="container">
      <!-- Mobile Layout -->
      <div class="mobile-header">
        <!-- Top Row: Title and Time -->
        <div class="header-top">
          <div class="title-section">
            <h1>Felipe OS</h1>
            <p class="subtitle">Anti-Procrastinación</p>
          </div>
          <div class="time-section">
            <time class="current-time">{{ currentTime }}</time>
            <div class="current-date">{{ formattedDate }}</div>
          </div>
        </div>
        
        <!-- Work Status Row -->
        <div class="work-status-mobile">
          <div v-if="!settingsStore.isWithinWorkHours && !remainingTime.isAfterWork" class="status-before-work">
            <span class="status-icon">⏰</span>
            <div class="status-content">
              <div class="status-label">Trabajo inicia en</div>
              <div class="status-value">{{ timeUntilWork }}</div>
            </div>
          </div>
          <div v-else-if="settingsStore.isWithinWorkHours" class="status-during-work">
            <span class="status-icon">🕐</span>
            <div class="status-content">
              <div class="status-label">Tiempo restante</div>
              <div class="status-value">{{ formatRemainingTime }}</div>
            </div>
          </div>
          <div v-else-if="remainingTime.isAfterWork" class="status-after-work">
            <span class="status-icon">✅</span>
            <div class="status-content">
              <div class="status-label">Jornada terminada</div>
              <div class="status-value">¡Buen trabajo!</div>
            </div>
          </div>
          
          <!-- Cell Phone Mode Indicator -->
          <div v-if="focusStore.cellPhoneMode" class="cell-phone-indicator">
            <div class="indicator-dot" :class="isInRedZone ? 'red-zone' : 'normal'"></div>
            <span class="indicator-text">
              {{ isInRedZone ? 'Zona Roja' : 'Modo Celular' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Red Zone Alert - Mobile Optimized -->
      <div v-if="redZoneStatus.isActive && focusStore.cellPhoneMode" 
           class="red-zone-alert-mobile">
        <div class="alert-content">
          <div class="alert-icon">🔴</div>
          <div class="alert-text">
            <div class="alert-title">ZONA ROJA ACTIVA</div>
            <div class="alert-subtitle">Minimiza el uso del celular</div>
            <div class="alert-time">{{ formatDuration(redZoneStatus.timeRemaining) }} restantes</div>
          </div>
        </div>
      </div>
      
      <!-- Red Zone Preview - Mobile -->
      <div v-else-if="focusStore.cellPhoneMode && redZoneStatus.timeUntilStart > 0" 
           class="red-zone-preview-mobile">
        <div class="preview-content">
          <div class="preview-icon">⏰</div>
          <div class="preview-text">
            <div class="preview-title">Zona roja inicia en</div>
            <div class="preview-time">{{ formatDuration(redZoneStatus.timeUntilStart) }}</div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { formatDateForDisplay, getCurrentTime, getRemainingWorkTime, formatDuration } from '~/utils/timeHelpers'

// Stores
const focusStore = useFocusStore()
const settingsStore = useSettingsStore()

// Reactive data
const currentTime = ref(getCurrentTime())
const formattedDate = ref(formatDateForDisplay(new Date().toISOString().split('T')[0]))

// Computed properties
const remainingTime = computed(() => settingsStore.remainingWorkTime)
const isInRedZone = computed(() => focusStore.isInRedZone)
const redZoneTimes = computed(() => focusStore.redZoneTimes)
const redZoneStatus = computed(() => focusStore.redZoneStatus)

const formatRemainingTime = computed(() => {
  const time = remainingTime.value
  if (time.hours === 0 && time.minutes === 0) {
    return '0m'
  }
  
  if (time.hours === 0) {
    return `${time.minutes}m`
  }
  
  if (time.minutes === 0) {
    return `${time.hours}h`
  }
  
  return `${time.hours}h ${time.minutes}m`
})

const timeUntilWork = computed(() => {
  const minutesUntilWork = settingsStore.getTimeUntilWorkStarts()
  if (minutesUntilWork === 0) return '0m'
  
  const hours = Math.floor(minutesUntilWork / 60)
  const minutes = minutesUntilWork % 60
  
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
})

// Update time every minute
let timeInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // Update time immediately and then every minute
  updateTime()
  timeInterval = setInterval(updateTime, 60000) // Update every minute
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

function updateTime() {
  currentTime.value = getCurrentTime()
  
  // Update date at midnight
  const newDate = new Date().toISOString().split('T')[0]
  const newFormattedDate = formatDateForDisplay(newDate)
  if (newFormattedDate !== formattedDate.value) {
    formattedDate.value = newFormattedDate
  }
}
</script>

<style scoped>
/* Mobile-first responsive header */
.mobile-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-section h1 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
}

.subtitle {
  font-size: 0.75rem;
  opacity: 0.9;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-section {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.current-time {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.current-date {
  font-size: 0.75rem;
  opacity: 0.8;
  line-height: 1;
}

.work-status-mobile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.status-before-work,
.status-during-work,
.status-after-work {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.status-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-label {
  font-size: 0.75rem;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

.status-value {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
}

.status-before-work {
  color: #fbbf24;
}

.status-during-work {
  color: #10b981;
}

.status-after-work {
  color: #3b82f6;
}

.cell-phone-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.indicator-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.indicator-dot.red-zone {
  background: #ef4444;
  animation: pulse 2s infinite;
}

.indicator-dot.normal {
  background: #fbbf24;
}

.indicator-text {
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Red Zone Alerts - Mobile */
.red-zone-alert-mobile {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 2px solid #fecaca;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
}

.red-zone-preview-mobile {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 2px solid #fed7aa;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
}

.alert-content,
.preview-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.alert-icon,
.preview-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.alert-text,
.preview-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alert-title,
.preview-title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  line-height: 1;
}

.alert-title {
  color: #dc2626;
}

.preview-title {
  color: #d97706;
}

.alert-subtitle {
  font-size: 0.75rem;
  color: #991b1b;
  line-height: 1;
}

.alert-time,
.preview-time {
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  line-height: 1;
}

.alert-time {
  color: #dc2626;
}

.preview-time {
  color: #d97706;
}

/* Desktop styles */
@media (min-width: 768px) {
  .mobile-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .header-top {
    flex: 1;
  }
  
  .title-section h1 {
    font-size: 2rem;
  }
  
  .current-time {
    font-size: 1.5rem;
  }
  
  .work-status-mobile {
    flex: none;
    min-width: 300px;
  }
  
  .status-value {
    font-size: 1.25rem;
  }
  
  .red-zone-alert-mobile,
  .red-zone-preview-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
  }
  
  .alert-content,
  .preview-content {
    flex: 1;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>