<template>
  <div class="card">
    <!-- Header -->
    <div class="blocks-header">
      <h2 class="blocks-title">
        Bloques Sagrados
      </h2>
      <div class="blocks-meta">
        <span class="blocks-count">
          {{ todaysBlocks.length }}/{{ VALIDATION_RULES.MAX_BLOCKS_PER_DAY }}
        </span>
        <button
          @click="handleAddBlockClick"
          class="add-block-btn"
        >
          <span class="btn-icon">+</span>
          <span class="btn-text">Agregar</span>
        </button>
      </div>
    </div>
    
    <!-- Blocks List -->
    <div v-if="todaysBlocks.length > 0" class="space-y-4">
      <BlocksBlockCard
        v-for="block in sortedBlocks"
        :key="block.id"
        :block="block"
        @edit="editBlock"
        @delete="deleteBlock"
        @toggle-completion="toggleBlockCompletion"
        @start="startBlock"
      />
    </div>
    
    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state-content">
        <div class="empty-state-icon">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 class="empty-state-title">
          No hay bloques programados
        </h3>
        <p class="empty-state-description">
          Crea tu primer bloque sagrado para comenzar a enfocar tu día
        </p>
        <button
          @click="handleCreateFirstBlockClick"
          class="create-first-btn"
        >
          <span class="btn-icon">✨</span>
          <span class="btn-text">Crear Primer Bloque</span>
        </button>
      </div>
    </div>
    
    <!-- Add/Edit Block Modal -->
    <Teleport to="body">
      <BlocksBlockEditor
        v-if="showAddBlock"
        :block="editingBlock"
        :validation-errors="validationErrors"
        @save="handleBlockSave"
        @cancel="handleBlockCancel"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Block } from '~/types'
import { VALIDATION_RULES } from '~/types'
import { getCurrentDate } from '~/utils/timeHelpers'
import { sortBlocksByPriority } from '~/utils/categoryHelpers'

// Stores
const blocksStore = useBlocksStore()

// Reactive state
const showAddBlock = ref(false)
const editingBlock = ref<Block | null>(null)
const validationErrors = ref<string[]>([])
const today = getCurrentDate()

// Computed properties
const todaysBlocks = computed(() => blocksStore.getBlocksByDate(today))
const sortedBlocks = computed(() => sortBlocksByPriority(todaysBlocks.value))

// Debug logging
onMounted(() => {
  console.log('SacredBlocks component mounted')
  console.log('Today:', today)
  console.log('Blocks store:', blocksStore)
  console.log('Today\'s blocks:', todaysBlocks.value)
})

// Watch showAddBlock changes
watch(showAddBlock, (newValue, oldValue) => {
  console.log('showAddBlock changed from', oldValue, 'to', newValue)
})

// Block actions
function editBlock(block: Block) {
  console.log('Edit block clicked:', block)
  editingBlock.value = block
  showAddBlock.value = false
}

async function deleteBlock(block: Block) {
  console.log('Delete block clicked:', block)
  if (confirm(`¿Estás seguro de que quieres eliminar el bloque "${block.description}"?`)) {
    const result = await blocksStore.deleteBlock(block.id)
    if (!result.success) {
      alert(`Error: ${result.error}`)
    }
  }
}

async function toggleBlockCompletion(block: Block) {
  console.log('Toggle completion clicked:', block)
  const result = await blocksStore.toggleBlockCompletion(block.id)
  if (!result.success) {
    alert(`Error: ${result.error}`)
  }
}

async function startBlock(block: Block) {
  console.log('Start block clicked:', block)
  const result = await blocksStore.startBlock(block.id)
  if (!result.success) {
    alert(`Error: ${result.error}`)
  }
}

// Modal handlers
function handleAddBlockClick() {
  console.log('Add block button clicked')
  console.log('showAddBlock before:', showAddBlock.value)
  console.log('editingBlock before:', editingBlock.value)
  showAddBlock.value = true
  console.log('showAddBlock after:', showAddBlock.value)
  
  // Force reactivity
  nextTick(() => {
    console.log('Next tick - showAddBlock:', showAddBlock.value)
  })
}

