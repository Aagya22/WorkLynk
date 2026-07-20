import { Response } from 'express';
import { Holiday } from '../models/holiday.model';
import { AuditLog } from '../models/audit-log.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
};

// Any authenticated user can read the calendar of holidays/events.
export const getHolidays = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    return res.status(200).json({ holidays });
  } catch (error: any) {
    console.error('Error retrieving holidays:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// Admin-only: add a holiday or event.
export const createHoliday = async (req: AuthenticatedRequest, res: Response) => {
  const { title, date, type } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    if (typeof title !== 'string' || typeof date !== 'string' || !title.trim() || !date) {
      return res.status(400).json({ message: 'A title and date are required.' });
    }

    const when = new Date(date);
    if (isNaN(when.getTime())) {
      return res.status(400).json({ message: 'Invalid date.' });
    }

    const holiday = await Holiday.create({
      title: sanitizeInput(title),
      date: when,
      type: type === 'event' ? 'event' : 'holiday',
      createdBy: req.user!._id
    });

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'HOLIDAY_CREATED',
      targetResource: `holiday:${holiday._id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { title: holiday.title, date, type: holiday.type }
    });

    return res.status(201).json({ message: 'Calendar entry added.', holiday });
  } catch (error: any) {
    console.error('Error creating holiday:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// Admin-only: edit a holiday or event.
export const updateHoliday = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, date, type } = req.body;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Calendar entry not found.' });
    }

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ message: 'A valid title is required.' });
      }
      holiday.title = sanitizeInput(title);
    }
    if (date !== undefined) {
      const when = new Date(date);
      if (isNaN(when.getTime())) {
        return res.status(400).json({ message: 'Invalid date.' });
      }
      holiday.date = when;
    }
    if (type !== undefined) {
      holiday.type = type === 'event' ? 'event' : 'holiday';
    }

    await holiday.save();

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'HOLIDAY_UPDATED',
      targetResource: `holiday:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { title: holiday.title }
    });

    return res.status(200).json({ message: 'Calendar entry updated.', holiday });
  } catch (error: any) {
    console.error('Error updating holiday:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// Admin-only: remove a holiday or event.
export const deleteHoliday = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) {
      return res.status(404).json({ message: 'Calendar entry not found.' });
    }

    await AuditLog.create({
      userId: req.user!._id,
      actionType: 'HOLIDAY_DELETED',
      targetResource: `holiday:${id}`,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { title: holiday.title }
    });

    return res.status(200).json({ message: 'Calendar entry removed.' });
  } catch (error: any) {
    console.error('Error deleting holiday:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
