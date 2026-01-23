<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Configuración</h1>
            <p class="text-gray-600 mt-1">Gestiona tu configuración y diagnósticos del sistema</p>
          </div>
          <NuxtLink 
            to="/"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Dashboard
          </NuxtLink>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- User Settings -->
        <div class="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="mr-2">⚙️</span>
            Configuración de Usuario
          </h3>

          <div class="space-y-6">
            <!-- Work Hours -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Horario de Trabajo
              </label>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Inicio</label>
                  <input
                    v-model="workStartTime"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    @change="updateWorkStartTime"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Fin</label>
                  <input
                    v-model="workEndTime"
                    type="time"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    @change="updateWorkEndTime"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Total: {{ settingsStore.totalWorkHours }} horas por día
              </p>
            </div>

            <!-- Weekend Blocking -->
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700">Bloquear Fines de Semana</label>
                <p class="text-xs text-gray-500">Previene planificar bloques en sábados y domingos</p>
              </div>
              <button
                @click="settingsStore.toggleWeekendBlocking()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="settingsStore.weekendBlocking ? 'bg-blue-600' : 'bg-gray-200'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settingsStore.weekendBlocking ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <!-- Cell Phone Mode -->
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700">Modo Celular</label>
                <p class="text-xs text-gray-500">Calcula zonas rojas para minimizar uso del teléfono</p>
              </div>
              <button
                @click="settingsStore.toggleCellPhoneMode()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                :class="settingsStore.cellPhoneMode ? 'bg-blue-600' : 'bg-gray-200'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="settingsStore.cellPhoneMode ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <!-- Reset Settings -->
            <div class="pt-4 border-t border-gray-200">
              <button
                @click="resetSettings"
                class="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Restaurar Configuración por Defecto
              </button>
            </div>
          </div>
        </div>

        <!-- System Diagnostics -->
        <div class="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span class="mr-2">🔧</span>
            Diagnósticos del Sistema
          </h3>
          
          <!-- Test Notifications -->
          <div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-2">Prueba de Notificaciones</h4>
            <p class="text-sm text-gray-600 mb-3">Verifica que las notificaciones nativas funcionen correctamente</p>
            <button
              @click="testNotifications"
              class="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Probar Notificación
            </button>
          </div>
          
          <SystemDiagnostics />
        </div>
      </div>

      <!-- Data Management -->
      <div class="mt-8 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span class="mr-2">📁</span>
          Gestión de Datos
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center p-4 border border-gray-200 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Exportar Datos</h4>
            <p class="text-sm text-gray-600 mb-3">Descarga una copia de seguridad de todos tus datos</p>
            <button
              @click="exportAllData"
              class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Exportar
            </button>
          </div>

          <div class="text-center p-4 border border-gray-200 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Importar Datos</h4>
            <p class="text-sm text-gray-600 mb-3">Restaura datos desde una copia de seguridad</p>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="importData"
            />
            <button
              @click="$refs.fileInput.click()"
              class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Importar
            </button>
          </div>

          <div class="text-center p-4 border border-gray-200 rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Limpiar Datos</h4>
            <p class="text-sm text-gray-600 mb-3">Elimina datos antiguos para liberar espacio</p>
            <button
              @click="cleanupOldData"
              class="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <!-- Error Messages -->
      <div v-if="errorMessage" class="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
        <p class="text-red-700">{{ errorMessage }}</p>
      </div>

      <!-- Success Messages -->
      <div v-if="successMessage" class="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
        <p class="text-green-700">{{ successMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { settingsStore, blocksStore, reviewsStore } = useStores()
const { cleanupOldData } = useErrorNotifications()
const { testNotification } = useNotifications()

// Local state for form inputs
const workStartTime = ref(settingsStore.workStartTime)
const workEndTime = ref(settingsStore.workEndTime)
const errorMessage = ref('')
const successMessage = ref('')

// Watch for changes in store
watch(() => settingsStore.workStartTime, (newValue) => {
  workStartTime.value = newValue
})

watch(() => settingsStore.workEndTime, (newValue) => {
  workEndTime.value = newValue
})

// Methods
async function updateWorkStartTime() {
  const result = await settingsStore.updateWorkStartTime(workStartTime.value)
  if (!result.success) {
    errorMessage.value = result.error || 'Error al actualizar hora de inicio'
    workStartTime.value = settingsStore.workStartTime // Reset to current value
  } else {
    errorMessage.value = ''
    successMessage.value = 'Hora de inicio actualizada'
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
}

async function updateWorkEndTime() {
  const result = await settingsStore.updateWorkEndTime(workEndTime.value)
  if (!result.success) {
    errorMessage.value = result.error || 'Error al actualizar hora de fin'
    workEndTime.value = settingsStore.workEndTime // Reset to current value
  } else {
    errorMessage.value = ''
    successMessage.value = 'Hora de fin actualizada'
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
}

async function resetSettings() {
  if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
    await settingsStore.resetToDefaults()
    successMessage.value = 'Configuración restaurada a valores por defecto'
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
}

async function testNotifications() {
  try {
    await testNotification()
    successMessage.value = 'Notificación de prueba enviada'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (error) {
    errorMessage.value = `Error al enviar notificación: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

function exportAllData() {
  const data = {
    blocks: blocksStore.exportBlocks(),
    reviews: reviewsStore.reviews,
    settings: {
      workStartTime: settingsStore.workStartTime,
      workEndTime: settingsStore.workEndTime,
      weekendBlocking: settingsStore.weekendBlocking,
      cellPhoneMode: settingsStore.cellPhoneMode
    },
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `felipe-os-complete-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
  
  successMessage.value = 'Datos exportados exitosamente'
  setTimeout(() => { successMessage.value = '' }, 3000)
}

async function importData(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Validate data structure
    if (!data.blocks || !Array.isArray(data.blocks)) {
      throw new Error('Formato de archivo inválido: falta array de bloques')
    }
    
    if (confirm('¿Estás seguro de que quieres importar estos datos? Esto sobrescribirá tus datos actuales.')) {
      // Import blocks
      const importResult = await blocksStore.importBlocks(data.blocks)
      if (!importResult.success) {
        throw new Error(importResult.error || 'Error al importar bloques')
      }
      
      // Import settings if available
      if (data.settings) {
        Object.assign(settingsStore, data.settings)
        await settingsStore.saveSettings()
      }
      
      successMessage.value = `Datos importados exitosamente: ${data.blocks.length} bloques`
      setTimeout(() => { successMessage.value = '' }, 5000)
    }
  } catch (error) {
    errorMessage.value = `Error al importar datos: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 5000)
  }
  
  // Reset file input
  ;(event.target as HTMLInputElement).value = ''
}

// Clear messages when component unmounts
onUnmounted(() => {
  errorMessage.value = ''
  successMessage.value = ''
})
</script>