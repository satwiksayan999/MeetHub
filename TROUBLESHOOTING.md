# Troubleshooting Registration/Login Issues

## Common Issues and Solutions

### 1. "Registration failed. Please try again."

**Possible Causes:**

#### A. Database not initialized
**Solution:** Run the database setup script:
```bash
cd backend
npm run setup-db
```

#### B. JWT_SECRET not configured
**Solution:** Add JWT_SECRET to `backend/.env`:
```env
JWT_SECRET=your-secret-key-change-in-production
```

#### C. Database connection issues
**Solution:** Check your `backend/.env` file has correct database credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=meethub
```

#### D. MySQL not running
**Solution:** Start your MySQL server

### 2. "Login failed. Please try again."

**Possible Causes:**

#### A. Invalid credentials
- Check email and password are correct
- Passwords are case-sensitive

#### B. Database issues (same as Registration issue B, C, D above)

### 3. Checking Backend Logs

Check your backend console/terminal for specific error messages. The updated error handling will now show:
- Database connection errors
- JWT_SECRET missing warnings
- Specific database errors

### 4. Quick Diagnostic Steps

1. **Check backend server is running:**
   ```bash
   # Should show: "Server running on port 5000"
   ```

2. **Check database connection:**
   - Look for: "✅ Database connected successfully" in backend logs
   - If you see connection errors, fix your `.env` file

3. **Verify .env file exists:**
   ```bash
   cd backend
   # Make sure .env file exists with required variables
   ```

4. **Test database setup:**
   ```bash
   cd backend
   npm run setup-db
   # Should show all tables created successfully
   ```

### 5. Required .env Variables

Make sure `backend/.env` has at minimum:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=meethub
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

### 6. Still Having Issues?

1. Check browser console (F12) for frontend errors
2. Check backend terminal for server errors
3. Verify MySQL is running: `mysql -u root -p`
4. Verify database exists: `SHOW DATABASES;`
5. Verify tables exist: `USE meethub; SHOW TABLES;`

The error messages have been improved to be more specific and helpful!
