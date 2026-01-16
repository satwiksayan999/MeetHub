# Quick Start Guide

## Prerequisites
- Node.js (v16+)
- MySQL (v8+)
- npm or yarn

## Step 1: Database Setup

1. Start MySQL server
2. Create the database:
```bash
mysql -u root -p < backend/database/schema.sql
```

Or manually:
```sql
CREATE DATABASE meethub;
USE meethub;
-- Then run the schema.sql file
```

## Step 2: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=meethub
JWT_SECRET=change-this-to-a-random-secret-key
NODE_ENV=development
```

Start backend:
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

## Step 3: Frontend Setup

```bash
cd frontend
npm install
```

(Optional) Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## Step 4: Test the Application

1. Open `http://localhost:3000`
2. Register a new account
3. Create an event type (e.g., "30 Minute Meeting")
4. Set your availability
5. Copy the booking link and test it in an incognito window

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check `.env` file has correct credentials
- Ensure database `meethub` exists

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Change port in `vite.config.js`

### CORS Issues
- Ensure backend is running
- Check `VITE_API_URL` in frontend `.env`
