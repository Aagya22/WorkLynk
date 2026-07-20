import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { Profile } from '../models/profile.model';
import { User } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { Leave } from '../models/leave.model';
import { Payslip } from '../models/payslip.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { sendSecurityAlertEmail } from '../utils/email';

import archiver from 'archiver';
import archiverZipEncrypted from 'archiver-zip-encrypted';

const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

const sanitizeProfileResponse = (profile: any, role: string, isOwner: boolean = false) => {
  const profileObj = profile.toObject ? profile.toObject() : { ...profile };

  // Employees may see salary/bank details on their own profile, but never on someone else's.
  if (role === 'employee' && !isOwner) {
    delete profileObj.salary;
    delete profileObj.bankAccount;
  }
  return profileObj;
};

// Soft duplicate check
const isPhoneNumberTaken = async (phoneNumber: string, excludeUserId?: any): Promise<boolean> => {
  const query: any = { phoneNumber: sanitizeInput(phoneNumber) };
  if (excludeUserId) query.userId = { $ne: excludeUserId };
  const existing = await Profile.findOne(query);
  return !!existing;
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

    if (await isPhoneNumberTaken(phoneNumber, userId)) {
      return res.status(400).json({ message: 'This phone number is already in use by another account.' });
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

export const initializeMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  const { fullName, dateOfBirth, phoneNumber, emergencyContact } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!fullName || !dateOfBirth || !phoneNumber || !emergencyContact) {
      return res.status(400).json({ message: 'Full name, date of birth, phone number, and emergency contact are required.' });
    }

    const existingProfile = await Profile.findOne({ userId: req.user!._id });
    if (existingProfile) {
      return res.status(400).json({ message: 'Your profile has already been set up.' });
    }

    if (await isPhoneNumberTaken(phoneNumber)) {
      return res.status(400).json({ message: 'This phone number is already in use by another account.' });
    }

    // Employees provide their own contact details; HR-managed fields start as placeholders.
    const profile = await Profile.create({
      userId: req.user!._id,
      fullName: sanitizeInput(fullName),
      jobTitle: 'Pending Assignment',
      dateOfBirth,
      phoneNumber: sanitizeInput(phoneNumber),
      emergencyContact: sanitizeInput(emergencyContact),
      salary: '0',
      bankAccount: 'Pending Assignment',
      employmentStartDate: new Date(),
      profilePhotoPath: null
    });

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PROFILE_CREATION',
      targetResource: `profile:${profile._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { selfInitialized: true }
    });

    return res.status(201).json({
      message: 'Profile set up successfully.',
      profile: sanitizeProfileResponse(profile, req.user!.role, true)
    });
  } catch (error: any) {
    console.error('Error initializing profile:', error);
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
      profile: sanitizeProfileResponse(profile, req.user!.role, req.user!._id.toString() === profile.userId.toString())
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

    // Reject a phone number already registered to a different profile (only when it changes).
    if (req.body.phoneNumber !== undefined && sanitizeInput(req.body.phoneNumber) !== profile.phoneNumber) {
      if (await isPhoneNumberTaken(req.body.phoneNumber, profile.userId)) {
        return res.status(400).json({ message: 'This phone number is already in use by another account.' });
      }
    }

    if (req.user!.role === 'employee') {

      const { fullName, phoneNumber, emergencyContact, dateOfBirth } = req.body;
      if (fullName !== undefined) profile.fullName = sanitizeInput(fullName);
      if (phoneNumber !== undefined) profile.phoneNumber = sanitizeInput(phoneNumber);
      if (emergencyContact !== undefined) profile.emergencyContact = sanitizeInput(emergencyContact);
      if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
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
      profile: sanitizeProfileResponse(profile, req.user!.role, isOwner)
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

export const removeProfilePhoto = async (req: AuthenticatedRequest, res: Response) => {
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

    if (!profile.profilePhotoPath) {
      return res.status(400).json({ message: 'There is no profile photo to remove.' });
    }

    const oldPath = path.join(__dirname, '../..', profile.profilePhotoPath);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (e) {
        console.error('Failed to delete photo file:', e);
      }
    }

    profile.profilePhotoPath = null;
    await profile.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'PROFILE_PHOTO_REMOVED',
      targetResource: `profile:${profile._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetUserId: userId }
    });

    return res.status(200).json({ message: 'Profile photo removed.', profilePhotoPath: null });
  } catch (error: any) {
    console.error('Error removing profile photo:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// Register password-protected zip format
(archiver as any).registerFormat('zip-encrypted', archiverZipEncrypted);

const generatePayslipPDFBuffer = (payslip: any, employeeName: string, employeeEmail: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    
    doc.on('data', (chunk: any) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err: any) => reject(err));
    
    doc.fontSize(20).text('Worklynk HR - Monthly Payslip', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Month: ${payslip.month}`);
    doc.text(`Employee Name: ${employeeName}`);
    doc.text(`Employee Email: ${employeeEmail}`);
    doc.moveDown();
    
    doc.text(`Basic Salary: Rs. ${payslip.basicSalary}`);
    doc.text(`Overtime Pay: Rs. ${payslip.overtimePay}`);
    doc.text(`Bonus: Rs. ${payslip.bonus}`);
    doc.moveDown();
    
    doc.text(`Tax Deduction: Rs. ${payslip.taxDeduction}`);
    doc.text(`National Insurance Deduction: Rs. ${payslip.niDeduction}`);
    doc.text(`Other Deductions: Rs. ${payslip.otherDeductions}`);
    doc.moveDown();
    
    doc.fontSize(14).text(`Net Salary: Rs. ${payslip.netSalary}`, { underline: true });
    doc.moveDown();
    
    doc.fontSize(12).text(`Notes: ${payslip.notes || 'N/A'}`);
    doc.moveDown();
    doc.fontSize(10).text(`Generated securely by Worklynk Server on ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.end();
  });
};

