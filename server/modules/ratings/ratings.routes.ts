import express from 'express';
import { ratingController } from './ratings.controller.js';
import { authenticateToken } from '../../middleware.js';

const router = express.Router();

/**
 * POST /api/ratings
 * Save a new user rating. 
 * Requires authentication.
 */
router.post('/', authenticateToken, ratingController.saveRating);

/**
 * GET /api/ratings/average/:userId
 * Fetch the average score and total count for a specific user profile.
 * Public access.
 */
router.get('/average/:userId', ratingController.getUserAverage);

export default router;