import { Response } from 'express';
import { User } from '../models/user.model';
import { AuditLog } from '../models/audit-log.model';
import { Leave } from '../models/leave.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // capped at 100
  const search = sanitizeInput(req.query.search as string || '');
  const role = req.query.role as string;
  const isActive = req.query.isActive as string;

  try {
    const filter: any = {};

    if (search) {
      // Use regex safely without special characters to prevent regex injection, or simple match
      const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      filter.email = { $regex: escapedSearch, $options: 'i' };
    }

    if (role && ['employee', 'hr_manager', 'admin'].includes(role)) {
      filter.role = role;
    }

    if (isActive === 'true' || isActive === 'false') {
      filter.isActive = isActive === 'true';
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-passwordHash -mfaSecret -consentToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error listing users:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const updateUserStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive status must be a boolean.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent self deactivation
    if (req.user!._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    user.isActive = isActive;
    // If deactivating, increment sessionVersion to invalidate existing tokens
    if (!isActive) {
      user.sessionVersion += 1;
    }
    await user.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'ADMIN_USER_STATUS_UPDATE',
      targetResource: `user:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetIsActive: isActive }
    });

    return res.status(200).json({
      message: `User account has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: { id: user._id, email: user.email, isActive: user.isActive }
    });
  } catch (error: any) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  if (!role || !['employee', 'hr_manager', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role value.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prevent self role demotion/change
    if (req.user!._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    const previousRole = user.role;
    user.role = role;
    user.sessionVersion += 1; // Invalidate current login tokens so new role is active
    await user.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'ADMIN_USER_ROLE_UPDATE',
      targetResource: `user:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { previousRole, targetRole: role }
    });

    return res.status(200).json({
      message: 'User role updated successfully.',
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const unlockUser = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.resetLoginAttempts();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'ADMIN_USER_FORCE_UNLOCK',
      targetResource: `user:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({ message: 'User account has been manually unlocked.' });
  } catch (error: any) {
    console.error('Error unlocking user:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const forcePasswordReset = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Set passwordChangedAt to 91 days ago to trigger immediate password expiry
    user.passwordChangedAt = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000);
    await user.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'ADMIN_USER_FORCE_PASSWORD_RESET_TRIGGER',
      targetResource: `user:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({
      message: 'User password reset triggered. The user will be forced to change password on their next login.'
    });
  } catch (error: any) {
    console.error('Error triggering password reset:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const getSystemStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Count locked users: lockedUntil is set and is in the future
    const lockedUsers = await User.countDocuments({
      lockedUntil: { $gt: new Date() }
    });

    // Count pending leave requests
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    // Recent login failures count (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedLogins24h = await AuditLog.countDocuments({
      actionType: 'LOGIN_FAILURE',
      createdAt: { $gte: oneDayAgo }
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        activeUsers,
        lockedUsers,
        pendingLeaves,
        failedLogins24h
      }
    });
  } catch (error: any) {
    console.error('Error retrieving system statistics:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const reviewUserRegistration = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid approval status value. Must be approved or rejected.' });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.approvalStatus !== 'pending') {
      return res.status(400).json({ message: 'This user is not pending approval.' });
    }

    user.approvalStatus = status;
    user.isActive = (status === 'approved');
    await user.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'ADMIN_USER_APPROVAL_DECISION',
      targetResource: `user:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { targetApprovalStatus: status }
    });

    return res.status(200).json({
      message: `User registration has been successfully ${status}.`,
      user: { id: user._id, email: user.email, approvalStatus: user.approvalStatus, isActive: user.isActive }
    });
  } catch (error: any) {
    console.error('Error reviewing user registration:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
