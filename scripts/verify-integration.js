#!/usr/bin/env node

// Integration verification script for Felipe OS
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🚀 Felipe OS - Verificación de Integración Final\n')

const checks = []

// 1. Verify all required files exist
console.log('📁 Verificando archivos requeridos...')
const requiredFiles = [
  'app.vue',
  'pages/index.vue',
  'pages/week.vue',
  'pages/stats.vue',
  'pages/review.vue',
  'pages/settings.vue',
  'stores/blocks.ts',
  'stores/focus.ts',
  'stores/settings.ts',
  'stores/reviews.ts',
  'stores/analytics.ts',
  'components/AppHeader.vue',
  'components/DailyPriority.vue',
  'components/SacredBlocks.vue',
  'components/ActionButtons.vue',
  'components/FocusMode.vue',
  'components/NightlyReview.vue',
  'components/ErrorNotification.vue',
  'components/LoadingSpinner.vue',
  'components/PerformanceIndicator.vue',
  'components/SystemDiagnostics.vue',
  'utils/errorHandling.ts',
  'utils/timeHelpers.ts',
  'utils/validationHelpers.ts',
  'composables/useStores.ts',
  'composables/useLoading.ts',
  'composables/useErrorNotifications.ts',
  'plugins/performance.client.ts'
]

