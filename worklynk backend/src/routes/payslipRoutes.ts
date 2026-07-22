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

// HR owns payroll; employees view their own; admin excluded.
router.post('/', protect, restrictTo('hr_manager'), createPayslip);
router.get('/', protect, restrictTo('employee', 'hr_manager'), getPayslips);
router.get('/:id', protect, restrictTo('employee', 'hr_manager'), getPayslipById);
router.get('/:id/pdf', protect, restrictTo('employee', 'hr_manager'), downloadPayslipPDF);
router.put('/:id', protect, restrictTo('hr_manager'), updatePayslip);
router.delete('/:id', protect, restrictTo('hr_manager'), deletePayslip);

export default router;
