<template>
  <div class="focus-overlay">
    <div class="focus-container">
      <!-- Header -->
      <div class="focus-header">
        <h1 class="focus-title">MODO ENFOQUE</h1>
        <button @click="exitFocus" class="exit-btn">
          Salir del Enfoque
        </button>
      </div>
      
      <!-- Current Block -->
      <div v-if="currentBlock" class="current-block">
        <div class="block-category" :class="`category-${currentBlock.category.toLowerCase()}`">
          {{ getCategoryDisplayName(currentBlock.category) }}
        </div>
        
        <h2 class="block-description">
          {{ currentBlock.description }}
        </h2>
        
        <div class="block-time">
          {{ currentBlock.startTime }} - {{ currentBlock.endTime }}
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill"
              :style="{ width: `${progressPercentage}%` }"
              :class="{ 'overdue': isOverdue }"
            ></div>
          </div>
          <div class="progress-text">
            {{ progressPercentage }}% completado
          </div>
        </div>
        
        <!-- Time Display -->
        <div class="time-display">
          <div class="time-section">
            <div class="time-label">Tiempo transcurrido</div>
            <div class="time-value">{{ formatDuration(elapsedTime) }}</div>
          </div>
          <div class="time-section">
            <div class="time-label">Tiempo restante</div>
            <div class="time-value" :class="{ 'overdue': isOverdue }">
              {{ isOverdue ? 'TIEMPO EXCEDIDO' : formatDuration(remainingTime) }}
            </div>
          </div>
        </div>
        
        <!-- Pause/Resume -->
        <div class="focus-controls">
          <button 
            v-if="!isPaused"
            @click="pauseSession"
            class="btn btn-secondary"
          >
            Pausar
          </button>
          <button 
            v-else
            @click="resumeSession"
            class="btn btn-success"
          >
            Reanudar
          </button>
          
          <button 
            @click="completeBlock"
            class="btn btn-primary"
          >
            Completar Bloque
          </button>
        </div>
        
        <!-- Paused Indicator -->
        <div v-if="isPaused" class="paused-indicator">
          ⏸️ SESIÓN PAUSADA
        </div>
      </div>
      
      <!-- No Block State -->
      <div v-else class="no-block">
        <h2>No hay bloque activo</h2>
        <p>No se encontró un bloque para enfocar</p>
        <button @click="exitFocus" class="btn btn-primary">
          Volver al Dashboard
        </button>
      </div>
      
      <!-- Cell Phone Mode Alert -->
      <div v-if="isInRedZone && cellPhoneMode" class="red-zone-alert">
        🔴 ZONA ROJA ACTIVA - Minimiza el uso del celular
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDuration } from '~/utils/timeHelpers'
import { getCategoryDisplayName } from '~/utils/categoryHelpers'

// Stores
const focusStore = useFocusStore()

// Computed properties from store
const currentBlock = computed(() => focusStore.currentBlock)
const elapsedTime = computed(() => focusStore.elapsedTime)
const remainingTime = computed(() => focusStore.remainingTime)
const progressPercentage = computed(() => focusStore.progressPercentage)
const isOverdue = computed(() => focusStore.isOverdue)
const isPaused = computed(() => focusStore.isPaused)
const cellPhoneMode = computed(() => focusStore.cellPhoneMode)
const isInRedZone = computed(() => focusStore.isInRedZone)

// Methods
async function exitFocus() {
  if (confirm('¿Estás seguro de que quieres salir del modo enfoque?')) {
    await focusStore.exitFocusMode()
  }
}

async function pauseSession() {
  await focusStore.pauseSession()
}

async function resumeSession() {
  await focusStore.resumeSession()
}

async function completeBlock() {
  if (confirm('¿Marcar este bloque como completado?')) {
    const result = await focusStore.completeCurrentBlock()
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }
}

// Update time every second in focus mode
let timeInterval: NodeJS.Timeout | null = null

onMounted(() => {
  timeInterval = setInterval(() => {
    // Force reactivity update
    focusStore.$patch({})
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Keyboard shortcuts
onMounted(() => {
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      exitFocus()
    } else if (event.key === ' ' && !isPaused.value) {
      event.preventDefault()
      pauseSession()
    } else if (event.key === ' ' && isPaused.value) {
      event.preventDefault()
      resumeSession()
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
.focus-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.focus-container {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.focus-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.focus-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: 2px;
}

.exit-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.exit-btn:hover {
  background: #dc2626;
}

.current-block {
  text-align: center;
}

.block-category {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.block-description {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
}

.block-time {
  font-size: 1.25rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 2rem;
}

.progress-container {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  transition: width 0.3s ease;
  border-radius: 6px;
}

.progress-fill.overdue {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-text {
  font-weight: 600;
  color: #374151;
}

.time-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.time-section {
  text-align: center;
}

.time-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.time-value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
}

.time-value.overdue {
  color: #ef4444;
  animation: pulse 2s infinite;
}

.focus-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.paused-indicator {
  background: #fbbf24;
  color: #92400e;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.125rem;
  animation: pulse 2s infinite;
}

.red-zone-alert {
  background: #fef2f2;
  border: 2px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 700;
  margin-top: 1rem;
  animation: pulse 3s infinite;
}

.no-block {
  text-align: center;
  padding: 2rem;
}

.no-block h2 {
  color: #374151;
  margin-bottom: 1rem;
}

.no-block p {
  color: #6b7280;
  margin-bottom: 2rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@media (max-width: 640px) {
  .focus-container {
    padding: 1.5rem;
  }
  
  .focus-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .block-description {
    font-size: 1.5rem;
  }
  
  .time-display {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .time-value {
    font-size: 1.5rem;
  }
  
  .focus-controls {
    flex-direction: column;
  }
}
</style>