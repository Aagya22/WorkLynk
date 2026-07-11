import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest } from './authMiddleware';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

export const validateMagicBytes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const buffer = req.file.buffer;
  if (buffer.length < 4) {
    return res.status(400).json({ message: 'File is too small to verify.' });
  }

  const hex = buffer.toString('hex', 0, 4).toUpperCase();
  const isPNG = hex === '89504E47';
  const isJPEG = hex.startsWith('FFD8FF');

  if (!isPNG && !isJPEG) {
    return res.status(400).json({ message: 'Invalid file type. Only JPEG and PNG are allowed.' });
  }

  try {
    const uploadFolder = process.env.UPLOAD_DIR || 'uploads';
    const uploadDir = path.join(__dirname, '../..', uploadFolder, 'profile-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = isPNG ? '.png' : '.jpg';
    const filename = `${req.user!._id}-${Date.now()}${ext}`;
    const destPath = path.join(uploadDir, filename);

    fs.writeFileSync(destPath, buffer);

    // Attach local file path to request so controller can save it to Profile
    (req as any).savedFilePath = `/uploads/profile-photos/${filename}`;
    next();
  } catch (error: any) {
    console.error('Error saving uploaded file:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
