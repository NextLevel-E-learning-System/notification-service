import { Request, Response } from 'express';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  getUnreadNotificationCount,
  createNotification 
} from '../services/notificationService.js';
import type { NotificationsPaginated } from '../types/index.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   * Buscar notificações do usuário autenticado
   */
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = req.headers['x-user-data'] as string;
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
   * GET /api/v1/notifications/count
   * Contar notificações não lidas
   */
  static async getUnreadCount(req: Request, res: Response) {
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
   * PUT /api/v1/notifications/:id/read
   * Marcar notificação como lida
   */
  static async markAsRead(req: Request, res: Response) {
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
   * PUT /api/v1/notifications/read-all
   * Marcar todas notificações como lidas
   */
  static async markAllAsRead(req: Request, res: Response) {
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

  /**
   * POST /api/v1/notifications
   * Criar nova notificação (admin only)
   */
  static async createNotification(req: Request, res: Response) {
    try {
      const { usuario_id, titulo, mensagem, tipo, canal } = req.body;
      
      if (!usuario_id || !titulo || !mensagem) {
        return res.status(400).json({ error: 'required_fields_missing' });
      }

      const notification = await createNotification({
        usuario_id,
        titulo,
        mensagem,
        tipo,
        canal
      });
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('[notification-controller] Erro criando notificação:', error);
      res.status(500).json({ error: 'internal_error' });
    }
  }
}