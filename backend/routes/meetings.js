import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import { sendCancellationToInvitee, sendCancellationToHost } from '../utils/email.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get upcoming meetings
router.get('/upcoming', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [meetings] = await pool.execute(
      `SELECT m.*, et.name as event_type_name, et.slug as event_type_slug
       FROM meetings m
       JOIN event_types et ON m.event_type_id = et.id
       WHERE m.user_id = ? 
       AND m.status = 'scheduled'
       AND (m.meeting_date > ? OR (m.meeting_date = ? AND m.start_time >= TIME(NOW())))
       ORDER BY m.meeting_date ASC, m.start_time ASC`,
      [userId, today, today]
    );

    res.json(meetings);
  } catch (error) {
    console.error('Get upcoming meetings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get past meetings
router.get('/past', async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const [meetings] = await pool.execute(
      `SELECT m.*, et.name as event_type_name, et.slug as event_type_slug
       FROM meetings m
       JOIN event_types et ON m.event_type_id = et.id
       WHERE m.user_id = ? 
       AND (m.status = 'cancelled' OR m.meeting_date < ? OR (m.meeting_date = ? AND m.start_time < TIME(NOW())))
       ORDER BY m.meeting_date DESC, m.start_time DESC
       LIMIT 50`,
      [userId, today, today]
    );

    res.json(meetings);
  } catch (error) {
    console.error('Get past meetings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel meeting
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [existing] = await pool.execute(
      'SELECT id FROM meetings WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    await pool.execute(
      "UPDATE meetings SET status = 'cancelled' WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    // Get meeting with event type and host info
    const [meetings] = await pool.execute(
      `SELECT m.*, et.name as event_type_name, et.slug, u.name as host_name, u.email as host_email
       FROM meetings m
       JOIN event_types et ON m.event_type_id = et.id
       JOIN users u ON et.user_id = u.id
       WHERE m.id = ?`,
      [id]
    );

    if (meetings.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = meetings[0];

    // Send cancellation emails asynchronously
    Promise.all([
      sendCancellationToInvitee(meeting, { name: meeting.event_type_name }, meeting.host_name),
      sendCancellationToHost(meeting, { name: meeting.event_type_name }, meeting.invitee_name)
    ]).catch(error => {
      console.error('Error sending cancellation emails:', error);
    });

    res.json(meeting);
  } catch (error) {
    console.error('Cancel meeting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
