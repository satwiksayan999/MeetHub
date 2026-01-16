import { useState } from 'react';
import dayjs from 'dayjs';
import { getCurrentMonth, getCurrentYear, getMonthDays, isPastDate } from '../utils/time';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Calendar({ selectedDate, onDateSelect, minDate }) {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [currentYear, setCurrentYear] = useState(getCurrentYear());

  const days = getMonthDays(currentYear, currentMonth);
  const firstDayOfMonth = dayjs(`${currentYear}-${currentMonth}-01`).day();

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateDisabled = (date) => {
    if (minDate && dayjs(date).isBefore(dayjs(minDate), 'day')) {
      return true;
    }
    return isPastDate(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold">
          {MONTHS[currentMonth - 1]} {currentYear}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {days.map(({ date, day }) => {
          const isSelected = selectedDate === date;
          const isDisabled = isDateDisabled(date);
          const isToday = dayjs(date).isSame(dayjs(), 'day');

          return (
            <button
              key={date}
              type="button"
              onClick={() => !isDisabled && onDateSelect(date)}
              disabled={isDisabled}
              className={`
                aspect-square rounded-md text-sm font-medium
                ${isSelected
                  ? 'bg-primary-600 text-white'
                  : isToday
                  ? 'bg-primary-50 text-primary-700 border-2 border-primary-600'
                  : isDisabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
