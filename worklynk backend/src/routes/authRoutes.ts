import { Router } from 'express';
import {
  register,
  login,
  verifyMFA,
  setupMFA,
  enableMFA,
  logout,
  refresh,
  changePassword,
  forceChangePassword,
  getMe
} from '../controllers/authController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { loginLimiter } from '../middlewares/rateLimit';

const router = Router();

// Public Routes
router.post('/login', loginLimiter, login);
router.post('/mfa/verify', verifyMFA);
router.post('/refresh', refresh);
router.post('/force-change-password', forceChangePassword);

// Authenticated Routes
router.get('/me', protect, getMe);
router.post('/mfa/setup', protect, setupMFA);
router.post('/mfa/enable', protect, enableMFA);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

// Admin-Only Routes
router.post('/register', protect, restrictTo('admin'), register);

export default router;
