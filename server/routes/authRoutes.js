import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import OtpModel from '../models/OtpModel.js';
import { sendOtpEmail, sendUsernameRecoveryEmail } from '../utils/mailer.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function maskEmail(email) {
  if (!email) return '';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const maskedUser = user.length <= 2 ? user[0] + '***' : user.slice(0, 2) + '***' + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

// 1. Send OTP for Registration
router.post('/send-register-otp', async (req, res) => {
  try {
    const { email, username, name } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Check if email already registered
    const existingEmail = await UserModel.findByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'This email address is already registered. Please sign in or use forgot password.' });
    }

    // Check if username already taken
    const existingUsername = await UserModel.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const otp = await OtpModel.generateOtp(cleanEmail, 'register');
    const result = await sendOtpEmail({ email: cleanEmail, otp, type: 'register', name: name || cleanUsername });

    return res.json({
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      previewOtp: result.previewOtp
    });
  } catch (err) {
    console.error('Send register OTP error:', err);
    return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// 2. Register: Name, Email, Username, Password, OTP
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password, otp } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }
    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code sent to your email.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Verify OTP
    const isValidOtp = await OtpModel.verifyOtp(cleanEmail, otp, 'register');
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
    }

    // Re-verify uniqueness
    const existingUsername = await UserModel.findOne({ username: cleanUsername });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }
    const existingEmail = await UserModel.findByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'This email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: newUser._id || newUser.id, username: cleanUsername, email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      message: 'Account verified and created successfully!',
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Failed to register user.' });
  }
});

// 3. Login: Username or Email, Password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const cleanIdentifier = username.trim().toLowerCase();
    const user = await UserModel.findByUsernameOrEmail(cleanIdentifier);

    if (!user) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username/email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id || user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

// 4. Forgot Username: Enter email -> receives email with username
router.post('/forgot-username', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid registered email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(cleanEmail);

    if (user) {
      await sendUsernameRecoveryEmail({
        email: cleanEmail,
        name: user.name,
        username: user.username
      });
    }

    // Always return safe friendly message to prevent email enumeration
    return res.json({
      message: `If an account exists with ${cleanEmail}, we have sent your registered username to your inbox!`
    });
  } catch (err) {
    console.error('Forgot username error:', err);
    return res.status(500).json({ error: 'Failed to process username recovery request.' });
  }
});

// 5. Send Password Reset OTP
router.post('/send-reset-otp', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string' || identifier.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter your registered username or email.' });
    }

    const clean = identifier.trim().toLowerCase();
    const user = await UserModel.findByUsernameOrEmail(clean);

    if (!user) {
      return res.status(404).json({ error: 'No account found matching this username or email.' });
    }

    if (!user.email) {
      return res.status(400).json({ error: 'No email address is linked to this account. Please contact support.' });
    }

    const otp = await OtpModel.generateOtp(user.email, 'password_reset');
    const result = await sendOtpEmail({
      email: user.email,
      otp,
      type: 'password_reset',
      name: user.name
    });

    return res.json({
      message: `Password reset code sent to ${maskEmail(user.email)}`,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      previewOtp: result.previewOtp
    });
  } catch (err) {
    console.error('Send reset OTP error:', err);
    return res.status(500).json({ error: 'Failed to send password reset code.' });
  }
});

// 6. Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const isValid = await OtpModel.verifyOtp(cleanEmail, otp, 'password_reset');
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
    }

    const user = await UserModel.findByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await UserModel.updatePassword(user._id || user.id, hashedPassword);

    return res.json({
      message: 'Password reset successful! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// 7. Get current user
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    user: req.user
  });
});

export default router;
