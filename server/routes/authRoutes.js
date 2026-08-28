import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register: Name, Username (unique), Password
router.post('/register', async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    const existing = await UserModel.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      name: name.trim(),
      username: cleanUsername,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: newUser._id || newUser.id, username: cleanUsername },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        username: newUser.username
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Failed to register user.' });
  }
});

// Login: Username, Password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await UserModel.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { userId: user._id || user.id, username: cleanUsername },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        username: user.username
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({
    user: req.user
  });
});

export default router;
