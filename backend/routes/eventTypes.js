import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create event type
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('duration_minutes').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
  body('slug').trim().notEmpty().withMessage('Slug is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, duration_minutes, slug, description, questions } = req.body;
    const userId = req.user.id;

    // Validate and prepare questions JSON
    let questionsJson = null;
    if (questions && Array.isArray(questions) && questions.length > 0) {
      // Validate questions structure
      const validQuestions = questions.filter(q => q && q.question && q.type);
      if (validQuestions.length > 0) {
        questionsJson = JSON.stringify(validQuestions);
      }
    }

    // Check if slug is unique
    const [existing] = await pool.execute(
      'SELECT id FROM event_types WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const [result] = await pool.execute(
      'INSERT INTO event_types (user_id, name, duration_minutes, slug, description, questions) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, duration_minutes, slug, description || null, questionsJson]
    );

    const [eventType] = await pool.execute(
      'SELECT * FROM event_types WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(eventType[0]);
  } catch (error) {
    console.error('Create event type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all event types for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const [eventTypes] = await pool.execute(
      'SELECT * FROM event_types WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Parse questions JSON for each event type
    const parsedEventTypes = eventTypes.map(et => {
      if (et.questions) {
        try {
          et.questions = typeof et.questions === 'string' 
            ? JSON.parse(et.questions) 
            : et.questions;
        } catch (e) {
          et.questions = null;
        }
      }
      return et;
    });

    res.json(parsedEventTypes);
  } catch (error) {
    console.error('Get event types error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event type
router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  body('duration_minutes').optional().isInt({ min: 5 }),
  body('slug').optional().trim().notEmpty(),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Handle questions field
    if (updates.questions !== undefined) {
      let questionsJson = null;
      if (updates.questions && Array.isArray(updates.questions) && updates.questions.length > 0) {
        const validQuestions = updates.questions.filter(q => q && q.question && q.type);
        if (validQuestions.length > 0) {
          questionsJson = JSON.stringify(validQuestions);
        }
      }
      updates.questions = questionsJson;
    }

    // Check ownership
    const [existing] = await pool.execute(
      'SELECT id FROM event_types WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    // Check slug uniqueness if updating
    if (updates.slug) {
      const [slugCheck] = await pool.execute(
        'SELECT id FROM event_types WHERE slug = ? AND id != ?',
        [updates.slug, id]
      );

      if (slugCheck.length > 0) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    // Build update query
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.duration_minutes) {
      fields.push('duration_minutes = ?');
      values.push(updates.duration_minutes);
    }
    if (updates.slug) {
      fields.push('slug = ?');
      values.push(updates.slug);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.questions !== undefined) {
      fields.push('questions = ?');
      values.push(updates.questions);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, userId);

    await pool.execute(
      `UPDATE event_types SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT * FROM event_types WHERE id = ?',
      [id]
    );

    // Parse questions JSON
    const eventType = updated[0];
    if (eventType.questions) {
      try {
        eventType.questions = typeof eventType.questions === 'string' 
          ? JSON.parse(eventType.questions) 
          : eventType.questions;
      } catch (e) {
        eventType.questions = null;
      }
    }

    res.json(eventType);
  } catch (error) {
    console.error('Update event type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event type
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [existing] = await pool.execute(
      'SELECT id FROM event_types WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    await pool.execute(
      'DELETE FROM event_types WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Event type deleted' });
  } catch (error) {
    console.error('Delete event type error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
