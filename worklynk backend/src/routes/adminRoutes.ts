import { Router } from 'express';
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
  unlockUser,
  forcePasswordReset,
  getSystemStats
} from '../controllers/adminController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// Enforce admin protection on all endpoints
router.use(protect);
router.use(restrictTo('admin'));

router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.post('/users/:id/unlock', unlockUser);
router.post('/users/:id/force-password-reset', forcePasswordReset);
router.get('/stats', getSystemStats);

export default router;
