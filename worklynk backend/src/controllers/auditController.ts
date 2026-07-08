import { Response } from 'express';
import { AuditLog } from '../models/audit-log.model';
import { User } from '../models/user.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const validActionTypes = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGIN_SUCCESS_MFA',
  'LOGOUT',
  'USER_REGISTRATION',
  'PASSWORD_CHANGE',
  'PASSWORD_FORCE_CHANGE',
  'MFA_ENABLED',
  'MFA_VERIFICATION_FAILURE',
  'SESSION_HIJACK_ATTEMPT',
  'REFRESH_TOKEN_HIJACK_ATTEMPT',
  'UNAUTHORIZED_ACCESS_ATTEMPT',
  'PROFILE_CREATION',
  'PROFILE_VIEW',
  'PROFILE_UPDATE',
  'UNAUTHORIZED_PROFILE_VIEW_ATTEMPT',
  'UNAUTHORIZED_PROFILE_UPDATE_ATTEMPT',
  'PROFILE_PHOTO_UPLOAD',
  'PAYSLIP_CREATION',
  'PAYSLIPS_LIST_VIEW',
  'PAYSLIP_VIEW',
  'PAYSLIP_PDF_DOWNLOAD',
  'PAYSLIP_UPDATE',
  'PAYSLIP_DELETION',
  'UNAUTHORIZED_PAYSLIP_VIEW_ATTEMPT',
  'UNAUTHORIZED_PAYSLIP_PDF_DOWNLOAD_ATTEMPT',
  'UNAUTHORIZED_PAYSLIP_UPDATE_ATTEMPT',
  'LEAVE_SUBMISSION',
  'LEAVE_MY_HISTORY_VIEW',
  'LEAVE_ALL_LIST_VIEW',
  'LEAVE_DECISION',
  'LEAVE_CANCELLATION',
  'GDPR_EXPORT_TOKEN_GENERATION',
  'GDPR_DATA_EXPORT',
  'ADMIN_USER_STATUS_UPDATE',
  'ADMIN_USER_ROLE_UPDATE',
  'ADMIN_USER_FORCE_UNLOCK',
  'ADMIN_USER_FORCE_PASSWORD_RESET_TRIGGER',
  'AUDIT_LOG_VIEW'
];

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  const userRole = req.user!.role;
  
  if (userRole === 'employee') {
    return res.status(403).json({ message: 'Access denied: Employees cannot view audit logs.' });
  }

  // Validate actionType if provided
  const queryActionType = req.query.actionType as string;
  if (queryActionType && !validActionTypes.includes(queryActionType)) {
    return res.status(400).json({ message: 'Invalid action type filter.' });
  }

  // Validate date inputs and cap range at 365 days
  let start: Date | null = null;
  let end: Date | null = null;

  if (req.query.startDate) {
    start = new Date(req.query.startDate as string);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start date format.' });
    }
  }

  if (req.query.endDate) {
    end = new Date(req.query.endDate as string);
    if (isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid end date format.' });
    }
  }

  if (start && end) {
    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date.' });
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      return res.status(400).json({ message: 'Date range filter cannot exceed 365 days.' });
    }
  }

  // Page size cap at 100
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  try {
    const filter: any = {};

    if (userRole === 'hr_manager') {
      const userDept = req.user!.department;
      if (!userDept) {
        return res.status(400).json({ message: 'Your manager account is not assigned to a department.' });
      }

      const deptUsers = await User.find({ department: userDept }).select('_id');
      const deptUserIds = deptUsers.map(u => u._id);

      // Check if department is empty
      if (deptUserIds.length === 0) {
        return res.status(200).json({
          logs: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          message: 'No users found in your department.'
        });
      }

      if (req.query.userId) {
        const queryUserId = req.query.userId as string;
        const belongsToDept = deptUserIds.some(id => id.toString() === queryUserId);
        
        if (!belongsToDept) {
          return res.status(403).json({ message: 'Access denied: User is not in your department.' });
        }
        filter.userId = queryUserId;
      } else {
        filter.userId = { $in: deptUserIds };
      }
    } else {
      // Admin: Unrestricted filtering
      if (req.query.userId) {
        filter.userId = req.query.userId;
      }
    }

    if (queryActionType) {
      filter.actionType = queryActionType;
    }

    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'email role department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(filter);

    // Audit the audit log view action itself
    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'AUDIT_LOG_VIEW',
      targetResource: userRole === 'hr_manager' ? `department:${req.user!.department}` : 'all',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { page, limit, total }
    });

    return res.status(200).json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error retrieving audit logs:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
