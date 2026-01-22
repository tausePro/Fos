<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <main class="container mx-auto px-4 py-6 max-w-6xl">
      <div class="card">
        <h1 class="text-2xl font-bold mb-6">Estadísticas</h1>
        <p class="text-gray-600 mb-4">
          Próximamente: Estadísticas detalladas de tu productividad y patrones de trabajo.
        </p>
        
        <NuxtLink to="/" class="btn btn-primary">
          Volver al Dashboard
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Estadísticas - Felipe OS'
})
</script>