const createEncryptedZipBuffer = (
  files: Array<{ name: string; content: string | Buffer }>,
  password: string
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const archive = (archiver as any).create('zip-encrypted', {
      zlib: { level: 9 },
      encryptionMethod: 'aes256',
      password
    });
    
    const chunks: Buffer[] = [];
    archive.on('data', (chunk: any) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', (err: any) => reject(err));
    
    for (const file of files) {
      archive.append(file.content, { name: file.name });
    }
    
    archive.finalize();
  });
};

export const generateExportConsentToken = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Only the user themselves can generate their own consent token.
    if (req.user!._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You can only generate consent tokens for your own account.' });
    }

    const consentToken = crypto.randomBytes(16).toString('hex');
    user.consentToken = consentToken;
    user.consentTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity
    await user.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'GDPR_EXPORT_TOKEN_GENERATION',
      targetResource: `user:${userId}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({
      message: 'One-time GDPR export consent token generated. Valid for 15 minutes.',
      consentToken
    });
  } catch (error: any) {
    console.error('Error generating export consent token:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const exportEmployeeData = async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const { consentToken } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isOwner = req.user!._id.toString() === targetUser._id.toString();
    const isAdmin = req.user!.role === 'admin';

    // Access control: owner (Employee/HR/Admin exporting themselves) or Admin with consent token
    if (!isOwner) {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Access denied: Unauthorized export attempt.' });
      }

      // If Admin, verify the one-time consent token
      if (!consentToken || !targetUser.consentToken || targetUser.consentToken !== consentToken) {
        return res.status(403).json({ message: 'Access denied: Invalid or missing one-time consent token.' });
      }

      if (!targetUser.consentTokenExpires || targetUser.consentTokenExpires < new Date()) {
        return res.status(403).json({ message: 'Access denied: Consent token has expired.' });
      }

      // Invalidate the one-time token immediately after use
      targetUser.consentToken = null;
      targetUser.consentTokenExpires = null;
      await targetUser.save();
    }

    // Fetch employee data
    const profile = await Profile.findOne({ userId });
    const leaves = await Leave.find({ employeeId: userId });
    const payslips = await Payslip.find({ employeeId: userId });

    // Prepare JSON contents
    const profileJson = JSON.stringify(profile ? profile.toObject() : {}, null, 2);
    const leavesJson = JSON.stringify(leaves.map(l => l.toObject()), null, 2);

    const filesToArchive: Array<{ name: string; content: string | Buffer }> = [
      { name: 'profile.json', content: profileJson },
      { name: 'leaves.json', content: leavesJson }
    ];

    // Generate in-memory PDF payslips
    const employeeName = profile ? profile.fullName : 'Employee';
    const employeeEmail = targetUser.email;

    for (const payslip of payslips) {
      try {
        const pdfBuffer = await generatePayslipPDFBuffer(payslip, employeeName, employeeEmail);
        filesToArchive.push({
          name: `payslips/payslip-${payslip.month}.pdf`,
          content: pdfBuffer
        });
      } catch (pdfErr) {
        console.error(`Failed to generate PDF for payslip ${payslip.month}:`, pdfErr);
      }
    }

    // Generate a random password for the ZIP
    const zipPassword = crypto.randomBytes(6).toString('hex'); // 12-char hex

    // Create the password-protected ZIP archive
    const zipBuffer = await createEncryptedZipBuffer(filesToArchive, zipPassword);

    // Email the password to the employee
    const emailSubject = 'Your GDPR Data Export Archive Password';
    const emailBody = `Hello,\n\nA GDPR Data Export request was processed for your account. You can unlock your downloaded data archive using the following password:\n\nPassword: ${zipPassword}\n\nThis password is shown once on screen and is not stored by our system.`;
    
    sendSecurityAlertEmail(employeeEmail, emailSubject, emailBody);

    // Audit logging
    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'GDPR_DATA_EXPORT',
      targetResource: `user:${userId}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { initiatedByAdmin: !isOwner }
    });

    // Return the base64-encoded zip data and the password
    return res.status(200).json({
      message: 'GDPR data export compiled successfully. Password has been emailed to the user.',
      password: zipPassword,
      zipData: zipBuffer.toString('base64'),
      fileName: `worklynk-export-${userId}.zip`
    });
  } catch (error: any) {
    console.error('Error during GDPR data export:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
