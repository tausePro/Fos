# Quick Start Guide - Empezar Hoy

## 🚀 Cómo Empezar AHORA

Este documento te guía para empezar a implementar mejoras **hoy mismo**, con tareas concretas y accionables.

## 📋 Opción 1: Empezar con Testing (RECOMENDADO)

### Por qué empezar aquí
- ✅ Mayor impacto en calidad
- ✅ Previene bugs futuros
- ✅ Base sólida para AI features
- ✅ Relativamente rápido (1 semana)

### Paso 1: Setup Property Testing (30 minutos)

```bash
# Instalar fast-check para property testing
cd felipe-os
bun add -D fast-check

# Crear estructura de tests
mkdir -p tests/properties
touch tests/properties/blocks.property.test.ts
touch tests/properties/validation.property.test.ts
```

### Paso 2: Implementar Property 4 (2-3 horas)

**Property 4: Sacred Block Limit Enforcement**

```typescript
// tests/properties/blocks.property.test.ts
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { useBlocksStore } from '~/stores/blocks'
import { createPinia, setActivePinia } from 'pinia'

describe('Property 4: Sacred Block Limit Enforcement', () => {
  it('should never allow more than 3 blocks per day', () => {
    fc.assert(
      fc.property(
        fc.array(blockGenerator(), { minLength: 4, maxLength: 10 }),
        (blocks) => {
          // Setup
          setActivePinia(createPinia())
          const store = useBlocksStore()
          const today = new Date().toISOString().split('T')[0]
          
          // Set all blocks to today
          const todayBlocks = blocks.map(b => ({ ...b, date: today }))
          
          // Try to add all blocks
          const results = todayBlocks.map(b => store.addBlock(b))
          
          // Property: Only first 3 should succeed
          const successCount = results.filter(r => r === true).length
          expect(successCount).toBeLessThanOrEqual(3)
          expect(store.getBlocksForDate(today).length).toBeLessThanOrEqual(3)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Generator helper
function blockGenerator() {
  return fc.record({
    id: fc.uuid(),
    startTime: fc.constantFrom('09:00', '10:00', '11:00', '14:00', '15:00'),
    endTime: fc.constantFrom('10:30', '11:30', '12:30', '15:30', '16:30'),
    category: fc.constantFrom('LANDINGCHAT', 'ESTUDIO', 'TAUSE', 'OTRO'),
    description: fc.string({ minLength: 5, maxLength: 50 }),
    completed: fc.boolean()
  })
}
```

### Paso 3: Implementar Property 5 (2-3 horas)

**Property 5: Time Overlap Prevention**

```typescript
// tests/properties/blocks.property.test.ts (continuar)
describe('Property 5: Time Overlap Prevention', () => {
  it('should never allow overlapping blocks', () => {
    fc.assert(
      fc.property(
        fc.array(blockGenerator(), { minLength: 2, maxLength: 5 }),
        (blocks) => {
          setActivePinia(createPinia())
          const store = useBlocksStore()
          const today = new Date().toISOString().split('T')[0]
          
          // Add blocks one by one
          const todayBlocks = blocks.map(b => ({ ...b, date: today }))
          todayBlocks.forEach(b => store.addBlock(b))
          
          // Property: No overlaps should exist
          const addedBlocks = store.getBlocksForDate(today)
          const hasOverlaps = checkForOverlaps(addedBlocks)
          
          expect(hasOverlaps).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

function checkForOverlaps(blocks: Block[]): boolean {
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]
      const b = blocks[j]
      
      const aStart = timeToMinutes(a.startTime)
      const aEnd = timeToMinutes(a.endTime)
      const bStart = timeToMinutes(b.startTime)
      const bEnd = timeToMinutes(b.endTime)
      
      // Check overlap
      if (aStart < bEnd && bStart < aEnd) {
        return true
      }
    }
  }
  return false
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
```

### Paso 4: Correr Tests (5 minutos)

