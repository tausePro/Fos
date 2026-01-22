<template>
  <div class="priority-card">
    <!-- Header with icon and completion status -->
    <div class="priority-header">
      <div class="priority-title">
        <div class="priority-icon">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>
        <h2>Tu Prioridad de Hoy</h2>
      </div>
      
      <div v-if="priority?.completed" class="completion-badge">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <span>Completada</span>
      </div>
    </div>
    
    <!-- Priority Input/Display -->
    <div v-if="!priority || isEditing" class="priority-input-section">
      <div class="input-container">
        <textarea
          v-model="priorityText"
          :placeholder="priority ? 'Editar tu prioridad...' : '¿Cuál es tu prioridad más importante para hoy?'"
          class="priority-textarea"
          rows="3"
          :maxlength="VALIDATION_RULES.PRIORITY_MAX_LENGTH"
          @keydown.enter.prevent="savePriority"
          @keydown.escape="cancelEdit"
        />
        <div class="char-counter">
          {{ priorityText.length }}/{{ VALIDATION_RULES.PRIORITY_MAX_LENGTH }}
        </div>
      </div>
      
      <div class="input-actions">
        <div class="action-buttons">
          <button
            @click="savePriority"
            :disabled="!priorityText.trim() || priorityText.length > VALIDATION_RULES.PRIORITY_MAX_LENGTH"
            class="btn btn-primary"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ priority ? 'Actualizar' : 'Guardar' }}
          </button>
          <button
            v-if="priority"
            @click="cancelEdit"
            class="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>
    
    <!-- Priority Display -->
    <div v-else class="priority-display-section">
      <div class="priority-content">
        <div class="priority-text">
          {{ priority.text }}
        </div>
        <div class="priority-motivation">
          💪 ¡Esta es tu misión de hoy! Mantén el enfoque en lo que realmente importa.
        </div>
      </div>
      
      <div class="priority-actions">
        <button
          @click="toggleCompletion"
          :class="[
            'btn completion-btn',
            priority.completed ? 'btn-success completed' : 'btn-primary'
          ]"
        >
          <svg v-if="priority.completed" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4" />
          </svg>
          {{ priority.completed ? '¡Completada!' : 'Marcar como completada' }}
        </button>
        
        <button
          @click="startEdit"
          class="btn btn-secondary edit-btn"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DailyPriority } from '~/types'
import { VALIDATION_RULES } from '~/types'
import { getCurrentDate } from '~/utils/timeHelpers'
import { validatePriorityText } from '~/utils/validationHelpers'

// Reactive state
const priorityText = ref('')
const isEditing = ref(false)
const error = ref('')
const priority = ref<DailyPriority | null>(null)

// Get today's date
const today = getCurrentDate()

// Load priority on mount
onMounted(() => {
  loadTodaysPriority()
})

// Load today's priority from localStorage
function loadTodaysPriority() {
  try {
    if (process.client) {
      const stored = localStorage.getItem('felipe-os-priorities')
      
      if (stored) {
        const priorities: DailyPriority[] = JSON.parse(stored)
        const todaysPriority = priorities.find(p => p.date === today)
        
        if (todaysPriority) {
          priority.value = todaysPriority
          priorityText.value = todaysPriority.text
        }
      }
    }
  } catch (error) {
    console.error('Error loading priority:', error)
  }
}

// Save priority to localStorage
async function savePriority() {
  error.value = ''
  
  // Validate input
  const validation = validatePriorityText(priorityText.value.trim())
  if (!validation.isValid) {
    error.value = validation.error!
    return
  }
  
  try {
    if (process.client) {
      // Load existing priorities
      let priorities: DailyPriority[] = []
      const stored = localStorage.getItem('felipe-os-priorities')
      if (stored) {
        priorities = JSON.parse(stored)
      }
      
      // Update or create priority
      const existingIndex = priorities.findIndex(p => p.date === today)
      const newPriority: DailyPriority = {
        date: today,
        text: priorityText.value.trim(),
        completed: priority.value?.completed || false
      }
      
      if (existingIndex >= 0) {
        priorities[existingIndex] = newPriority
      } else {
        priorities.push(newPriority)
      }
      
      // Save to storage
      localStorage.setItem('felipe-os-priorities', JSON.stringify(priorities))
      
      // Update local state
      priority.value = newPriority
      isEditing.value = false
    }
    
  } catch (err) {
    console.error('Error saving priority:', err)
    error.value = 'Error al guardar la prioridad'
  }
}

// Toggle priority completion
async function toggleCompletion() {
  if (!priority.value) return
  
  try {
    if (process.client) {
      // Load existing priorities
      let priorities: DailyPriority[] = []
      const stored = localStorage.getItem('felipe-os-priorities')
      if (stored) {
        priorities = JSON.parse(stored)
      }
      
      // Update completion status
      const existingIndex = priorities.findIndex(p => p.date === today)
      if (existingIndex >= 0) {
        priorities[existingIndex].completed = !priorities[existingIndex].completed
        priority.value.completed = priorities[existingIndex].completed
        
        // Save to storage
        localStorage.setItem('felipe-os-priorities', JSON.stringify(priorities))
      }
    }
    
  } catch (err) {
    console.error('Error toggling completion:', err)
    error.value = 'Error al actualizar el estado'
  }
}

// Start editing
function startEdit() {
  isEditing.value = true
  priorityText.value = priority.value?.text || ''
  error.value = ''
}

// Cancel editing
function cancelEdit() {
  isEditing.value = false
  priorityText.value = priority.value?.text || ''
  error.value = ''
}
</script>

<style scoped>
.priority-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.priority-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="90" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  pointer-events: none;
}

.priority-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.priority-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.priority-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 0.75rem;
  backdrop-filter: blur(10px);
}

.priority-title h2 {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.completion-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(16, 185, 129, 0.9);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.priority-input-section {
  position: relative;
  z-index: 1;
}

.input-container {
  position: relative;
  margin-bottom: 1.5rem;
}

.priority-textarea {
  width: 100%;
  padding: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  font-size: 1.125rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
  resize: none;
  transition: all 0.3s ease;
}

.priority-textarea::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.priority-textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.char-counter {
  position: absolute;
  bottom: 0.75rem;
  right: 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.error-message {
  background: rgba(239, 68, 68, 0.9);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.priority-display-section {
  position: relative;
  z-index: 1;
}

.priority-content {
  margin-bottom: 2rem;
}

.priority-text {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.priority-motivation {
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.9;
  font-style: italic;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.priority-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.completion-btn {
  font-size: 1.125rem;
  padding: 1rem 2rem;
  font-weight: 700;
  min-width: 200px;
}

.completion-btn.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  animation: pulse 2s infinite;
}

.edit-btn {
  padding: 1rem 1.5rem;
}

.btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-color: transparent;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: transparent;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@media (max-width: 768px) {
  .priority-card {
    padding: 1.5rem;
    border-radius: 16px;
  }
  
  .priority-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .priority-title h2 {
    font-size: 1.25rem;
  }
  
  .priority-text {
    font-size: 1.25rem;
  }
  
  .priority-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .completion-btn {
    min-width: auto;
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .edit-btn {
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
  }
}

@media (max-width: 480px) {
  .priority-card {
    padding: 1.25rem;
  }
  
  .priority-actions {
    gap: 0.5rem;
  }
  
  .completion-btn {
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
    min-height: 44px;
  }
  
  .edit-btn {
    padding: 0.5rem 0.875rem;
    font-size: 0.75rem;
    min-height: 40px;
  }
  
  .completion-btn .w-5,
  .edit-btn .w-4 {
    width: 1rem;
    height: 1rem;
  }
}
</style>