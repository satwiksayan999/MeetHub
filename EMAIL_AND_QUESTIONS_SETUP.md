# Email Notifications & Custom Questions - Setup Guide

## ✅ Features Implemented

### 1. Email Notifications
- ✅ Booking confirmation email to invitee (person who booked)
- ✅ Booking notification email to host (event creator)
- ✅ Cancellation emails to both invitee and host
- ✅ Different email templates for each recipient type

### 2. Custom Invitee Questions
- ✅ Add custom questions when creating/editing event types
- ✅ Question types: Text, Email, Long Text (textarea)
- ✅ Required/optional questions
- ✅ Custom placeholders
- ✅ Answers stored with bookings and included in host email

## 📧 Email Configuration

### Step 1: Update Backend `.env` File

Add these email configuration variables to `backend/.env`:

```env
# Email Configuration (Nodemailer)
# For Gmail: Use App Password (https://support.google.com/accounts/answer/185833)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Gmail Setup Instructions:
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "App Passwords" (https://myaccount.google.com/apppasswords)
4. Generate an app password for "Mail"
5. Use this app password as `SMTP_PASS` (not your regular password)

### Other Email Providers:
- **Outlook/Hotmail**: `smtp-mail.outlook.com`, port `587`
- **Yahoo**: `smtp.mail.yahoo.com`, port `587`
- **Custom SMTP**: Adjust `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` accordingly

**Note**: If email is not configured, the app will continue to work but emails won't be sent (logged to console instead).

## 🗄️ Database Migration

### Step 2: Run Database Migration

Run this command to add the required columns:

```bash
cd backend
node scripts/add-custom-questions.js
```

Or if you're setting up from scratch, the columns are already included in the setup script:
```bash
cd backend
npm run setup-db
```

## 📦 Install Dependencies

Make sure nodemailer is installed:

```bash
cd backend
npm install
```

## 🚀 Usage

### Adding Custom Questions to Event Types

1. Go to **Event Types** page
2. Create or edit an event type
3. Scroll to **Custom Questions** section
4. Click **"+ Add Question"**
5. Fill in:
   - Question text
   - Type (Text, Email, or Long Text)
   - Check "Required" if needed
   - Add placeholder text (optional)
6. Save the event type

### How It Works

**When someone books:**
- Invitee sees custom questions on the booking form
- Answers are collected and stored with the booking
- Invitee receives a confirmation email with meeting details
- Host receives a notification email with:
  - Invitee details
  - Meeting date/time
  - Answers to custom questions

**When a meeting is cancelled:**
- Both invitee and host receive cancellation emails

## 📝 Email Templates

The emails include:
- **Invitee Confirmation**: Meeting details, date, time, duration
- **Host Notification**: Invitee info, meeting details, custom question answers
- **Cancellation Emails**: Meeting details that were cancelled

All emails are HTML formatted and mobile-friendly.

## 🔍 Testing

1. Create an event type with custom questions
2. Book a meeting using the public booking link
3. Answer the custom questions
4. Check your email (both invitee and host emails if configured)
5. Cancel a meeting and verify cancellation emails are sent

## 🛠️ Troubleshooting

### Emails not sending?
- Check `.env` file has correct SMTP credentials
- For Gmail, ensure you're using an App Password, not your regular password
- Check backend console logs for email errors
- Verify SMTP server settings match your email provider

### Custom questions not showing?
- Ensure you ran the database migration script
- Check that questions are saved when creating/editing event types
- Clear browser cache if needed

### Questions not saving?
- Ensure questions array has valid format: `[{question: "...", type: "...", required: true/false}]`
- Check browser console for API errors

## 📋 Question Format

Questions are stored as JSON:
```json
[
  {
    "question": "What would you like to discuss?",
    "type": "textarea",
    "required": true,
    "placeholder": "Enter details here..."
  },
  {
    "question": "Your phone number",
    "type": "text",
    "required": false,
    "placeholder": "+1234567890"
  }
]
```

**Question Types:**
- `text`: Single line text input
- `email`: Email input (with validation)
- `textarea`: Multi-line text input
