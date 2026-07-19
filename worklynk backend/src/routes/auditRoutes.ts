import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, restrictTo('admin'), getAuditLogs);

export default router;
