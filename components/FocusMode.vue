<template>
  <div class="focus-overlay">
    <div class="focus-container">
      <!-- Header -->
      <div class="focus-header">
        <h1 class="focus-title">MODO ENFOQUE</h1>
        <button @click="handleExitFocus" class="exit-btn">
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
            @click="handlePauseSession"
            class="btn btn-secondary"
          >
            Pausar
          </button>
          <button 
            v-else
            @click="handleResumeSession"
            class="btn btn-success"
          >
            Reanudar
          </button>
          
          <button 
            @click="handleCompleteBlock"
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
        <button @click="handleExitFocus" class="btn btn-primary">
          Volver al Dashboard
        </button>
      </div>
      
      <!-- Cell Phone Mode Alert -->
      <div v-if="isInRedZone && cellPhoneMode" class="red-zone-alert">
        🔴 ZONA ROJA ACTIVA - Minimiza el uso del celular
      </div>
      
      <!-- Emergency Help -->
      <div class="emergency-help">
        <div class="help-title">🆘 ATAJOS DE EMERGENCIA:</div>
        <div class="help-shortcuts">
          <div>ESC = Salir inmediatamente</div>
          <div>Ctrl/Cmd + Q = Salir forzado</div>
          <div>Ctrl/Cmd + C = Completar y salir</div>
          <div>F1 = Salir | F2 = Completar</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDuration } from '~/utils/timeHelpers'
import { getCategoryDisplayName } from '~/utils/categoryHelpers'

// Stores
const focusStore = useFocusStore()
const router = useRouter()

// Tauri Commands - Professional solution for macOS 26.1
const { isTauri, focusCommands } = useTauriCommands()

// Reactive refs for UI state
const currentBlock = ref(null)
const elapsedTime = ref(0)
const remainingTime = ref(0)
const progressPercentage = ref(0)
const isOverdue = ref(false)
const isPaused = ref(false)
const cellPhoneMode = ref(false)
const isInRedZone = ref(false)

// Update UI state function
function updateUIState() {
  currentBlock.value = focusStore.currentBlock
  elapsedTime.value = focusStore.elapsedTime
  remainingTime.value = focusStore.remainingTime
  progressPercentage.value = focusStore.progressPercentage
  isOverdue.value = focusStore.isOverdue
  isPaused.value = focusStore.isPaused
  cellPhoneMode.value = focusStore.cellPhoneMode
  isInRedZone.value = focusStore.isInRedZone
}

/**
 * Professional Event Handlers using Tauri Commands
 * 
 * These handlers use Tauri's native IPC instead of relying on WebView events.
 * This bypasses the macOS 26.1 Tahoe WebKit click event bug.
 */

const handleExitFocus = async () => {
  console.log('handleExitFocus called')
  
  if (!window.confirm('¿Estás seguro de que quieres salir del modo enfoque?')) {
    return
  }
  
  // Try Tauri command first (for native app)
  if (isTauri()) {
    const success = await focusCommands.exit()
    if (success) {
      console.log('Tauri command executed, exiting focus mode')
    }
  }
  
  // Execute the actual logic (works in both web and native)
  focusStore.exitFocusMode()
  router.push('/')
}

const handleCompleteBlock = async () => {
  console.log('handleCompleteBlock called')
  
  if (!window.confirm('¿Marcar este bloque como completado?')) {
    return
  }
  
  // Try Tauri command first (for native app)
  if (isTauri()) {
    const success = await focusCommands.complete()
    if (success) {
      console.log('Tauri command executed, completing block')
    }
  }
  
  // Execute the actual logic (works in both web and native)
  const result = focusStore.completeCurrentBlock()
  if (result.success) {
    router.push('/')
  } else {
    window.alert(`Error: ${result.error}`)
  }
}

const handlePauseSession = async () => {
  console.log('handlePauseSession called')
  
  // Try Tauri command first (for native app)
  if (isTauri()) {
    const success = await focusCommands.pause()
    if (success) {
      console.log('Tauri command executed, pausing session')
    }
  }
  
  // Execute the actual logic (works in both web and native)
  focusStore.pauseSession()
  updateUIState()
}

const handleResumeSession = async () => {
  console.log('handleResumeSession called')
  
  // Try Tauri command first (for native app)
  if (isTauri()) {
    const success = await focusCommands.resume()
    if (success) {
      console.log('Tauri command executed, resuming session')
    }
  }
  
  // Execute the actual logic (works in both web and native)
  focusStore.resumeSession()
  updateUIState()
}

// Emergency escape handlers - Direct keyboard shortcuts
const emergencyEscape = async () => {
  console.log('EMERGENCY ESCAPE ACTIVATED')
  focusStore.exitFocusMode()
  router.push('/')
}

const emergencyComplete = async () => {
  console.log('EMERGENCY COMPLETE ACTIVATED')
  if (focusStore.currentBlockId) {
    focusStore.completeCurrentBlock()
  }
  router.push('/')
}

// Update time every second
let timeInterval: NodeJS.Timeout | null = null

onMounted(() => {
  console.log('FocusMode component mounted')
  console.log('Running in Tauri:', isTauri())
  updateUIState()
  
  timeInterval = setInterval(() => {
    focusStore.updateTimestamp()
    updateUIState()
  }, 1000)
  
  // Keyboard shortcuts - EMERGENCY EXITS
  const handleKeydown = (event: KeyboardEvent) => {
    console.log('Key pressed:', event.key, 'Ctrl:', event.ctrlKey, 'Meta:', event.metaKey)
    
    // EMERGENCY EXITS - Multiple ways to escape
    if (event.key === 'Escape') {
      console.log('Escape key - emergency exit')
      emergencyEscape()
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'q') {
      console.log('Ctrl/Cmd+Q - emergency exit')
      event.preventDefault()
      emergencyEscape()
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      console.log('Ctrl/Cmd+C - emergency complete')
      event.preventDefault()
      emergencyComplete()
    } else if (event.key === 'F1') {
      console.log('F1 - emergency exit')
      event.preventDefault()
      emergencyEscape()
    } else if (event.key === 'F2') {
      console.log('F2 - emergency complete')
      event.preventDefault()
      emergencyComplete()
    } else if (event.key === ' ') {
      event.preventDefault()
      if (isPaused.value) {
        handleResumeSession()
      } else {
        handlePauseSession()
      }
    }
  }
  
  document.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
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
  min-height: 44px;
  min-width: 120px;
  font-size: 14px;
}

.exit-btn:hover {
  background: #dc2626;
}

.exit-btn:active {
  background: #b91c1c;
  transform: scale(0.98);
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

.focus-controls .btn {
  min-height: 44px;
  min-width: 140px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.75rem 1.5rem;
}

.focus-controls .btn:active {
  transform: scale(0.98);
}

.focus-controls .btn-primary {
  background: #3b82f6;
  color: white;
}

.focus-controls .btn-primary:hover {
  background: #2563eb;
}

.focus-controls .btn-secondary {
  background: #6b7280;
  color: white;
}

.focus-controls .btn-secondary:hover {
  background: #4b5563;
}

.focus-controls .btn-success {
  background: #10b981;
  color: white;
}

.focus-controls .btn-success:hover {
  background: #059669;
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

.emergency-help {
  background: #f0f9ff;
  border: 2px solid #0ea5e9;
  color: #0c4a6e;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.help-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-align: center;
}

.help-shortcuts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.25rem;
  font-family: monospace;
}

@media (max-width: 640px) {
  .help-shortcuts {
    grid-template-columns: 1fr;
  }
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