import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from './upload.controller.js';
import { authenticateToken } from '../../middleware.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/upload - Upload image
router.post('/', authenticateToken, upload.single('image'), uploadImage);

export { router as uploadRouter };
