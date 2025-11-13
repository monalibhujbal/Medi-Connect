// Utility functions for appointment scheduling and rescheduling

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

/**
 * Get next consecutive slot time
 */
export function getNextSlotTime(currentTime: string, slotDuration: number): string {
  const currentMinutes = timeToMinutes(currentTime)
  const nextMinutes = currentMinutes + slotDuration
  return minutesToTime(nextMinutes)
}

/**
 * Check if a time is within schedule bounds
 */
export function isTimeInSchedule(time: string, startTime: string, endTime: string): boolean {
  const timeMinutes = timeToMinutes(time)
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  return timeMinutes >= startMinutes && timeMinutes < endMinutes
}

