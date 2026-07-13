import { Response } from 'express';
import { Leave } from '../models/leave.model';
import { User } from '../models/user.model';
import { Notification } from '../models/notification.model';
import { AuditLog } from '../models/audit-log.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

export const requestLeave = async (req: AuthenticatedRequest, res: Response) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const allowedTypes = ['annual', 'sick', 'emergency', 'unpaid'];
  if (!allowedTypes.includes(leaveType)) {
    return res.status(400).json({ message: 'Invalid leave type.' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return res.status(400).json({ message: 'Invalid start or end dates.' });
  }

  // Block past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    return res.status(400).json({ message: 'Start date cannot be in the past.' });
  }

  try {
    const overlap = await Leave.findOne({
      employeeId: req.user!._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (overlap) {
      return res.status(400).json({ message: 'You have an overlapping pending or approved leave request during these dates.' });
    }

    if (leaveType === 'annual') {
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const startOfYear = new Date(start.getFullYear(), 0, 1);
      const endOfYear = new Date(start.getFullYear(), 11, 31);

      const approvedLeaves = await Leave.find({
        employeeId: req.user!._id,
        leaveType: 'annual',
        status: 'approved',
        startDate: { $gte: startOfYear, $lte: endOfYear }
      });

      let usedDays = 0;
      approvedLeaves.forEach(l => {
        const days = Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        usedDays += days;
      });

      if (usedDays + duration > 28) {
        return res.status(400).json({ message: `This request exceeds your annual leave balance. Remaining: ${28 - usedDays} days.` });
      }
    }

    const leave = await Leave.create({
      employeeId: req.user!._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason: sanitizeInput(reason)
    });

    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'LEAVE_SUBMISSION',
      targetResource: `leave:${leave._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { durationDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 }
    });

    // Notify HR managers and Admin
    const adminsAndHr = await User.find({ role: { $in: ['hr_manager', 'admin'] } });
    for (const recipient of adminsAndHr) {
      await Notification.create({
        userId: recipient._id,
        title: 'New Leave Request',
        message: `A new leave request from ${req.user!.email} is pending approval.`,
        type: 'leave'
      });
    }

    return res.status(201).json({ message: 'Leave request submitted successfully.', leave });
  } catch (error: any) {
    console.error('Error submitting leave request:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const getMyLeaves = async (req: AuthenticatedRequest, res: Response) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const leaves = await Leave.find({ employeeId: req.user!._id }).sort({ createdAt: -1 });

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'LEAVE_MY_HISTORY_VIEW',
      targetResource: `employee:${req.user!._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({ leaves });
  } catch (error: any) {
    console.error('Error retrieving leave history:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const getAllLeaves = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role === 'employee') {
    return res.status(403).json({ message: 'Access denied: Employees cannot retrieve all leaves.' });
  }

  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    // Pagination logic
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status === 'pending') {
      filter.status = 'pending';
    } else if (req.query.status === 'decided') {
      filter.status = { $in: ['approved', 'rejected'] };
    }

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Leave.countDocuments(filter);

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'LEAVE_ALL_LIST_VIEW',
      targetResource: 'all',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { page, limit, total }
    });

    return res.status(200).json({
      leaves,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Error retrieving leave requests:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const decideLeave = async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role === 'employee') {
    return res.status(403).json({ message: 'Access denied: Employees cannot approve or reject leaves.' });
  }

  const { id } = req.params;
  const { status, decisionComment } = req.body;

  if (!status || !decisionComment) {
    return res.status(400).json({ message: 'Status and decision comment are required.' });
  }

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid decision status.' });
  }

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    // Check if already decided
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request has already been decided.' });
    }

    // Business Logic: Block self-approval
    if (req.user!._id.toString() === leave.employeeId.toString()) {
      return res.status(400).json({ message: 'Access denied: You cannot approve or reject your own leave request.' });
    }

    if (status === 'approved' && leave.leaveType === 'annual') {
      const duration = Math.ceil((leave.endDate.getTime() - leave.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const startOfYear = new Date(leave.startDate.getFullYear(), 0, 1);
      const endOfYear = new Date(leave.startDate.getFullYear(), 11, 31);

      const approvedLeaves = await Leave.find({
        employeeId: leave.employeeId,
        leaveType: 'annual',
        status: 'approved',
        startDate: { $gte: startOfYear, $lte: endOfYear }
      });

      let usedDays = 0;
      approvedLeaves.forEach(l => {
        const days = Math.ceil((l.endDate.getTime() - l.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        usedDays += days;
      });

      if (usedDays + duration > 28) {
        return res.status(400).json({ message: 'Approval failed: This request exceeds the employee annual leave balance.' });
      }
    }

    leave.status = status;
    leave.decidedBy = req.user!._id;
    leave.decisionComment = sanitizeInput(decisionComment);
    leave.decidedAt = new Date();

    await leave.save();

    const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'LEAVE_DECISION',
      targetResource: `leave:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { status, reason: decisionComment, targetEmployeeId: leave.employeeId }
    });

    // Notify the employee about the decision
    await Notification.create({
      userId: leave.employeeId,
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your leave request from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been ${status}.`,
      type: 'leave'
    });

    return res.status(200).json({ message: `Leave request successfully ${status}.`, leave });
  } catch (error: any) {
    console.error('Error updating leave request:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const cancelLeave = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found.' });
    }

    // IDOR Check: user must own the request
    if (leave.employeeId.toString() !== req.user!._id.toString()) {
      return res.status(403).json({ message: 'Access denied: You cannot cancel this leave request.' });
    }

    if (leave.status === 'cancelled') {
      return res.status(400).json({ message: 'This leave request has already been cancelled.' });
    }

    if (leave.status === 'rejected') {
      return res.status(400).json({ message: 'Cannot cancel rejected leave requests.' });
    }

    // Block cancelling approved leaves starting within 24 hours
    if (leave.status === 'approved') {
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (leave.startDate.getTime() - Date.now() < twentyFourHours) {
        return res.status(400).json({ message: 'Cannot cancel approved leaves starting in less than 24 hours.' });
      }
    }

    leave.status = 'cancelled';
    await leave.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'LEAVE_CANCELLATION',
      targetResource: `leave:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    return res.status(200).json({ message: 'Leave request cancelled successfully.', leave });
  } catch (error: any) {
    console.error('Error cancelling leave request:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
