import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { meetingsService } from '../services/meetings';
import { formatDateTime } from '../utils/time';

export default function Meetings() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const [upcomingData, pastData] = await Promise.all([
        meetingsService.getUpcoming(),
        meetingsService.getPast(),
      ]);
      setUpcoming(upcomingData);
      setPast(pastData);
    } catch (err) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this meeting?')) {
      return;
    }

    try {
      await meetingsService.cancel(id);
      loadMeetings();
    } catch (err) {
      alert('Failed to cancel meeting');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const meetings = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
          <p className="mt-2 text-gray-600">View and manage your scheduled meetings</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'upcoming'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'past'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Past ({past.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {meetings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No {activeTab} meetings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {meeting.event_type_name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(meeting.meeting_date, meeting.start_time)}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Invitee:</span> {meeting.invitee_name} ({meeting.invitee_email})
                        </p>
                        {meeting.message_to_host && (
                          <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
                            <p className="text-xs font-medium text-amber-800 mb-1">💬 Message from Invitee:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.message_to_host}</p>
                          </div>
                        )}
                        {meeting.status === 'cancelled' && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded">
                            Cancelled
                          </span>
                        )}
                      </div>
                      {activeTab === 'upcoming' && meeting.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancel(meeting.id)}
                          className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
