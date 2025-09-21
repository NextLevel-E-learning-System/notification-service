import { Router } from 'express';
import { EmailController } from '../controllers/emailController.js';
import { NotificationController } from '../controllers/notificationController.js';
import { notificationValidation, templateSendValidation, templateValidation, validateBody } from '../validation/validators.js';
import { TemplateController } from '../controllers/templateController.js';

export const filaRouter = Router();
// GET /api/v1/email/queue - Listar fila de emails
filaRouter.get('/', EmailController.getEmailQueue);
// POST /api/v1/email/queue/:id/retry - Retentar envio de email
filaRouter.post('/:id/retry', EmailController.retryEmail);
// POST /api/v1/email/queue/process - Processar fila manualmente
filaRouter.post('/process', EmailController.processQueue);
// GET /api/v1/email/queue/stats - Estatísticas da fila
filaRouter.get('/stats', EmailController.getQueueStats);

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

export const templateRouter = Router();
templateRouter.get('/', TemplateController.listTemplates);
// GET /api/v1/notifications/templates/:codigo - Buscar template específico
templateRouter.get('/:codigo', TemplateController.getTemplate);
// POST /api/v1/notifications/templates - Criar/atualizar template
templateRouter.post('/', validateBody(templateValidation), TemplateController.createTemplate);
// POST /api/v1/notifications/templates/:codigo/send - Enviar notificação usando template
templateRouter.post('/:codigo/send', validateBody(templateSendValidation), TemplateController.sendNotificationFromTemplate);
