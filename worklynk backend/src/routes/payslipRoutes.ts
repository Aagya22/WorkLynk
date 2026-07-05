import { Router } from 'express';
import {
  createPayslip,
  getPayslips,
  getPayslipById,
  downloadPayslipPDF,
  updatePayslip,
  deletePayslip
} from '../controllers/payslipController';
import { protect, restrictTo } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', protect, restrictTo('admin', 'hr_manager'), createPayslip);
router.get('/', protect, getPayslips);
router.get('/:id', protect, getPayslipById);
router.get('/:id/pdf', protect, downloadPayslipPDF);
router.put('/:id', protect, restrictTo('admin'), updatePayslip);
router.delete('/:id', protect, restrictTo('admin'), deletePayslip);

export default router;
