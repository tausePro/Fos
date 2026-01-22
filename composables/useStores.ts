// Composable for managing store initialization
export const useStores = () => {
  const blocksStore = useBlocksStore()
  const focusStore = useFocusStore()
  const settingsStore = useSettingsStore()

  const initializeStores = async () => {
    try {
      console.log('Initializing all stores...')
      
      // Initialize stores in sequence to avoid conflicts
      await settingsStore.initializeStore()
      console.log('Settings store initialized')
      
      await blocksStore.initializeStore()
      console.log('Blocks store initialized')
      
      await focusStore.initializeStore()
      console.log('Focus store initialized')
      
      console.log('All stores initialized successfully')
    } catch (error) {
      console.error('Error initializing stores:', error)
    }
  }

  return {
    blocksStore,
    focusStore,
    settingsStore,
    initializeStores
  }
}