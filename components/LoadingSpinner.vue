<template>
  <div v-if="show" class="loading-container" :class="containerClasses">
    <div class="loading-content">
      <!-- Spinner -->
      <div class="spinner" :class="spinnerClasses">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      
      <!-- Message -->
      <div v-if="message" class="loading-message" :class="messageClasses">
        {{ message }}
      </div>
      
      <!-- Progress bar for longer operations -->
      <div v-if="showProgress && progress !== null" class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
          ></div>
        </div>
        <div class="progress-text">{{ Math.round(progress) }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show?: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'overlay' | 'inline' | 'minimal'
  progress?: number | null
  showProgress?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  size: 'medium',
  variant: 'inline',
  progress: null,
  showProgress: false
})

const containerClasses = computed(() => {
  const classes = ['loading-container']
  
  if (props.variant === 'overlay') {
    classes.push('overlay')
  } else if (props.variant === 'minimal') {
    classes.push('minimal')
  }
  
  return classes.join(' ')
})

const spinnerClasses = computed(() => {
  const classes = ['spinner']
  classes.push(`size-${props.size}`)
  return classes.join(' ')
})

const messageClasses = computed(() => {
  const classes = ['loading-message']
  classes.push(`size-${props.size}`)
  return classes.join(' ')
})
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.loading-container.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

.loading-container.minimal {
  padding: 0.5rem;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* Spinner Styles */
.spinner {
  position: relative;
  display: inline-block;
}

.spinner.size-small {
  width: 24px;
  height: 24px;
}

.spinner.size-medium {
  width: 40px;
  height: 40px;
}

.spinner.size-large {
  width: 60px;
  height: 60px;
}

.spinner-ring {
  position: absolute;
  border: 2px solid transparent;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner.size-small .spinner-ring {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.spinner.size-medium .spinner-ring {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner.size-large .spinner-ring {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

.spinner-ring:nth-child(1) {
  animation-delay: 0s;
  border-top-color: #3b82f6;
}

.spinner-ring:nth-child(2) {
  animation-delay: -0.4s;
  border-top-color: #10b981;
  transform: scale(0.8);
}

.spinner-ring:nth-child(3) {
  animation-delay: -0.8s;
  border-top-color: #f59e0b;
  transform: scale(0.6);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Message Styles */
.loading-message {
  font-weight: 500;
  color: #64748b;
  text-align: center;
}

.loading-message.size-small {
  font-size: 0.75rem;
}

.loading-message.size-medium {
  font-size: 0.875rem;
}

.loading-message.size-large {
  font-size: 1rem;
}

/* Progress Bar Styles */
.progress-container {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .loading-container {
    padding: 0.75rem;
  }
  
  .loading-content {
    gap: 0.75rem;
  }
  
  .progress-container {
    width: 150px;
  }
}
</style>