function handleCreateFirstBlockClick() {
  console.log('Create first block button clicked')
  showAddBlock.value = true
  console.log('showAddBlock set to:', showAddBlock.value)
}

async function handleBlockSave(blockData: Omit<Block, 'id' | 'completed'>) {
  try {
    console.log('handleBlockSave called with:', blockData)
    
    // Clear previous validation errors
    validationErrors.value = []
    
    let result
    
    if (editingBlock.value) {
      // Update existing block
      console.log('Updating existing block:', editingBlock.value.id)
      result = await blocksStore.updateBlock(editingBlock.value.id, blockData)
    } else {
      // Create new block
      console.log('Creating new block')
      result = await blocksStore.createBlock(blockData, false) // First try without override
    }
    
    console.log('Block save result:', result)
    
    if (result.success) {
      console.log('Block saved successfully')
      
      // Show warnings if any (e.g., LANDINGCHAT priority override)
      if (result.warnings && result.warnings.length > 0) {
        alert(`Bloque creado exitosamente.\n\n⚠️ ${result.warnings.join('\n')}`)
      }
      
      showAddBlock.value = false
      editingBlock.value = null
      validationErrors.value = []
    } else if (result.requiresOverride) {
      // Ask user if they want to override time boundaries
      const overrideMessage = `${result.errors?.join('\n') || 'Restricciones de tiempo detectadas'}\n\n${result.warnings?.join('\n') || ''}\n\n¿Deseas crear el bloque de todas formas?`
      
      if (confirm(overrideMessage)) {
        console.log('User confirmed override, trying again with override enabled')
        const overrideResult = await blocksStore.createBlock(blockData, true)
        
        if (overrideResult.success) {
          alert(`Bloque creado con override.\n\n⚠️ ${overrideResult.warnings?.join('\n') || 'Límites de tiempo ignorados'}`)
          showAddBlock.value = false
          editingBlock.value = null
          validationErrors.value = []
        } else {
          validationErrors.value = overrideResult.errors || ['Error al crear bloque con override']
        }
      }
    } else {
      // Set validation errors to be displayed in the modal
      console.log('Block save failed with errors:', result.errors)
      validationErrors.value = result.errors || ['Error desconocido']
    }
  } catch (error) {
    console.error('Error saving block:', error)
    validationErrors.value = ['Error inesperado al guardar el bloque']
  }
}

function handleBlockCancel() {
  console.log('Block creation cancelled')
  showAddBlock.value = false
  editingBlock.value = null
  validationErrors.value = []
}
</script>

<style scoped>
/* Mobile-optimized Sacred Blocks */
.blocks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.blocks-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.blocks-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.blocks-count {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
  background: #f1f5f9;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

.add-block-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.add-block-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.add-block-btn .btn-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.add-block-btn .btn-text {
  font-size: 0.875rem;
}

/* Empty State */
.empty-state {
  padding: 2rem 1rem;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.empty-state-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.empty-state-description {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 2rem;
}

.create-first-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 16px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.create-first-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.create-first-btn .btn-icon {
  font-size: 1.25rem;
  line-height: 1;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .blocks-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .blocks-meta {
    justify-content: space-between;
  }
  
  .add-block-btn {
    flex: 1;
    justify-content: center;
    padding: 1rem;
  }
  
  .blocks-title {
    text-align: center;
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: 1.5rem 0.5rem;
  }
  
  .empty-state-icon {
    width: 3rem;
    height: 3rem;
  }
  
  .empty-state-title {
    font-size: 1.125rem;
  }
  
  .create-first-btn {
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
  }
  
  .add-block-btn .btn-text {
    display: none;
  }
  
  .add-block-btn {
    padding: 0.75rem;
    min-width: 44px;
    justify-content: center;
  }
}
</style>