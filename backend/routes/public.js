import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { generateTimeSlots, getDayOfWeek, timeRangesOverlap, isPastDate } from '../utils/time.js';
import { sendBookingConfirmationToInvitee, sendBookingNotificationToHost } from '../utils/email.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const router = express.Router();

// Get public event type by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const [eventTypes] = await pool.execute(
      `SELECT et.*, u.name as user_name, u.email as user_email, u.timezone as user_timezone
       FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE et.slug = ?`,
      [slug]
    );

    if (eventTypes.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    const eventType = eventTypes[0];
    
    // Parse questions JSON if it exists
    let questions = null;
    if (eventType.questions) {
      try {
        questions = typeof eventType.questions === 'string' 
          ? JSON.parse(eventType.questions) 
          : eventType.questions;
      } catch (e) {
        console.error('Error parsing questions:', e);
      }
    }

    res.json({
      id: eventType.id,
      name: eventType.name,
      duration_minutes: eventType.duration_minutes,
      slug: eventType.slug,
      description: eventType.description,
      questions: questions,
      user_name: eventType.user_name,
      user_timezone: eventType.user_timezone
    });
  } catch (error) {
    console.error('Get public event type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available slots for a date
router.get('/:slug/available-slots', async (req, res) => {
  try {
    const { slug } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Check if date is in the past
    if (isPastDate(date)) {
      return res.json({ slots: [] });
    }

    // Get event type and user info
    const [eventTypes] = await pool.execute(
      `SELECT et.*, u.timezone as user_timezone
       FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE et.slug = ?`,
      [slug]
    );

    if (eventTypes.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    const eventType = eventTypes[0];
    const dayOfWeek = getDayOfWeek(date);

    // Get availability for this day
    const [availability] = await pool.execute(
      'SELECT * FROM availability WHERE user_id = (SELECT user_id FROM event_types WHERE slug = ?) AND day_of_week = ?',
      [slug, dayOfWeek]
    );

    if (availability.length === 0) {
      return res.json({ slots: [] });
    }

    // Get existing bookings for this date
    const [bookings] = await pool.execute(
      `SELECT start_time, end_time FROM meetings 
       WHERE event_type_id = ? 
       AND meeting_date = ? 
       AND status = 'scheduled'`,
      [eventType.id, date]
    );

    // Generate all possible slots from availability
    const allSlots = [];
    for (const avail of availability) {
      const slots = generateTimeSlots(
        date,
        avail.start_time,
        avail.end_time,
        eventType.duration_minutes,
        eventType.user_timezone
      );
      allSlots.push(...slots);
    }

    // Filter out overlapping slots
    const availableSlots = allSlots.filter(slot => {
      return !bookings.some(booking => {
        return timeRangesOverlap(
          slot.start,
          slot.end,
          booking.start_time.substring(0, 5), // Remove seconds if present
          booking.end_time.substring(0, 5)
        );
      });
    });

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Book a meeting
router.post('/:slug/book', [
  body('invitee_name').trim().notEmpty().withMessage('Name is required'),
  body('invitee_email').isEmail().withMessage('Valid email is required'),
  body('meeting_date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be in YYYY-MM-DD format'),
  body('start_time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:mm format'),
  body('timezone').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug } = req.params;
    const { invitee_name, invitee_email, meeting_date, start_time, timezone = 'UTC', invitee_answers, message_to_host } = req.body;

    // Check if date is in the past
    if (isPastDate(meeting_date)) {
      return res.status(400).json({ error: 'Cannot book meetings in the past' });
    }

    // Get event type with host info
    const [eventTypes] = await pool.execute(
      `SELECT et.*, u.timezone as user_timezone, u.name as user_name, u.email as user_email
       FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE et.slug = ?`,
      [slug]
    );

    if (eventTypes.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    const eventType = eventTypes[0];

    // Calculate end time
    const startDateTime = dayjs.tz(`${meeting_date} ${start_time}`, timezone);
    const endDateTime = startDateTime.add(eventType.duration_minutes, 'minute');
    const end_time = endDateTime.format('HH:mm');

    // Check if slot is still available
    const [conflicts] = await pool.execute(
      `SELECT id FROM meetings 
       WHERE event_type_id = ? 
       AND meeting_date = ? 
       AND status = 'scheduled'
       AND (
         (start_time <= ? AND end_time > ?) OR
         (start_time < ? AND end_time >= ?) OR
         (start_time >= ? AND end_time <= ?)
       )`,
      [eventType.id, meeting_date, start_time, start_time, end_time, end_time, start_time, end_time]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'This time slot is no longer available' });
    }

    // Verify slot is within availability
    const dayOfWeek = getDayOfWeek(meeting_date);
    const [availability] = await pool.execute(
      'SELECT * FROM availability WHERE user_id = ? AND day_of_week = ?',
      [eventType.user_id, dayOfWeek]
    );

    let isValidSlot = false;
    for (const avail of availability) {
      if (start_time >= avail.start_time && end_time <= avail.end_time) {
        isValidSlot = true;
        break;
      }
    }

    if (!isValidSlot) {
      return res.status(400).json({ error: 'Selected time is outside available hours' });
    }

    // Store invitee answers as JSON
    const answersJson = invitee_answers ? JSON.stringify(invitee_answers) : null;

    // Create meeting
    const [result] = await pool.execute(
      `INSERT INTO meetings (event_type_id, user_id, invitee_name, invitee_email, meeting_date, start_time, end_time, timezone, status, invitee_answers, message_to_host)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)`,
      [eventType.id, eventType.user_id, invitee_name, invitee_email, meeting_date, start_time, end_time, timezone, answersJson, message_to_host || null]
    );

    const [meeting] = await pool.execute(
      'SELECT * FROM meetings WHERE id = ?',
      [result.insertId]
    );

    // Send emails asynchronously (don't wait for them)
    Promise.all([
      sendBookingConfirmationToInvitee(meeting[0], eventType, eventType.user_name),
      sendBookingNotificationToHost(
        { ...meeting[0], host_email: eventType.user_email, message_to_host: message_to_host || null },
        eventType,
        invitee_answers || {}
      )
    ]).catch(error => {
      console.error('Error sending booking emails:', error);
    });

    res.status(201).json(meeting[0]);
  } catch (error) {
    console.error('Book meeting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
