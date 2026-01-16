import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(customParseFormat);

export function formatTime(time) {
  return dayjs(time, 'HH:mm').format('h:mm A');
}

export function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatDateTime(date, time) {
  return dayjs(`${date} ${time}`).format('MMMM D, YYYY [at] h:mm A');
}

export function getDayOfWeek(date) {
  return dayjs(date).day();
}

export function isPastDate(date) {
  return dayjs(date).isBefore(dayjs(), 'day');
}

export function getDaysInMonth(year, month) {
  return dayjs(`${year}-${month}`).daysInMonth();
}

export function getMonthDays(year, month) {
  const days = [];
  const daysInMonth = getDaysInMonth(year, month);
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
    });
  }
  
  return days;
}

export function getCurrentMonth() {
  return dayjs().month() + 1; // 1-12
}

export function getCurrentYear() {
  return dayjs().year();
}
