import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

const sanitizeProfileResponse = (profile: any, role: string) => {
  const profileObj = profile.toObject ? profile.toObject() : { ...profile };
  
  // Regular employees should not receive salary and bank details in the profile response
  if (role === 'employee') {
    delete profileObj.salary;
    delete profileObj.bankAccount;
  }
  return profileObj;
};

export const createProfile = async (req: AuthenticatedRequest, res: Response) => {
  // Role check
  if (req.user!.role === 'employee') {
    return res.status(403).json({ message: 'Access denied: Employees cannot create profiles.' });
  }

  const {
    userId,
    fullName,
    jobTitle,
    dateOfBirth,
    phoneNumber,
    emergencyContact,
    salary,
    bankAccount,
    employmentStartDate
  } = req.body;

  try {
    if (!userId || !fullName || !jobTitle || !dateOfBirth || !phoneNumber || !emergencyContact || !salary || !bankAccount || !employmentStartDate) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const existingProfile = await Profile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists for this user.' });
    }

    // Input sanitization to prevent XSS
    const cleanFullName = sanitizeInput(fullName);
    const cleanJobTitle = sanitizeInput(jobTitle);
    const cleanPhoneNumber = sanitizeInput(phoneNumber);
    const cleanEmergencyContact = sanitizeInput(emergencyContact);

    const profile = await Profile.create({
      userId,
      fullName: cleanFullName,
      jobTitle: cleanJobTitle,
      dateOfBirth,
      phoneNumber: cleanPhoneNumber,
      emergencyContact: cleanEmergencyContact,
      salary,
      bankAccount,
      employmentStartDate,
      profilePhotoPath: null
    });

    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PROFILE_CREATION',
      targetResource: `profile:${profile._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetUserId: userId }
    });

    return res.status(201).json({
      message: 'Profile created successfully.',
      profile: sanitizeProfileResponse(profile, req.user!.role)
    });
  } catch (error: any) {
    console.error('Error creating profile:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // IDOR Check
    if (req.user!.role === 'employee' && req.user!._id.toString() !== profile.userId.toString()) {
      // Log unauthorized access attempt
      await AuditLog.create({
        userId: req.user!._id,
        actionType: 'UNAUTHORIZED_PROFILE_VIEW_ATTEMPT',
        targetResource: `profile:${profile._id}`,
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: { targetUserId: userId }
      });
      return res.status(403).json({ message: 'Access denied: You cannot view this profile.' });
    }

    // Log successful view
    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PROFILE_VIEW',
      targetResource: `profile:${profile._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetUserId: userId }
    });

    return res.status(200).json({
      profile: sanitizeProfileResponse(profile, req.user!.role)
    });
  } catch (error: any) {
    console.error('Error retrieving profile:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const isOwner = req.user!._id.toString() === profile.userId.toString();

    // IDOR check
    if (req.user!.role === 'employee' && !isOwner) {
      await AuditLog.create({
        userId: req.user!._id,
        actionType: 'UNAUTHORIZED_PROFILE_UPDATE_ATTEMPT',
        targetResource: `profile:${profile._id}`,
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: { targetUserId: userId }
      });
      return res.status(403).json({ message: 'Access denied: You cannot modify this profile.' });
    }

    if (req.user!.role === 'employee') {
      // Employees can only edit non-sensitive fields
      const { fullName, phoneNumber, emergencyContact } = req.body;
      if (fullName !== undefined) profile.fullName = sanitizeInput(fullName);
      if (phoneNumber !== undefined) profile.phoneNumber = sanitizeInput(phoneNumber);
      if (emergencyContact !== undefined) profile.emergencyContact = sanitizeInput(emergencyContact);
    } else {
      // HR/Admin can update all fields
      const {
        fullName,
        jobTitle,
        dateOfBirth,
        phoneNumber,
        emergencyContact,
        salary,
        bankAccount,
        employmentStartDate
      } = req.body;

      if (fullName !== undefined) profile.fullName = sanitizeInput(fullName);
      if (jobTitle !== undefined) profile.jobTitle = sanitizeInput(jobTitle);
      if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth; // Encrypted field, raw string goes in setter
      if (phoneNumber !== undefined) profile.phoneNumber = sanitizeInput(phoneNumber);
      if (emergencyContact !== undefined) profile.emergencyContact = sanitizeInput(emergencyContact);
      if (salary !== undefined) profile.salary = salary;
      if (bankAccount !== undefined) profile.bankAccount = bankAccount;
      if (employmentStartDate !== undefined) profile.employmentStartDate = employmentStartDate;
    }

    await profile.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PROFILE_UPDATE',
      targetResource: `profile:${profile._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetUserId: userId }
    });

    return res.status(200).json({
      message: 'Profile updated successfully.',
      profile: sanitizeProfileResponse(profile, req.user!.role)
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const uploadProfilePhoto = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    const isOwner = req.user!._id.toString() === profile.userId.toString();
    if (req.user!.role === 'employee' && !isOwner) {
      return res.status(403).json({ message: 'Access denied: You cannot modify this profile.' });
    }

    const savedPath = (req as any).savedFilePath;
    if (!savedPath) {
      return res.status(400).json({ message: 'File upload failed.' });
    }

    if (profile.profilePhotoPath) {
      const oldPath = path.join(__dirname, '../..', profile.profilePhotoPath);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error('Failed to delete old photo:', e);
        }
      }
    }

    profile.profilePhotoPath = savedPath;
    await profile.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PROFILE_PHOTO_UPLOAD',
      targetResource: `profile:${profile._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetUserId: userId, path: savedPath }
    });

    return res.status(200).json({
      message: 'Profile photo uploaded successfully.',
      profilePhotoPath: savedPath
    });
  } catch (error: any) {
    console.error('Error uploading profile photo:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
