import { Router, Request, Response, NextFunction } from 'express';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  getUnreadNotificationCount,
  createNotification 
} from '../services/notificationService.js';

export const notificationRouter = Router();

interface AuthenticatedRequest extends Request {
  userId?: string;
  userRoles?: string[];
}

// Middleware para extrair userId dos headers (vem do gateway)
const extractUserId = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({ error: 'user_id_required' });
  }
  req.userId = userId;
  next();
};

// GET /notifications/v1/notificacoes - Buscar notificações do usuário
notificationRouter.get('/notificacoes', extractUserId, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
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
    console.error('[notification-service] Erro buscando notificações:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// GET /notifications/v1/notificacoes/count - Contar notificações não lidas
notificationRouter.get('/notificacoes/count', extractUserId, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const count = await getUnreadNotificationCount(userId);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('[notification-service] Erro contando notificações:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// PUT /notifications/v1/notificacoes/:id/read - Marcar notificação como lida
notificationRouter.put('/notificacoes/:id/read', extractUserId, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
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
    console.error('[notification-service] Erro marcando notificação como lida:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// PUT /notifications/v1/notificacoes/read-all - Marcar todas como lidas
notificationRouter.put('/notificacoes/read-all', extractUserId, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const count = await markAllNotificationsAsRead(userId);
    
    res.json({ 
      message: 'all_notifications_marked_as_read',
      markedCount: count 
    });
  } catch (error) {
    console.error('[notification-service] Erro marcando todas notificações como lidas:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /notifications/v1/notificacoes - Criar notificação (admin only)
notificationRouter.post('/notificacoes', extractUserId, async (req: AuthenticatedRequest, res) => {
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
    console.error('[notification-service] Erro criando notificação:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Rota legada para compatibilidade (pode ser removida depois)
notificationRouter.get('/:usuarioId', async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;
    const notifications = await getUserNotifications(usuarioId);
    res.json(notifications);
  } catch (error) {
    console.error('[notification-service] Erro na rota legada:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});
