// Time utility functions for Felipe OS

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get current time in HH:MM format
 */
export function getCurrentTime(): string {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

/**
 * Format date for display (e.g., "Monday, January 21, 2026")
 */
export function formatDateForDisplay(date: string): string {
  const dateObj = new Date(date + 'T00:00:00')
  return dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Check if a date is today
 */
export function isToday(date: string): boolean {
  return date === getCurrentDate()
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: string): boolean {
  const dateObj = new Date(date + 'T00:00:00')
  const day = dateObj.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: string): string {
  const dateObj = new Date(date + 'T00:00:00')
  const day = dateObj.getDay()
  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(dateObj.setDate(diff))
  return monday.toISOString().split('T')[0]
}

/**
 * Get array of dates for a week starting from Monday
 */
export function getWeekDates(startDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate + 'T00:00:00')
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates
}

/**
 * Calculate remaining work time until 5pm
 */
export function getRemainingWorkTime(): { hours: number; minutes: number; isAfterWork: boolean } {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  // Work ends at 17:00 (5pm)
  const workEndHour = 17
  const workEndMinute = 0
  
  if (currentHour >= workEndHour) {
    return { hours: 0, minutes: 0, isAfterWork: true }
  }
  
  const currentTotalMinutes = currentHour * 60 + currentMinute
  const workEndTotalMinutes = workEndHour * 60 + workEndMinute
  const remainingMinutes = workEndTotalMinutes - currentTotalMinutes
  
  return {
    hours: Math.floor(remainingMinutes / 60),
    minutes: remainingMinutes % 60,
    isAfterWork: false
  }
}

/**
 * Check if current time is in red zone (first 3 hours of workday)
 * Uses settings store to get work start time
 */
export function isInRedZone(workStartTime: string = '08:00'): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const workStartMinutes = timeToMinutes(workStartTime)
  const redZoneEndMinutes = workStartMinutes + (3 * 60) // 3 hours after work start
  
  return currentMinutes >= workStartMinutes && currentMinutes < redZoneEndMinutes
}

/**
 * Get red zone times for display based on work start time
 */
export function getRedZoneTimes(workStartTime: string = '08:00'): { start: string; end: string } {
  const startMinutes = timeToMinutes(workStartTime)
  const endMinutes = startMinutes + (3 * 60) // 3 hours later
  
  return {
    start: workStartTime,
    end: minutesToTime(endMinutes)
  }
}

/**
 * Get remaining time in red zone (in minutes)
 */
export function getRemainingRedZoneTime(workStartTime: string = '08:00'): number {
  if (!isInRedZone(workStartTime)) return 0
  
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const workStartMinutes = timeToMinutes(workStartTime)
  const redZoneEndMinutes = workStartMinutes + (3 * 60)
  
  return Math.max(0, redZoneEndMinutes - currentMinutes)
}

/**
 * Get time until red zone starts (if before work hours)
 */
export function getTimeUntilRedZone(workStartTime: string = '08:00'): number {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const workStartMinutes = timeToMinutes(workStartTime)
  
  if (currentMinutes >= workStartMinutes) return 0
  
  return workStartMinutes - currentMinutes
}

/**
 * Check if a specific time is within red zone
 */
export function isTimeInRedZone(time: string, workStartTime: string = '08:00'): boolean {
  const timeMinutes = timeToMinutes(time)
  const workStartMinutes = timeToMinutes(workStartTime)
  const redZoneEndMinutes = workStartMinutes + (3 * 60)
  
  return timeMinutes >= workStartMinutes && timeMinutes < redZoneEndMinutes
}

/**
 * Get red zone status for display
 */
export function getRedZoneStatus(workStartTime: string = '08:00'): {
  isActive: boolean
  timeRemaining: number
  timeUntilStart: number
  startTime: string
  endTime: string
  message: string
} {
  const isActive = isInRedZone(workStartTime)
  const timeRemaining = getRemainingRedZoneTime(workStartTime)
  const timeUntilStart = getTimeUntilRedZone(workStartTime)
  const times = getRedZoneTimes(workStartTime)
  
  let message = ''
  if (isActive) {
    message = `Zona roja activa. ${formatDuration(timeRemaining)} restantes.`
  } else if (timeUntilStart > 0) {
    message = `Zona roja inicia en ${formatDuration(timeUntilStart)}.`
  } else {
    message = 'Zona roja terminada por hoy.'
  }
  
  return {
    isActive,
    timeRemaining,
    timeUntilStart,
    startTime: times.start,
    endTime: times.end,
    message
  }
}

/**
 * Check if it's time for nightly review (after 8pm)
 */
export function isNightlyReviewTime(): boolean {
  const now = new Date()
  return now.getHours() >= 20 // 8pm
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Round time to nearest 30-minute increment
 */
export function roundToNearestHalfHour(time: string): string {
  const minutes = timeToMinutes(time)
  const roundedMinutes = Math.round(minutes / 30) * 30
  return minutesToTime(roundedMinutes)
}

/**
 * Get next 30-minute increment from current time
 */
export function getNextHalfHour(): string {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const nextHalfHour = Math.ceil(currentMinutes / 30) * 30
  return minutesToTime(nextHalfHour)
}

/**
 * Calculate duration between two times in minutes
 */
export function calculateDurationMinutes(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

/**
 * Format duration for display (e.g., "1h 30m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}m`
  } else if (mins === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${mins}m`
  }
}

/**
 * Check if a time is within work hours (8am - 5pm)
 */
export function isWithinWorkHours(time: string): boolean {
  const minutes = timeToMinutes(time)
  const workStart = timeToMinutes('08:00')
  const workEnd = timeToMinutes('17:00')
  
  return minutes >= workStart && minutes <= workEnd
}

/**
 * Get suggested end time for a block starting at given time (90 minutes default)
 */
export function getSuggestedEndTime(startTime: string, durationMinutes: number = 90): string {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + durationMinutes
  return minutesToTime(endMinutes)
}