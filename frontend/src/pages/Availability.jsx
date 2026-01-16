import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { availabilityService } from '../services/availability';

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function Availability() {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      const data = await availabilityService.get();
      const grouped = {};
      data.forEach((slot) => {
        if (!grouped[slot.day_of_week]) {
          grouped[slot.day_of_week] = [];
        }
        grouped[slot.day_of_week].push({
          start_time: slot.start_time.substring(0, 5),
          end_time: slot.end_time.substring(0, 5),
        });
      });
      setAvailability(grouped);
    } catch (err) {
      console.error('Failed to load availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTimeSlot = (day) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start_time: '09:00', end_time: '17:00' }],
    }));
  };

  const removeTimeSlot = (day, index) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (day, index, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const availabilityArray = [];
      Object.keys(availability).forEach((day) => {
        availability[day].forEach((slot) => {
          availabilityArray.push({
            day_of_week: parseInt(day),
            start_time: slot.start_time,
            end_time: slot.end_time,
          });
        });
      });

      await availabilityService.save(availabilityArray);
      setMessage('Availability saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
          <p className="mt-2 text-gray-600">Set your weekly availability for meetings</p>
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded ${
              message.includes('success')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {DAYS.map((day) => {
            const slots = availability[day.value] || [];

            return (
              <div key={day.value} className="mb-6 last:mb-0 pb-6 last:pb-0 border-b last:border-b-0 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{day.label}</h3>
                  <button
                    onClick={() => addTimeSlot(day.value)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add Time Slot
                  </button>
                </div>

                {slots.length === 0 ? (
                  <p className="text-sm text-gray-500">No availability set</p>
                ) : (
                  <div className="space-y-3">
                    {slots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) =>
                            updateTimeSlot(day.value, index, 'start_time', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) =>
                            updateTimeSlot(day.value, index, 'end_time', e.target.value)
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <button
                          onClick={() => removeTimeSlot(day.value, index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  );
}
