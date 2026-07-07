import { Router } from 'express';
import {
  createProfile,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  generateExportConsentToken,
  exportEmployeeData
} from '../controllers/profileController';
import { protect, restrictTo } from '../middlewares/authMiddleware';
import { upload, validateMagicBytes } from '../middlewares/uploadMiddleware';

const router = Router();

router.post('/', protect, restrictTo('admin', 'hr_manager'), createProfile);
router.get('/:userId', protect, getProfile);
router.put('/:userId', protect, updateProfile);
router.post(
  '/:userId/photo',
  protect,
  upload.single('photo'),
  validateMagicBytes,
  uploadProfilePhoto
);

// GDPR Compliance Data Export routes
router.post('/:userId/export-token', protect, generateExportConsentToken);
router.post('/:userId/export', protect, exportEmployeeData);

export default router;