```bash
# Correr property tests
bun run test tests/properties/

# Ver coverage
bun run test --coverage
```

## 📋 Opción 2: Empezar con E2E Tests

### Por qué empezar aquí
- ✅ Valida flujos completos
- ✅ Previene regresiones
- ✅ Fácil de entender
- ✅ Alto valor

### Paso 1: Setup Playwright (15 minutos)

```bash
# Instalar Playwright
bun add -D @playwright/test

# Instalar browsers
npx playwright install

# Crear estructura
mkdir -p tests/e2e
touch tests/e2e/focus-session.spec.ts
touch playwright.config.ts
```

### Paso 2: Configurar Playwright (10 minutos)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Paso 3: Primer E2E Test (30 minutos)

```typescript
// tests/e2e/focus-session.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Complete Focus Session Workflow', () => {
  test('should complete a full focus session', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('/')
    
    // 2. Set daily priority
    await page.fill('[data-testid="priority-input"]', 'Finish authentication module')
    await expect(page.locator('[data-testid="priority-display"]')).toContainText('Finish authentication')
    
    // 3. Create a block
    await page.click('[data-testid="add-block-btn"]')
    await page.fill('[data-testid="block-start-time"]', '09:00')
    await page.fill('[data-testid="block-end-time"]', '10:30')
    await page.selectOption('[data-testid="block-category"]', 'LANDINGCHAT')
    await page.fill('[data-testid="block-description"]', 'Deep work on auth')
    await page.click('[data-testid="save-block-btn"]')
    
    // 4. Verify block created
    await expect(page.locator('[data-testid="block-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="block-card"]')).toContainText('Deep work on auth')
    
    // 5. Start focus mode
    await page.click('[data-testid="start-day-btn"]')
    
    // 6. Verify focus mode active
    await expect(page.locator('[data-testid="focus-mode"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-block"]')).toContainText('Deep work on auth')
    
    // 7. Complete block
    await page.click('[data-testid="complete-block-btn"]')
    
    // 8. Verify completion
    await expect(page.locator('[data-testid="block-completed"]')).toBeVisible()
  })
})
```

### Paso 4: Correr E2E Tests (5 minutos)

```bash
# Correr tests
npx playwright test

# Ver reporte
npx playwright show-report
```

## 📋 Opción 3: Empezar con Google Calendar

### Por qué empezar aquí
- ✅ Feature visible inmediatamente
- ✅ Alto valor para usuario
- ✅ Base para AI features
- ✅ Relativamente independiente

### Paso 1: Setup Google Cloud Project (30 minutos)

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto "Felipe OS"
3. Habilitar Google Calendar API
4. Crear OAuth 2.0 credentials
5. Configurar consent screen
6. Descargar credentials.json

### Paso 2: Instalar Dependencies (5 minutos)

```bash
# Instalar googleapis
bun add googleapis

# Instalar crypto para tokens
bun add crypto-js
bun add -D @types/crypto-js
```

### Paso 3: Implementar OAuth (1-2 horas)

```typescript
// composables/useGoogleCalendar.ts
import { google } from 'googleapis'
import { ref } from 'vue'

export const useGoogleCalendar = () => {
  const isAuthenticated = ref(false)
  const oauth2Client = ref<any>(null)
  
  const initAuth = async () => {
    const { OAuth2 } = google.auth
    
    oauth2Client.value = new OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/auth/callback'
    )
    
    // Check if we have stored tokens
    const tokens = localStorage.getItem('google-tokens')
    if (tokens) {
      oauth2Client.value.setCredentials(JSON.parse(tokens))
      isAuthenticated.value = true
    }
  }
  
  const authenticate = async () => {
    const authUrl = oauth2Client.value.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.events']
    })
    
    // Open auth URL
    window.location.href = authUrl
  }
  
  const handleCallback = async (code: string) => {
    const { tokens } = await oauth2Client.value.getToken(code)
    oauth2Client.value.setCredentials(tokens)
    
    // Store tokens
    localStorage.setItem('google-tokens', JSON.stringify(tokens))
    isAuthenticated.value = true
  }
  
  return {
    isAuthenticated,
    initAuth,
    authenticate,
    handleCallback
  }
}
```

