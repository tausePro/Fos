// Client-side storage plugin for Felipe OS
export default defineNuxtPlugin(() => {
  // Simple localStorage wrapper with error handling
  const storage = {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.error('Error reading from localStorage:', error)
        return null
      }
    },

    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.error('Error writing to localStorage:', error)
        // Handle quota exceeded or other storage errors
        if (error instanceof DOMException && error.code === 22) {
          console.warn('localStorage quota exceeded')
          // Could implement cleanup logic here
        }
      }
    },

    removeItem(key: string): void {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Error removing from localStorage:', error)
      }
    },

    clear(): void {
      try {
        localStorage.clear()
      } catch (error) {
        console.error('Error clearing localStorage:', error)
      }
    }
  }

  return {
    provide: {
      storage
    }
  }
})