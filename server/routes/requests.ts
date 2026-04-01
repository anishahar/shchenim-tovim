import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware.js';
import { pool } from '../db.js';

const router: Router = Router();

/**
 * FEATURE 1: HELP REQUESTS MANAGEMENT
 */

// @route   GET /api/requests
// @desc    Retrieve all help requests with optional filters (category, urgency)
// @access  Private (Registered users)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { category, urgency } = req.query;
    let query = 'SELECT * FROM requests WHERE status != $1';
    let params: any[] = ['closed'];

    // Dynamic filtering logic for category and urgency
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (urgency) {
      params.push(urgency);
      query += ` AND urgency = $${params.length}`;
    }

    const result = await pool.query(query + ' ORDER BY created_at DESC', params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching requests:', err);
    res.status(500).json({ error: 'Server error while fetching requests' });
  }
});

// @route   GET /api/requests/:id
// @desc    Get a single request by its ID
// @access  Private
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/requests
// @desc    Create a new help request
// @access  Private
router.post('/', authenticateToken, async (req: any, res: Response) => {
  try {
    const { title, description, category, urgency, location_text, lat, lng, image_url } = req.body;
    const userId = req.user.id; // Extracted from JWT via authenticateToken

    const result = await pool.query(
      `INSERT INTO requests (user_id, title, description, category, urgency, location_text, lat, lng, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open') RETURNING *`,
      [userId, title, description, category, urgency, location_text, lat, lng, image_url]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating request:', err);
    res.status(500).json({ error: 'Failed to create help request' });
  }
});

// @route   PATCH /api/requests/:id
// @desc    Update request status or details (Only by the creator)
// @access  Private
router.patch('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const { status, title, description } = req.body;
    const { id } = req.params;
    const userId = req.user.id;

    // Ownership Verification: Check if the request belongs to the current user
    const ownershipCheck = await pool.query(
      'SELECT * FROM requests WHERE id = $1 AND user_id = $2', 
      [id, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: You are not the owner of this request' });
    }

    const result = await pool.query(
      'UPDATE requests SET status = COALESCE($1, status), title = COALESCE($2, title), description = COALESCE($3, description) WHERE id = $4 RETURNING *',
      [status, title, description, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// @route   DELETE /api/requests/:id
// @desc    Remove a request from the system (Only by the creator)
// @access  Private
router.delete('/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Ownership Verification
    const ownershipCheck = await pool.query(
      'SELECT * FROM requests WHERE id = $1 AND user_id = $2', 
      [id, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: You are not authorized to delete this request' });
    }

    await pool.query('DELETE FROM requests WHERE id = $1', [id]);
    res.json({ message: 'Request successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});

export default router;