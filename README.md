# MeetHub - Calendly-like Scheduling Application

A full-stack meeting scheduling application built with React, Node.js, Express, and MySQL.

## Features

- ✅ User authentication (email/password)
- ✅ Create and manage event types
- ✅ Set weekly availability
- ✅ Public booking pages
- ✅ Prevent double bookings
- ✅ View and manage meetings
- ✅ Responsive UI with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Day.js

### Backend
- Node.js
- Express.js
- MySQL
- JWT Authentication
- bcryptjs
- Day.js (timezone support)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=meethub
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

4. Create the database and tables:
```bash
mysql -u root -p < database/schema.sql
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Event Types**: Go to Event Types page and create meeting types (e.g., "30 Minute Meeting")
3. **Set Availability**: Go to Availability page and set your weekly schedule
4. **Share Booking Link**: Copy the booking link from your event type and share it
5. **Book Meetings**: Use the public booking link to schedule meetings
6. **Manage Meetings**: View upcoming and past meetings, cancel if needed

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Event Types (Protected)
- `GET /api/event-types` - Get all event types
- `POST /api/event-types` - Create event type
- `PUT /api/event-types/:id` - Update event type
- `DELETE /api/event-types/:id` - Delete event type

### Availability (Protected)
- `GET /api/availability` - Get availability
- `POST /api/availability` - Save availability

### Public Booking
- `GET /api/public/:slug` - Get event type by slug
- `GET /api/public/:slug/available-slots?date=YYYY-MM-DD` - Get available slots
- `POST /api/public/:slug/book` - Book a meeting

### Meetings (Protected)
- `GET /api/meetings/upcoming` - Get upcoming meetings
- `GET /api/meetings/past` - Get past meetings
- `PUT /api/meetings/:id/cancel` - Cancel meeting

## Database Schema

- **users**: User accounts
- **event_types**: Meeting types created by users
- **availability**: Weekly availability settings
- **meetings**: Scheduled meetings

## Project Structure

```
MeetHub/
├── backend/
│   ├── config/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Deployment

This application can be deployed to Render. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment Steps

1. Push your code to GitHub
2. Create a MySQL database on Render
3. Deploy backend as a Web Service
4. Deploy frontend as a Static Site
5. Configure environment variables
6. Initialize database schema

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## License

MIT
