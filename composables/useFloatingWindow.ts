import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface FloatingWindowData {
  session_type: string
  time_remaining: number
  progress_percent: number
  is_zona_roja: boolean
}

export function useFloatingWindow() {
  const isVisible = ref(false)
  const listeners = ref<UnlistenFn[]>([])

  // Show floating window
  const showFloatingWindow = async () => {
    if (!process.client) return

    try {
      await invoke('show_floating_window')
      isVisible.value = true
      console.log('✓ Floating window shown')
    } catch (e) {
      console.error('Failed to show floating window:', e)
    }
  }

  // Hide floating window
  const hideFloatingWindow = async () => {
    if (!process.client) return

    try {
      await invoke('hide_floating_window')
      isVisible.value = false
      console.log('✓ Floating window hidden')
    } catch (e) {
      console.error('Failed to hide floating window:', e)
    }
  }

  // Update floating window content
  const updateFloatingWindow = async (data: FloatingWindowData) => {
    if (!process.client) return

    try {
      await invoke('update_floating_window', {
        sessionType: data.session_type,
        timeRemaining: data.time_remaining,
        progressPercent: data.progress_percent,
        isZonaRoja: data.is_zona_roja
      })
    } catch (e) {
      console.error('Failed to update floating window:', e)
    }
  }

  // Setup event listeners for floating window actions
  const setupListeners = async (callbacks: {
    onPause?: () => void
    onResume?: () => void
    onStop?: () => void
  }) => {
    if (!process.client) return

    try {
      if (callbacks.onPause) {
        const unlistenPause = await listen('floating:pause', () => {
          callbacks.onPause?.()
        })
        listeners.value.push(unlistenPause)
      }

      if (callbacks.onResume) {
        const unlistenResume = await listen('floating:resume', () => {
          callbacks.onResume?.()
        })
        listeners.value.push(unlistenResume)
      }

      if (callbacks.onStop) {
        const unlistenStop = await listen('floating:stop', () => {
          callbacks.onStop?.()
        })
        listeners.value.push(unlistenStop)
      }

      console.log('✓ Floating window listeners registered')
    } catch (e) {
      console.error('Failed to setup floating window listeners:', e)
    }
  }

  // Cleanup listeners
  const cleanupListeners = () => {
    listeners.value.forEach(unlisten => unlisten())
    listeners.value = []
  }

  return {
    isVisible,
    showFloatingWindow,
    hideFloatingWindow,
    updateFloatingWindow,
    setupListeners,
    cleanupListeners
  }
}
