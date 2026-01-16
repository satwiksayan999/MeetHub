import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create/Update availability (replaces all for user)
router.post('/', [
  body('availability').isArray().withMessage('Availability must be an array'),
  body('availability.*.day_of_week').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
  body('availability.*.start_time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:mm format'),
  body('availability.*.end_time').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:mm format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { availability } = req.body;

    // Validate time ranges
    for (const slot of availability) {
      if (slot.start_time >= slot.end_time) {
        return res.status(400).json({ error: 'Start time must be before end time' });
      }
    }

    // Delete existing availability
    await pool.execute('DELETE FROM availability WHERE user_id = ?', [userId]);

    // Insert new availability
    if (availability.length > 0) {
      const values = availability.map(slot => [userId, slot.day_of_week, slot.start_time, slot.end_time]);
      const placeholders = values.map(() => '(?, ?, ?, ?)').join(', ');
      const flatValues = values.flat();

      await pool.execute(
        `INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES ${placeholders}`,
        flatValues
      );
    }

    // Return updated availability
    const [updated] = await pool.execute(
      'SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week, start_time',
      [userId]
    );

    res.json(updated);
  } catch (error) {
    console.error('Save availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get availability
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [availability] = await pool.execute(
      'SELECT * FROM availability WHERE user_id = ? ORDER BY day_of_week, start_time',
      [userId]
    );

    res.json(availability);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
