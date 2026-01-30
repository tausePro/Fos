<template>
  <div class="floating-window">
    <div class="floating-header" :class="{ 'zona-roja': isZonaRoja }">
      <span class="session-type">{{ sessionType }}</span>
      <button class="close-btn" @click="handleClose">×</button>
    </div>
    
    <div class="floating-content">
      <div class="time-display">
        {{ formattedTime }}
      </div>
      
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercent}%` }"></div>
      </div>
      
      <div class="quick-actions">
        <button class="action-btn" @click="handlePause" v-if="!isPaused">
          ⏸
        </button>
        <button class="action-btn" @click="handleResume" v-if="isPaused">
          ▶
        </button>
        <button class="action-btn danger" @click="handleStop">
          ⏹
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

// State
const sessionType = ref('Focus')
const timeRemaining = ref(1500) // seconds
const progressPercent = ref(0)
const isZonaRoja = ref(false)
const isPaused = ref(false)

// Computed
const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Event listener
let unlistenUpdate: UnlistenFn | null = null

// Methods
const handleClose = () => {
  if (process.client && window.__TAURI__) {
    const { invoke } = window.__TAURI__.core
    invoke('hide_floating_window')
  }
}

const handlePause = () => {
  isPaused.value = true
  // Emit event to main window
  if (process.client && window.__TAURI__) {
    const { emit } = window.__TAURI__.event
    emit('floating:pause')
  }
}

const handleResume = () => {
  isPaused.value = false
  // Emit event to main window
  if (process.client && window.__TAURI__) {
    const { emit } = window.__TAURI__.event
    emit('floating:resume')
  }
}

const handleStop = () => {
  // Emit event to main window
  if (process.client && window.__TAURI__) {
    const { emit } = window.__TAURI__.event
    emit('floating:stop')
  }
}

// Lifecycle
onMounted(async () => {
  if (process.client && window.__TAURI__) {
    // Listen for updates from Rust backend
    unlistenUpdate = await listen('floating:update', (event: any) => {
      const data = event.payload
      sessionType.value = data.session_type
      timeRemaining.value = data.time_remaining
      progressPercent.value = data.progress_percent
      isZonaRoja.value = data.is_zona_roja
    })
  }
})

onUnmounted(() => {
  if (unlistenUpdate) {
    unlistenUpdate()
  }
})
</script>

<style scoped>
.floating-window {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: flex;
  flex-direction: column;
}

.floating-header {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  -webkit-app-region: drag;
}

.floating-header.zona-roja {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.session-type {
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;
  -webkit-app-region: no-drag;
}

.close-btn:hover {
  opacity: 1;
}

.floating-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.time-display {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  -webkit-app-region: no-drag;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.action-btn.danger {
  border-color: #fecaca;
}

.action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.3);
}
</style>
