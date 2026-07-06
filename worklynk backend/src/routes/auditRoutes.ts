import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', protect, restrictTo('admin', 'hr_manager'), getAuditLogs);

export default router;
