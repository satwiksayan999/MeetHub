# Deployment Guide for MeetHub

This guide will help you deploy MeetHub to GitHub and Render.

## Prerequisites

- A GitHub account
- A Render account (sign up at https://render.com)
- Git installed on your local machine

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
# Navigate to project root
cd MeetHub

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - MeetHub scheduling app"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com and create a new repository
2. Name it `MeetHub` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license (we already have these)

### 1.3 Push to GitHub

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/MeetHub.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 2: Deploy Database on Render

**Important Note**: Render's free tier typically only supports PostgreSQL. If you need MySQL specifically, you may need to:
- Use a paid Render plan
- Use an external MySQL database (e.g., AWS RDS, PlanetScale, Railway)
- Modify the codebase to use PostgreSQL (requires schema changes)

For this guide, we'll assume you're using PostgreSQL (free tier) or MySQL (if available).

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"** or **"MySQL"**
3. Select **"PostgreSQL"** (free tier) or **"MySQL"** (if available on your plan)
4. Configure:
   - **Name**: `meethub-database`
   - **Database Name**: `meethub`
   - **User**: `meethub_user`
   - **Plan**: Free (for testing) - Note: Free tier only supports PostgreSQL
5. Click **"Create Database"**
6. Wait for database to be provisioned
7. Note down the **Internal Database URL** and connection details (you'll need this)

### Set up Database Schema

Once your database is created, you'll need to initialize the schema. You have two options:

#### Option 1: Using SQL Schema File (Recommended)
1. Go to your Render database dashboard
2. Click on **"Connect"** → **"External Connection"** to get connection details
3. Use a MySQL client (like MySQL Workbench, DBeaver, or command line) to connect
4. Run the SQL commands from `backend/database/schema.sql`
5. Or use Render's database console if available

#### Option 2: Using Setup Script
1. Temporarily add the database connection details to your backend `.env` (or use environment variables)
2. SSH into your backend service (if available) or run locally with Render database credentials
3. Run: `cd backend && npm run setup-db`
4. This will create all tables automatically

**Note**: The setup script (`backend/scripts/setup-db.js`) is more up-to-date and includes recent schema changes. If you use the SQL file, you may need to run migration scripts for `questions` and `message_to_host` fields.

## Step 3: Deploy Backend API

### Option A: Using Render Blueprint (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account and select the `MeetHub` repository
4. Render will detect `render.yaml` and create services automatically
5. You'll need to set environment variables manually after services are created

### Option B: Manual Deployment

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `MeetHub` repository
4. Configure the service:
   - **Name**: `meethub-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DB_HOST=<from database connection string>
   DB_USER=<from database connection string>
   DB_PASSWORD=<from database connection string>
   DB_NAME=meethub
   JWT_SECRET=<generate a strong random string>
   FRONTEND_URL=https://your-frontend-url.onrender.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

6. Click **"Create Web Service"**
7. Wait for deployment to complete
8. Note the **Service URL** (e.g., `https://meethub-backend.onrender.com`)

## Step 4: Deploy Frontend

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub account and select the `MeetHub` repository
4. Configure:
   - **Name**: `meethub-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

5. Add Environment Variable:
   ```
   VITE_API_URL=https://meethub-backend.onrender.com/api
   ```
   (Replace with your actual backend URL)

6. Click **"Create Static Site"**
7. Wait for deployment to complete
8. Note the **Site URL** (e.g., `https://meethub-frontend.onrender.com`)

## Step 5: Update Configuration

### Update Backend CORS

1. Go to your backend service on Render
2. Navigate to **"Environment"** tab
3. Update `FRONTEND_URL` to your frontend URL:
   ```
   FRONTEND_URL=https://meethub-frontend.onrender.com
   ```
4. Save and redeploy

### Verify Environment Variables

**Backend Environment Variables:**
- ✅ `NODE_ENV=production`
- ✅ `PORT=10000` (Render uses port 10000)
- ✅ Database connection variables (from database service)
- ✅ `JWT_SECRET` (strong random string)
- ✅ `FRONTEND_URL` (your frontend URL)
- ✅ Email configuration (SMTP settings)

**Frontend Environment Variables:**
- ✅ `VITE_API_URL` (your backend URL + /api)

## Step 6: Initialize Database

After deployment, you need to initialize the database schema:

1. Connect to your Render database using a MySQL client
2. Run the SQL commands from `backend/database/schema.sql`
3. Or use Render's database console to execute the schema

## Step 7: Test Deployment

1. Visit your frontend URL
2. Try registering a new account
3. Test the booking flow
4. Check backend logs in Render dashboard for any errors

## Troubleshooting

### Backend Issues

- **Database Connection Errors**: Verify database credentials match your Render database service
- **Port Errors**: Ensure `PORT` is set to `10000` or use `process.env.PORT` (which Render sets automatically)
- **CORS Errors**: Verify `FRONTEND_URL` matches your frontend deployment URL exactly

### Frontend Issues

- **API Connection Errors**: Verify `VITE_API_URL` is set correctly and includes `/api`
- **Build Errors**: Check that all dependencies are in `package.json`
- **Environment Variables**: Remember that Vite requires `VITE_` prefix for client-side variables

### Database Issues

- **Schema Not Applied**: Manually run `backend/database/schema.sql` in your database
- **Connection String**: Use the internal database URL for `DB_HOST` when services are in the same region

## Custom Domain (Optional)

1. Go to your service on Render
2. Navigate to **"Settings"** → **"Custom Domain"**
3. Add your domain and follow DNS configuration instructions

## Continuous Deployment

Render automatically deploys on every push to the `main` branch. To disable auto-deploy:
1. Go to service settings
2. Navigate to **"Settings"** → **"Build & Deploy"**
3. Disable **"Auto-Deploy"**

## Free Tier Limitations

- Services may spin down after 15 minutes of inactivity (cold starts take ~30 seconds)
- Free tier has resource limitations
- Consider upgrading for production use

## Security Notes

- Never commit `.env` files to GitHub
- Use strong, random `JWT_SECRET` values
- Keep your Render dashboard credentials secure
- Consider using Render's secrets management for sensitive data

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: Create an issue in your repository for project-specific problems
