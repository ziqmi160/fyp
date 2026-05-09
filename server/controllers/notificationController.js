import { Notification } from '../models/index.js';

export const createNotification = async (userId, title, message, type = 'info', relatedId = null, relatedType = null) => {
  return Notification.create({
    user_id: userId,
    title,
    message,
    type,
    related_id: relatedId,
    related_type: relatedType
  });
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    await notification.update({ is_read: true });

    res.json({ success: true, data: notification, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      { where: { user_id: req.user.id } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
};
