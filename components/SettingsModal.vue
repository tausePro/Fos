<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold">Configuración</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Work Hours -->
        <div class="settings-section">
          <h4 class="section-title">Horario de Trabajo</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="workStart">Hora de inicio</label>
              <input
                id="workStart"
                v-model="workStartTime"
                type="time"
                @change="updateWorkStart"
              />
            </div>
            <div class="form-group">
              <label for="workEnd">Hora de fin</label>
              <input
                id="workEnd"
                v-model="workEndTime"
                type="time"
                @change="updateWorkEnd"
              />
            </div>
          </div>
          
          <div class="work-summary">
            <strong>Jornada laboral:</strong> {{ settingsStore.totalWorkHours }} horas
            ({{ settingsStore.workStartTime }} - {{ settingsStore.workEndTime }})
          </div>
        </div>
        
        <!-- Weekend Blocking -->
        <div class="settings-section">
          <h4 class="section-title">Fin de Semana</h4>
          
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="settingsStore.weekendBlocking"
              @change="toggleWeekendBlocking"
            />
            <span class="toggle-text">
              Bloquear planificación en fines de semana (tiempo familiar)
            </span>
          </label>
          
          <p class="setting-description">
            Cuando está activado, no podrás crear bloques los sábados y domingos.
          </p>
        </div>
        
        <!-- Cell Phone Mode -->
        <div class="settings-section">
          <h4 class="section-title">Modo Celular</h4>
          
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="settingsStore.cellPhoneMode"
              @change="toggleCellPhoneMode"
            />
            <span class="toggle-text">
              Activar alertas de zona roja (primeras 3 horas del día)
            </span>
          </label>
          
          <p class="setting-description">
            Te recordará minimizar el uso del celular durante las primeras 3 horas de trabajo (8am-11am).
          </p>
        </div>
        
        <!-- Current Status -->
        <div class="settings-section">
          <h4 class="section-title">Estado Actual</h4>
          
          <div class="status-grid">
            <div class="status-item">
              <span class="status-label">Dentro del horario:</span>
              <span :class="settingsStore.isWithinWorkHours ? 'status-yes' : 'status-no'">
                {{ settingsStore.isWithinWorkHours ? 'Sí' : 'No' }}
              </span>
            </div>
            
            <div class="status-item">
              <span class="status-label">Tiempo restante hoy:</span>
              <span class="status-value">
                {{ remainingTimeText }}
              </span>
            </div>
            
            <div class="status-item">
              <span class="status-label">Es fin de semana:</span>
              <span :class="settingsStore.isWeekend ? 'status-yes' : 'status-no'">
                {{ settingsStore.isWeekend ? 'Sí' : 'No' }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Errors -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <!-- Actions -->
        <div class="modal-actions">
          <button @click="resetToDefaults" class="btn btn-secondary">
            Restaurar Valores por Defecto
          </button>
          <button @click="$emit('close')" class="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Emits
const emit = defineEmits<{
  'close': []
}>()

// Store
const settingsStore = useSettingsStore()

// Local state
const workStartTime = ref(settingsStore.workStartTime)
const workEndTime = ref(settingsStore.workEndTime)
const error = ref('')

// Computed
const remainingTimeText = computed(() => {
  const remaining = settingsStore.remainingWorkTime
  if (remaining.isAfterWork) {
    return 'Jornada terminada'
  }
  return `${remaining.hours}h ${remaining.minutes}m`
})

// Methods
async function updateWorkStart() {
  error.value = ''
  const result = await settingsStore.updateWorkStartTime(workStartTime.value)
  if (!result.success) {
    error.value = result.error!
    workStartTime.value = settingsStore.workStartTime // Reset
  }
}

async function updateWorkEnd() {
  error.value = ''
  const result = await settingsStore.updateWorkEndTime(workEndTime.value)
  if (!result.success) {
    error.value = result.error!
    workEndTime.value = settingsStore.workEndTime // Reset
  }
}

async function toggleWeekendBlocking() {
  await settingsStore.toggleWeekendBlocking()
}

async function toggleCellPhoneMode() {
  await settingsStore.toggleCellPhoneMode()
}

async function resetToDefaults() {
  if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
    await settingsStore.resetToDefaults()
    workStartTime.value = settingsStore.workStartTime
    workEndTime.value = settingsStore.workEndTime
    error.value = ''
  }
}

// Watch for external changes
watch(() => settingsStore.workStartTime, (newValue) => {
  workStartTime.value = newValue
})

watch(() => settingsStore.workEndTime, (newValue) => {
  workEndTime.value = newValue
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.settings-section:last-of-type {
  border-bottom: none;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.work-summary {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  color: #374151;
}

.toggle-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.toggle-label input[type="checkbox"] {
  margin-right: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
}

.toggle-text {
  font-weight: 500;
  color: #374151;
}

.setting-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.status-grid {
  display: grid;
  gap: 0.75rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.status-label {
  font-weight: 500;
  color: #374151;
}

.status-value {
  font-weight: 600;
  color: #111827;
}

.status-yes {
  color: #059669;
  font-weight: 600;
}

.status-no {
  color: #dc2626;
  font-weight: 600;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>