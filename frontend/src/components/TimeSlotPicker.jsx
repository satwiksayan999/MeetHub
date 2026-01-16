import { formatTime } from '../utils/time';

export default function TimeSlotPicker({ slots, selectedSlot, onSlotSelect, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center">No available time slots for this date.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Select a time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
        {slots.map((slot, index) => {
          const slotKey = `${slot.start}-${slot.end}`;
          const isSelected = selectedSlot === slotKey;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSlotSelect(slotKey, slot)}
              className={`
                px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-primary-50 hover:text-primary-700 border border-gray-200'
                }
              `}
            >
              {formatTime(slot.start)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
