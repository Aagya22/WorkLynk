import { Router } from 'express';
import {
  createProfile,
  getProfile,
  updateProfile,
  uploadProfilePhoto
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

export default router;
