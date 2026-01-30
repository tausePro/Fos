import { ref, onMounted, onUnmounted } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'

export interface ShortcutConfig {
  id: string
  name: string
  description: string
  defaultShortcut: string
  currentShortcut: string
  action: () => void
}

export function useGlobalShortcuts() {
  const shortcuts = ref<ShortcutConfig[]>([])
  const listeners = ref<UnlistenFn[]>([])

  // Initialize default shortcuts
  const initializeShortcuts = () => {
    shortcuts.value = [
      {
        id: 'toggle_focus_mode',
        name: 'Toggle Focus Mode',
        description: 'Activar/desactivar modo focus',
        defaultShortcut: 'Cmd+Shift+F',
        currentShortcut: 'Cmd+Shift+F',
        action: handleToggleFocusMode
      },
      {
        id: 'activate_zona_roja',
        name: 'Activate Zona Roja',
        description: 'Activar zona roja inmediatamente',
        defaultShortcut: 'Cmd+Shift+Z',
        currentShortcut: 'Cmd+Shift+Z',
        action: handleActivateZonaRoja
      },
      {
        id: 'start_break',
        name: 'Start Break',
        description: 'Iniciar sesión de descanso',
        defaultShortcut: 'Cmd+Shift+B',
        currentShortcut: 'Cmd+Shift+B',
        action: handleStartBreak
      },
      {
        id: 'toggle_window',
        name: 'Toggle Window',
        description: 'Mostrar/ocultar ventana principal',
        defaultShortcut: 'Cmd+Shift+S',
        currentShortcut: 'Cmd+Shift+S',
        action: handleToggleWindow
      }
    ]

    // Load custom shortcuts from localStorage
    loadCustomShortcuts()
  }

  // Load custom shortcuts from localStorage
  const loadCustomShortcuts = () => {
    if (process.client) {
      const stored = localStorage.getItem('felipe-os-shortcuts')
      if (stored) {
        try {
          const customShortcuts = JSON.parse(stored)
          shortcuts.value.forEach(shortcut => {
            const custom = customShortcuts[shortcut.id]
            if (custom) {
              shortcut.currentShortcut = custom
            }
          })
        } catch (e) {
          console.error('Failed to load custom shortcuts:', e)
        }
      }
    }
  }

  // Save custom shortcuts to localStorage
  const saveCustomShortcuts = () => {
    if (process.client) {
      const customShortcuts: Record<string, string> = {}
      shortcuts.value.forEach(shortcut => {
        if (shortcut.currentShortcut !== shortcut.defaultShortcut) {
          customShortcuts[shortcut.id] = shortcut.currentShortcut
        }
      })
      localStorage.setItem('felipe-os-shortcuts', JSON.stringify(customShortcuts))
    }
  }

  // Update a shortcut
  const updateShortcut = (id: string, newShortcut: string): boolean => {
    const shortcut = shortcuts.value.find(s => s.id === id)
    if (!shortcut) return false

    // Check for conflicts
    const conflict = shortcuts.value.find(
      s => s.id !== id && s.currentShortcut === newShortcut
    )
    if (conflict) {
      console.warn(`Shortcut ${newShortcut} is already used by ${conflict.name}`)
      return false
    }

    shortcut.currentShortcut = newShortcut
    saveCustomShortcuts()
    return true
  }

  // Reset a shortcut to default
  const resetShortcut = (id: string) => {
    const shortcut = shortcuts.value.find(s => s.id === id)
    if (shortcut) {
      shortcut.currentShortcut = shortcut.defaultShortcut
      saveCustomShortcuts()
    }
  }

  // Reset all shortcuts to defaults
  const resetAllShortcuts = () => {
    shortcuts.value.forEach(shortcut => {
      shortcut.currentShortcut = shortcut.defaultShortcut
    })
    if (process.client) {
      localStorage.removeItem('felipe-os-shortcuts')
    }
  }

  // Shortcut action handlers
  const handleToggleFocusMode = () => {
    console.log('Global shortcut: Toggle Focus Mode')
    const focusStore = useFocusStore()
    if (focusStore.isActive) {
      focusStore.exitFocusMode()
    } else {
      // Get current block and start focus mode
      const blocksStore = useBlocksStore()
      const currentBlock = blocksStore.getCurrentActiveBlock
      if (currentBlock) {
        focusStore.startFocusMode(currentBlock)
      }
    }
  }

  const handleActivateZonaRoja = () => {
    console.log('Global shortcut: Activate Zona Roja')
    const focusStore = useFocusStore()
    focusStore.activateZonaRoja()
  }

  const handleStartBreak = () => {
    console.log('Global shortcut: Start Break')
    const focusStore = useFocusStore()
    focusStore.startBreak()
  }

  const handleToggleWindow = () => {
    console.log('Global shortcut: Toggle Window')
    // Window toggle is handled by Rust backend
  }

  // Setup event listeners for Tauri events
  const setupListeners = async () => {
    if (!process.client) return

    try {
      // Listen for shortcut events from Rust backend
      const unlistenToggleFocus = await listen('shortcut:toggle_focus_mode', () => {
        handleToggleFocusMode()
      })
      listeners.value.push(unlistenToggleFocus)

      const unlistenZonaRoja = await listen('shortcut:activate_zona_roja', () => {
        handleActivateZonaRoja()
      })
      listeners.value.push(unlistenZonaRoja)

      const unlistenBreak = await listen('shortcut:start_break', () => {
        handleStartBreak()
      })
      listeners.value.push(unlistenBreak)

      console.log('✓ Global shortcut listeners registered')
    } catch (e) {
      console.error('Failed to setup shortcut listeners:', e)
    }
  }

  // Cleanup listeners
  const cleanupListeners = () => {
    listeners.value.forEach(unlisten => unlisten())
    listeners.value = []
  }

  // Lifecycle hooks
  onMounted(() => {
    initializeShortcuts()
    setupListeners()
  })

  onUnmounted(() => {
    cleanupListeners()
  })

  return {
    shortcuts,
    updateShortcut,
    resetShortcut,
    resetAllShortcuts,
    loadCustomShortcuts,
    saveCustomShortcuts
  }
}
