import { Router } from 'express';
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
  unlockUser,
  forcePasswordReset,
  getSystemStats,
  reviewUserRegistration
} from '../controllers/adminController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// Enforce auth protection on all endpoints
router.use(protect);

// Admin & HR Manager Access
router.get('/users', restrictTo('admin', 'hr_manager'), getUsers);
router.get('/stats', restrictTo('admin', 'hr_manager'), getSystemStats);

// strictly Admin-Only Access
router.use(restrictTo('admin'));
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/approval', reviewUserRegistration);
router.post('/users/:id/unlock', unlockUser);
router.post('/users/:id/force-password-reset', forcePasswordReset);

export default router;
