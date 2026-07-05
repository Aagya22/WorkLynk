import { Response, NextFunction, Request } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User, IUser } from '../models/user.model';
import { BlacklistedToken } from '../models/blacklist.model';
import { sendSecurityAlertEmail } from '../utils/email';
import { AuditLog } from '../models/audit-log.model';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  token?: string;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  // Check cookie or Authorization header
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token);

    // Check blacklist
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Session has expired or logged out. Please log in again.' });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'This account has been deactivated.' });
    }

    // Verify session version
    if (user.sessionVersion !== decoded.sessionVersion) {
      return res.status(401).json({ message: 'Session version is invalid. Please log in again.' });
    }

    // Check IP match
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    if (decoded.ip && decoded.ip !== clientIP) {
      user.sessionVersion += 1;
      await user.save();

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      // Log audit trail
      await AuditLog.create({
        userId: user._id,
        actionType: 'SESSION_HIJACK_ATTEMPT',
        targetResource: `IP Mismatch: Token IP ${decoded.ip} vs Current Request IP ${clientIP}`,
        ipAddress: clientIP,
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: { tokenIP: decoded.ip, requestIP: clientIP }
      });

      // Send email notifications
      sendSecurityAlertEmail(
        user.email,
        'CRITICAL: Security Access Mismatch Detected',
        `We detected an attempt to access your account using a session from a different IP address (${clientIP}). Your session has been automatically terminated for your safety. If this was not you, please change your password immediately.`
      );

      sendSecurityAlertEmail(
        'admin@worklynk.local',
        `CRITICAL: Possible Session Hijacking Attempt - User ${user.email}`,
        `A session hijack attempt was blocked for user: ${user.email}.\nToken IP: ${decoded.ip}\nRequest IP: ${clientIP}\nUser-Agent: ${req.headers['user-agent']}`
      );

      return res.status(401).json({ message: 'Security alert: Session terminated due to access location change.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
};

export const restrictTo = (...roles: Array<'employee' | 'hr_manager' | 'admin'>) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      await AuditLog.create({
        userId: req.user._id,
        actionType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetResource: `${req.method} ${req.originalUrl}`,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: { userRole: req.user.role, requiredRoles: roles }
      });

      return res.status(403).json({
        message: 'Access denied: You do not have permission to perform this action.'
      });
    }

    next();
  };
};
