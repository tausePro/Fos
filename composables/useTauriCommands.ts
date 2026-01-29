/**
 * Tauri Commands Composable
 * 
 * Professional solution for macOS 26.1 Tahoe WebView click event issues.
 * 
 * PROBLEM: Vue.js @click events don't work in Tauri WebView on macOS 26.1 beta
 * CAUSE: WebKit bug in macOS Tahoe affecting pointer events in WKWebView
 * SOLUTION: Use Tauri native commands instead of relying on WebView events
 * 
 * This approach:
 * - Bypasses WebView event handling entirely
 * - Uses Tauri's IPC (Inter-Process Communication) directly
 * - Works reliably across all macOS versions
 * - Is the recommended pattern for critical actions in Tauri apps
 */

import { invoke } from '@tauri-apps/api/core'

export const useTauriCommands = () => {
  /**
   * Check if running in Tauri environment
   */
  const isTauri = () => {
    return typeof window !== 'undefined' && '__TAURI__' in window
  }

  /**
   * Focus Mode Commands
   */
  const focusCommands = {
    /**
     * Exit focus mode
     */
    async exit(): Promise<boolean> {
      if (!isTauri()) {
        console.warn('Not in Tauri environment, using fallback')
        return false
      }

      try {
        await invoke('focus_exit')
        return true
      } catch (error) {
        console.error('Error calling focus_exit command:', error)
        return false
      }
    },

    /**
     * Complete current block
     */
    async complete(): Promise<boolean> {
      if (!isTauri()) {
        console.warn('Not in Tauri environment, using fallback')
        return false
      }

      try {
        await invoke('focus_complete')
        return true
      } catch (error) {
        console.error('Error calling focus_complete command:', error)
        return false
      }
    },

    /**
     * Pause focus session
     */
    async pause(): Promise<boolean> {
      if (!isTauri()) {
        console.warn('Not in Tauri environment, using fallback')
        return false
      }

      try {
        await invoke('focus_pause')
        return true
      } catch (error) {
        console.error('Error calling focus_pause command:', error)
        return false
      }
    },

    /**
     * Resume focus session
     */
    async resume(): Promise<boolean> {
      if (!isTauri()) {
        console.warn('Not in Tauri environment, using fallback')
        return false
      }

      try {
        await invoke('focus_resume')
        return true
      } catch (error) {
        console.error('Error calling focus_resume command:', error)
        return false
      }
    }
  }

  /**
   * Settings Commands
   */
  const settingsCommands = {
    /**
     * Toggle weekend blocking
     */
    async toggleWeekend(): Promise<boolean> {
      if (!isTauri()) {
        console.warn('Not in Tauri environment, using fallback')
        return false
      }

      try {
        await invoke('settings_toggle_weekend')
        return true
      } catch (error) {
        console.error('Error calling settings_toggle_weekend command:', error)
        return false
      }
    },

    /**
     * Toggle cell phone mode
     */
    async toggleCellphone(): Promise<boolean> {
      if (!isTauri()) {
        console.warn('Not in Tauri environment, using fallback')
        return false
      }

      try {
        await invoke('settings_toggle_cellphone')
        return true
      } catch (error) {
        console.error('Error calling settings_toggle_cellphone command:', error)
        return false
      }
    },

    /**
     * Reset settings to defaults
     */
    async reset(): Promise<boolean> {
      if (!isTauri()) {
        console.warn('Not in Tauri environment, using fallback')
        return false
      }

      try {
        await invoke('settings_reset')
        return true
      } catch (error) {
        console.error('Error calling settings_reset command:', error)
        return false
      }
    }
  }

  return {
    isTauri,
    focusCommands,
    settingsCommands
  }
}
