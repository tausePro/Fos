<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="text-xl font-bold">
          {{ block ? 'Editar Bloque' : 'Nuevo Bloque Sagrado' }}
        </h3>
        <button @click="$emit('cancel')" class="close-btn">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- Description -->
        <div class="form-group">
          <label for="description">Descripción</label>
          <input
            id="description"
            v-model="formData.description"
            type="text"
            :maxlength="50"
            placeholder="¿En qué vas a trabajar?"
            required
          />
          <div class="char-count">
            {{ formData.description.length }}/50
          </div>
        </div>
        
        <!-- Time Range -->
        <div class="form-row">
          <div class="form-group">
            <label for="startTime">Hora de inicio</label>
            <input
              id="startTime"
              v-model="formData.startTime"
              type="time"
              required
            />
          </div>
          <div class="form-group">
            <label for="endTime">Hora de fin</label>
            <input
              id="endTime"
              v-model="formData.endTime"
              type="time"
              required
            />
          </div>
        </div>
        
        <!-- Duration Display -->
        <div v-if="duration > 0" class="duration-display">
          Duración: {{ Math.floor(duration / 60) }}h {{ duration % 60 }}m
        </div>
        
        <!-- Category -->
        <div class="form-group">
          <label>Categoría</label>
          <div class="category-buttons">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              @click="formData.category = category"
              :class="[
                'category-btn',
                `category-${category.toLowerCase()}`,
                { active: formData.category === category }
              ]"
            >
              {{ getCategoryDisplayName(category) }}
            </button>
          </div>
        </div>
        
        <!-- Errors -->
        <div v-if="errors.length > 0" class="error-list">
          <ul>
            <li v-for="error in errors" :key="error" class="error-item">
              {{ error }}
            </li>
          </ul>
        </div>
        
        <!-- Actions -->
        <div class="modal-actions">
          <button type="button" @click="$emit('cancel')" class="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!canSave">
            {{ block ? 'Actualizar' : 'Crear' }} Bloque
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Block, Category } from '~/types'
import { getCurrentDate } from '~/utils/timeHelpers'
import { getCategoryDisplayName } from '~/utils/categoryHelpers'

// Props
const props = defineProps<{
  block?: Block | null
  validationErrors?: string[]
}>()

// Emits
const emit = defineEmits<{
  'save': [blockData: Omit<Block, 'id' | 'completed'>]
  'cancel': []
}>()

// Categories
const categories: Category[] = ['LANDINGCHAT', 'ESTUDIO', 'TAUSE', 'OTRO']

// Form data
const formData = reactive({
  description: props.block?.description || '',
  startTime: props.block?.startTime || '09:00',
  endTime: props.block?.endTime || '10:30',
  category: props.block?.category || 'LANDINGCHAT' as Category,
  date: props.block?.date || getCurrentDate()
})

// Reactive state
const errors = ref<string[]>([])

// Watch for external validation errors
watch(() => props.validationErrors, (newErrors) => {
  if (newErrors && newErrors.length > 0) {
    errors.value = [...newErrors]
  }
}, { immediate: true })

// Computed properties
const duration = computed(() => {
  if (!formData.startTime || !formData.endTime) return 0
  
  const start = formData.startTime.split(':').map(Number)
  const end = formData.endTime.split(':').map(Number)
  
  const startMinutes = start[0] * 60 + start[1]
  const endMinutes = end[0] * 60 + end[1]
  
  return Math.max(0, endMinutes - startMinutes)
})

const canSave = computed(() => {
  return formData.description.trim().length > 0 && 
         formData.startTime && 
         formData.endTime && 
         duration.value > 0
})

// Watch for time changes to suggest end time
watch(() => formData.startTime, (newStartTime) => {
  if (newStartTime && !props.block) {
    // Only auto-suggest for new blocks
    const start = newStartTime.split(':').map(Number)
    const startMinutes = start[0] * 60 + start[1]
    const endMinutes = startMinutes + 90 // 90 minutes default
    
    const hours = Math.floor(endMinutes / 60)
    const minutes = endMinutes % 60
    
    formData.endTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
})

// Methods
function handleSubmit() {
  errors.value = []
  
  // Basic validation
  if (!formData.description.trim()) {
    errors.value.push('La descripción es requerida')
    return
  }
  
  if (formData.description.length > 50) {
    errors.value.push('La descripción no puede exceder 50 caracteres')
    return
  }
  
  if (duration.value < 30) {
    errors.value.push('El bloque debe durar al menos 30 minutos')
    return
  }
  
  if (duration.value > 120) {
    errors.value.push('El bloque no puede durar más de 2 horas')
    return
  }
  
  // If no validation errors, emit save event
  if (errors.value.length === 0) {
    console.log('Emitting save event with data:', formData)
    emit('save', { ...formData })
  }
}

// Auto-focus description field
onMounted(() => {
  console.log('BlockEditor mounted')
  const descInput = document.getElementById('description')
  if (descInput) {
    descInput.focus()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 10000;
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

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.duration-display {
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.category-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.category-btn {
  padding: 0.75rem;
  border: 2px solid transparent;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn.category-landingchat {
  background: #10b981;
  color: white;
}

.category-btn.category-estudio {
  background: #3b82f6;
  color: white;
}

.category-btn.category-tause {
  background: #f59e0b;
  color: white;
}

.category-btn.category-otro {
  background: #6b7280;
  color: white;
}

.category-btn:not(.active) {
  opacity: 0.6;
}

.category-btn.active {
  border-color: #111827;
  transform: scale(1.02);
}

.error-list {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.error-item {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.error-item:last-child {
  margin-bottom: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
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
  
  .category-buttons {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>