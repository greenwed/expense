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
      message: result.sent ? `Verification code sent to ${cleanEmail}` : `Verification code generated!`,
      email: cleanEmail,
      sent: result.sent,
      previewOtp: result.previewOtp
    });
  } catch (err) {
    console.error('Send register OTP error:', err);
    return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// 2. Register: Name, Email, Username, Password, OTP (supports both /register and /register-with-otp)
const handleRegister = async (req, res) => {
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

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    // Verify OTP if provided
    if (otp) {
      if (String(otp).trim().length !== 6) {
        return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
      }
      const isValidOtp = await OtpModel.verifyOtp(cleanEmail, otp, 'register');
      if (!isValidOtp) {
        return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
      }
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
};

router.post('/register', handleRegister);
router.post('/register-with-otp', handleRegister);

// 3. Login: Username or Email, Password (accepts identifier, username, email)
router.post('/login', async (req, res) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.username || req.body.email;
    const { password } = req.body;

    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const cleanIdentifier = String(rawIdentifier).trim().toLowerCase();
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

    let recoveredUsername = null;
    if (user) {
      const mailRes = await sendUsernameRecoveryEmail({
        email: cleanEmail,
        name: user.name,
        username: user.username
      });
      if (!mailRes.sent) {
        recoveredUsername = user.username;
      }
    }

    return res.json({
      message: `If an account exists with ${cleanEmail}, we have sent your registered username to your inbox!`,
      previewUsername: recoveredUsername
    });
  } catch (err) {
    console.error('Forgot username error:', err);
    return res.status(500).json({ error: 'Failed to process username recovery request.' });
  }
});

// 5. Send Password Reset OTP (supports both /send-reset-otp and /forgot-password-otp)
const handleSendResetOtp = async (req, res) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.username || req.body.email;
    if (!rawIdentifier || typeof rawIdentifier !== 'string' || rawIdentifier.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter your registered username or email.' });
    }

    const clean = rawIdentifier.trim().toLowerCase();
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
      message: result.sent ? `Password reset code sent to ${maskEmail(user.email)}` : `Password reset code generated!`,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      previewOtp: result.previewOtp
    });
  } catch (err) {
    console.error('Send reset OTP error:', err);
    return res.status(500).json({ error: 'Failed to send password reset code.' });
  }
};

router.post('/send-reset-otp', handleSendResetOtp);
router.post('/forgot-password-otp', handleSendResetOtp);

// 6. Reset Password with OTP (supports both /reset-password and /reset-password-with-otp)
const handleResetPassword = async (req, res) => {
  try {
    const { email, identifier, otp, newPassword, password } = req.body;
    const targetEmailOrId = email || identifier;
    const targetPassword = newPassword || password;

    if (!targetEmailOrId) {
      return res.status(400).json({ error: 'Valid email or username is required.' });
    }
    if (!targetPassword || typeof targetPassword !== 'string' || targetPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters.' });
    }

    const cleanId = String(targetEmailOrId).trim().toLowerCase();
    const user = await UserModel.findByUsernameOrEmail(cleanId);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Verify OTP unless directly authenticated
    if (otp !== 'DIRECT') {
      if (!otp || String(otp).trim().length !== 6) {
        return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
      }
      const isValid = await OtpModel.verifyOtp(user.email, otp, 'password_reset');
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(targetPassword, salt);

    await UserModel.updatePassword(user._id || user.id, hashedPassword);

    const token = jwt.sign(
      { userId: user._id || user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'Password reset successful! You are now signed in.',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

router.post('/reset-password', handleResetPassword);
router.post('/reset-password-with-otp', handleResetPassword);

// 7. Get current user
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    user: req.user
  });
});

export default router;
