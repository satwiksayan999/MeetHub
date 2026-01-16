import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter only if email is configured
let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Increased timeouts for Render's network
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    // For Gmail with TLS
    requireTLS: true,
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  };

  // For port 465 with SSL
  if (parseInt(process.env.SMTP_PORT || '587') === 465) {
    smtpConfig.secure = true;
    smtpConfig.requireTLS = false;
  }

  transporter = nodemailer.createTransport(smtpConfig);

  // Verify transporter configuration asynchronously (non-blocking)
  transporter.verify((error, success) => {
    if (error) {
      console.log('⚠️  Email configuration error (emails will be skipped):', error.message);
      console.log('   Error code:', error.code);
      console.log('   SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
      console.log('   SMTP Port:', process.env.SMTP_PORT || '587');
      console.log('   Email functionality will be disabled until SMTP is properly configured.');
      console.log('   Note: Render free tier may have network restrictions. Consider using SendGrid or similar service.');
    } else {
      console.log('✅ Email server is ready to send messages');
      console.log('   SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
      console.log('   SMTP Port:', process.env.SMTP_PORT || '587');
    }
  });
} else {
  console.log('ℹ️  Email not configured - SMTP_USER and SMTP_PASS not set. Email features will be disabled.');
}

/**
 * Send booking confirmation email to invitee
 */
export async function sendBookingConfirmationToInvitee(booking, eventType, hostName) {
  if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured - skipping invitee confirmation email');
    return;
  }

  const { invitee_name, invitee_email, meeting_date, start_time, end_time } = booking;
  
  const mailOptions = {
    from: `"${hostName}" <${process.env.SMTP_USER}>`,
    to: invitee_email,
    subject: `Meeting Confirmed: ${eventType.name} with ${hostName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; margin-left: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Meeting Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${invitee_name},</p>
            <p>Your meeting has been successfully scheduled. Here are the details:</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Event:</span>
                <span class="value">${eventType.name}</span>
              </div>
              <div class="info-row">
                <span class="label">Host:</span>
                <span class="value">${hostName}</span>
              </div>
              <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${formatDate(meeting_date)}</span>
              </div>
              <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">${formatTime(start_time)} - ${formatTime(end_time)}</span>
              </div>
              <div class="info-row">
                <span class="label">Duration:</span>
                <span class="value">${eventType.duration_minutes} minutes</span>
              </div>
            </div>

            <p>We look forward to meeting with you!</p>
            
            <div class="footer">
              <p>This is an automated confirmation email from MeetHub.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hi ${invitee_name},

Your meeting has been successfully scheduled.

Event: ${eventType.name}
Host: ${hostName}
Date: ${formatDate(meeting_date)}
Time: ${formatTime(start_time)} - ${formatTime(end_time)}
Duration: ${eventType.duration_minutes} minutes

We look forward to meeting with you!
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${invitee_email}`);
  } catch (error) {
    console.error('Error sending invitee confirmation email:', error);
  }
}

/**
 * Send booking notification email to host
 */
