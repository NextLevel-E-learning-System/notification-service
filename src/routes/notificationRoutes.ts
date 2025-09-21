import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { validateBody, notificationValidation } from '../validation/validators.js';

export const notificationRouter = Router();

// GET /api/v1/notifications - Buscar notificações do usuário autenticado
notificationRouter.get('/', NotificationController.getNotifications);

// GET /api/v1/notifications/count - Contar notificações não lidas
notificationRouter.get('/count', NotificationController.getUnreadCount);

// PUT /api/v1/notifications/:id/read - Marcar notificação como lida
notificationRouter.put('/:id/read', NotificationController.markAsRead);

// PUT /api/v1/notifications/read-all - Marcar todas notificações como lidas
notificationRouter.put('/read-all', NotificationController.markAllAsRead);

// POST /api/v1/notifications - Criar nova notificação (admin only)
notificationRouter.post('/', validateBody(notificationValidation), NotificationController.createNotification);
