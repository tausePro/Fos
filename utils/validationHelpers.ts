import type { Block, DailyPriority, Category } from '~/types'
import { VALIDATION_RULES } from '~/types'
import { timeToMinutes, minutesToTime, calculateDurationMinutes } from '~/utils/timeHelpers'
import { getCategoryPriority } from '~/utils/categoryHelpers'

// Text validation functions
export function validatePriorityText(text: string): { isValid: boolean; error?: string } {
  if (text.length > VALIDATION_RULES.PRIORITY_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Priority must be ${VALIDATION_RULES.PRIORITY_MAX_LENGTH} characters or less`
    }
  }
  return { isValid: true }
}

export function validateBlockDescription(description: string): { isValid: boolean; error?: string } {
  if (description.length > VALIDATION_RULES.BLOCK_DESCRIPTION_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Description must be ${VALIDATION_RULES.BLOCK_DESCRIPTION_MAX_LENGTH} characters or less`
    }
  }
  return { isValid: true }
}

// Time validation functions
export function validateTimeFormat(time: string): { isValid: boolean; error?: string } {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(time)) {
    return {
      isValid: false,
      error: 'Time must be in HH:MM format (24-hour)'
    }
  }
  return { isValid: true }
}

export function validateTimeIncrement(time: string): { isValid: boolean; error?: string } {
  const [hours, minutes] = time.split(':').map(Number)
  if (minutes % 30 !== 0) {
    return {
      isValid: false,
      error: 'Time must be in 30-minute increments (00 or 30)'
    }
  }
  return { isValid: true }
}

export function validateBlockDuration(startTime: string, endTime: string): { isValid: boolean; error?: string } {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const durationMinutes = endMinutes - startMinutes

  if (durationMinutes <= 0) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    }
  }

  if (durationMinutes < VALIDATION_RULES.MIN_BLOCK_DURATION_MINUTES) {
    return {
      isValid: false,
      error: `Block must be at least ${VALIDATION_RULES.MIN_BLOCK_DURATION_MINUTES} minutes`
    }
  }

  if (durationMinutes > VALIDATION_RULES.MAX_BLOCK_DURATION_MINUTES) {
    return {
      isValid: false,
      error: `Block cannot exceed ${VALIDATION_RULES.MAX_BLOCK_DURATION_MINUTES} minutes (2 hours)`
    }
  }

  return { isValid: true }
}

// Block validation functions
export function validateBlockLimit(blocks: Block[], date: string): { isValid: boolean; error?: string } {
  const dailyBlocks = blocks.filter(block => block.date === date)
  if (dailyBlocks.length >= VALIDATION_RULES.MAX_BLOCKS_PER_DAY) {
    return {
      isValid: false,
      error: `Maximum ${VALIDATION_RULES.MAX_BLOCKS_PER_DAY} blocks allowed per day`
    }
  }
  return { isValid: true }
}

export function validateBlockOverlap(blocks: Block[], newBlock: Omit<Block, 'id' | 'completed'>): { isValid: boolean; error?: string } {
  const dailyBlocks = blocks.filter(block => 
    block.date === newBlock.date && block.id !== (newBlock as any).id
  )

  const newStartMinutes = timeToMinutes(newBlock.startTime)
  const newEndMinutes = timeToMinutes(newBlock.endTime)

  for (const block of dailyBlocks) {
    const blockStartMinutes = timeToMinutes(block.startTime)
    const blockEndMinutes = timeToMinutes(block.endTime)

    // Check for overlap
    if (
      (newStartMinutes < blockEndMinutes && newEndMinutes > blockStartMinutes)
    ) {
      return {
        isValid: false,
        error: `Block overlaps with existing block: ${block.startTime}-${block.endTime} (${block.description})`
      }
    }
  }

  return { isValid: true }
}

export function validateWorkHours(time: string): { isValid: boolean; error?: string } {
  const timeMinutes = timeToMinutes(time)
  const endTimeMinutes = timeToMinutes(VALIDATION_RULES.WORK_END_TIME)

  if (timeMinutes >= endTimeMinutes) {
    return {
      isValid: false,
      error: `Los bloques de trabajo deben terminar antes de las ${VALIDATION_RULES.WORK_END_TIME} (5pm)`
    }
  }

  return { isValid: true }
}

export function validateWeekendBlocking(date: string): { isValid: boolean; error?: string; warning?: string } {
  const dateObj = new Date(date + 'T00:00:00')
  const dayOfWeek = dateObj.getDay() // 0 = Sunday, 6 = Saturday
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isValid: false,
      error: 'Los fines de semana están reservados para tiempo familiar. No se pueden programar bloques de trabajo.',
      warning: '💝 Recuerda: Los fines de semana son para descansar y pasar tiempo con la familia.'
    }
  }
  
  return { isValid: true }
}