export async function sendBookingNotificationToHost(booking, eventType, inviteeAnswers = {}) {
  if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured - skipping host notification email');
    return;
  }

  const { invitee_name, invitee_email, meeting_date, start_time, end_time, message_to_host } = booking;
  
  // Format custom answers if any
  let answersSection = '';
  if (Object.keys(inviteeAnswers).length > 0) {
    answersSection = `
      <div class="info-box">
        <h3 style="margin-top: 0; color: #0ea5e9;">Invitee Information:</h3>
        ${Object.entries(inviteeAnswers).map(([question, answer]) => `
          <div class="info-row">
            <span class="label">${question}:</span>
            <span class="value">${answer}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Format message to host if any
  let messageSection = '';
  if (message_to_host && message_to_host.trim()) {
    messageSection = `
      <div class="info-box" style="border-left-color: #f59e0b;">
        <h3 style="margin-top: 0; color: #f59e0b;">💬 Message from Invitee:</h3>
        <p style="color: #333; white-space: pre-wrap;">${message_to_host}</p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"MeetHub" <${process.env.SMTP_USER}>`,
    to: booking.host_email || process.env.SMTP_USER,
    subject: `New Meeting Scheduled: ${eventType.name} - ${invitee_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; margin-left: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Meeting Scheduled</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have a new meeting scheduled for your event type "<strong>${eventType.name}</strong>".</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="label">Event Type:</span>
                <span class="value">${eventType.name}</span>
              </div>
              <div class="info-row">
                <span class="label">Invitee Name:</span>
                <span class="value">${invitee_name}</span>
              </div>
              <div class="info-row">
                <span class="label">Invitee Email:</span>
                <span class="value">${invitee_email}</span>
              </div>
              <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">${formatDate(meeting_date)}</span>
              </div>
              <div class="info-row">
                <span class="label">Time:</span>
                <span class="value">${formatTime(start_time)} - ${formatTime(end_time)}</span>
              </div>
              <div class="info-row">
                <span class="label">Duration:</span>
                <span class="value">${eventType.duration_minutes} minutes</span>
              </div>
            </div>

            ${answersSection}

            ${messageSection}

            <p>Please make sure to add this to your calendar!</p>
            
            <div class="footer">
              <p>This is an automated notification from MeetHub.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
You have a new meeting scheduled for your event type "${eventType.name}".

Invitee: ${invitee_name} (${invitee_email})
Date: ${formatDate(meeting_date)}
Time: ${formatTime(start_time)} - ${formatTime(end_time)}
Duration: ${eventType.duration_minutes} minutes

${Object.keys(inviteeAnswers).length > 0 ? '\nInvitee Information:\n' + Object.entries(inviteeAnswers).map(([q, a]) => `${q}: ${a}`).join('\n') : ''}

Please make sure to add this to your calendar!
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking notification email sent to host`);
  } catch (error) {
    console.error('Error sending host notification email:', error);
  }
}

/**
 * Send cancellation email to invitee
 */
export async function sendCancellationToInvitee(booking, eventType, hostName) {
  if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured - skipping cancellation email to invitee');
    return;
  }

  const { invitee_name, invitee_email, meeting_date, start_time } = booking;

  const mailOptions = {
    from: `"${hostName}" <${process.env.SMTP_USER}>`,
    to: invitee_email,
    subject: `Meeting Cancelled: ${eventType.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Meeting Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${invitee_name},</p>
            <p>Unfortunately, your meeting scheduled for <strong>${formatDate(meeting_date)} at ${formatTime(start_time)}</strong> has been cancelled.</p>
            <p>Event: <strong>${eventType.name}</strong> with ${hostName}</p>
            <p>We apologize for any inconvenience. Please feel free to schedule a new meeting if needed.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Cancellation email sent to ${invitee_email}`);
  } catch (error) {
    console.error('Error sending cancellation email:', error);
  }
}

/**
 * Send cancellation notification to host
 */
export async function sendCancellationToHost(booking, eventType, inviteeName) {
  if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured - skipping cancellation email to host');
    return;
  }

  const { meeting_date, start_time } = booking;

  const mailOptions = {
    from: `"MeetHub" <${process.env.SMTP_USER}>`,
    to: booking.host_email || process.env.SMTP_USER,
    subject: `Meeting Cancelled: ${eventType.name} - ${inviteeName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ef4444;">Meeting Cancelled</h2>
          <p>The following meeting has been cancelled:</p>
          <p><strong>Event:</strong> ${eventType.name}<br>
          <strong>Invitee:</strong> ${inviteeName}<br>
          <strong>Date:</strong> ${formatDate(meeting_date)}<br>
          <strong>Time:</strong> ${formatTime(start_time)}</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Cancellation notification sent to host`);
  } catch (error) {
    console.error('Error sending cancellation notification to host:', error);
  }
}

// Helper functions
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(time) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
