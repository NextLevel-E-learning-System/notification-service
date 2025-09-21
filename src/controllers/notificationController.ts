import { Request, Response } from 'express';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  getUnreadNotificationCount,
} from '../services/notificationService.js';


export const getNotifications = async (req: Request, res: Response) => {

    try {
      const userId = req.header('x-user-id')!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const onlyUnread = req.query.unread === 'true';
      const offset = (page - 1) * limit;

      const notifications = await getUserNotifications(userId, limit, offset, onlyUnread);
      
      res.json({
        notifications,
        pagination: {
          page,
          limit,
          total: notifications.length
        }
      });
    } catch (error) {
      console.error('[notification-controller] Erro buscando notificações:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Contar notificações não lidas
   */
export const getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = req.header('x-user-id')!;
      const count = await getUnreadNotificationCount(userId);
      
      res.json({ unreadCount: count });
    } catch (error) {
      console.error('[notification-controller] Erro contando notificações:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Marcar notificação como lida
   */  
export const markAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.header('x-user-id')!;
      const notificationId = parseInt(req.params.id);
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'invalid_notification_id' });
      }

      const success = await markNotificationAsRead(notificationId, userId);
      
      if (success) {
        res.json({ message: 'notification_marked_as_read' });
      } else {
        res.status(404).json({ error: 'notification_not_found' });
      }
    } catch (error) {
      console.error('[notification-controller] Erro marcando notificação como lida:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }

  /**
   * Marcar todas notificações como lidas
   */
export const markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.header('x-user-id')!;
      const count = await markAllNotificationsAsRead(userId);
      
      res.json({ 
        message: 'all_notifications_marked_as_read',
        markedCount: count 
      });
    } catch (error) {
      console.error('[notification-controller] Erro marcando todas notificações como lidas:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }
