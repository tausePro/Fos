<template>
  <div>
    <style>
      .settings-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
        padding: 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .settings-content {
        max-width: 64rem;
        margin: 0 auto;
      }
      .settings-header {
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .settings-title {
        font-size: 2rem;
        font-weight: 800;
        color: #1e293b;
        margin-bottom: 0.5rem;
      }
      .settings-subtitle {
        color: #64748b;
        margin: 0;
      }
      .back-button {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s ease;
        display: inline-block;
        border: none;
        cursor: pointer;
      }
      .back-button:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      }
      .settings-card {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 2rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      }
      .card-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
      }
      .card-title span {
        margin-right: 0.5rem;
      }
      .form-group {
        margin-bottom: 2rem;
      }
      .form-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.75rem;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .form-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s ease;
      }
      .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .toggle-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        background: #f8fafc;
        border-radius: 12px;
        margin-bottom: 1rem;
      }
      .toggle-info h4 {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.25rem 0;
      }
      .toggle-info p {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
      }
      .toggle-switch {
        position: relative;
        display: inline-flex;
        height: 1.5rem;
        width: 2.75rem;
        align-items: center;
        border-radius: 9999px;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
      }
      .toggle-switch.active {
        background-color: #3b82f6;
      }
      .toggle-switch.inactive {
        background-color: #d1d5db;
      }
      .toggle-knob {
        display: inline-block;
        height: 1rem;
        width: 1rem;
        border-radius: 50%;
        background: white;
        transition: transform 0.2s ease;
      }
      .toggle-knob.active {
        transform: translateX(1.5rem);
      }
      .toggle-knob.inactive {
        transform: translateX(0.25rem);
      }
      .notification-test {
        padding: 1rem;
        background: #f0f9ff;
        border: 2px solid #0ea5e9;
        border-radius: 12px;
        margin-bottom: 1rem;
      }
      .test-button {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .test-button:hover {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      }
      .reset-button {
        width: 100%;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        background: #f3f4f6;
        color: #374151;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .reset-button:hover {
        background: #e5e7eb;
      }
      .data-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
      }
      .data-card {
        text-align: center;
        padding: 1.5rem;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        background: white;
      }
      .data-button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
      }
      .data-button.export {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
      }
      .data-button.import {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
      }
      .data-button.cleanup {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }
      .message {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 12px;
      }
      .message.error {
        background: #fef2f2;
        border: 2px solid #fecaca;
        color: #dc2626;
      }
      .message.success {
        background: #f0fdf4;
        border: 2px solid #bbf7d0;
        color: #059669;
      }
    </style>

    <div class="settings-container">
      <div class="settings-content">
        <!-- Header -->
        <div class="settings-header">
          <div>
            <h1 class="settings-title">Configuración</h1>
            <p class="settings-subtitle">Gestiona tu configuración y diagnósticos del sistema</p>
          </div>
          <button class="back-button" onclick="window.location.href='/'">
            Volver al Dashboard
          </button>
        </div>

        <!-- User Settings -->
        <div class="settings-card">
          <h3 class="card-title">
            <span>⚙️</span>
            Configuración de Usuario
          </h3>

          <!-- Work Hours -->
          <div class="form-group">
            <label class="form-label">Horario de Trabajo</label>
            <div class="form-grid">
              <div>
                <label style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Inicio</label>
                <input
                  v-model="workStartTime"
                  type="time"
                  class="form-input"
                  @change="updateWorkStartTime"
                />
              </div>
              <div>
                <label style="display: block; font-size: 0.75rem; color: #6b7280; margin-bottom: 0.25rem;">Fin</label>
                <input
                  v-model="workEndTime"
                  type="time"
                  class="form-input"
                  @change="updateWorkEndTime"
                />
              </div>
            </div>
            <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">
              Total: {{ settingsStore.totalWorkHours }} horas por día
            </p>
          </div>

          <!-- Weekend Blocking -->
          <div class="toggle-container">
            <div class="toggle-info">
              <h4>Bloquear Fines de Semana</h4>
              <p>Previene planificar bloques en sábados y domingos</p>
            </div>
            <button
              class="toggle-switch"
              :class="settingsStore.weekendBlocking ? 'active' : 'inactive'"
              @click="handleToggleWeekend"
            >
              <span
                class="toggle-knob"
                :class="settingsStore.weekendBlocking ? 'active' : 'inactive'"
              ></span>
            </button>
          </div>

          <!-- Cell Phone Mode -->
          <div class="toggle-container">
            <div class="toggle-info">
              <h4>Modo Celular</h4>
              <p>Calcula zonas rojas para minimizar uso del teléfono</p>
            </div>
            <button
              class="toggle-switch"
              :class="settingsStore.cellPhoneMode ? 'active' : 'inactive'"
              @click="handleToggleCellphone"
            >
              <span
                class="toggle-knob"
                :class="settingsStore.cellPhoneMode ? 'active' : 'inactive'"
              ></span>
            </button>
          </div>

          <!-- Test Notifications -->
          <div class="notification-test">
            <h4 style="font-weight: 600; color: #1e293b; margin-bottom: 0.5rem; display: flex; align-items: center;">
              <span style="margin-right: 0.5rem;">🔔</span>
              Prueba de Notificaciones
            </h4>
            <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">Verifica que las notificaciones nativas funcionen correctamente</p>
            <button class="test-button" @click="handleTestNotifications">
              🧪 Probar Notificación
            </button>
          </div>

          <!-- Reset Settings -->
          <div style="padding-top: 1rem; border-top: 2px solid #e5e7eb;">
            <button class="reset-button" @click="handleResetSettings">
              Restaurar Configuración por Defecto
            </button>
          </div>
        </div>

        <!-- System Diagnostics -->
        <div class="settings-card">
          <h3 class="card-title">
            <span>🔧</span>
            Diagnósticos del Sistema
          </h3>
          <SystemDiagnostics />
        </div>

        <!-- Data Management -->
        <div class="settings-card">
          <h3 class="card-title">
            <span>📁</span>
            Gestión de Datos
          </h3>

          <div class="data-grid">
            <div class="data-card">
              <h4 style="font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">Exportar Datos</h4>
              <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">Descarga una copia de seguridad de todos tus datos</p>
              <button class="data-button export" @click="handleExportData">
                Exportar
              </button>
            </div>

            <div class="data-card">
              <h4 style="font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">Importar Datos</h4>
              <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">Restaura datos desde una copia de seguridad</p>
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                style="display: none;"
                @change="importData"
              />
              <button class="data-button import" @click="handleImportClick">
                Importar
              </button>
            </div>

            <div class="data-card">
              <h4 style="font-weight: 600; color: #1e293b; margin-bottom: 0.5rem;">Limpiar Datos</h4>
              <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">Elimina datos antiguos para liberar espacio</p>
              <button class="data-button cleanup" @click="handleCleanupData">
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="errorMessage" class="message error">
          <p style="margin: 0;">{{ errorMessage }}</p>
        </div>

        <div v-if="successMessage" class="message success">
          <p style="margin: 0;">{{ successMessage }}</p>
        </div>
      </div>
    </div>

    <script>
  </div>
</template>

<script setup lang="ts">
const { settingsStore, blocksStore, reviewsStore } = useStores()
const { cleanupOldData } = useErrorNotifications()
const { testNotification } = useNotifications()

// Tauri Commands - Professional solution for macOS 26.1
const { isTauri, settingsCommands } = useTauriCommands()

// Local state for form inputs
const workStartTime = ref(settingsStore.workStartTime)
const workEndTime = ref(settingsStore.workEndTime)
const errorMessage = ref('')
const successMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Watch for changes in store
watch(() => settingsStore.workStartTime, (newValue) => {
  workStartTime.value = newValue
})

watch(() => settingsStore.workEndTime, (newValue) => {
  workEndTime.value = newValue
})

/**
 * Professional Event Handlers using Tauri Commands
 */

async function handleToggleWeekend() {
  console.log('handleToggleWeekend called')
  
  // Try Tauri command first (for native app)
  if (isTauri()) {
    const success = await settingsCommands.toggleWeekend()
    if (success) {
      console.log('Tauri command executed, toggling weekend blocking')
    }
  }
  
  // Execute the actual logic (works in both web and native)
  await settingsStore.toggleWeekendBlocking()
}

async function handleToggleCellphone() {
  console.log('handleToggleCellphone called')
  
  // Try Tauri command first (for native app)
  if (isTauri()) {
    const success = await settingsCommands.toggleCellphone()
    if (success) {
      console.log('Tauri command executed, toggling cellphone mode')
    }
  }
  
  // Execute the actual logic (works in both web and native)
  await settingsStore.toggleCellPhoneMode()
}

async function handleTestNotifications() {
  console.log('handleTestNotifications called')
  
  try {
    await testNotification()
    successMessage.value = 'Notificación de prueba enviada'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (error) {
    errorMessage.value = `Error al enviar notificación: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

async function handleResetSettings() {
  console.log('handleResetSettings called')
  
  if (!confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
    return
  }
  
  // Try Tauri command first (for native app)
  if (isTauri()) {
    const success = await settingsCommands.reset()
    if (success) {
      console.log('Tauri command executed, resetting settings')
    }
  }
  
  // Execute the actual logic (works in both web and native)
  await settingsStore.resetToDefaults()
  successMessage.value = 'Configuración restaurada a valores por defecto'
  setTimeout(() => { successMessage.value = '' }, 3000)
}

function handleExportData() {
  console.log('handleExportData called')
  exportAllData()
}

function handleImportClick() {
  console.log('handleImportClick called')
  fileInput.value?.click()
}

async function handleCleanupData() {
  console.log('handleCleanupData called')
  
  if (!confirm('¿Estás seguro de que quieres limpiar datos antiguos?')) {
    return
  }
  
  try {
    await cleanupOldData()
    successMessage.value = 'Datos antiguos limpiados exitosamente'
    setTimeout(() => { successMessage.value = '' }, 3000)
  } catch (error) {
    errorMessage.value = `Error al limpiar datos: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

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

// Log Tauri status on mount
onMounted(() => {
  console.log('Settings page mounted')
  console.log('Running in Tauri:', isTauri())
})
</script>