export function validateTimeBoundaries(
  blockData: Omit<Block, 'id' | 'completed'>,
  allowOverride = false
): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[];
  requiresOverride?: boolean;
} {
  const errors: string[] = []
  const warnings: string[] = []
  let requiresOverride = false

  // Check weekend blocking
  const weekendValidation = validateWeekendBlocking(blockData.date)
  if (!weekendValidation.isValid) {
    if (allowOverride) {
      warnings.push(weekendValidation.warning || weekendValidation.error!)
      requiresOverride = true
    } else {
      errors.push(weekendValidation.error!)
      if (weekendValidation.warning) {
        warnings.push(weekendValidation.warning)
      }
    }
  }

  // Check 5pm cutoff
  const workHoursValidation = validateWorkHours(blockData.endTime)
  if (!workHoursValidation.isValid) {
    if (allowOverride) {
      warnings.push('⚠️ Este bloque termina después de las 5pm. Se recomienda mantener límites de trabajo saludables.')
      requiresOverride = true
    } else {
      errors.push(workHoursValidation.error!)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiresOverride
  }
}

export function suggestDefaultDuration(startTime: string): string {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + 90 // 90-minute default
  return minutesToTime(endMinutes)
}

// Complete block validation
export function validateBlock(
  blocks: Block[], 
  blockData: Omit<Block, 'id' | 'completed'>,
  isEdit = false
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate description
  const descValidation = validateBlockDescription(blockData.description)
  if (!descValidation.isValid) {
    errors.push(descValidation.error!)
  }

  // Validate time format
  const startTimeValidation = validateTimeFormat(blockData.startTime)
  if (!startTimeValidation.isValid) {
    errors.push(`Start time: ${startTimeValidation.error}`)
  }

  const endTimeValidation = validateTimeFormat(blockData.endTime)
  if (!endTimeValidation.isValid) {
    errors.push(`End time: ${endTimeValidation.error}`)
  }

  // If time formats are valid, validate duration
  if (startTimeValidation.isValid && endTimeValidation.isValid) {
    const durationValidation = validateBlockDuration(blockData.startTime, blockData.endTime)
    if (!durationValidation.isValid) {
      errors.push(durationValidation.error!)
    }

    // Temporarily disable work hours validation to allow testing
    // const workHoursValidation = validateWorkHours(blockData.endTime)
    // if (!workHoursValidation.isValid) {
    //   errors.push(workHoursValidation.error!)
    // }
  }

  // Validate block limit (only for new blocks)
  if (!isEdit) {
    const limitValidation = validateBlockLimit(blocks, blockData.date)
    if (!limitValidation.isValid) {
      errors.push(limitValidation.error!)
    }
  }

  // Validate overlap
  const overlapValidation = validateBlockOverlap(blocks, blockData)
  if (!overlapValidation.isValid) {
    errors.push(overlapValidation.error!)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// LANDINGCHAT Priority Scheduling Functions
export function findConflictingBlocks(
  blocks: Block[], 
  newBlock: Omit<Block, 'id' | 'completed'>
): Block[] {
  const dailyBlocks = blocks.filter(block => 
    block.date === newBlock.date && block.id !== (newBlock as any).id
  )

  const newStartMinutes = timeToMinutes(newBlock.startTime)
  const newEndMinutes = timeToMinutes(newBlock.endTime)

  return dailyBlocks.filter(block => {
    const blockStartMinutes = timeToMinutes(block.startTime)
    const blockEndMinutes = timeToMinutes(block.endTime)

    // Check for overlap
    return (newStartMinutes < blockEndMinutes && newEndMinutes > blockStartMinutes)
  })
}

export function resolveLandingchatConflict(
  blocks: Block[],
  newBlock: Omit<Block, 'id' | 'completed'>
): { 
  canSchedule: boolean; 
  conflictResolution?: 'override' | 'suggest_time'; 
  suggestedTime?: { startTime: string; endTime: string };
  conflictingBlocks?: Block[];
  message?: string;
} {
  const conflictingBlocks = findConflictingBlocks(blocks, newBlock)
  
  if (conflictingBlocks.length === 0) {
    return { canSchedule: true }
  }

  // If new block is LANDINGCHAT, it can override lower priority blocks
  if (newBlock.category === 'LANDINGCHAT') {
    const canOverride = conflictingBlocks.every(block => 
      getCategoryPriority(block.category) > getCategoryPriority('LANDINGCHAT')
    )
    
    if (canOverride) {
      return {
        canSchedule: true,
        conflictResolution: 'override',
        conflictingBlocks,
        message: `LANDINGCHAT tiene prioridad. Se moverán los bloques conflictivos: ${conflictingBlocks.map(b => b.description).join(', ')}`
      }
    }
  }

  // If new block is not LANDINGCHAT, check if it conflicts with LANDINGCHAT
  const landingchatConflicts = conflictingBlocks.filter(block => block.category === 'LANDINGCHAT')
  if (landingchatConflicts.length > 0) {
    // Suggest alternative time slots
    const suggestedTime = findAlternativeTimeSlot(blocks, newBlock)
    return {
      canSchedule: false,
      conflictResolution: 'suggest_time',
      suggestedTime,
      conflictingBlocks: landingchatConflicts,
      message: `Conflicto con bloque LANDINGCHAT prioritario. ${suggestedTime ? 'Hora sugerida: ' + suggestedTime.startTime + '-' + suggestedTime.endTime : 'No hay horarios alternativos disponibles.'}`
    }
  }

  // Regular conflict between non-LANDINGCHAT blocks
  return {
    canSchedule: false,
    conflictingBlocks,
    message: `Conflicto con bloque existente: ${conflictingBlocks.map(b => `${b.startTime}-${b.endTime} (${b.description})`).join(', ')}`
  }
}

export function findAlternativeTimeSlot(
  blocks: Block[],
  newBlock: Omit<Block, 'id' | 'completed'>
): { startTime: string; endTime: string } | null {
  const dailyBlocks = blocks
    .filter(block => block.date === newBlock.date)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))

  const blockDuration = timeToMinutes(newBlock.endTime) - timeToMinutes(newBlock.startTime)
  const workStartMinutes = timeToMinutes('08:00') // 8 AM
  const workEndMinutes = timeToMinutes('17:00') // 5 PM

  // Try to find a slot before the first block
  if (dailyBlocks.length > 0) {
    const firstBlockStart = timeToMinutes(dailyBlocks[0].startTime)
    if (firstBlockStart - workStartMinutes >= blockDuration) {
      const suggestedStart = Math.max(workStartMinutes, firstBlockStart - blockDuration)
      return {
        startTime: minutesToTime(suggestedStart),
        endTime: minutesToTime(suggestedStart + blockDuration)
      }
    }
  }

  // Try to find a slot between blocks
  for (let i = 0; i < dailyBlocks.length - 1; i++) {
    const currentBlockEnd = timeToMinutes(dailyBlocks[i].endTime)
    const nextBlockStart = timeToMinutes(dailyBlocks[i + 1].startTime)
    const availableTime = nextBlockStart - currentBlockEnd

    if (availableTime >= blockDuration) {
      return {
        startTime: minutesToTime(currentBlockEnd),
        endTime: minutesToTime(currentBlockEnd + blockDuration)
      }
    }
  }

  // Try to find a slot after the last block
  if (dailyBlocks.length > 0) {
    const lastBlockEnd = timeToMinutes(dailyBlocks[dailyBlocks.length - 1].endTime)
    if (workEndMinutes - lastBlockEnd >= blockDuration) {
      return {
        startTime: minutesToTime(lastBlockEnd),
        endTime: minutesToTime(lastBlockEnd + blockDuration)
      }
    }
  }

  // If no blocks exist, suggest a morning slot
  if (dailyBlocks.length === 0) {
    return {
      startTime: minutesToTime(workStartMinutes),
      endTime: minutesToTime(workStartMinutes + blockDuration)
    }
  }

  return null
}

// Enhanced block validation with LANDINGCHAT priority and time boundaries
export function validateBlockWithPriority(
  blocks: Block[], 
  blockData: Omit<Block, 'id' | 'completed'>,
  isEdit = false,
  allowTimeBoundaryOverride = false
): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[];
  conflictResolution?: any;
  requiresOverride?: boolean;
} {
  const errors: string[] = []
  const warnings: string[] = []
  let requiresOverride = false

  // Basic validation first (without work hours check)
  const basicValidation = validateBlock(blocks, blockData, isEdit)
  
  // Time boundary validation
  const boundaryValidation = validateTimeBoundaries(blockData, allowTimeBoundaryOverride)
  if (!boundaryValidation.isValid) {
    errors.push(...boundaryValidation.errors)
  }
  warnings.push(...boundaryValidation.warnings)
  if (boundaryValidation.requiresOverride) {
    requiresOverride = true
  }

  // If basic validation failed, check for LANDINGCHAT priority resolution
  if (!basicValidation.isValid) {
    // Check if the only error is overlap, which we might resolve with LANDINGCHAT priority
    const hasOnlyOverlapError = basicValidation.errors.length === 1 && 
      basicValidation.errors[0].includes('overlaps with existing block')
    
    if (hasOnlyOverlapError && blockData.category === 'LANDINGCHAT') {
      // Try to resolve LANDINGCHAT conflict
      const conflictResolution = resolveLandingchatConflict(blocks, blockData)
      
      if (conflictResolution.canSchedule && conflictResolution.conflictResolution === 'override') {
        warnings.push(conflictResolution.message!)
        
        // If we have time boundary errors, still fail
        if (errors.length > 0 && !allowTimeBoundaryOverride) {
          return {
            isValid: false,
            errors,
            warnings,
            requiresOverride
          }
        }
        
        return {
          isValid: true,
          errors: [],
          warnings,
          conflictResolution,
          requiresOverride
        }
      }
    }
    
    // Add basic validation errors if we can't resolve conflicts
    errors.push(...basicValidation.errors)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiresOverride
  }
}