let missingFiles = 0
requiredFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} - FALTANTE`)
    missingFiles++
  }
})

checks.push({
  name: 'Archivos requeridos',
  passed: missingFiles === 0,
  details: `${requiredFiles.length - missingFiles}/${requiredFiles.length} archivos encontrados`
})

// 2. Verify package.json has required dependencies
console.log('\n📦 Verificando dependencias...')
try {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
  const requiredDeps = [
    '@nuxt/devtools',
    '@pinia/nuxt',
    'nuxt',
    'pinia',
    'tailwindcss',
    '@tailwindcss/forms',
    '@heroicons/vue',
    'vitest',
    '@vue/test-utils'
  ]
  
  let missingDeps = 0
  requiredDeps.forEach(dep => {
    const hasInDeps = packageJson.dependencies?.[dep]
    const hasInDevDeps = packageJson.devDependencies?.[dep]
    
    if (hasInDeps || hasInDevDeps) {
      console.log(`  ✅ ${dep}`)
    } else {
      console.log(`  ❌ ${dep} - FALTANTE`)
      missingDeps++
    }
  })
  
  checks.push({
    name: 'Dependencias',
    passed: missingDeps === 0,
    details: `${requiredDeps.length - missingDeps}/${requiredDeps.length} dependencias encontradas`
  })
} catch (error) {
  console.log('  ❌ Error leyendo package.json')
  checks.push({
    name: 'Dependencias',
    passed: false,
    details: 'Error leyendo package.json'
  })
}

// 3. Verify TypeScript types
console.log('\n🔍 Verificando tipos TypeScript...')
try {
  if (existsSync('types/index.ts')) {
    const typesContent = readFileSync('types/index.ts', 'utf8')
    const requiredTypes = ['Block', 'Category', 'DailyPriority', 'ReviewEntry', 'UserSettings']
    
    let missingTypes = 0
    requiredTypes.forEach(type => {
      if (typesContent.includes(`interface ${type}`) || typesContent.includes(`type ${type}`)) {
        console.log(`  ✅ ${type}`)
      } else {
        console.log(`  ❌ ${type} - FALTANTE`)
        missingTypes++
      }
    })
    
    checks.push({
      name: 'Tipos TypeScript',
      passed: missingTypes === 0,
      details: `${requiredTypes.length - missingTypes}/${requiredTypes.length} tipos encontrados`
    })
  } else {
    console.log('  ❌ types/index.ts no encontrado')
    checks.push({
      name: 'Tipos TypeScript',
      passed: false,
      details: 'Archivo de tipos no encontrado'
    })
  }
} catch (error) {
  console.log('  ❌ Error verificando tipos')
  checks.push({
    name: 'Tipos TypeScript',
    passed: false,
    details: 'Error verificando tipos'
  })
}

// 4. Run tests
console.log('\n🧪 Ejecutando tests...')
try {
  execSync('bun run test --run', { stdio: 'pipe' })
  console.log('  ✅ Tests pasaron exitosamente')
  checks.push({
    name: 'Tests',
    passed: true,
    details: 'Todos los tests pasaron'
  })
} catch (error) {
  console.log('  ❌ Tests fallaron')
  checks.push({
    name: 'Tests',
    passed: false,
    details: 'Algunos tests fallaron'
  })
}

// 5. Verify build
console.log('\n🏗️  Verificando build...')
try {
  execSync('bun run build', { stdio: 'pipe' })
  console.log('  ✅ Build exitoso')
  checks.push({
    name: 'Build',
    passed: true,
    details: 'Build completado sin errores'
  })
} catch (error) {
  console.log('  ❌ Build falló')
  checks.push({
    name: 'Build',
    passed: false,
    details: 'Error en el build'
  })
}

// 6. Verify spec tasks completion
console.log('\n📋 Verificando tareas del spec...')
try {
  if (existsSync('.kiro/specs/felipe-os/tasks.md')) {
    const tasksContent = readFileSync('.kiro/specs/felipe-os/tasks.md', 'utf8')
    
    // Count completed vs total tasks
    const completedTasks = (tasksContent.match(/- \[x\]/g) || []).length
    const totalTasks = (tasksContent.match(/- \[[x\s-~]\]/g) || []).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    console.log(`  📊 ${completedTasks}/${totalTasks} tareas completadas (${completionRate}%)`)
    
    // Check critical tasks
    const criticalTasks = [
      'Project Setup and Core Infrastructure',
      'Pinia Store Implementation',
      'Main Dashboard Implementation',
      'Block Management System',
      'Focus Mode Implementation',
      'Weekly Overview Implementation',
      'Analytics and Statistics',
      'Error Handling and Edge Cases',
      'Performance and UI Polish'
    ]
    
    let completedCritical = 0
    criticalTasks.forEach(task => {
      if (tasksContent.includes(task) && tasksContent.includes(`[x]`) && tasksContent.indexOf(`[x]`) < tasksContent.indexOf(task)) {
        completedCritical++
      }
    })
    
    checks.push({
      name: 'Tareas del Spec',
      passed: completionRate >= 80,
      details: `${completionRate}% completado, ${completedCritical}/${criticalTasks.length} tareas críticas`
    })
  } else {
    console.log('  ❌ tasks.md no encontrado')
    checks.push({
      name: 'Tareas del Spec',
      passed: false,
      details: 'Archivo de tareas no encontrado'
    })
  }
} catch (error) {
  console.log('  ❌ Error verificando tareas')
  checks.push({
    name: 'Tareas del Spec',
    passed: false,
    details: 'Error verificando tareas'
  })
}

// Final report
console.log('\n' + '='.repeat(60))
console.log('📊 REPORTE FINAL DE INTEGRACIÓN')
console.log('='.repeat(60))

const passedChecks = checks.filter(check => check.passed).length
const totalChecks = checks.length
const overallScore = Math.round((passedChecks / totalChecks) * 100)

checks.forEach(check => {
  const status = check.passed ? '✅' : '❌'
  console.log(`${status} ${check.name}: ${check.details}`)
})

console.log('\n' + '-'.repeat(60))
console.log(`🎯 PUNTUACIÓN GENERAL: ${passedChecks}/${totalChecks} (${overallScore}%)`)

if (overallScore >= 90) {
  console.log('🎉 ¡EXCELENTE! Felipe OS está listo para producción')
} else if (overallScore >= 80) {
  console.log('✅ BUENO. Felipe OS está casi listo, revisa los elementos faltantes')
} else if (overallScore >= 70) {
  console.log('⚠️  REGULAR. Felipe OS necesita más trabajo antes de estar listo')
} else {
  console.log('❌ CRÍTICO. Felipe OS requiere atención inmediata')
}

console.log('\n🚀 Verificación completada')

// Exit with appropriate code
process.exit(overallScore >= 80 ? 0 : 1)