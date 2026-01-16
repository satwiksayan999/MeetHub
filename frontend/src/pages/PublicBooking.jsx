import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import BookingForm from '../components/BookingForm';
import { publicService } from '../services/public';
import { formatDate, formatDateTime } from '../utils/time';

export default function PublicBooking() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState('date'); // 'date', 'time', 'form', 'confirmation'
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEventType();
  }, [slug]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  const loadEventType = async () => {
    try {
      const data = await publicService.getEventType(slug);
      setEventType(data);
    } catch (err) {
      setError('Event type not found');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      const data = await publicService.getAvailableSlots(slug, selectedDate);
      setSlots(data.slots || []);
    } catch (err) {
      setError('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('time');
  };

  const handleSlotSelect = (slotKey, slot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleBookingSubmit = async (formData) => {
    try {
      const bookingData = {
        ...formData,
        meeting_date: selectedDate,
        start_time: selectedSlot.start,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const result = await publicService.book(slug, bookingData);
      setBooking(result);
      setStep('confirmation');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book meeting');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !eventType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (step === 'confirmation' && booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-4">
            Your meeting with {eventType.user_name} has been scheduled.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Event:</span> {eventType.name}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Date & Time:</span>{' '}
              {formatDateTime(booking.meeting_date, booking.start_time)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Duration:</span> {eventType.duration_minutes} minutes
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventType?.name}</h1>
          {eventType?.description && (
            <p className="text-gray-600">{eventType.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Duration: {eventType?.duration_minutes} minutes
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {step === 'date' && (
            <div className="lg:col-span-2">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                minDate={formatDate(new Date())}
              />
            </div>
          )}

          {step === 'time' && (
            <>
              <div>
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  minDate={formatDate(new Date())}
                />
                <button
                  onClick={() => {
                    setStep('date');
                    setSelectedDate(null);
                    setSelectedSlot(null);
                  }}
                  className="mt-4 w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Change date
                </button>
              </div>
              <div>
                <TimeSlotPicker
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={handleSlotSelect}
                  loading={loadingSlots}
                />
              </div>
            </>
          )}

          {step === 'form' && (
            <>
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                  <h3 className="text-lg font-semibold mb-2">Selected Time</h3>
                  <p className="text-gray-600">
                    {formatDateTime(selectedDate, selectedSlot.start)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {eventType.duration_minutes} minutes
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStep('time');
                    setSelectedSlot(null);
                  }}
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Change time
                </button>
              </div>
              <div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Enter Your Details</h3>
                  <BookingForm 
                    onSubmit={handleBookingSubmit} 
                    loading={false}
                    questions={eventType?.questions || []}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
