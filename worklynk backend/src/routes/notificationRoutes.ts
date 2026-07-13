import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Enforce auth protection on all notification endpoints
router.use(protect);

router.get('/', getMyNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);

export default router;
