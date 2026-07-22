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

// Self-service leave (not admin)
router.post('/', protect, restrictTo('employee', 'hr_manager'), requestLeave);
router.get('/me', protect, restrictTo('employee', 'hr_manager'), getMyLeaves);
router.post('/:id/cancel', protect, restrictTo('employee', 'hr_manager'), cancelLeave);
// Approval / oversight
router.get('/', protect, restrictTo('admin', 'hr_manager'), getAllLeaves);
router.patch('/:id/decision', protect, restrictTo('admin', 'hr_manager'), decideLeave);

export default router;
