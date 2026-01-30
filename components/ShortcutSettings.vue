<template>
  <div class="shortcut-settings">
    <h3 class="text-lg font-semibold mb-4">Global Shortcuts</h3>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Personaliza los atajos de teclado globales. Los atajos funcionan incluso cuando la app está en segundo plano.
    </p>

    <div class="space-y-4">
      <div
        v-for="shortcut in shortcuts"
        :key="shortcut.id"
        class="shortcut-item p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h4 class="font-medium text-gray-900 dark:text-gray-100">
              {{ shortcut.name }}
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ shortcut.description }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <div class="shortcut-display">
              <kbd
                class="px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              >
                {{ shortcut.currentShortcut }}
              </kbd>
            </div>

            <button
              v-if="shortcut.currentShortcut !== shortcut.defaultShortcut"
              @click="resetShortcut(shortcut.id)"
              class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              title="Restaurar atajo por defecto"
            >
              Reset
            </button>

            <button
              @click="startEditing(shortcut.id)"
              class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Cambiar
            </button>
          </div>
        </div>

        <!-- Edit mode -->
        <div
          v-if="editingShortcut === shortcut.id"
          class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        >
          <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Presiona la combinación de teclas que deseas usar:
          </p>
          <div class="flex items-center gap-3">
            <input
              ref="shortcutInput"
              v-model="newShortcut"
              @keydown.prevent="captureShortcut"
              type="text"
              readonly
              placeholder="Presiona las teclas..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              @click="saveNewShortcut(shortcut.id)"
              :disabled="!newShortcut"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Guardar
            </button>
            <button
              @click="cancelEditing"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p v-if="conflictError" class="text-sm text-red-600 dark:text-red-400 mt-2">
            {{ conflictError }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-6 flex justify-end">
      <button
        @click="resetAllShortcuts"
        class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Restaurar todos los atajos por defecto
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const { shortcuts, updateShortcut, resetShortcut: resetShortcutFn, resetAllShortcuts: resetAllShortcutsFn } = useGlobalShortcuts()

const editingShortcut = ref<string | null>(null)
const newShortcut = ref('')
const conflictError = ref('')
const shortcutInput = ref<HTMLInputElement | null>(null)

const startEditing = async (id: string) => {
  editingShortcut.value = id
  newShortcut.value = ''
  conflictError.value = ''
  
  await nextTick()
  shortcutInput.value?.focus()
}

const cancelEditing = () => {
  editingShortcut.value = null
  newShortcut.value = ''
  conflictError.value = ''
}

const captureShortcut = (event: KeyboardEvent) => {
  event.preventDefault()
  
  const keys: string[] = []
  
  // Capture modifiers
  if (event.metaKey || event.ctrlKey) keys.push('Cmd')
  if (event.shiftKey) keys.push('Shift')
  if (event.altKey) keys.push('Alt')
  
  // Capture main key (ignore modifier keys themselves)
  if (!['Meta', 'Control', 'Shift', 'Alt'].includes(event.key)) {
    keys.push(event.key.toUpperCase())
  }
  
  if (keys.length > 1) {
    newShortcut.value = keys.join('+')
  }
}

const saveNewShortcut = (id: string) => {
  if (!newShortcut.value) return
  
  const success = updateShortcut(id, newShortcut.value)
  
  if (success) {
    conflictError.value = ''
    cancelEditing()
  } else {
    conflictError.value = 'Este atajo ya está en uso por otro comando'
  }
}

const resetShortcut = (id: string) => {
  resetShortcutFn(id)
}

const resetAllShortcuts = () => {
  if (confirm('¿Estás seguro de que quieres restaurar todos los atajos a sus valores por defecto?')) {
    resetAllShortcutsFn()
  }
}
</script>

<style scoped>
.shortcut-settings {
  @apply w-full;
}

.shortcut-item {
  @apply transition-all duration-200;
}

.shortcut-item:hover {
  @apply shadow-md;
}

kbd {
  @apply font-mono;
}
</style>
