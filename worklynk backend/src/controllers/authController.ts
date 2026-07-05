import { Response } from 'express';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { BlacklistedToken } from '../models/blacklist.model';
import { AuditLog } from '../models/audit-log.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from '../utils/jwt';
import { sendSecurityAlertEmail } from '../utils/email';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':",./<>?~`|\\-]).{12,}$/;

export const register = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, role } = req.body;

  try {
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'All fields (email, password, role) are required.' });
    }

    const normalizedRole = role.toLowerCase();
    if (!['employee', 'hr_manager', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role assignment.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email,
      passwordHash,
      role: normalizedRole,
      isActive: true
    });

    const creatorId = req.user ? req.user._id : newUser._id;
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    
    await AuditLog.create({
      userId: creatorId,
      actionType: 'USER_REGISTRATION',
      targetResource: `user:${newUser._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { registeredEmail: email, role: normalizedRole }
    });

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      await bcrypt.compare(password, '$2b$12$DummyHashToPreventTimingEnumerationAttacksSecure123');
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.isLocked) {
      if (user.lockedUntil && user.lockedUntil < new Date()) {
        await user.resetLoginAttempts();
      } else {
        const minutesLeft = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 60000);
        return res.status(401).json({
          message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minutes.`
        });
      }
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'This account has been deactivated.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();

      await AuditLog.create({
        userId: user._id,
        actionType: 'LOGIN_FAILURE',
        targetResource: 'auth',
        ipAddress: clientIP,
        userAgent,
        metadata: { failedAttemptsCount: user.failedLoginCount }
      });

      if (user.failedLoginCount >= 5) {
        sendSecurityAlertEmail(
          user.email,
          'Your account has been locked',
          'Your Worklynk account has been locked for 15 minutes due to 5 consecutive failed login attempts. If this was not you, please contact system administration.'
        );
        sendSecurityAlertEmail(
          'admin@worklynk.local',
          'Security Warning: User account lockout triggered',
          `User: ${user.email} has been locked out after 5 failed login attempts.\nIP Address: ${clientIP}`
        );
      }

      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    await user.resetLoginAttempts();

    if (user.isPasswordExpired()) {
      return res.status(200).json({
        passwordExpired: true,
        userId: user._id,
        message: 'Your password has expired (90-day policy). You must change it to log in.'
      });
    }

    if (user.mfaEnabled) {
      const JWT_SECRET = process.env.JWT_SECRET || 'yoworklynkkosecretho';
      const tempToken = jwt.sign(
        { userId: user._id, mfaPending: true, ip: clientIP },
        JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.status(200).json({
        mfaRequired: true,
        tempToken,
        message: 'MFA verification required.'
      });
    }

    user.lastLogin = new Date();
    user.lastLoginIP = clientIP;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      actionType: 'LOGIN_SUCCESS',
      targetResource: 'auth',
      ipAddress: clientIP,
      userAgent
    });

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      sessionVersion: user.sessionVersion,
      ip: clientIP
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error during login.', error: error.message });
  }
};

export const verifyMFA = async (req: AuthenticatedRequest, res: Response) => {
  const { tempToken, code } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Temporary token and MFA code are required.' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'yoworklynkkosecretho';
    let decoded: any;

    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'MFA session expired or invalid. Please try logging in again.' });
    }

    if (!decoded.mfaPending) {
      return res.status(400).json({ message: 'Invalid login session structure.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account is invalid or deactivated.' });
    }

    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'MFA is not configured for this user.' });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!isVerified) {
      await AuditLog.create({
        userId: user._id,
        actionType: 'MFA_VERIFICATION_FAILURE',
        targetResource: 'auth',
        ipAddress: clientIP,
        userAgent,
        metadata: { attemptedCode: code }
      });
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    user.lastLogin = new Date();
    user.lastLoginIP = clientIP;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      actionType: 'LOGIN_SUCCESS_MFA',
      targetResource: 'auth',
      ipAddress: clientIP,
      userAgent
    });

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      sessionVersion: user.sessionVersion,
      ip: clientIP
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: 'MFA login successful.',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        mfaEnabled: true
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Internal server error during MFA verification.', error: error.message });
  }
};

