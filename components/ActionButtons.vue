<template>
  <div class="action-buttons-container">
    <!-- Primary Action - Start Day -->
    <div class="primary-action">
      <button
        @click="startDay"
        :disabled="!canStartDay"
        :class="[
          'start-day-btn',
          canStartDay ? 'enabled' : 'disabled',
          focusStore.isFocusMode ? 'focus-active' : ''
        ]"
      >
        <div class="btn-content">
          <div class="btn-icon">
            {{ focusStore.isFocusMode ? '🎯' : '🚀' }}
          </div>
          <div class="btn-text">
            <div class="btn-title">
              {{ focusStore.isFocusMode ? 'MODO ENFOQUE ACTIVO' : 'INICIAR DÍA' }}
            </div>
            <div v-if="!focusStore.isFocusMode" class="btn-subtitle">
              Comienza tu jornada productiva
            </div>
          </div>
        </div>
      </button>
    </div>
    
    <!-- Secondary Actions Grid -->
    <div class="secondary-actions">
      <!-- Cell Phone Mode Toggle -->
      <button
        @click="toggleCellPhoneMode"
        :class="[
          'action-btn cell-phone-btn',
          focusStore.cellPhoneMode ? 'active' : 'inactive'
        ]"
      >
        <div class="btn-icon">{{ focusStore.cellPhoneMode ? '📵' : '📱' }}</div>
        <div class="btn-label">
          <div class="btn-title">Modo Celular</div>
          <div class="btn-status">{{ focusStore.cellPhoneMode ? 'ON' : 'OFF' }}</div>
        </div>
      </button>
      
      <!-- View Week -->
      <NuxtLink to="/week" class="action-btn week-btn">
        <div class="btn-icon">📅</div>
        <div class="btn-label">
          <div class="btn-title">Ver Semana</div>
          <div class="btn-status">Progreso</div>
        </div>
      </NuxtLink>
      
      <!-- Reviews -->
      <NuxtLink to="/review" class="action-btn review-btn">
        <div class="btn-icon">🌙</div>
        <div class="btn-label">
          <div class="btn-title">Revisiones</div>
          <div class="btn-status">Historial</div>
        </div>
      </NuxtLink>
      
      <!-- Stats -->
      <NuxtLink to="/stats" class="action-btn stats-btn">
        <div class="btn-icon">📊</div>
        <div class="btn-label">
          <div class="btn-title">Estadísticas</div>
          <div class="btn-status">Análisis</div>
        </div>
      </NuxtLink>
      
      <!-- Settings -->
      <button @click="showSettings = true" class="action-btn settings-btn">
        <div class="btn-icon">⚙️</div>
        <div class="btn-label">
          <div class="btn-title">Configuración</div>
          <div class="btn-status">Ajustes</div>
        </div>
      </button>
    </div>
    
    <!-- Status Message -->
    <div v-if="statusMessage" class="status-message">
      <div class="status-content">
        <div class="status-icon">{{ statusIcon }}</div>
        <div class="status-text">{{ statusMessage }}</div>
      </div>
    </div>
    
    <!-- Settings Modal -->
    <Teleport to="body">
      <SettingsModal
        v-if="showSettings"
        @close="showSettings = false"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// Stores
const focusStore = useFocusStore()
const blocksStore = useBlocksStore()
const settingsStore = useSettingsStore()

// Reactive state
const showSettings = ref(false)

// Computed properties
const canStartDay = computed(() => {
  if (focusStore.isFocusMode) return false
  
  const todaysBlocks = blocksStore.getTodaysBlocks
  if (todaysBlocks.length === 0) return false
  
  // Check if there are any incomplete blocks
  const incompleteBlocks = todaysBlocks.filter(block => !block.completed)
  return incompleteBlocks.length > 0
})

const statusMessage = computed(() => {
  if (focusStore.isFocusMode) {
    const currentBlock = focusStore.currentBlock
    if (currentBlock) {
      return `Enfocado en: ${currentBlock.description}`
    }
    return 'Modo enfoque activo'
  }
  
  const todaysBlocks = blocksStore.getTodaysBlocks
  if (todaysBlocks.length === 0) {
    return 'Crea al menos un bloque para comenzar tu día'
  }
  
  const incompleteBlocks = todaysBlocks.filter(block => !block.completed)
  if (incompleteBlocks.length === 0) {
    return '¡Felicitaciones! Has completado todos tus bloques de hoy'
  }
  
  const remainingTime = settingsStore.remainingWorkTime
  if (remainingTime.isAfterWork) {
    return 'Jornada laboral terminada. ¡Buen trabajo!'
  }
  
  return `${incompleteBlocks.length} bloque${incompleteBlocks.length > 1 ? 's' : ''} pendiente${incompleteBlocks.length > 1 ? 's' : ''}`
})

