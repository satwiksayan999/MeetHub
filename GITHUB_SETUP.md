# Quick GitHub Setup Guide

## Initial GitHub Setup (One-time)

### 1. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `MeetHub` (or your preferred name)
3. Description: "Calendly-like meeting scheduling application"
4. Visibility: Public or Private (your choice)
5. **Do NOT** check "Initialize with README" (we already have files)
6. Click "Create repository"

### 2. Push Your Code

Open terminal in your project directory and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: MeetHub scheduling app ready for deployment"

# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/MeetHub.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### 3. Verify Upload

1. Go to your GitHub repository page
2. You should see all your project files
3. Verify that `.env` files are NOT visible (they should be in `.gitignore`)

## Future Updates

After making changes:

```bash
git add .
git commit -m "Description of your changes"
git push
```

Render will automatically redeploy when you push to the `main` branch (if auto-deploy is enabled).

## Next Steps

After pushing to GitHub, proceed to [DEPLOYMENT.md](./DEPLOYMENT.md) for Render deployment instructions.
