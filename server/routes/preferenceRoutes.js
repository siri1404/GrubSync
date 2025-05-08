import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { createPreference } from '../models/preferenceController.js';

const router = express.Router({ mergeParams: true });

// POST /api/groups/:groupId/preferences
router.post('/', authenticate, createPreference);

export default router;
