import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All profile routes require authentication
router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);

export default router;

