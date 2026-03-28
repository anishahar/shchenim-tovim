import express, { Router } from 'express';
import { authenticateToken, requireRole } from './middleware.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const router: Router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user with role 'resident'
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, passwordHash, 'resident']
    );

    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, is_blocked FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({ error: 'Account has been blocked' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Request routes
router.get('/requests', authenticateToken, (req, res) => {
  // TODO: Get all requests
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/requests', authenticateToken, (req, res) => {
  // TODO: Create new request
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/requests/:id', authenticateToken, (req, res) => {
  // TODO: Get request by ID
  res.status(501).json({ message: 'Not implemented yet' });
});

router.patch('/requests/:id', authenticateToken, (req, res) => {
  // TODO: Update request
  res.status(501).json({ message: 'Not implemented yet' });
});

router.delete('/requests/:id', authenticateToken, (req, res) => {
  // TODO: Delete request
  res.status(501).json({ message: 'Not implemented yet' });
});

// Chat routes
router.get('/chats', authenticateToken, (req, res) => {
  // TODO: Get user's chats
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/chats', authenticateToken, (req, res) => {
  // TODO: Create new chat
  res.status(501).json({ message: 'Not implemented yet' });
});

router.get('/chats/:id/messages', authenticateToken, (req, res) => {
  // TODO: Get chat messages
  res.status(501).json({ message: 'Not implemented yet' });
});

// Announcement routes
router.get('/announcements', authenticateToken, (req, res) => {
  // TODO: Get all announcements
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/announcements', authenticateToken, requireRole('admin'), (req, res) => {
  // TODO: Create announcement (admin only)
  res.status(501).json({ message: 'Not implemented yet' });
});

// User routes
router.get('/users/:id', authenticateToken, (req, res) => {
  // TODO: Get user profile
  res.status(501).json({ message: 'Not implemented yet' });
});

router.patch('/users/:id', authenticateToken, (req, res) => {
  // TODO: Update user profile
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