### Paso 4: Implementar Sync Básico (2-3 horas)

```typescript
// composables/useCalendarSync.ts
import { google } from 'googleapis'
import { useBlocksStore } from '~/stores/blocks'

export const useCalendarSync = () => {
  const blocksStore = useBlocksStore()
  
  const syncBlockToCalendar = async (block: Block) => {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client.value })
    
    const event = {
      summary: `[${block.category}] ${block.description}`,
      start: {
        dateTime: `${block.date}T${block.startTime}:00`,
        timeZone: 'America/Bogota'
      },
      end: {
        dateTime: `${block.date}T${block.endTime}:00`,
        timeZone: 'America/Bogota'
      },
      colorId: getCategoryColorId(block.category)
    }
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    })
    
    return response.data.id
  }
  
  const syncAllBlocks = async () => {
    const blocks = blocksStore.getAllBlocks()
    
    for (const block of blocks) {
      if (!block.calendarEventId) {
        const eventId = await syncBlockToCalendar(block)
        block.calendarEventId = eventId
      }
    }
  }
  
  return {
    syncBlockToCalendar,
    syncAllBlocks
  }
}

function getCategoryColorId(category: string): string {
  const colors = {
    LANDINGCHAT: '10', // Green
    ESTUDIO: '9',      // Blue
    TAUSE: '6',        // Orange
    OTRO: '8'          // Gray
  }
  return colors[category] || '8'
}
```

## 🎯 Recomendación

### Para Máximo Impacto: Empezar con Testing
1. ✅ Implementar Property 4 y 5 (4-6 horas)
2. ✅ Setup E2E con Playwright (1 hora)
3. ✅ Crear primer E2E test (30 minutos)

**Total**: 1 día de trabajo
**Impacto**: Base sólida para todo lo demás

### Para Feature Visible: Empezar con Calendar
1. ✅ Setup Google Cloud (30 minutos)
2. ✅ Implementar OAuth (2 horas)
3. ✅ Sync básico (3 horas)

**Total**: 1 día de trabajo
**Impacto**: Feature inmediatamente útil

## 📊 Checklist de Hoy

```
Testing Track:
[ ] Instalar fast-check
[ ] Crear estructura de tests
[ ] Implementar Property 4
[ ] Implementar Property 5
[ ] Correr tests y verificar

E2E Track:
[ ] Instalar Playwright
[ ] Configurar playwright.config.ts
[ ] Crear primer test
[ ] Correr test y verificar
[ ] Ver reporte HTML

Calendar Track:
[ ] Crear Google Cloud project
[ ] Habilitar Calendar API
[ ] Descargar credentials
[ ] Implementar OAuth
[ ] Probar autenticación
```

## 🚀 Después de Hoy

### Mañana
- Implementar Property 6 y 7
- Agregar más E2E tests
- O continuar con Calendar sync

### Esta Semana
- Completar 8 property tests críticos
- 3-4 E2E tests principales
- O Calendar sync completo

### Próxima Semana
- Refactoring de código duplicado
- Completar testing coverage
- O empezar con AI features

## 💡 Tips

1. **Empieza pequeño**: Un test a la vez
2. **Verifica frecuentemente**: Corre tests después de cada cambio
3. **Documenta**: Agrega comentarios explicando el property
4. **Itera**: Mejora los tests basado en lo que encuentres
5. **Celebra**: Cada test que pasa es progreso real

## 🎉 ¡Éxito!

Cuando termines hoy, habrás:
- ✅ Mejorado la calidad del código
- ✅ Prevenido bugs futuros
- ✅ Creado base para AI features
- ✅ Hecho progreso tangible

**¡Vamos a empezar!** 🚀
