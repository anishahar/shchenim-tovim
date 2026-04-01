const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.js');
const pool = require('../db/pool.js');

/**
 * FEATURE 1: HELP REQUESTS (API Implementation)
 */

// @route   GET /api/requests
// @desc    Get all requests with filtering, search, and pagination
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, urgency, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // SQL Query joining users table to get creator details as requested by Frontend
    let query = `
      SELECT r.*, u.name as user_name, u.avatar_url 
      FROM requests r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.status != 'closed'
    `;
    let params = [];

    // Apply filters (Category, Urgency, Search)
    if (category) {
      params.push(category);
      query += ` AND r.category = $${params.length}`;
    }
    if (urgency) {
      params.push(urgency);
      query += ` AND r.urgency = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (r.title ILIKE $${params.length} OR r.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    const result = await pool.query(query, params);
    
    // Format response to match the Frontend's expected structure
    const formattedData = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      urgency: row.urgency,
      status: row.status,
      location_text: row.location_text,
      image_url: row.image_url,
      created_at: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatar_url: row.avatar_url
      }
    }));

    res.json({
      data: formattedData,
      total: result.rowCount,
      page: parseInt(page)
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Server error fetching requests' });
  }
});

// @route   POST /api/requests
// @desc    Create a new help request
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, urgency, location_text, image_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO requests (user_id, title, description, category, urgency, location_text, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open') RETURNING id, title, status`,
      [req.user.id, title, description, category, urgency, location_text, image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// @route   PATCH /api/requests/:id
// @desc    Update request status (Ownership check included)
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Check if request exists and if the user is the owner
    const check = await pool.query('SELECT user_id FROM requests WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized update' });

    await pool.query('UPDATE requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Request updated' });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// @route   DELETE /api/requests/:id
// @desc    Remove a request from the system
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const check = await pool.query('SELECT user_id FROM requests WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized deletion' });

    await pool.query('DELETE FROM requests WHERE id = $1', [id]);
    res.json({ message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});

module.exports = router;