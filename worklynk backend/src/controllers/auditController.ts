import { Response } from 'express';
import { AuditLog } from '../models/audit-log.model';
import { User } from '../models/user.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  const userRole = req.user!.role;
  
  if (userRole === 'employee') {
    return res.status(403).json({ message: 'Access denied: Employees cannot view audit logs.' });
  }

  try {
    const filter: any = {};

    if (userRole === 'hr_manager') {
      const userDept = req.user!.department;
      if (!userDept) {
        return res.status(400).json({ message: 'Your manager account is not assigned to a department.' });
      }

      const deptUsers = await User.find({ department: userDept }).select('_id');
      const deptUserIds = deptUsers.map(u => u._id);

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

    if (req.query.actionType) {
      filter.actionType = req.query.actionType;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate as string);
        if (!isNaN(start.getTime())) filter.createdAt.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate as string);
        if (!isNaN(end.getTime())) filter.createdAt.$lte = end;
      }
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

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
    return res.status(500).json({ message: 'Error retrieving audit logs.', error: error.message });
  }
};
