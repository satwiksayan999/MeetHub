import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { eventTypesService } from '../services/eventTypes';

export default function EventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 30,
    slug: '',
    description: '',
    questions: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadEventTypes();
  }, []);

  const loadEventTypes = async () => {
    try {
      const data = await eventTypesService.getAll();
      setEventTypes(data);
    } catch (err) {
      setError('Failed to load event types');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !editing) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editing) {
        await eventTypesService.update(editing.id, formData);
      } else {
        await eventTypesService.create(formData);
      }
      setShowModal(false);
      setEditing(null);
      setFormData({ name: '', duration_minutes: 30, slug: '', description: '', questions: [] });
      loadEventTypes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event type');
    }
  };

  const handleEdit = (eventType) => {
    setEditing(eventType);
    setFormData({
      name: eventType.name,
      duration_minutes: eventType.duration_minutes,
      slug: eventType.slug,
      description: eventType.description || '',
      questions: eventType.questions || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event type?')) {
      return;
    }

    try {
      await eventTypesService.delete(id);
      loadEventTypes();
    } catch (err) {
      setError('Failed to delete event type');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', duration_minutes: 30, slug: '', description: '', questions: [] });
    setError('');
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, { question: '', type: 'text', required: false, placeholder: '' }],
    }));
  };

  const removeQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const getBookingUrl = (slug) => {
    return `${window.location.origin}/book/${slug}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Types</h1>
            <p className="mt-2 text-gray-600">Create and manage your meeting types</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-medium"
          >
            + Create Event Type
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : eventTypes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No event types yet. Create your first one!</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 font-medium"
            >
              Create Event Type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventTypes.map((eventType) => (
              <div
                key={eventType.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{eventType.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(eventType)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(eventType.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-2">{eventType.duration_minutes} minutes</p>
                {eventType.description && (
                  <p className="text-sm text-gray-600 mb-4">{eventType.description}</p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Booking Link:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={getBookingUrl(eventType.slug)}
                      className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded bg-gray-50"
                    />
                    <button
                      onClick={() => copyToClipboard(getBookingUrl(eventType.slug))}
                      className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editing ? 'Edit Event Type' : 'Create Event Type'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    min="5"
                    step="5"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL identifier)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used in your booking URL: /book/{formData.slug || 'your-slug'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Custom Questions Section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Questions (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Question
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Add custom questions that invitees will answer when booking
                  </p>

                  {formData.questions.length > 0 && (
                    <div className="space-y-3">
                      {formData.questions.map((q, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-600">Question {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Question text"
                            value={q.question}
                            onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <select
                              value={q.type}
                              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="email">Email</option>
                              <option value="textarea">Long Text</option>
                            </select>
                            <label className="flex items-center space-x-2 text-sm">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span>Required</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Placeholder (optional)"
                            value={q.placeholder || ''}
                            onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
                  >
                    {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
