import { Router } from 'express';
import {
  register,
  login,
  verifyMFA,
  setupMFA,
  enableMFA,
  disableMFA,
  logout,
  signOutOthers,
  refresh,
  changePassword,
  changeEmail,
  forceChangePassword,
  getMe,
  getCaptcha,
  registerSelf,
  forgotPassword,
  resetPassword
} from '../controllers/authController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { authLimiter, mfaSetupLimiter, passwordResetLimiter, registrationLimiter } from '../middlewares/rateLimit';

const router = Router();

// Public Routes
router.get('/captcha', getCaptcha);
router.post('/register-self', registrationLimiter, registerSelf);
router.post('/login', authLimiter, login);
router.post('/mfa/verify', mfaSetupLimiter, verifyMFA);
router.post('/refresh', refresh);
router.post('/force-change-password', authLimiter, forceChangePassword);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Authenticated Routes
router.get('/me', protect, getMe);
router.post('/mfa/setup', protect, mfaSetupLimiter, setupMFA);
router.post('/mfa/enable', protect, mfaSetupLimiter, enableMFA);
router.post('/mfa/disable', protect, mfaSetupLimiter, disableMFA);
router.post('/logout', protect, logout);
router.post('/logout-others', protect, signOutOthers);
router.put('/change-password', protect, changePassword);
router.put('/change-email', protect, changeEmail);

// Admin-Only Routes
router.post('/register', protect, restrictTo('admin'), register);

export default router;
