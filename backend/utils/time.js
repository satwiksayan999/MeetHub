import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

/**
 * Generate time slots for a given date and availability
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} startTime - Start time in HH:mm format
 * @param {string} endTime - End time in HH:mm format
 * @param {number} durationMinutes - Duration of each slot in minutes
 * @param {string} timezone - Timezone string
 * @returns {Array} Array of time slots in HH:mm format
 */
export function generateTimeSlots(date, startTime, endTime, durationMinutes, timezone = 'UTC') {
  const slots = [];
  const dateTime = dayjs.tz(`${date} ${startTime}`, timezone);
  const endDateTime = dayjs.tz(`${date} ${endTime}`, timezone);

  let current = dateTime;
  while (current.isBefore(endDateTime)) {
    const slotEnd = current.add(durationMinutes, 'minute');
    if (slotEnd.isAfter(endDateTime)) break;
    
    slots.push({
      start: current.format('HH:mm'),
      end: slotEnd.format('HH:mm')
    });
    
    current = slotEnd;
  }

  return slots;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Convert time from one timezone to another
 */
export function convertTimezone(time, fromTz, toTz) {
  return dayjs.tz(time, fromTz).tz(toTz);
}

/**
 * Get day of week from date (0=Sunday, 6=Saturday)
 */
export function getDayOfWeek(date) {
  return dayjs(date).day();
}

/**
 * Format date for display
 */
export function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * Check if date is in the past
 */
export function isPastDate(date) {
  return dayjs(date).isBefore(dayjs(), 'day');
}
