import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('timezone').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return first error message in a consistent format
      const firstError = errors.array()[0];
      return res.status(400).json({ error: firstError.msg || 'Validation failed' });
    }

    const { name, email, password, timezone = 'UTC' } = req.body;

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, timezone) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, timezone]
    );

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        name,
        email,
        timezone
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Database not initialized. Please run: npm run setup-db' });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured. Please check your .env file' });
    }
    
    // Generic error with more details in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Registration failed: ${error.message}`
      : 'Registration failed. Please try again.';
    
    res.status(500).json({ error: errorMessage });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return first error message in a consistent format
      const firstError = errors.array()[0];
      return res.status(400).json({ error: firstError.msg || 'Validation failed' });
    }

    const { email, password } = req.body;

    // Find user
    const [users] = await pool.execute(
      'SELECT id, name, email, password_hash, timezone FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide more specific error messages
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Database not initialized. Please run: npm run setup-db' });
    }
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured. Please check your .env file' });
    }
    
    // Generic error with more details in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `Login failed: ${error.message}`
      : 'Login failed. Please try again.';
    
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
