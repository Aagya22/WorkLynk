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
  getMe,
  getCaptcha,
  registerSelf
} from '../controllers/authController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { authLimiter, mfaSetupLimiter } from '../middlewares/rateLimit';

const router = Router();

// Public Routes
router.get('/captcha', getCaptcha);
router.post('/register-self', registerSelf);
router.post('/login', authLimiter, login);
router.post('/mfa/verify', mfaSetupLimiter, verifyMFA);
router.post('/refresh', refresh);
router.post('/force-change-password', forceChangePassword);

// Authenticated Routes
router.get('/me', protect, getMe);
router.post('/mfa/setup', protect, mfaSetupLimiter, setupMFA);
router.post('/mfa/enable', protect, mfaSetupLimiter, enableMFA);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

// Admin-Only Routes
router.post('/register', protect, restrictTo('admin'), register);

export default router;
