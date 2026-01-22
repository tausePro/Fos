<template>
  <div class="nightly-review-overlay">
    <div class="review-container">
      <div class="review-header">
        <div class="review-icon">🌙</div>
        <h2>Revisión Nocturna</h2>
        <p class="review-date">{{ formattedDate }}</p>
      </div>

      <div class="review-content">
        <!-- Daily Summary -->
        <div class="summary-section">
          <h3>Resumen del Día</h3>
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">Bloques Completados</span>
              <span class="stat-value">{{ completedBlocks }}/{{ totalBlocks }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Prioridad del Día</span>
              <span class="stat-value" :class="{ 'completed': priorityCompleted }">
                {{ priorityCompleted ? '✅ Completada' : '⏳ Pendiente' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Rating Section -->
        <div class="rating-section">
          <div class="rating-group">
            <label>¿Cómo fue tu nivel de enfoque hoy?</label>
            <div class="rating-stars">
              <button
                v-for="star in 5"
                :key="`focus-${star}`"
                @click="reviewData.focusRating = star"
                :class="['star-btn', { active: star <= reviewData.focusRating }]"
              >
                {{ star <= reviewData.focusRating ? '⭐' : '☆' }}
              </button>
            </div>
            <span class="rating-label">{{ getFocusLabel(reviewData.focusRating) }}</span>
          </div>

          <div class="rating-group">
            <label>¿Cómo fue tu nivel de energía hoy?</label>
            <div class="rating-stars">
              <button
                v-for="star in 5"
                :key="`energy-${star}`"
                @click="reviewData.energyRating = star"
                :class="['star-btn', { active: star <= reviewData.energyRating }]"
              >
                {{ star <= reviewData.energyRating ? '⚡' : '☆' }}
              </button>
            </div>
            <span class="rating-label">{{ getEnergyLabel(reviewData.energyRating) }}</span>
          </div>
        </div>

        <!-- Reflection Section -->
        <div class="reflection-section">
          <div class="reflection-group">
            <label for="reflection-notes">¿Qué funcionó bien hoy?</label>
            <textarea
              id="reflection-notes"
              v-model="reviewData.reflectionNotes"
              placeholder="Reflexiona sobre los aspectos positivos del día..."
              rows="3"
              maxlength="300"
            />
            <div class="char-counter">{{ reviewData.reflectionNotes.length }}/300</div>
          </div>

          <div class="reflection-group">
            <label for="improvements">¿Qué puedes mejorar mañana?</label>
            <textarea
              id="improvements"
              v-model="reviewData.improvements"
              placeholder="Identifica áreas de mejora para mañana..."
              rows="3"
              maxlength="300"
            />
            <div class="char-counter">{{ reviewData.improvements.length }}/300</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="review-actions">
          <button @click="skipReview" class="btn btn-secondary">
            Saltar por Hoy
          </button>
          <button 
            @click="saveReview" 
            :disabled="!canSaveReview"
            class="btn btn-primary"
          >
            Completar Revisión
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReviewEntry, Block, DailyPriority } from '~/types'
import { getCurrentDate, formatDateForDisplay } from '~/utils/timeHelpers'

// Props
const props = defineProps<{
  todaysBlocks: Block[]
  todaysPriority: DailyPriority | null
}>()

// Emits
const emit = defineEmits<{
  'review-completed': [review: ReviewEntry]
  'review-skipped': []
}>()

// Reactive data
const today = getCurrentDate()
const formattedDate = formatDateForDisplay(today)

const reviewData = ref<Omit<ReviewEntry, 'date' | 'completedBlocks' | 'totalBlocks'>>({
  focusRating: 0,
  energyRating: 0,
  reflectionNotes: '',
  improvements: ''
})

// Computed properties
const completedBlocks = computed(() => 
  props.todaysBlocks.filter(block => block.completed).length
)

const totalBlocks = computed(() => props.todaysBlocks.length)

const priorityCompleted = computed(() => 
  props.todaysPriority?.completed || false
)

const canSaveReview = computed(() => 
  reviewData.value.focusRating > 0 && 
  reviewData.value.energyRating > 0
)

// Methods
function getFocusLabel(rating: number): string {
  const labels = {
    0: 'Sin calificar',
    1: 'Muy distraído',
    2: 'Algo distraído',
    3: 'Enfoque normal',
    4: 'Buen enfoque',
    5: 'Enfoque excelente'
  }
  return labels[rating as keyof typeof labels] || ''
}

function getEnergyLabel(rating: number): string {
  const labels = {
    0: 'Sin calificar',
    1: 'Muy cansado',
    2: 'Algo cansado',
    3: 'Energía normal',
    4: 'Buena energía',
    5: 'Energía excelente'
  }
  return labels[rating as keyof typeof labels] || ''
}

function saveReview() {
  const review: ReviewEntry = {
    date: today,
    focusRating: reviewData.value.focusRating,
    energyRating: reviewData.value.energyRating,
    completedBlocks: completedBlocks.value,
    totalBlocks: totalBlocks.value,
    reflectionNotes: reviewData.value.reflectionNotes.trim(),
    improvements: reviewData.value.improvements.trim()
  }

  emit('review-completed', review)
}

function skipReview() {
  emit('review-skipped')
}

// Load existing review if available
onMounted(() => {
  try {
    if (process.client) {
      const stored = localStorage.getItem('felipe-os-reviews')
      if (stored) {
        const reviews: ReviewEntry[] = JSON.parse(stored)
        const existingReview = reviews.find(r => r.date === today)
        
        if (existingReview) {
          reviewData.value = {
            focusRating: existingReview.focusRating,
            energyRating: existingReview.energyRating,
            reflectionNotes: existingReview.reflectionNotes,
            improvements: existingReview.improvements
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading existing review:', error)
  }
})
</script>

<style scoped>
.nightly-review-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  padding: 1rem;
}

.review-container {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  color: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.review-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.review-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.review-header h2 {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.review-date {
  font-size: 1rem;
  opacity: 0.8;
  margin: 0;
}

.review-content {
  padding: 2rem;
}

.summary-section {
  margin-bottom: 2rem;
}

.summary-section h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #f1f5f9;
}

.summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.125rem;
  font-weight: 700;
}

.stat-value.completed {
  color: #10b981;
}

.rating-section {
  margin-bottom: 2rem;
}

.rating-group {
  margin-bottom: 1.5rem;
}

.rating-group label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #f1f5f9;
}

.rating-stars {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.star-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #64748b;
}

.star-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

.star-btn.active {
  color: #fbbf24;
}

.rating-label {
  font-size: 0.875rem;
  color: #94a3b8;
  font-style: italic;
}

.reflection-section {
  margin-bottom: 2rem;
}

.reflection-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.reflection-group label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #f1f5f9;
}

.reflection-group textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.reflection-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.reflection-group textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
}

.char-counter {
  position: absolute;
  bottom: 0.75rem;
  right: 1rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.review-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.btn-primary:disabled {
  background: #64748b;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .review-container {
    margin: 0.5rem;
    border-radius: 16px;
  }
  
  .review-header {
    padding: 1.5rem 1.5rem 1rem;
  }
  
  .review-content {
    padding: 1.5rem;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .review-actions {
    flex-direction: column;
  }
  
  .btn {
    min-width: auto;
  }
}
</style>