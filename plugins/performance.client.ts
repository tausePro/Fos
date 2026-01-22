// Performance optimization plugin for Felipe OS
export default defineNuxtPlugin(() => {
  // Performance monitoring
  const performanceObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    
    entries.forEach((entry) => {
      // Log slow operations
      if (entry.duration > 100) {
        console.warn(`Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
      }
      
      // Track specific metrics
      if (entry.entryType === 'navigation') {
        const navEntry = entry as PerformanceNavigationTiming
        console.log('Navigation timing:', {
          domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          totalTime: navEntry.loadEventEnd - navEntry.navigationStart
        })
      }
    })
  })
  
  // Observe performance entries
  try {
    performanceObserver.observe({ entryTypes: ['navigation', 'measure', 'mark'] })
  } catch (error) {
    console.warn('Performance Observer not supported:', error)
  }
  
  // Memory usage monitoring (if available)
  if ('memory' in performance) {
    const checkMemory = () => {
      const memory = (performance as any).memory
      if (memory) {
        const used = memory.usedJSHeapSize / 1024 / 1024
        const total = memory.totalJSHeapSize / 1024 / 1024
        const limit = memory.jsHeapSizeLimit / 1024 / 1024
        
        console.log(`Memory usage: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB (limit: ${limit.toFixed(2)}MB)`)
        
        // Warn if memory usage is high
        if (used / limit > 0.8) {
          console.warn('High memory usage detected. Consider optimizing data structures.')
        }
      }
    }
    
    // Check memory every 30 seconds
    setInterval(checkMemory, 30000)
  }
  
  // Optimize images loading
  const optimizeImages = () => {
    const images = document.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.loading) {
        img.loading = 'lazy'
      }
    })
  }
  
  // Run image optimization after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeImages)
  } else {
    optimizeImages()
  }
  
  // Optimize localStorage operations
  const originalSetItem = localStorage.setItem
  const originalGetItem = localStorage.getItem
  
  // Throttle localStorage writes to prevent excessive I/O
  const throttledWrites = new Map<string, NodeJS.Timeout>()
  
  localStorage.setItem = function(key: string, value: string) {
    // Clear existing timeout for this key
    if (throttledWrites.has(key)) {
      clearTimeout(throttledWrites.get(key)!)
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      originalSetItem.call(this, key, value)
      throttledWrites.delete(key)
    }, 100) // 100ms throttle
    
    throttledWrites.set(key, timeout)
  }
  
  // Add performance marks for key operations
  const addPerformanceMark = (name: string) => {
    try {
      performance.mark(name)
    } catch (error) {
      // Ignore if performance API not available
    }
  }
  
  // Provide global performance utilities
  return {
    provide: {
      performance: {
        mark: addPerformanceMark,
        measure: (name: string, startMark: string, endMark?: string) => {
          try {
            performance.measure(name, startMark, endMark)
          } catch (error) {
            // Ignore if performance API not available
          }
        },
        now: () => performance.now(),
        getEntries: () => performance.getEntries()
      }
    }
  }
})