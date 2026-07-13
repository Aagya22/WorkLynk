import { Response } from 'express';
import { Notification } from '../models/notification.model';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await Notification.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(50); // limit to latest 50 notifications

    return res.status(200).json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user!._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json({ message: 'Notification marked as read.', notification });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { userId: req.user!._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({ message: 'All notifications marked as read.' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findOneAndDelete({ _id: id, userId: req.user!._id });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json({ message: 'Notification deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};
