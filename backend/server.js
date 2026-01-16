import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import eventTypesRoutes from './routes/eventTypes.js';
import availabilityRoutes from './routes/availability.js';
import publicRoutes from './routes/public.js';
import meetingsRoutes from './routes/meetings.js';

dotenv.config();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('⚠️  WARNING: JWT_SECRET is not set in .env file');
  console.error('   Authentication will not work properly.');
  console.error('   Please set JWT_SECRET in your .env file.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173', // Vite default port
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/event-types', eventTypesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/meetings', meetingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
