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

router.post('/', protect, requestLeave);
router.get('/me', protect, getMyLeaves);
router.get('/', protect, restrictTo('admin', 'hr_manager'), getAllLeaves);
router.patch('/:id/decision', protect, restrictTo('admin', 'hr_manager'), decideLeave);
router.post('/:id/cancel', protect, cancelLeave);

export default router;