const statusIcon = computed(() => {
  if (focusStore.isFocusMode) {
    return '🎯'
  }
  
  const todaysBlocks = blocksStore.getTodaysBlocks
  if (todaysBlocks.length === 0) {
    return '📝'
  }
  
  const incompleteBlocks = todaysBlocks.filter(block => !block.completed)
  if (incompleteBlocks.length === 0) {
    return '🎉'
  }
  
  const remainingTime = settingsStore.remainingWorkTime
  if (remainingTime.isAfterWork) {
    return '✅'
  }
  
  return '⏳'
})

// Actions
async function startDay() {
  if (!canStartDay.value) return
  
  try {
    const result = await focusStore.startFocusMode()
    
    if (!result.success) {
      alert(`Error al iniciar el día: ${result.error}`)
    }
  } catch (error) {
    console.error('Error starting day:', error)
    alert('Error inesperado al iniciar el día')
  }
}

async function toggleCellPhoneMode() {
  try {
    await focusStore.toggleCellPhoneMode()
  } catch (error) {
    console.error('Error toggling cell phone mode:', error)
    alert('Error al cambiar modo celular')
  }
}
</script>

<style scoped>
.action-buttons-container {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

/* Primary Action Button */
.primary-action {
  margin-bottom: 1.5rem;
}

.start-day-btn {
  width: 100%;
  padding: 1.5rem;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 700;
  text-align: left;
  position: relative;
  overflow: hidden;
}

.start-day-btn.enabled {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
}

.start-day-btn.enabled:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
}

.start-day-btn.focus-active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
  animation: pulse 2s infinite;
}

.start-day-btn.disabled {
  background: #94a3b8;
  color: white;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.btn-text {
  flex: 1;
}

.btn-title {
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.btn-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

/* Secondary Actions Grid */
.secondary-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.25rem 1rem;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  background: white;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 100px;
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.action-btn .btn-icon {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.btn-label {
  text-align: center;
}

.btn-label .btn-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.btn-label .btn-status {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Specific button styles */
.cell-phone-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #10b981;
  color: white;
}

.cell-phone-btn.active .btn-label .btn-title,
.cell-phone-btn.active .btn-label .btn-status {
  color: white;
}

.cell-phone-btn.inactive {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.week-btn:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-color: #3b82f6;
  color: white;
}

.week-btn:hover .btn-label .btn-title,
.week-btn:hover .btn-label .btn-status {
  color: white;
}

.review-btn:hover {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-color: #6366f1;
  color: white;
}

.review-btn:hover .btn-label .btn-title,
.review-btn:hover .btn-label .btn-status {
  color: white;
}

.stats-btn:hover {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  border-color: #8b5cf6;
  color: white;
}

.stats-btn:hover .btn-label .btn-title,
.stats-btn:hover .btn-label .btn-status {
  color: white;
}

.settings-btn:hover {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  border-color: #64748b;
  color: white;
}

.settings-btn:hover .btn-label .btn-title,
.settings-btn:hover .btn-label .btn-status {
  color: white;
}

/* Status Message */
.status-message {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
}

.status-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-align: center;
}

/* Responsive Design */
@media (min-width: 640px) {
  .action-buttons-container {
    padding: 2rem;
  }
  
  .secondary-actions {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .btn-content {
    text-align: center;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn-icon {
    font-size: 2.5rem;
  }
  
  .btn-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .action-buttons-container {
    padding: 1rem;
    border-radius: 16px;
  }
  
  .start-day-btn {
    padding: 1.25rem;
  }
  
  .btn-title {
    font-size: 1.125rem;
  }
  
  .secondary-actions {
    gap: 0.75rem;
  }
  
  .action-btn {
    padding: 1rem 0.75rem;
    min-height: 80px;
  }
  
  .action-btn .btn-icon {
    font-size: 1.5rem;
  }
  
  .btn-label .btn-title {
    font-size: 0.75rem;
  }
  
  .btn-label .btn-status {
    font-size: 0.625rem;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
</style>