import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    console.log(`📧 SMTP Mailer configured with host: ${host}`);
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    console.log('📧 Gmail Mailer configured successfully');
  }

  return transporter;
}

export async function sendOtpEmail({ email, otp, type = 'register', name = '' }) {
  const mailer = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@rupeetrack.app';

  const isPasswordReset = type === 'password_reset';
  const subject = isPasswordReset
    ? `🔑 ${otp} is your RupeeTrack Password Reset Code`
    : `🔐 ${otp} is your RupeeTrack Email Verification Code`;

  const title = isPasswordReset ? 'Password Reset Verification' : 'Verify Your Email Address';
  const message = isPasswordReset
    ? 'We received a request to reset the password for your RupeeTrack account. Use the verification code below to set a new password:'
    : 'Welcome to RupeeTrack! Use the verification code below to complete your registration:';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
          .card { max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .logo { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 12px; font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 20px; }
          h2 { color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          p { color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
          .otp-box { background-color: #0f172a; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #34d399; font-family: monospace; }
          .expiry { font-size: 12px; color: #94a3b8; margin-top: 8px; text-align: center; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">₹</div>
          <h2>${title}</h2>
          <p>${name ? `Hello <strong>${name}</strong>,<br>` : ''}${message}</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 10 minutes</div>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">If you did not request this verification code, please ignore this email.</p>
          <div class="footer">
            RupeeTrack • Smart Personal & Family Expense Hub<br>
            All amounts in Indian Rupee (₹)
          </div>
        </div>
      </body>
    </html>
  `;

  if (mailer) {
    try {
      await mailer.sendMail({
        from: `"RupeeTrack" <${fromEmail}>`,
        to: email,
        subject,
        html: htmlContent
      });
      console.log(`✅ Verification email sent to: ${email}`);
      return { success: true, sent: true };
    } catch (err) {
      console.error(`⚠️ Failed to send email via SMTP (${err.message}). Logging OTP.`);
    }
  }

  // Fallback / Development logging mode
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 [Simulated Email] Verification OTP for ${email}:`);
  console.log(`🔑 OTP CODE: ${otp} (Type: ${type})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return { success: true, sent: false, previewOtp: process.env.NODE_ENV !== 'production' ? otp : undefined };
}

export async function sendUsernameRecoveryEmail({ email, name, username }) {
  const mailer = getTransporter();
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER || 'noreply@rupeetrack.app';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
          .card { max-width: 500px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .logo { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 12px; font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 20px; }
          h2 { color: #ffffff; margin-top: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          p { color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
          .info-box { background-color: #0f172a; border: 1px solid #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
          .username { font-size: 24px; font-weight: 800; color: #34d399; font-family: monospace; }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">₹</div>
          <h2>Your RupeeTrack Username</h2>
          <p>Hello <strong>${name}</strong>,<br>You requested a reminder of your registered RupeeTrack username:</p>
          <div class="info-box">
            <span style="font-size: 12px; color: #94a3b8; display: block; margin-bottom: 4px;">Registered Username</span>
            <div class="username">@${username}</div>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">You can use this username along with your password to log in at any time.</p>
          <div class="footer">
            RupeeTrack • Smart Personal & Family Expense Hub
          </div>
        </div>
      </body>
    </html>
  `;

  if (mailer) {
    try {
      await mailer.sendMail({
        from: `"RupeeTrack" <${fromEmail}>`,
        to: email,
        subject: `👤 Your RupeeTrack Username: @${username}`,
        html: htmlContent
      });
      console.log(`✅ Username reminder email sent to: ${email}`);
      return { success: true };
    } catch (err) {
      console.error(`⚠️ Failed to send username email (${err.message})`);
    }
  }

  console.log(`📧 [Simulated Email] Username for ${email}: @${username}`);
  return { success: true };
}
