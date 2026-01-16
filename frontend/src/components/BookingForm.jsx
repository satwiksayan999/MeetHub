import { useState, useEffect } from 'react';

export default function BookingForm({ onSubmit, loading, questions = [] }) {
  const [formData, setFormData] = useState({
    invitee_name: '',
    invitee_email: '',
    message_to_host: '',
  });

  const [customAnswers, setCustomAnswers] = useState({});
  const [errors, setErrors] = useState({});

  // Initialize custom answers
  useEffect(() => {
    const initialAnswers = {};
    questions.forEach((q, index) => {
      initialAnswers[`question_${index}`] = '';
    });
    setCustomAnswers(initialAnswers);
  }, [questions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCustomQuestionChange = (index, value) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [`question_${index}`]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.invitee_name.trim()) {
      newErrors.invitee_name = 'Name is required';
    }

    if (!formData.invitee_email.trim()) {
      newErrors.invitee_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.invitee_email)) {
      newErrors.invitee_email = 'Invalid email format';
    }

    // Validate custom questions
    questions.forEach((q, index) => {
      const answer = customAnswers[`question_${index}`] || '';
      if (q.required && !answer.trim()) {
        newErrors[`question_${index}`] = 'This field is required';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build invitee_answers object
    const inviteeAnswers = {};
    questions.forEach((q, index) => {
      const answer = customAnswers[`question_${index}`];
      if (answer && answer.trim()) {
        inviteeAnswers[q.question] = answer.trim();
      }
    });

    onSubmit({ ...formData, invitee_answers: Object.keys(inviteeAnswers).length > 0 ? inviteeAnswers : undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="invitee_name" className="block text-sm font-medium text-gray-700 mb-1">
          Your Name
        </label>
        <input
          type="text"
          id="invitee_name"
          name="invitee_name"
          value={formData.invitee_name}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.invitee_name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your name"
        />
        {errors.invitee_name && (
          <p className="mt-1 text-sm text-red-600">{errors.invitee_name}</p>
        )}
      </div>

      <div>
        <label htmlFor="invitee_email" className="block text-sm font-medium text-gray-700 mb-1">
          Your Email
        </label>
        <input
          type="email"
          id="invitee_email"
          name="invitee_email"
          value={formData.invitee_email}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.invitee_email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your email"
        />
        {errors.invitee_email && (
          <p className="mt-1 text-sm text-red-600">{errors.invitee_email}</p>
        )}
      </div>

      {/* Message to Host */}
      <div>
        <label htmlFor="message_to_host" className="block text-sm font-medium text-gray-700 mb-1">
          Message to Host (Optional)
        </label>
        <textarea
          id="message_to_host"
          name="message_to_host"
          value={formData.message_to_host}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Is there anything specific you'd like to discuss or prepare for this meeting?"
        />
        <p className="mt-1 text-xs text-gray-500">
          Your host will see this message before the meeting
        </p>
      </div>

      {/* Custom Questions */}
      {questions && questions.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Additional Information</h3>
          {questions.map((q, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {q.question}
                {q.required && <span className="text-red-500"> *</span>}
              </label>
              {q.type === 'textarea' ? (
                <textarea
                  value={customAnswers[`question_${index}`] || ''}
                  onChange={(e) => handleCustomQuestionChange(index, e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors[`question_${index}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={q.placeholder || 'Enter your answer'}
                />
              ) : (
                <input
                  type={q.type === 'email' ? 'email' : 'text'}
                  value={customAnswers[`question_${index}`] || ''}
                  onChange={(e) => handleCustomQuestionChange(index, e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors[`question_${index}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={q.placeholder || 'Enter your answer'}
                />
              )}
              {errors[`question_${index}`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`question_${index}`]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? 'Booking...' : 'Confirm Booking'}
      </button>
    </form>
  );
}
