<template>
  <div v-if="visible" class="fixed top-4 right-4 z-50 max-w-md">
    <div 
      class="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 mb-4"
      :class="notificationClasses"
    >
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <component :is="iconComponent" class="w-6 h-6" :class="iconClasses" />
        </div>
        
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-gray-900 mb-1">
            {{ notification.title }}
          </h4>
          <p class="text-sm text-gray-600 mb-2">
            {{ notification.message }}
          </p>
          <p class="text-xs text-gray-500">
            {{ notification.action }}
          </p>
        </div>
        
        <div class="flex-shrink-0">
          <button
            @click="dismiss"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <!-- Action buttons for recoverable errors -->
      <div v-if="notification.recoverable && showActions" class="mt-3 flex space-x-2">
        <button
          @click="retry"
          class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Reintentar
        </button>
        <button
          @click="cleanup"
          class="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
        >
          Limpiar Datos
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon, 
  WrenchScrewdriverIcon,
  XMarkIcon 
} from '@heroicons/vue/24/outline'

interface ErrorNotification {
  type: 'quota_exceeded' | 'data_corruption' | 'access_denied' | 'unknown'
  title: string
  message: string
  action: string
  recoverable: boolean
}

interface Props {
  notification: ErrorNotification | null
  visible: boolean
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showActions: true
})

const emit = defineEmits<{
  dismiss: []
  retry: []
  cleanup: []
}>()

const iconComponent = computed(() => {
  switch (props.notification?.type) {
    case 'quota_exceeded':
      return ExclamationTriangleIcon
    case 'data_corruption':
      return WrenchScrewdriverIcon
    case 'access_denied':
      return XCircleIcon
    default:
      return InformationCircleIcon
  }
})

const iconClasses = computed(() => {
  switch (props.notification?.type) {
    case 'quota_exceeded':
      return 'text-orange-500'
    case 'data_corruption':
      return 'text-blue-500'
    case 'access_denied':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
})

const notificationClasses = computed(() => {
  switch (props.notification?.type) {
    case 'quota_exceeded':
      return 'border-l-4 border-l-orange-400'
    case 'data_corruption':
      return 'border-l-4 border-l-blue-400'
    case 'access_denied':
      return 'border-l-4 border-l-red-400'
    default:
      return 'border-l-4 border-l-gray-400'
  }
})

function dismiss() {
  emit('dismiss')
}

function retry() {
  emit('retry')
}

function cleanup() {
  emit('cleanup')
}

// Auto-dismiss after 10 seconds for non-critical errors
onMounted(() => {
  if (props.notification?.type !== 'access_denied') {
    setTimeout(() => {
      if (props.visible) {
        dismiss()
      }
    }, 10000)
  }
})
</script>