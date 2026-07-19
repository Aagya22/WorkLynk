import { Router } from 'express';
import {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  decideLeave,
  cancelLeave
} from '../controllers/leaveController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// Self-service leave (submit/view/cancel own) — not for admin, a system role.
router.post('/', protect, restrictTo('employee', 'hr_manager'), requestLeave);
router.get('/me', protect, restrictTo('employee', 'hr_manager'), getMyLeaves);
router.post('/:id/cancel', protect, restrictTo('employee', 'hr_manager'), cancelLeave);
// Approval/oversight — HR and admin.
router.get('/', protect, restrictTo('admin', 'hr_manager'), getAllLeaves);
router.patch('/:id/decision', protect, restrictTo('admin', 'hr_manager'), decideLeave);

export default router;
