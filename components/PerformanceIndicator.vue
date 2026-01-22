<template>
  <div v-if="showIndicator" class="performance-indicator" :class="indicatorClasses">
    <div class="performance-content">
      <div class="performance-icon">
        {{ performanceIcon }}
      </div>
      <div class="performance-text">
        <div class="performance-metric">{{ formattedLoadTime }}</div>
        <div class="performance-label">{{ performanceLabel }}</div>
      </div>
      <button 
        v-if="showDetails"
        @click="toggleDetails"
        class="details-toggle"
      >
        <span 
          class="chevron-icon"
          :class="{ 'rotate-180': detailsOpen }"
        >
          ▼
        </span>
      </button>
    </div>
    
    <!-- Detailed metrics -->
    <div v-if="detailsOpen && showDetails" class="performance-details">
      <div class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Inicialización</span>
          <span class="metric-value">{{ formatTime(metrics.initialization) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Carga de Datos</span>
          <span class="metric-value">{{ formatTime(metrics.dataLoading) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Renderizado</span>
          <span class="metric-value">{{ formatTime(metrics.rendering) }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Total</span>
          <span class="metric-value">{{ formatTime(totalLoadTime) }}</span>
        </div>
      </div>
      
      <!-- Performance tips -->
      <div v-if="performanceTips.length > 0" class="performance-tips">
        <h4 class="tips-title">Sugerencias de Optimización:</h4>
        <ul class="tips-list">
          <li v-for="tip in performanceTips" :key="tip" class="tip-item">
            {{ tip }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showIndicator?: boolean
  showDetails?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

const props = withDefaults(defineProps<Props>(), {
  showIndicator: true,
  showDetails: true,
  autoHide: true,
  autoHideDelay: 5000
})

const { performanceMetrics } = useLoading()

// State
const detailsOpen = ref(false)
const visible = ref(true)

// Computed metrics
const metrics = computed(() => {
  return {
    initialization: performanceMetrics.value.get('app-init') || 0,
    dataLoading: performanceMetrics.value.get('stores-init') || 0,
    rendering: performanceMetrics.value.get('initial-render') || 0
  }
})

const totalLoadTime = computed(() => {
  return metrics.value.initialization + metrics.value.dataLoading + metrics.value.rendering
})

const formattedLoadTime = computed(() => {
  return formatTime(totalLoadTime.value)
})

const performanceLevel = computed(() => {
  const time = totalLoadTime.value
  if (time < 1000) return 'excellent'
  if (time < 2000) return 'good'
  if (time < 3000) return 'fair'
  return 'poor'
})

const performanceIcon = computed(() => {
  switch (performanceLevel.value) {
    case 'excellent': return '🚀'
    case 'good': return '✅'
    case 'fair': return '⚠️'
    case 'poor': return '🐌'
    default: return '⏱️'
  }
})

const performanceLabel = computed(() => {
  switch (performanceLevel.value) {
    case 'excellent': return 'Excelente'
    case 'good': return 'Bueno'
    case 'fair': return 'Regular'
    case 'poor': return 'Lento'
    default: return 'Midiendo...'
  }
})

const indicatorClasses = computed(() => {
  const classes = ['performance-indicator']
  classes.push(`level-${performanceLevel.value}`)
  if (!visible.value) classes.push('hidden')
  return classes.join(' ')
})

const performanceTips = computed(() => {
  const tips: string[] = []
  const time = totalLoadTime.value
  
  if (time > 2000) {
    tips.push('La aplicación está cargando lentamente. Considera limpiar datos antiguos.')
  }
  
  if (metrics.value.dataLoading > 1000) {
    tips.push('La carga de datos está tomando tiempo. Revisa el almacenamiento local.')
  }
  
  if (performanceMetrics.value.size > 50) {
    tips.push('Muchas operaciones registradas. El rendimiento puede verse afectado.')
  }
  
  return tips
})

// Methods
function toggleDetails() {
  detailsOpen.value = !detailsOpen.value
}

function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  } else {
    return `${(ms / 1000).toFixed(1)}s`
  }
}

// Auto-hide functionality
onMounted(() => {
  if (props.autoHide && props.autoHideDelay > 0) {
    setTimeout(() => {
      visible.value = false
    }, props.autoHideDelay)
  }
})

// Show indicator only if we have meaningful data
const showIndicator = computed(() => {
  return props.showIndicator && visible.value && totalLoadTime.value > 0
})
</script>

<style scoped>
.performance-indicator {
  position: fixed;
  top: 4px;
  right: 4px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  max-width: 300px;
}

.performance-indicator.hidden {
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
}

.performance-content {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 0.75rem;
}

.performance-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.performance-text {
  flex: 1;
  min-width: 0;
}

.performance-metric {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.performance-label {
  font-size: 0.75rem;
  color: #64748b;
}

.details-toggle {
  padding: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #64748b;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.details-toggle:hover {
  background: #f1f5f9;
  color: #475569;
}

.chevron-icon {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 0.75rem;
}

.chevron-icon.rotate-180 {
  transform: rotate(180deg);
}

/* Performance level colors */
.level-excellent {
  border-left: 4px solid #10b981;
}

.level-good {
  border-left: 4px solid #3b82f6;
}

.level-fair {
  border-left: 4px solid #f59e0b;
}

.level-poor {
  border-left: 4px solid #ef4444;
}

/* Details section */
.performance-details {
  border-top: 1px solid #e2e8f0;
  padding: 0.75rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
}

.metric-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e293b;
}

.performance-tips {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.tips-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tip-item {
  font-size: 0.75rem;
  color: #64748b;
  padding: 0.25rem 0;
  padding-left: 1rem;
  position: relative;
}

.tip-item::before {
  content: '💡';
  position: absolute;
  left: 0;
  top: 0.25rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .performance-indicator {
    position: relative;
    top: auto;
    right: auto;
    margin: 0.5rem;
    max-width: none;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>