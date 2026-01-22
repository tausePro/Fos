<template>
  <div 
    class="block-card"
    :class="[
      `border-l-4 border-${block.category.toLowerCase()}`,
      block.completed ? 'completed' : '',
      isCurrentBlock ? 'current-block' : '',
      isPast && !block.completed ? 'overdue-block' : ''
    ]"
  >
    <div class="flex items-start justify-between">
      <!-- Left: Block Info -->
      <div class="flex items-start space-x-4 flex-1">
        <!-- Category Color Indicator -->
        <div 
          class="category-indicator mt-1"
          :class="categoryClasses.bg"
        ></div>
        
        <!-- Time and Description -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-3 mb-2">
            <span class="time-range">
              {{ block.startTime }} - {{ block.endTime }}
            </span>
            <span class="duration-badge">
              {{ formatDuration(blockDuration) }}
            </span>
            <span 
              class="category-badge"
              :class="categoryClasses.bg"
            >
              {{ getCategoryDisplayName(block.category) }}
            </span>
          </div>
          
          <h3 
            class="block-title"
            :class="{ 'completed': block.completed }"
          >
            {{ block.description }}
          </h3>
          
          <!-- Status Indicator -->
          <div class="status-row">
            <div v-if="isCurrentBlock" class="status-active">
              🔥 ACTIVO AHORA
            </div>
            <div v-else-if="isUpcoming" class="status-upcoming">
              ⏰ En {{ timeUntilStart }}
            </div>
            <div v-else-if="isPast && !block.completed" class="status-overdue">
              ⚠️ PERDIDO
            </div>
            <div v-else-if="block.completed" class="status-completed">
              ✅ COMPLETADO
            </div>
          </div>
          
          <!-- Actual Times (if started) -->
          <div v-if="block.actualStartTime || block.actualEndTime" class="actual-times">
            <span v-if="block.actualStartTime">
              Iniciado: {{ block.actualStartTime }}
            </span>
            <span v-if="block.actualEndTime" class="ml-3">
              Terminado: {{ block.actualEndTime }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Right: Actions -->
      <div class="flex items-center space-x-3 flex-shrink-0">
        <!-- Completion Toggle -->
        <button
          @click="$emit('toggle-completion', block)"
          :class="[
            'completion-btn',
            block.completed ? 'completed' : 'pending'
          ]"
          :title="block.completed ? 'Marcar como pendiente' : 'Marcar como completado'"
        >
          <svg v-if="block.completed" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <!-- Start Block (if not completed and not started) -->
        <button
          v-if="!block.completed && !block.actualStartTime && isCurrentOrUpcoming"
          @click="$emit('start', block)"
          class="start-btn"
          title="Iniciar bloque"
        >
          ▶ Iniciar
        </button>
        
        <!-- Menu Button -->
        <div class="relative">
          <button
            @click="showMenu = !showMenu"
            class="menu-btn"
            title="Opciones"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          <!-- Dropdown Menu -->
          <div 
            v-if="showMenu"
            class="dropdown-menu"
            @click.stop
          >
            <button @click="handleEdit" class="dropdown-item">
              ✏️ Editar
            </button>
            <button @click="handleDelete" class="dropdown-item delete">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Block } from '~/types'
import { getCategoryClasses, getCategoryDisplayName } from '~/utils/categoryHelpers'
import { getCurrentTime, formatDuration, calculateDurationMinutes, timeToMinutes } from '~/utils/timeHelpers'

// Props
const props = defineProps<{
  block: Block
}>()

// Emits
const emit = defineEmits<{
  'edit': [block: Block]
  'delete': [block: Block]
  'toggle-completion': [block: Block]
  'start': [block: Block]
}>()

// Reactive state
const showMenu = ref(false)

// Computed properties
const categoryClasses = computed(() => getCategoryClasses(props.block.category))
const blockDuration = computed(() => calculateDurationMinutes(props.block.startTime, props.block.endTime))

const currentTime = ref(getCurrentTime())
const isCurrentBlock = computed(() => {
  const current = currentTime.value
  return current >= props.block.startTime && current < props.block.endTime
})

const isUpcoming = computed(() => {
  return currentTime.value < props.block.startTime
})

const isPast = computed(() => {
  return currentTime.value >= props.block.endTime
})

const isCurrentOrUpcoming = computed(() => {
  return isCurrentBlock.value || isUpcoming.value
})

const timeUntilStart = computed(() => {
  if (!isUpcoming.value) return ''
  
  const currentMinutes = timeToMinutes(currentTime.value)
  const startMinutes = timeToMinutes(props.block.startTime)
  const diffMinutes = startMinutes - currentMinutes
  
  if (diffMinutes < 60) {
    return `${diffMinutes}m`
  } else {
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
})

// Update current time every minute
let timeInterval: NodeJS.Timeout | null = null

onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = getCurrentTime()
  }, 60000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Close menu when clicking outside
onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

function closeMenu() {
  showMenu.value = false
}

// Event handlers
function handleEdit() {
  emit('edit', props.block)
  showMenu.value = false
}

function handleDelete() {
  emit('delete', props.block)
  showMenu.value = false
}

// Helper functions
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
</script>

<style scoped>
.block-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.block-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.block-card.completed {
  background: #f8fafc;
  opacity: 0.8;
}

.block-card.current-block {
  border-left-color: #10b981 !important;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.2);
}

.block-card.overdue-block {
  border-left-color: #ef4444 !important;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.border-landingchat { border-left-color: #10b981; }
.border-estudio { border-left-color: #3b82f6; }
.border-tause { border-left-color: #f59e0b; }
.border-otro { border-left-color: #64748b; }

.category-indicator {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.time-range {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
  background: #f1f5f9;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
}

.duration-badge {
  font-size: 0.75rem;
  color: #64748b;
  background: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
}

.category-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.block-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.block-title.completed {
  text-decoration: line-through;
  color: #64748b;
}

.status-row {
  margin-top: 0.75rem;
}

.status-active {
  color: #059669;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: #f0fdf4;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  display: inline-block;
}

.status-upcoming {
  color: #2563eb;
  font-weight: 700;
  font-size: 0.75rem;
  background: #eff6ff;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  display: inline-block;
}

.status-overdue {
  color: #dc2626;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: #fef2f2;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  display: inline-block;
}

.status-completed {
  color: #059669;
  font-weight: 700;
  font-size: 0.75rem;
  background: #f0fdf4;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  display: inline-block;
}

.actual-times {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.completion-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.completion-btn.completed {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.completion-btn.pending {
  border-color: #d1d5db;
  color: #d1d5db;
  background: white;
}

.completion-btn.pending:hover {
  border-color: #10b981;
  color: #10b981;
  transform: scale(1.1);
}

.start-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.start-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.menu-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  width: 10rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 50;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.dropdown-item.delete {
  color: #dc2626;
}

.dropdown-item.delete:hover {
  background: #fef2f2;
}

@media (max-width: 640px) {
  .block-card {
    padding: 1rem;
  }
  
  .time-range {
    font-size: 0.75rem;
  }
  
  .block-title {
    font-size: 0.875rem;
  }
  
  .completion-btn {
    width: 2rem;
    height: 2rem;
  }
  
  .start-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.625rem;
  }
}
</style>