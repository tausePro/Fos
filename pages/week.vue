<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    
    <main class="container mx-auto px-4 py-6 max-w-6xl">
      <div class="card">
        <h1 class="text-2xl font-bold mb-6">Vista Semanal</h1>
        <p class="text-gray-600 mb-4">
          Próximamente: Vista de la semana con todos tus bloques organizados por día.
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
  title: 'Vista Semanal - Felipe OS'
})
</script>