export const setupMFA = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    if (user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is already enabled on this account.' });
    }

    const appName = process.env.MFA_APP_NAME || 'Worklynk';
    const secret = speakeasy.generateSecret({
      name: `${appName}:${user.email}`,
      issuer: appName
    });

    user.mfaSecret = secret.base32;
    await user.save();

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || '');

    return res.status(200).json({
      secret: secret.base32,
      qrCodeDataUrl,
      message: 'MFA secret generated. Scan QR code and verify with code to enable.'
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error setting up MFA.', error: error.message });
  }
};

export const enableMFA = async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!code) {
      return res.status(400).json({ message: 'Verification code is required.' });
    }

    const user = req.user!;
    if (!user.mfaSecret) {
      return res.status(400).json({ message: 'MFA setup has not been initiated.' });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1
    });

    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid code. MFA setup failed.' });
    }

    user.mfaEnabled = true;
    user.mfaVerified = true;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      actionType: 'MFA_ENABLED',
      targetResource: 'user',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({ message: 'MFA successfully enabled.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error enabling MFA.', error: error.message });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const user = req.user!;
    const token = req.token!;

    try {
      const decoded = verifyAccessToken(token);
      const expiresAt = new Date(decoded.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000);
      await BlacklistedToken.create({ token, expiresAt });
    } catch {
      await BlacklistedToken.create({ token, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    }

    user.sessionVersion += 1;
    user.lastLogout = new Date();
    await user.save();

    await AuditLog.create({
      userId: user._id,
      actionType: 'LOGOUT',
      targetResource: 'auth',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error during logout.', error: error.message });
  }
};

export const refresh = async (req: AuthenticatedRequest, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is missing. Please log in again.' });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User does not exist or has been deactivated.' });
    }

    if (user.sessionVersion !== decoded.sessionVersion) {
      return res.status(401).json({ message: 'Session version is invalid. Please log in again.' });
    }

    if (decoded.ip && decoded.ip !== clientIP) {
      user.sessionVersion += 1;
      await user.save();

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      await AuditLog.create({
        userId: user._id,
        actionType: 'REFRESH_TOKEN_HIJACK_ATTEMPT',
        targetResource: 'auth',
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: { tokenIP: decoded.ip, requestIP: clientIP }
      });

      sendSecurityAlertEmail(
        user.email,
        'CRITICAL: Token Refresh Location Mismatch',
        `A request to refresh your login session was made from a different location/IP address (${clientIP}). Your session has been revoked.`
      );

      return res.status(401).json({ message: 'Security alert: Refresh request location mismatch. Session revoked.' });
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      sessionVersion: user.sessionVersion,
      ip: clientIP
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ message: 'Session refreshed successfully.' });
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token expired or invalid. Please log in again.' });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const user = req.user!;

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    const isReused = await user.isPasswordReused(newPassword);
    if (isReused) {
      return res.status(400).json({
        message: 'You cannot reuse your current password or any of your last 5 passwords.'
      });
    }

    await user.addToPasswordHistory(user.passwordHash);

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    user.sessionVersion += 1;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      actionType: 'PASSWORD_CHANGE',
      targetResource: 'user',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    sendSecurityAlertEmail(
      user.email,
      'Your password has been changed',
      'The password for your Worklynk account was successfully changed. If you did not make this change, please contact system administration immediately.'
    );

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({ message: 'Password changed successfully. Please log in with your new password.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error changing password.', error: error.message });
  }
};

export const forceChangePassword = async (req: AuthenticatedRequest, res: Response) => {
  const { email, currentPassword, newPassword } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields (email, currentPassword, newPassword) are required.' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or user does not exist.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    if (!user.isPasswordExpired()) {
      return res.status(400).json({ message: 'Force password reset is only permitted for expired passwords.' });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
      });
    }

    const isReused = await user.isPasswordReused(newPassword);
    if (isReused) {
      return res.status(400).json({
        message: 'You cannot reuse your current password or any of your last 5 passwords.'
      });
    }

    await user.addToPasswordHistory(user.passwordHash);

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordChangedAt = new Date();
    user.sessionVersion += 1;
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      actionType: 'PASSWORD_FORCE_CHANGE',
      targetResource: 'user',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    sendSecurityAlertEmail(
      user.email,
      'Your expired password has been updated',
      'You have successfully updated your expired password. You can now log in with your new password.'
    );

    return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error performing force password update.', error: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving user details.', error: error.message });
  }
};
