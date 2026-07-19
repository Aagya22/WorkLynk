import { Router } from 'express';
import { getHolidays, createHoliday, deleteHoliday } from '../controllers/holidayController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

// All authenticated users can view the calendar.
router.get('/', protect, getHolidays);

// Only admin can set or remove holidays/events.
router.post('/', protect, restrictTo('admin'), createHoliday);
router.delete('/:id', protect, restrictTo('admin'), deleteHoliday);

export default router;
