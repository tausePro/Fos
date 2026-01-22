<template>
  <div class="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <span class="mr-2">🔧</span>
      Diagnóstico del Sistema
    </h3>

    <!-- Overall Health Status -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Estado General</span>
        <div class="flex items-center">
          <div 
            class="w-3 h-3 rounded-full mr-2"
            :class="overallHealthColor"
          ></div>
          <span class="text-sm" :class="overallHealthTextColor">
            {{ overallHealthText }}
          </span>
        </div>
      </div>
    </div>

    <!-- Storage Quota -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700">Almacenamiento</span>
        <span class="text-sm text-gray-600">
          {{ formatBytes(storageStatus?.quota.used || 0) }} / {{ formatBytes(5 * 1024 * 1024) }}
        </span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="h-2 rounded-full transition-all duration-300"
          :class="storageBarColor"
          :style="{ width: `${Math.min(storageStatus?.quota.percentage || 0, 100)}%` }"
        ></div>
      </div>
      <p class="text-xs text-gray-500 mt-1">
        {{ (storageStatus?.quota.percentage || 0).toFixed(1) }}% utilizado
      </p>
    </div>

    <!-- Store Status -->
    <div class="space-y-3 mb-6">
      <h4 class="text-sm font-medium text-gray-700">Estado de Stores</h4>
      
      <div v-for="(store, name) in storeStatuses" :key="name" class="flex items-center justify-between">
        <span class="text-sm text-gray-600 capitalize">{{ name }}</span>
        <div class="flex items-center">
          <div 
            class="w-2 h-2 rounded-full mr-2"
            :class="store.usingFallback ? 'bg-orange-400' : 'bg-green-400'"
          ></div>
          <span class="text-xs" :class="store.usingFallback ? 'text-orange-600' : 'text-green-600'">
            {{ store.usingFallback ? 'Temporal' : 'Sincronizado' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Data Integrity -->
    <div v-if="dataIntegrity" class="mb-6">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Integridad de Datos</h4>
      <div class="text-sm text-gray-600">
        <div class="flex items-center justify-between">
          <span>Estado</span>
          <span :class="dataIntegrity.isValid ? 'text-green-600' : 'text-orange-600'">
            {{ dataIntegrity.isValid ? 'Válido' : 'Problemas detectados' }}
          </span>
        </div>
        <div v-if="dataIntegrity.fixed > 0" class="text-xs text-blue-600 mt-1">
          {{ dataIntegrity.fixed }} problemas corregidos automáticamente
        </div>
        <div v-if="dataIntegrity.issues.length > 0" class="text-xs text-orange-600 mt-1">
          <ul class="list-disc list-inside">
            <li v-for="issue in dataIntegrity.issues" :key="issue">{{ issue }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-wrap gap-2">
      <button
        @click="runDiagnostics"
        :disabled="loading"
        class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
      >
        {{ loading ? 'Analizando...' : 'Ejecutar Diagnóstico' }}
      </button>
      
      <button
        v-if="!storageStatus?.overallHealth"
        @click="retrySync"
        class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
      >
        Sincronizar Datos
      </button>
      
      <button
        v-if="(storageStatus?.quota.percentage || 0) > 80"
        @click="cleanupData"
        class="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
      >
        Limpiar Datos Antiguos
      </button>
      
      <button
        @click="exportData"
        class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
      >
        Exportar Datos
      </button>
    </div>

    <!-- Last Check -->
    <div v-if="lastCheck" class="mt-4 text-xs text-gray-500">
      Última verificación: {{ formatTime(lastCheck) }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { getGlobalStorageStatus, retryLastOperation, cleanupOldData } = useErrorNotifications()
const { blocksStore } = useStores()

// State
const loading = ref(false)
const storageStatus = ref(null)
const dataIntegrity = ref(null)
const lastCheck = ref<Date | null>(null)

// Computed
const storeStatuses = computed(() => {
  return storageStatus.value?.stores || {}
})

const overallHealthColor = computed(() => {
  if (!storageStatus.value) return 'bg-gray-400'
  return storageStatus.value.overallHealth ? 'bg-green-400' : 'bg-orange-400'
})

const overallHealthTextColor = computed(() => {
  if (!storageStatus.value) return 'text-gray-600'
  return storageStatus.value.overallHealth ? 'text-green-600' : 'text-orange-600'
})

const overallHealthText = computed(() => {
  if (!storageStatus.value) return 'Verificando...'
  return storageStatus.value.overallHealth ? 'Saludable' : 'Requiere Atención'
})

const storageBarColor = computed(() => {
  const percentage = storageStatus.value?.quota.percentage || 0
  if (percentage > 90) return 'bg-red-500'
  if (percentage > 80) return 'bg-orange-500'
  if (percentage > 60) return 'bg-yellow-500'
  return 'bg-green-500'
})

// Methods
async function runDiagnostics() {
  loading.value = true
  
  try {
    // Get storage status
    storageStatus.value = await getGlobalStorageStatus()
    
    // Check data integrity
    dataIntegrity.value = await blocksStore.validateDataIntegrity()
    
    lastCheck.value = new Date()
  } catch (error) {
    console.error('Error running diagnostics:', error)
  } finally {
    loading.value = false
  }
}

async function retrySync() {
  await retryLastOperation()
  await runDiagnostics()
}

async function cleanupData() {
  await cleanupOldData()
  await runDiagnostics()
}

function exportData() {
  const data = {
    blocks: blocksStore.exportBlocks(),
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `felipe-os-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  URL.revokeObjectURL(url)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-CO', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

// Initialize
onMounted(() => {
  runDiagnostics()
  
  // Auto-refresh every 60 seconds
  setInterval(runDiagnostics, 60000)
})
</script>